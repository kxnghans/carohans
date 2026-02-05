"use client";

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { DiscountManager } from '../common/DiscountManager';
import { formatCurrency, getReturnStatusColor, getItemIntegrityColor, calculateOrderTotal, getIconStyle } from '../../utils/helpers';
import { Order, InventoryItem } from '../../types';
import { processOrderReturn, getOrderDetails } from '../../services/orderService';
import { useData } from '../../context/DataContext';
import { DynamicIcon } from '../common/DynamicIcon';

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
  const { fetchData } = useData();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order>(returnOrder);
  
  const [returnDate, setReturnDate] = useState('');
  const [returnItemQuantities, setReturnItemQuantities] = useState<Record<number, { returned: number, lost: number, damaged: number }>>({});
  const [selectedReturnStatus, setSelectedReturnStatus] = useState<'On Time' | 'Early' | 'Late'>('On Time');
  const [selectedItemIntegrity, setSelectedItemIntegrity] = useState<string[]>(['Good']);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [returnDiscount, setReturnDiscount] = useState<{ name: string; type: 'fixed' | 'percentage'; value: number; code: string } | null>(null);

  const today = new Date().toISOString().split('T')[0] ?? '';

  // 1. Auto-update Return Status based on Dates
  useEffect(() => {
    if (!returnDate || !activeOrder) return;
    
    const actual = new Date(returnDate).setHours(0,0,0,0);
    const planned = new Date(activeOrder.endDate).setHours(0,0,0,0);
    
    let newStatus: 'Early' | 'Late' | 'On Time' = 'On Time';
    if (actual < planned) newStatus = 'Early';
    else if (actual > planned) newStatus = 'Late';

    if (selectedReturnStatus !== newStatus) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedReturnStatus(newStatus);
    }
  }, [returnDate, activeOrder, selectedReturnStatus]);

  // 2. Auto-update Item Integrity based on Item Audit
  useEffect(() => {
    const hasLost = Object.values(returnItemQuantities).some(q => q.lost > 0);
    const hasDamaged = Object.values(returnItemQuantities).some(q => q.damaged > 0);
    
    const next: string[] = [];
    if (hasLost) next.push('Lost');
    if (hasDamaged) next.push('Damaged');
    if (next.length === 0) next.push('Good');
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedItemIntegrity(prev => JSON.stringify(prev) !== JSON.stringify(next) ? next : prev);
  }, [returnItemQuantities]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    let isCancelled = false;

    const initializeModal = async () => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            let orderToUse = returnOrder;

            // Fetch full details if items are missing
            if (!returnOrder.items || returnOrder.items.length === 0) {
                setIsLoading(true);
                const fullOrder = await getOrderDetails(returnOrder.id);
                if (!isCancelled && fullOrder) {
                    orderToUse = fullOrder;
                    setActiveOrder(fullOrder);
                }
                setIsLoading(false);
            } else {
                setActiveOrder(returnOrder);
            }

            if (isCancelled) return;

            // Initialize state from orderToUse
            const initialQtys: Record<number, { returned: number, lost: number, damaged: number }> = {};
            if (orderToUse.items) {
                orderToUse.items.forEach(item => {
                    initialQtys[item.inventoryId] = { returned: item.qty, lost: 0, damaged: 0 };
                });
            }
            setReturnItemQuantities(initialQtys);
            
            setReturnDate('');
            
            // Auto-determine default return status
            const today = new Date().toISOString().split('T')[0] ?? '';
            if (today < orderToUse.endDate) setSelectedReturnStatus('Early');
            else if (today === orderToUse.endDate) setSelectedReturnStatus('On Time');
            else setSelectedReturnStatus('Late');

            setSelectedItemIntegrity(['Good']);
            setPaymentAmount(0);
            setSubmitAttempted(false);

            if (orderToUse.discountName) {
                setReturnDiscount({
                    name: orderToUse.discountName,
                    type: (orderToUse.discountType as 'fixed' | 'percentage') || 'fixed',
                    value: Number(orderToUse.discountValue) || 0,
                    code: ''
                });
            } else {
                setReturnDiscount(null);
            }
        }
    };

    const timer = setTimeout(initializeModal, 0);
    
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
        isCancelled = true;
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
        clearTimeout(timer);
    };
  }, [isOpen, returnOrder]);

  const handleQuantityChange = (itemId: number, type: 'lost' | 'damaged', value: number, originalQty: number) => {
      const current = returnItemQuantities[itemId] || { returned: originalQty, lost: 0, damaged: 0 };
      const otherVal = type === 'lost' ? current.damaged : current.lost;
      
      // Validation: Total Bad (Lost + Damaged) cannot exceed Original Qty
      if (value + otherVal > originalQty) {
          showNotification(`Cannot set ${type} quantity. Total items cannot exceed ${originalQty}.`, 'error');
          return;
      }
      
      // Auto-calculate Returned (Good)
      const newReturned = originalQty - (value + otherVal);
      
      setReturnItemQuantities({
          ...returnItemQuantities,
          [itemId]: {
              ...current,
              [type]: value,
              returned: newReturned
          }
      });
  };

  // Derived Financials for Return Modal
  const returnTotals = useMemo(() => {
    if (!activeOrder) return { subtotal: 0, discount: 0, netRental: 0, lateFee: 0, lossFee: 0, damageFee: 0, total: 0, balance: 0 };
    
    // 1. Late Fee Calculation
    const daysLate = Math.max(0, Math.ceil((new Date(returnDate).getTime() - new Date(activeOrder.endDate).getTime()) / (1000 * 60 * 60 * 24)));
    const lateFee = daysLate * latePenaltyPerDay;

    // 2. Loss & Damage Fees
    let lossFee = 0;
    let damageFee = 0;
    Object.entries(returnItemQuantities).forEach(([id, qtys]) => {
        const invItem = inventory.find(i => i.id === Number(id));
        if (invItem) {
            const cost = invItem.replacementCost || 0;
            if (qtys.lost > 0) lossFee += cost * qtys.lost;
            if (qtys.damaged > 0) damageFee += cost * qtys.damaged;
        }
    });

    const rentalItems = activeOrder.items.map(item => {
        const invItem = inventory.find(i => i.id === item.inventoryId);
        return { price: item.price || invItem?.price || 0, qty: item.qty };
    });

    const rentalSubtotal = calculateOrderTotal(rentalItems, activeOrder.startDate, returnDate);

    // Calculate applicable discount (capped at rental subtotal)
    let appliedDiscount = 0;
    if (returnDiscount) {
        const discountVal = Number(returnDiscount.value);
        if (returnDiscount.type === 'fixed') {
            appliedDiscount = Math.min(rentalSubtotal, discountVal);
        } else {
            appliedDiscount = (rentalSubtotal * discountVal) / 100;
        }
    }
    
    const netRental = Math.max(0, rentalSubtotal - appliedDiscount);
    const totalPenalties = lateFee + lossFee + damageFee;
    const total = netRental + totalPenalties;
    const balance = total - (activeOrder.amountPaid + paymentAmount);

    return { 
        subtotal: rentalSubtotal || 0, 
        discount: appliedDiscount || 0, 
        netRental: netRental || 0, 
        lateFee: lateFee || 0, 
        lossFee: lossFee || 0, 
        damageFee: damageFee || 0, 
        total: total || 0, 
        balance: balance || 0,
        daysLate 
    };
  }, [activeOrder, returnDate, returnItemQuantities, paymentAmount, inventory, latePenaltyPerDay, returnDiscount]);

  const handleConfirmReturn = async () => {
    if (!activeOrder) return;

    if (!returnDate) {
        showNotification("Please select an Actual Return Date to proceed.", "error");
        return;
    }

    if (!paymentAmount && paymentAmount !== 0) { 
         setSubmitAttempted(true);
         return; 
    }
    
    if (paymentAmount < 0) {
        showNotification("Payment cannot be negative.", "error");
        return;
    }
    
    if (returnTotals.balance > 0 && (!paymentAmount || paymentAmount <= 0)) {
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
        amountPaid: activeOrder.amountPaid + paymentAmount,
        totalAmount: returnTotals.total,
        discountName: returnDiscount?.name || '',
        discountType: returnDiscount?.type || 'fixed',
        discountValue: returnDiscount?.value || 0,
        discountCode: returnDiscount?.code || '',
        items: activeOrder.items.map(item => ({
            inventoryId: item.inventoryId,
            returnedQty: returnItemQuantities[item.inventoryId]?.returned || 0,
            lostQty: returnItemQuantities[item.inventoryId]?.lost || 0,
            damagedQty: returnItemQuantities[item.inventoryId]?.damaged || 0
        }))
    };

    try {
        await processOrderReturn(activeOrder.id, returnData);
        
        showNotification(`Order #${activeOrder.id} return processed. Status: ${finalStatus}`, "success");
        await fetchData(); // Refresh local state
        onClose();
    } catch (error) {
        console.error("Return process failed:", error);
        // Extract the most descriptive message possible
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = (error as any)?.message || (typeof error === 'string' ? error : "Failed to process return. Please check your network connection.");
        showNotification(message, "error");
        
        // Log additional details if available (Supabase specific)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any)?.details) console.error("Error details:", (error as any).details);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any)?.hint) console.error("Error hint:", (error as any).hint);
    }
  };

  if (!isOpen || !mounted) return null;

  // Show loading state if activeOrder is not yet ready or explicitly loading
  if (isLoading || !activeOrder) {
      return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-theme-body font-bold text-muted">Loading Order Details...</p>
            </div>
        </div>,
        document.body
      );
  }

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
                    <div className="p-2 bg-white/10 rounded-lg"><Icons.Check className="w-5 h-5" /></div>
                    <div>
                        <h3 className="text-theme-title font-bold tracking-tight">Process Return Audit</h3>
                        <p className="text-theme-caption opacity-70 font-medium">Order #{activeOrder.id} • {activeOrder.clientName}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.X className="w-5 h-5" /></button>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-surface">
                {/* Dates & Logistics */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <DatePicker 
                              label="Actual Return Date"
                              value={returnDate}
                              onChange={(val) => setReturnDate(val)}
                            />
                            <button 
                                onClick={() => setReturnDate(today)}
                                className="px-4 py-1.5 bg-muted text-white dark:bg-muted dark:text-background rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-sm border border-muted"
                            >
                                Set to Today
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2 ml-1">Return Status</label>
                                <div className={`py-2.5 border-2 rounded-xl text-theme-subtitle uppercase tracking-tight transition-all text-center font-bold ${getReturnStatusColor(selectedReturnStatus)}`}>
                                    {selectedReturnStatus}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2 ml-1">Item Integrity</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItemIntegrity.map(status => (
                                        <div 
                                            key={status}
                                            className={`flex-1 min-w-[80px] py-2.5 border-2 rounded-xl text-theme-subtitle uppercase tracking-tight transition-all text-center font-bold ${getItemIntegrityColor(status as string)}`}
                                        >
                                            {status}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Item Audit List */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Item Inspection</label>
                    </div>
                    <div className="space-y-4">
                        {activeOrder.items.map(item => {
                            const invItem = inventory.find(i => i.id === item.inventoryId);
                            const qtys = returnItemQuantities[item.inventoryId] || { returned: item.qty, lost: 0, damaged: 0 };
                            
                            return (
                                <div key={item.inventoryId} className="bg-background border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/20 hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`rounded-xl flex items-center justify-center border-none transition-all ${getIconStyle(invItem?.color, { noBorder: true, noBackground: true }).container} group-hover:scale-110`}>
                                                <DynamicIcon 
                                                    iconString={invItem?.image} 
                                                    color={invItem?.color} 
                                                    variant="modal" 
                                                    forceUpdate={invItem}
                                                    fallback={<span>📦</span>} 
                                                />
                                            </div>
                                            <div>
                                                <p className="text-theme-body-bold text-foreground text-lg">{invItem?.name}</p>
                                                <p className="text-theme-caption text-muted font-bold uppercase tracking-tight mt-0.5">Original Qty: {item.qty}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-surface/50 p-3 rounded-xl border border-border/50">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-muted uppercase mb-1">Good</span>
                                                <div 
                                                    className="w-12 text-center bg-transparent border-none p-1.5 text-xs font-black text-success outline-none" 
                                                >
                                                    {qtys.returned}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-muted uppercase mb-1">Lost</span>
                                                <input 
                                                    type="number" 
                                                    className="w-12 text-center bg-background border border-border rounded-lg p-1.5 text-xs font-black text-error outline-none focus:border-error dark:[color-scheme:dark]" 
                                                    value={qtys.lost} 
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => handleQuantityChange(item.inventoryId, 'lost', parseInt(e.target.value) || 0, item.qty)}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-muted uppercase mb-1">Dmg</span>
                                                <input 
                                                    type="number" 
                                                    className="w-12 text-center bg-background border border-border rounded-lg p-1.5 text-xs font-black text-warning outline-none focus:border-warning dark:[color-scheme:dark]" 
                                                    value={qtys.damaged} 
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => handleQuantityChange(item.inventoryId, 'damaged', parseInt(e.target.value) || 0, item.qty)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Operational Adjustment (Discount) */}
                <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm">
                    <DiscountManager 
                        variant="featured"
                        subtotal={returnTotals.subtotal}
                        initialDiscount={returnDiscount || undefined}
                        isConfirmedInitial={!!returnDiscount}
                        onApply={(form) => setReturnDiscount(form)}
                        onClear={() => setReturnDiscount(null)}
                        showNotification={showNotification}
                    />
                </div>

                {/* Financial Summary & Payment */}
                <div className="bg-background rounded-3xl p-8 border border-border grid grid-cols-1 md:grid-cols-2 gap-10 shadow-inner relative overflow-hidden">
                    <div className="space-y-4">
                        <h4 className="text-theme-caption font-black text-muted uppercase tracking-widest mb-6">Financial Summary</h4>
                        <div className="flex justify-between text-theme-body py-1">
                            <span className="text-muted">Rental Subtotal</span>
                            <span className="text-foreground font-bold">{formatCurrency(returnTotals.subtotal)}</span>
                        </div>
                        {returnTotals.discount > 0 && (
                            <div className="flex justify-between text-theme-body py-1">
                                <span className="text-secondary font-medium">Discount Applied</span>
                                <span className="text-secondary font-bold">-{formatCurrency(returnTotals.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-theme-body py-1">
                            <span className="text-muted font-bold">Net Rental Cost</span>
                            <span className="text-foreground font-bold">{formatCurrency(returnTotals.netRental)}</span>
                        </div>
                        
                        {(returnTotals.lateFee > 0 || returnTotals.lossFee > 0 || returnTotals.damageFee > 0) && (
                            <div className="pt-4 border-t border-border mt-4 space-y-2">
                                {returnTotals.lateFee > 0 && (
                                    <div className="flex justify-between text-theme-body text-xs">
                                        <span className="text-muted">Late Fees</span>
                                        <span className="text-error font-bold">+{formatCurrency(returnTotals.lateFee)}</span>
                                    </div>
                                )}
                                {(returnTotals.lossFee + returnTotals.damageFee) > 0 && (
                                    <div className="flex justify-between text-theme-body text-xs">
                                        <span className="text-muted">Damage/Loss Penalty</span>
                                        <span className="text-error font-bold">+{formatCurrency(returnTotals.lossFee + returnTotals.damageFee)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex justify-between text-theme-body pt-4 border-t border-border">
                            <span className="text-muted">Total Order Value</span>
                            <span className="text-theme-body-bold text-foreground">{formatCurrency(returnTotals.total)}</span>
                        </div>
                        <div className="flex justify-between text-theme-body">
                            <span className="text-muted">Previous Payments</span>
                            <span className="text-success font-bold">-{formatCurrency(activeOrder.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-theme-subtitle font-black pt-5 border-t-2 border-foreground mt-4 dark:border-white">
                            <span className="text-foreground uppercase tracking-tighter">Net Balance Due</span>
                            <span className="text-error text-theme-header">{formatCurrency(Math.max(0, returnTotals.total - activeOrder.amountPaid))}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-theme-caption font-black text-muted uppercase tracking-widest mb-6">Process Payment</h4>
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
                                placeholder="0"
                                value={isNaN(paymentAmount) ? '' : paymentAmount}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    setPaymentAmount(parseFloat(e.target.value) || 0);
                                    if (submitAttempted) setSubmitAttempted(false);
                                }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setPaymentAmount(Math.max(0, (returnTotals.total || 0) - (activeOrder.amountPaid || 0)))} className="flex-1 py-2.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-white text-theme-caption font-black uppercase rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors shadow-sm">Pay Full Balance</button>
                            <Button 
                                variant="secondary" 
                                className="flex-1 text-error border-error/20 hover:bg-error/5 hover:border-error/30 transition-all font-bold" 
                                onClick={() => setPaymentAmount(0)}
                            >
                                <Icons.Trash2 className="w-4 h-4 mr-1" /> Clear
                            </Button>
                        </div>
                        {returnTotals.balance > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-xl border border-amber-100/20 mt-2">
                                <Icons.AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
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
                    variant="success" 
                    className="flex-1 shadow-lg shadow-success/20 rounded-2xl border-none font-black uppercase tracking-widest" 
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