"use client";

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { formatCurrency, getDurationDays, getReturnStatusColor, getItemIntegrityColor } from '../../utils/helpers';
import { Order, InventoryItem } from '../../types';
import { processOrderReturn } from '../../services/orderService';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnOrder: Order;
  inventory: InventoryItem[];
  latePenaltyPerDay: number;
  showNotification: (msg: string, type?: string) => void;
}

export const ReturnModal = ({
  isOpen,
  onClose,
  returnOrder,
  inventory,
  latePenaltyPerDay,
  showNotification
}: ReturnModalProps) => {
  const { Check, X, AlertCircle, Trash2 } = Icons;
  const [mounted, setMounted] = useState(false);
  
  const [returnDate, setReturnDate] = useState('');
  const [returnItemQuantities, setReturnItemQuantities] = useState<Record<number, { returned: number, lost: number, damaged: number }>>({});
  const [selectedReturnStatus, setSelectedReturnStatus] = useState<'On Time' | 'Early' | 'Late'>('On Time');
  const [selectedItemIntegrity, setSelectedItemIntegrity] = useState<string[]>(['Good']);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            // Initialize state from returnOrder
            const initialQtys: Record<number, { returned: number, lost: number, damaged: number }> = {};
            returnOrder.items.forEach(item => {
                initialQtys[item.inventoryId] = { returned: item.qty, lost: 0, damaged: 0 };
            });
            setReturnItemQuantities(initialQtys);
            
            setReturnDate('');
            
            // Auto-determine default return status
            const today = new Date().toISOString().split('T')[0] ?? '';
            if (today < returnOrder.endDate) setSelectedReturnStatus('Early');
            else if (today === returnOrder.endDate) setSelectedReturnStatus('On Time');
            else setSelectedReturnStatus('Late');

            setSelectedItemIntegrity(['Good']);
            setPaymentAmount(0);
            setSubmitAttempted(false);
        }
    }, 0);
    
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
        clearTimeout(timer);
    };
  }, [isOpen, returnOrder]);

  const toggleIntegrity = (status: string) => {
    setSelectedItemIntegrity(prev => {
        if (status === 'Good') return ['Good'];
        
        let next = prev.filter(s => s !== 'Good');
        if (next.includes(status)) {
            next = next.filter(s => s !== status);
            if (next.length === 0) return ['Good'];
            return next;
        } else {
            return [...next, status];
        }
    });
  };

  // Derived Financials for Return Modal
  const returnTotals = useMemo(() => {
    if (!returnOrder) return { subtotal: 0, lateFee: 0, lossFee: 0, damageFee: 0, total: 0, balance: 0 };
    
    // 1. Late Fee Calculation
    const daysLate = Math.max(0, Math.ceil((new Date(returnDate).getTime() - new Date(returnOrder.endDate).getTime()) / (1000 * 60 * 60 * 24)));
    const lateFee = daysLate * latePenaltyPerDay;

    // 2. Loss & Damage Fees
    let lossFee = 0;
    let damageFee = 0;
    Object.entries(returnItemQuantities).forEach(([id, qtys]) => {
        const invItem = inventory.find(i => i.id === Number(id));
        if (invItem) {
            if (qtys.lost > 0) lossFee += invItem.replacementCost * qtys.lost;
            if (qtys.damaged > 0) damageFee += invItem.replacementCost * qtys.damaged;
        }
    });

    const rentalSubtotal = returnOrder.items.reduce((sum, item) => {
        const invItem = inventory.find(i => i.id === item.inventoryId);
        const price = item.price || invItem?.price || 0;
        const actualDuration = getDurationDays(returnOrder.startDate, returnDate);
        return sum + (price * item.qty * actualDuration);
    }, 0);

    const total = rentalSubtotal + lateFee + lossFee + damageFee;
    const balance = total - (returnOrder.amountPaid + paymentAmount);

    return { subtotal: rentalSubtotal, lateFee, lossFee, damageFee, total, balance };
  }, [returnOrder, returnDate, returnItemQuantities, paymentAmount, inventory, latePenaltyPerDay]);

  const handleConfirmReturn = async () => {
    if (!returnOrder) return;

    if (!returnDate) {
        showNotification("Please select an Actual Return Date to proceed.", "error");
        return;
    }

    if (!paymentAmount && paymentAmount !== 0) { // Check undefined/NaN
         setSubmitAttempted(true);
         return; // Wait for user input
    }
    
    if (paymentAmount < 0) {
        showNotification("Payment cannot be negative.", "error");
        return;
    }
    
    if (!paymentAmount || paymentAmount <= 0) {
         setSubmitAttempted(true);
         showNotification("Payment required. Please enter an amount greater than ¢0 to proceed.", "error");
         return;
    }

    setSubmitAttempted(false);
    const finalStatus = returnTotals.balance <= 0 ? 'Completed' : 'Settlement';

    const returnData = {
        status: finalStatus,
        closedAt: returnDate,
        returnStatus: selectedReturnStatus,
        itemIntegrity: selectedItemIntegrity.join(', '),
        penaltyAmount: returnTotals.lateFee + returnTotals.lossFee + returnTotals.damageFee,
        amountPaid: returnOrder.amountPaid + paymentAmount,
        totalAmount: returnTotals.total,
        items: returnOrder.items.map(item => ({
            inventoryId: item.inventoryId,
            returnedQty: returnItemQuantities[item.inventoryId]?.returned || 0,
            lostQty: returnItemQuantities[item.inventoryId]?.lost || 0,
            damagedQty: returnItemQuantities[item.inventoryId]?.damaged || 0
        }))
    };

    try {
        await processOrderReturn(returnOrder.id, returnData);
        showNotification(`Return processed. Status: ${finalStatus}`);
        onClose();
        window.location.reload(); 
    } catch (error) {
        console.error("Return process failed", error);
        showNotification("Failed to process return", "error");
    }
  };

  if (!isOpen || !mounted || !returnOrder) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
        <div 
          className="w-full max-w-2xl bg-surface rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden border border-border"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header - Sticky */}
            <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary p-6 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><Check className="w-5 h-5" /></div>
                    <div>
                        <h3 className="text-theme-title font-bold tracking-tight">Process Return Audit</h3>
                        <p className="text-theme-caption opacity-70 font-medium">Order #{returnOrder.id} • {returnOrder.clientName}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-surface">
                {/* Dates & Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <DatePicker 
                          label="Actual Return Date"
                          value={returnDate}
                          onChange={(val) => setReturnDate(val)}
                        />
                        <button 
                            onClick={() => setReturnDate(new Date().toISOString().split('T')[0] ?? '')}
                            className="text-[10px] font-bold text-primary dark:text-warning uppercase tracking-widest hover:underline ml-1"
                        >
                            Set to Today
                        </button>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2 ml-1">Return Status</label>
                            <div className="flex gap-2">
                                {(['Early', 'On Time', 'Late'] as const).map(status => {
                                    const isActive = selectedReturnStatus === status;
                                    const statusClasses = getReturnStatusColor(status);
                                    return (
                                                                                    <button 
                                                                                        key={status}
                                                                                        onClick={() => setSelectedReturnStatus(status)} 
                                                                                        className={`flex-1 py-2.5 border-2 rounded-xl text-theme-subtitle uppercase tracking-tight transition-all text-center ${isActive ? statusClasses : 'bg-background text-muted border-border hover:border-primary/30'}`}
                                                                                    >
                                                                                        {status}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2 ml-1">Item Integrity</label>
                                                                        <div className="flex gap-2">
                                                                            {(['Good', 'Lost', 'Damaged'] as const).map(status => {
                                                                                const isActive = selectedItemIntegrity.includes(status);
                                                                                const integrityClasses = getItemIntegrityColor(status);
                                                                                return (
                                                                                    <button 
                                                                                        key={status}
                                                                                        onClick={() => toggleIntegrity(status)} 
                                                                                        className={`flex-1 py-2.5 border-2 rounded-xl text-theme-subtitle uppercase tracking-tight transition-all text-center ${isActive ? integrityClasses : 'bg-background text-muted border-border hover:border-primary/30'}`}
                                                                                    >
                                                                                        {status}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>                    </div>
                </div>

                {/* Item Audit List */}
                <div>
                    <div className="flex items-center gap-2 mb-4 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Item Inspection</label>
                    </div>
                    <div className="space-y-3">
                        {returnOrder.items.map(item => {
                            const invItem = inventory.find(i => i.id === item.inventoryId);
                            const qtys = returnItemQuantities[item.inventoryId] || { returned: item.qty, lost: 0, damaged: 0 };
                            
                            return (
                                <div key={item.inventoryId} className="bg-background border border-border rounded-2xl p-4 shadow-sm group hover:border-primary/20 hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center font-bold text-xl text-muted group-hover:scale-110 transition-transform">{invItem?.image || '📦'}</div>
                                            <div>
                                                <p className="text-theme-body-bold text-foreground">{invItem?.name}</p>
                                                <p className="text-theme-caption text-muted font-bold uppercase tracking-tight">Original Qty: {item.qty}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-surface/50 p-2 rounded-xl border border-border/50">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-muted uppercase mb-1">Good</span>
                                                <input 
                                                    type="number" 
                                                    className="w-12 text-center bg-background border border-border rounded-lg p-1.5 text-xs font-black text-success outline-none focus:border-success dark:[color-scheme:dark]" 
                                                    value={qtys.returned} 
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setReturnItemQuantities({ ...returnItemQuantities, [item.inventoryId]: { ...qtys, returned: val } });
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-muted uppercase mb-1">Lost</span>
                                                <input 
                                                    type="number" 
                                                    className="w-12 text-center bg-background border border-border rounded-lg p-1.5 text-xs font-black text-error outline-none focus:border-error dark:[color-scheme:dark]" 
                                                    value={qtys.lost} 
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setReturnItemQuantities({ ...returnItemQuantities, [item.inventoryId]: { ...qtys, lost: val } });
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-muted uppercase mb-1">Dmg</span>
                                                <input 
                                                    type="number" 
                                                    className="w-12 text-center bg-background border border-border rounded-lg p-1.5 text-xs font-black text-warning outline-none focus:border-warning dark:[color-scheme:dark]" 
                                                    value={qtys.damaged} 
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setReturnItemQuantities({ ...returnItemQuantities, [item.inventoryId]: { ...qtys, damaged: val } });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Financial Summary & Payment */}
                <div className="bg-background rounded-2xl p-6 border border-border grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner">
                    <div className="space-y-2.5">
                        <h4 className="text-theme-caption font-black text-muted uppercase tracking-widest mb-4">Financial Summary</h4>
                        <div className="flex justify-between text-theme-body">
                            <span className="text-muted">Rental Subtotal</span>
                            <span className="text-foreground font-bold">{formatCurrency(returnTotals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-theme-body">
                            <span className="text-muted">Total Late Fees</span>
                            <span className="text-error font-bold">+{formatCurrency(returnTotals.lateFee)}</span>
                        </div>
                        <div className="flex justify-between text-theme-body">
                            <span className="text-muted">Damage/Loss Penalty</span>
                            <span className="text-error font-bold">+{formatCurrency(returnTotals.lossFee + returnTotals.damageFee)}</span>
                        </div>
                        <div className="flex justify-between text-theme-body pt-2 border-t border-border">
                            <span className="text-muted">Total Revised Bill</span>
                            <span className="text-theme-body-bold text-foreground">{formatCurrency(returnTotals.total)}</span>
                        </div>
                        <div className="flex justify-between text-theme-body">
                            <span className="text-muted">Already Paid</span>
                            <span className="text-success font-bold">-{formatCurrency(returnOrder.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-theme-subtitle font-black pt-3 border-t-2 border-foreground mt-2 dark:border-white">
                            <span className="text-foreground uppercase tracking-tighter">Amount Due Now</span>
                            <span className="text-error text-theme-header">{formatCurrency(Math.max(0, returnTotals.total - returnOrder.amountPaid))}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-theme-caption font-black text-muted uppercase tracking-widest mb-4">Process Payment</h4>
                        <div className="relative group">
                            <div className={`absolute left-6 top-1/2 -translate-y-1/2 font-black text-theme-header transition-colors ${submitAttempted && (!paymentAmount || paymentAmount <= 0) ? 'text-error' : 'text-muted group-focus-within:text-primary dark:group-focus-within:text-warning'}`}>¢</div>
                            <input 
                                type="number" 
                                step="0.01"
                                min="0.01"
                                required
                                className={`w-full pl-14 pr-4 py-5 bg-surface border rounded-2xl text-theme-header font-black text-foreground outline-none transition-all shadow-sm ${
                                    submitAttempted && (!paymentAmount || paymentAmount <= 0) 
                                    ? 'border-error focus:ring-rose-500/10' 
                                    : 'border-border focus:border-primary dark:focus:border-warning focus:ring-4 focus:ring-primary/10 dark:focus:ring-warning/10'
                                } dark:[color-scheme:dark]`}
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => {
                                    setPaymentAmount(parseFloat(e.target.value) || 0);
                                    if (submitAttempted) setSubmitAttempted(false);
                                }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setPaymentAmount(Math.max(0, returnTotals.total - returnOrder.amountPaid))} className="flex-1 py-2.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-white text-theme-caption font-black uppercase rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors shadow-sm">Pay Full Balance</button>
                            <Button 
                                variant="secondary" 
                                className="flex-1 text-error border-error/20 hover:bg-error/5 hover:border-error/30 transition-all font-bold" 
                                onClick={() => setPaymentAmount(0)}
                            >
                                <Trash2 className="w-4 h-4 mr-1" /> Clear
                            </Button>
                        </div>
                        {returnTotals.balance > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-xl border border-amber-100/20 mt-2">
                                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                                <p className="text-theme-caption text-amber-700 dark:text-warning font-bold italic leading-tight">Order remains in &apos;Settlement&apos; until balance is ¢0.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer - Sticky */}
            <div className="p-6 bg-background border-t border-border flex gap-3 flex-shrink-0">
                <Button variant="secondary" className="flex-1 rounded-2xl" onClick={onClose}>Cancel</Button>
                <Button 
                    variant="primary" 
                    className="flex-1 bg-success hover:bg-emerald-700 dark:bg-success dark:hover:bg-success/90 dark:text-primary shadow-lg shadow-emerald-600/20 rounded-2xl" 
                    onClick={handleConfirmReturn}
                >
                    {returnTotals.balance <= 0 ? 'Finalize & Close Order' : 'Record Partial Payment'}
                </Button>
            </div>
        </div>
    </div>,
    document.body
  );
};
