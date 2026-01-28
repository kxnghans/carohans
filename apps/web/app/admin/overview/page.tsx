"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons, InventoryIcons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { calculateMetrics, formatCurrency, getStatusColor, formatDate, calculateOrderTotal, getDurationDays } from '../../utils/helpers';
import { FilterCard } from '../../components/dashboard/FilterCard';
import { ClientSelector } from '../../components/modals/ClientSelector';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Order, Client, InventoryItem, PortalFormData } from '../../types';
import { updateOrderStatusToSupabase, processOrderReturn } from '../../services/orderService';
import { OrderTable } from '../../components/orders/OrderTable';

export default function AdminOverviewPage() {
  const { Truck, LayoutDashboard, ClipboardList, AlertOctagon, AlertCircle, Check, Search, Plus, X, ChevronRight, Loader2 } = Icons;
  const { orders, setOrders, clients, showNotification, inventory, loading, submitOrder, latePenaltyPerDay } = useAppStore();
  
  const [mounted, setMounted] = useState(false);
  const [orderFilter, setOrderFilter] = useState('All');

  useEffect(() => {
    setMounted(true);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOrderStep, setCreateOrderStep] = useState<'none' | 'select-client' | 'shop' | 'review'>('none');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [posCart, setPosCart] = useState<(InventoryItem & { qty: number })[]>([]);
  const [posDates, setPosDates] = useState({ start: '', end: '' });
  const [viewingInvoice, setViewingInvoice] = useState<(Order & { cart: any[], client: any }) | null>(null);
  
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnItemQuantities, setReturnItemQuantities] = useState<Record<number, { returned: number, lost: number, damaged: number }>>({});
  const [selectedReturnStatus, setSelectedReturnStatus] = useState<'On Time' | 'Early' | 'Late'>('On Time');
  const [selectedItemIntegrity, setSelectedItemIntegrity] = useState<string[]>(['Good']);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'id',
    direction: 'desc'
  });

  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

  useEffect(() => {
    if (returnOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [returnOrder]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReturnOrder(null);
    };
    if (returnOrder) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [returnOrder]);

  // Initializing item quantities when returnOrder is set
  useEffect(() => {
    if (returnOrder) {
        const initialQtys: any = {};
        returnOrder.items.forEach(item => {
            initialQtys[item.itemId] = { returned: item.qty, lost: 0, damaged: 0 };
        });
        setReturnItemQuantities(initialQtys);
        setReturnDate(new Date().toISOString().split('T')[0]);
        
        // Auto-determine default return status
        const today = new Date().toISOString().split('T')[0];
        if (today < returnOrder.endDate) setSelectedReturnStatus('Early');
        else if (today === returnOrder.endDate) setSelectedReturnStatus('On Time');
        else setSelectedReturnStatus('Late');

        setSelectedItemIntegrity(['Good']);
        
        // Always default to 0 as requested, forcing admin to input actual payment
        setPaymentAmount(0);
        setSubmitAttempted(false);
    }
  }, [returnOrder]);

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
    
    // 1. Late Fee Calculation using admin-defined penalty per day
    const daysLate = Math.max(0, Math.ceil((new Date(returnDate).getTime() - new Date(returnOrder.endDate).getTime()) / (1000 * 60 * 60 * 24)));
    const lateFee = daysLate * latePenaltyPerDay;

    // 2. Loss & Damage Fees (Both 100% of replacement cost)
    let lossFee = 0;
    let damageFee = 0;
    Object.entries(returnItemQuantities).forEach(([id, qtys]) => {
        const invItem = inventory.find(i => i.id === Number(id));
        if (invItem) {
            if (qtys.lost > 0) {
                lossFee += invItem.replacementCost * qtys.lost;
            }
            if (qtys.damaged > 0) {
                damageFee += invItem.replacementCost * qtys.damaged;
            }
        }
    });

    const rentalSubtotal = returnOrder.items.reduce((sum, item) => {
        const invItem = inventory.find(i => i.id === item.itemId);
        const price = item.price || invItem?.price || 0;
        const duration = getDurationDays(returnOrder.startDate, returnOrder.endDate);
        return sum + (price * item.qty * duration);
    }, 0);

    const total = rentalSubtotal + lateFee + lossFee + damageFee;
    const balance = total - (returnOrder.amountPaid + paymentAmount);

    return { subtotal: rentalSubtotal, lateFee, lossFee, damageFee, total, balance };
  }, [returnOrder, returnDate, returnItemQuantities, paymentAmount, inventory, latePenaltyPerDay]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderFilter !== 'All') {
        result = result.filter(o => o.status === orderFilter);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(o => 
            o.clientName.toLowerCase().includes(q) || 
            o.id.toString().includes(q) ||
            o.email.toLowerCase().includes(q)
        );
    }
    return result;
  }, [orders, orderFilter, searchQuery]);

  const sortedOrders = useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof typeof a];
        let bVal = b[sortConfig.key as keyof typeof b];
        if (sortConfig.key === 'startDate') { aVal = new Date(aVal as string).getTime(); bVal = new Date(bVal as string).getTime(); }
        
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOrderInvoice = (order: Order) => {
    const reconstructedCart = order.items.map((item) => {
      const inventoryItem = inventory.find(i => i.id === item.itemId);
      return { 
        ...inventoryItem, 
        qty: item.qty,
        lostQty: item.lostQty,
        damagedQty: item.damagedQty
      };
    });

    setViewingInvoice({
      ...order,
      cart: reconstructedCart,
      client: { name: order.clientName, email: order.email, phone: order.phone }
    });
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, closedAt?: string, returnStatus?: string) => {
    try {
      if (newStatus === 'Completed' && !closedAt) {
          const order = orders.find(o => o.id === orderId);
          if (order) { setReturnOrder(order); return; }
      }
      await updateOrderStatusToSupabase(orderId, newStatus, closedAt, returnStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, closedAt, returnStatus: returnStatus as any } : o));
      showNotification(`Order #${orderId} marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification("Failed to update status", "error");
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnOrder) return;

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
            itemId: item.itemId,
            returnedQty: returnItemQuantities[item.itemId]?.returned || 0,
            lostQty: returnItemQuantities[item.itemId]?.lost || 0,
            damagedQty: returnItemQuantities[item.itemId]?.damaged || 0
        }))
    };

    try {
        await processOrderReturn(returnOrder.id, returnData);
        showNotification(`Return processed. Status: ${finalStatus}`);
        setReturnOrder(null);
        // Sync state could be refetched or updated locally
        window.location.reload(); 
    } catch (error) {
        console.error("Return process failed", error);
        showNotification("Failed to process return", "error");
    }
  };



  const addToPosCart = (item: InventoryItem, qty: number) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
      }
      if (qty > 0) return [...prev, { ...item, qty }];
      return prev;
    });
  };

  const submitAdminOrder = async () => {
    if (!selectedClient) return;
    const orderData: PortalFormData = {
        firstName: selectedClient.firstName,
        lastName: selectedClient.lastName,
        username: selectedClient.username || '',
        phone: selectedClient.phone,
        email: selectedClient.email,
        address: selectedClient.address,
        start: posDates.start || new Date().toISOString().split('T')[0],
        end: posDates.end || new Date().toISOString().split('T')[0]
    };
    await submitOrder(orderData);
    setPosCart([]); setSelectedClient(null); setPosDates({ start: '', end: '' }); setCreateOrderStep('none');
    showNotification("Order created successfully!", "success");
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-medium">Loading Dashboard Data...</p>
        </div>
    );
  }

  const posTotal = calculateOrderTotal(posCart, posDates.start, posDates.end);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* TODAY'S LOGISTICS BANNER */}
      <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden group border border-transparent dark:border-white">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
          <Truck className="w-64 h-64 -mr-16 -mt-16 text-white dark:text-slate-900" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 text-indigo-300 dark:text-indigo-600 text-theme-caption font-bold mb-4 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> Live Operations
            </div>
            <h2 className="text-theme-header mb-2 text-white dark:text-slate-900">Today's Logistics</h2>
            <p className="text-slate-400 dark:text-slate-500 text-theme-body">Overview of pickup and return schedules for today.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8 bg-white/5 dark:bg-slate-900/5 p-6 rounded-2xl border border-white/10 dark:border-slate-900/10 backdrop-blur-sm w-full md:w-auto">
            <div className="text-center px-2">
              <span className="block text-theme-header text-white dark:text-slate-900">{metrics.pickupsToday}</span>
              <span className="text-theme-caption text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Pickups</span>
            </div>
            <div className="text-center px-2 border-x border-white/10 dark:border-slate-900/10">
              <span className="block text-theme-header text-white dark:text-slate-900">{metrics.returnsToday}</span>
              <span className="text-theme-caption text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Return</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-theme-header text-rose-400 dark:text-rose-600">{metrics.lateRentals}</span>
              <span className="text-theme-caption text-rose-400/80 dark:text-rose-600/80 uppercase tracking-wider font-bold">Late</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERABLE STATUS CARDS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-theme-caption text-muted uppercase tracking-[0.25em]">Operational Filter Engine</h3>
            <div className="h-px flex-1 bg-border mx-6 hidden sm:block"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 sm:gap-8">
          <FilterCard title="Total Orders" count={orders.length} status="All" active={orderFilter === 'All'} onClick={() => setOrderFilter('All')} color="bg-slate-500" icon={LayoutDashboard} />
          <FilterCard title="Pending" count={metrics.pendingRequests} status="Pending" active={orderFilter === 'Pending'} onClick={() => setOrderFilter('Pending')} color="bg-amber-500" icon={ClipboardList} />
          <FilterCard title="Approved" count={metrics.approvedOrders} status="Approved" active={orderFilter === 'Approved'} onClick={() => setOrderFilter('Approved')} color="bg-blue-500" icon={Check} />
          <FilterCard title="Active" count={metrics.activeRentals} status="Active" active={orderFilter === 'Active'} onClick={() => setOrderFilter('Active')} color="bg-indigo-500" icon={Truck} />
          <FilterCard title="Overdue" count={metrics.lateRentals} status="Late" active={orderFilter === 'Late'} onClick={() => setOrderFilter('Late')} color="bg-rose-500" icon={AlertOctagon} />
          <FilterCard title="Completed" count={metrics.completedRentals} status="Completed" active={orderFilter === 'Completed'} onClick={() => setOrderFilter('Completed')} color="bg-emerald-500" icon={Check} />
        </div>
      </div>

      {/* ORDER HISTORY SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-theme-title text-foreground tracking-tight">{orderFilter === 'All' ? 'Recent Orders' : `${orderFilter} Orders`}</h2>
            <p className="text-theme-caption text-muted mt-1">{filteredOrders.length} records found</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search orders, clients..." 
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-theme-label outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" onClick={() => setCreateOrderStep('select-client')}>
              <Plus className="w-4 h-4 mr-2" /> CREATE ORDER
            </Button>
          </div>
        </div>

        <OrderTable 
            orders={sortedOrders}
            inventory={inventory}
            isAdmin={true}
            onUpdateStatus={updateOrderStatus}
            onViewInvoice={handleOrderInvoice}
            sortConfig={sortConfig}
            requestSort={requestSort}
        />
      </div>

      {/* POS MODALS & OVERLAYS */}
      {createOrderStep === 'select-client' && (
        <ClientSelector clients={clients} onClose={() => setCreateOrderStep('none')} onSelect={(c: any) => { setSelectedClient(c); setCreateOrderStep('shop'); }} />
      )}

      {createOrderStep === 'shop' && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-surface border-b border-border sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <Button variant="secondary" size="sm" onClick={() => { setCreateOrderStep('none'); setPosCart([]); }}><X className="w-4 h-4 mr-2" /> Cancel</Button>
              <div className="h-6 w-px bg-border"></div>
              <h2 className="text-theme-subtitle text-foreground">New Order for <span className="text-primary">{selectedClient?.firstName} {selectedClient?.lastName}</span></h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2 hidden md:block">
                <p className="text-theme-caption font-bold text-muted uppercase tracking-wider">Estimated Total</p>
                <p className="text-theme-title text-foreground">{formatCurrency(posTotal)}</p>
              </div>
              <Button onClick={() => setCreateOrderStep('review')} disabled={posCart.length === 0}>Review Order ({posCart.length}) <ChevronRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-lg">
                <div className="bg-surface p-3 rounded-xl border border-border shadow-sm flex flex-col gap-1">
                  <label className="text-theme-caption font-black text-muted uppercase px-1">Pickup Date</label>
                  <input type="date" className="w-full bg-transparent text-foreground text-theme-label outline-none" value={posDates.start} onChange={e => setPosDates({ ...posDates, start: e.target.value })} />
                </div>
                <div className="bg-surface p-3 rounded-xl border border-border shadow-sm flex flex-col gap-1">
                  <label className="text-theme-caption font-black text-muted uppercase px-1">Return Date</label>
                  <input type="date" className="w-full bg-transparent text-foreground text-theme-label outline-none" value={posDates.end} onChange={e => setPosDates({ ...posDates, end: e.target.value })} />
                </div>
              </div>
            </div>
            <Card noPadding><InventoryTable data={inventory} isAdmin={false} onAddToCart={addToPosCart} cart={posCart} /></Card>
          </div>
        </div>
      )}

      {createOrderStep === 'review' && (
        <InvoiceModal isOpen={true} onClose={() => setCreateOrderStep('shop')} cart={posCart} client={selectedClient} total={posTotal} startDate={posDates.start} endDate={posDates.end} onConfirm={submitAdminOrder} />
      )}

      {viewingInvoice && (
        <InvoiceModal isOpen={true} onClose={() => setViewingInvoice(null)} cart={viewingInvoice.cart} client={viewingInvoice.client} total={viewingInvoice.totalAmount} startDate={viewingInvoice.startDate} endDate={viewingInvoice.endDate} penaltyAmount={viewingInvoice.penaltyAmount} status={viewingInvoice.status} onConfirm={() => setViewingInvoice(null)} />
      )}

      {/* ENHANCED RETURN TRACKING DIALOG */}
      {mounted && returnOrder && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setReturnOrder(null)}
        >
            <div 
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Sticky */}
                <div className="bg-slate-800 text-white p-6 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg text-emerald-400"><Check className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-theme-title font-bold tracking-tight">Process Return Audit</h3>
                            <p className="text-theme-caption text-slate-400 font-medium">Order #{returnOrder.id} • {returnOrder.clientName}</p>
                        </div>
                    </div>
                    <button onClick={() => setReturnOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Dates & Logistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-theme-caption font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Actual Return Date</label>
                            <input type="date" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-theme-label text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Return Status</label>
                                <div className="flex gap-2">
                                    {(['Early', 'On Time', 'Late'] as const).map(status => {
                                        const isActive = selectedReturnStatus === status;
                                        const colors = {
                                            'Early': isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-blue-200',
                                            'On Time': isActive ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500 hover:border-emerald-200',
                                            'Late': isActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 text-slate-500 hover:border-rose-200'
                                        };
                                        return (
                                            <button 
                                                key={status}
                                                onClick={() => setSelectedReturnStatus(status)} 
                                                className={`flex-1 py-2.5 border-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all text-center ${colors[status]}`}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Item Integrity</label>
                                <div className="flex gap-2">
                                    {(['Good', 'Lost', 'Damaged'] as const).map(status => {
                                        const isActive = selectedItemIntegrity.includes(status);
                                        const colors = {
                                            'Good': isActive ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500 hover:border-emerald-200',
                                            'Lost': isActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 text-slate-500 hover:border-rose-200',
                                            'Damaged': isActive ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 text-slate-500 hover:border-amber-200'
                                        };
                                        return (
                                            <button 
                                                key={status}
                                                onClick={() => toggleIntegrity(status)} 
                                                className={`flex-1 py-2.5 border-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all text-center ${colors[status]}`}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Item Audit List */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Inspection</label>
                        </div>
                        <div className="space-y-3">
                            {returnOrder.items.map(item => {
                                const invItem = inventory.find(i => i.id === item.itemId);
                                const qtys = returnItemQuantities[item.itemId] || { returned: item.qty, lost: 0, damaged: 0 };
                                
                                return (
                                    <div key={item.itemId} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm group hover:border-slate-200 hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-xl text-slate-400 group-hover:scale-110 transition-transform">{invItem?.image || '📦'}</div>
                                                <div>
                                                    <p className="text-theme-body-bold text-slate-900">{invItem?.name}</p>
                                                    <p className="text-theme-caption text-slate-400 font-bold uppercase tracking-tight">Original Qty: {item.qty}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Good</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-12 text-center bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-black text-emerald-600 outline-none focus:border-emerald-500" 
                                                        value={qtys.returned} 
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setReturnItemQuantities({ ...returnItemQuantities, [item.itemId]: { ...qtys, returned: val } });
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Lost</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-12 text-center bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-black text-rose-600 outline-none focus:border-rose-500" 
                                                        value={qtys.lost} 
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setReturnItemQuantities({ ...returnItemQuantities, [item.itemId]: { ...qtys, lost: val } });
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Dmg</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-12 text-center bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-black text-amber-600 outline-none focus:border-amber-500" 
                                                        value={qtys.damaged} 
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setReturnItemQuantities({ ...returnItemQuantities, [item.itemId]: { ...qtys, damaged: val } });
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
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner">
                        <div className="space-y-2.5">
                            <h4 className="text-theme-caption font-black text-slate-400 uppercase tracking-widest mb-4">Financial Summary</h4>
                            <div className="flex justify-between text-theme-body">
                                <span className="text-slate-500">Rental Subtotal</span>
                                <span className="text-slate-900 font-bold">{formatCurrency(returnTotals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-theme-body">
                                <span className="text-slate-500">Late Fees</span>
                                <span className="text-rose-600 font-bold">+{formatCurrency(returnTotals.lateFee)}</span>
                            </div>
                            <div className="flex justify-between text-theme-body">
                                <span className="text-slate-500">Damage/Loss Penalty</span>
                                <span className="text-rose-600 font-bold">+{formatCurrency(returnTotals.lossFee + returnTotals.damageFee)}</span>
                            </div>
                            <div className="flex justify-between text-theme-body pt-2 border-t border-slate-200">
                                <span className="text-slate-500">Total Revised Bill</span>
                                <span className="text-theme-body-bold text-slate-900">{formatCurrency(returnTotals.total)}</span>
                            </div>
                            <div className="flex justify-between text-theme-body">
                                <span className="text-slate-500">Already Paid</span>
                                <span className="text-emerald-600 font-bold">-{formatCurrency(returnOrder.amountPaid)}</span>
                            </div>
                            <div className="flex justify-between text-theme-subtitle font-black pt-3 border-t-2 border-slate-900 mt-2">
                                <span className="text-slate-900 uppercase tracking-tighter">Amount Due Now</span>
                                <span className="text-rose-600 text-theme-header">{formatCurrency(Math.max(0, returnTotals.total - returnOrder.amountPaid))}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-theme-caption font-black text-slate-400 uppercase tracking-widest mb-4">Process Payment</h4>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-theme-header transition-colors ${submitAttempted && (!paymentAmount || paymentAmount <= 0) ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>¢</div>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    min="0.01"
                                    required
                                    className={`w-full pl-10 pr-4 py-5 bg-white border rounded-2xl text-theme-header font-black text-slate-900 outline-none transition-all shadow-sm ${
                                        submitAttempted && (!paymentAmount || paymentAmount <= 0) 
                                        ? 'border-rose-500 focus:ring-rose-500/10' 
                                        : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                    }`}
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        setPaymentAmount(parseFloat(e.target.value) || 0);
                                        if (submitAttempted) setSubmitAttempted(false);
                                    }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setPaymentAmount(Math.max(0, returnTotals.total - returnOrder.amountPaid))} className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 text-theme-caption font-black uppercase rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm">Pay Full Balance</button>
                                <button onClick={() => setPaymentAmount(0)} className="flex-1 py-2.5 bg-slate-100 text-slate-500 text-theme-caption font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors shadow-sm">Clear</button>
                            </div>
                            {returnTotals.balance > 0 && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 mt-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                    <p className="text-theme-caption text-amber-700 font-bold italic leading-tight">Order remains in 'Settlement' until balance is ¢0.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Sticky */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
                    <Button variant="secondary" className="flex-1 rounded-2xl" onClick={() => setReturnOrder(null)}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-2xl" 
                        onClick={handleConfirmReturn}
                    >
                        {returnTotals.balance <= 0 ? 'Finalize & Close Order' : 'Record Partial Payment'}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
}
