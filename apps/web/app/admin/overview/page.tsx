"use client";

import { useState, useMemo, useEffect } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { calculateMetrics, formatCurrency, calculateOrderTotal } from '../../utils/helpers';
import { FilterCard } from '../../components/dashboard/FilterCard';
import { ClientSelector } from '../../components/modals/ClientSelector';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { ReturnModal } from '../../components/modals/ReturnModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { DynamicIcon } from '../../components/common/DynamicIcon';
import { Order, Client, InventoryItem, PortalFormData } from '../../types';
import { updateOrderStatusToSupabase } from '../../services/orderService';
import { OrderTable } from '../../components/orders/OrderTable';

export default function AdminOverviewPage() {
  const { Truck, LayoutDashboard, ClipboardList, AlertOctagon, Check, Search, Plus, X, ChevronRight, Loader2, User, CreditCard } = Icons;
  const { orders, setOrders, clients, showNotification, inventory, loading, submitOrder, latePenaltyPerDay, modifyingOrderId, setModifyingOrderId, cancelModification, setCart, portalFormData, setPortalFormData, cart, createOrderStep, setCreateOrderStep } = useAppStore();
  
  const [mounted, setMounted] = useState(false);
  const [orderFilter, setOrderFilter] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [viewingInvoice, setViewingInvoice] = useState<(Order & { cart: (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[], client: Partial<Client> }) | null>(null);
  
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'id',
    direction: 'desc'
  });

  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

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
    const sortableItems = [...filteredOrders];
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
      const inventoryItem = inventory.find(i => i.id === item.inventoryId);
      return { 
        ...inventoryItem, 
        qty: item.qty,
        lostQty: item.lostQty,
        damagedQty: item.damagedQty
      };
    }) as (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[];

    setViewingInvoice({
      ...order,
      endDate: order.closedAt || order.endDate,
      cart: reconstructedCart,
      client: { firstName: order.clientName, email: order.email, phone: order.phone }
    });
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, closedAt?: string, returnStatus?: string) => {
    try {
      if (newStatus === 'Completed' && !closedAt) {
          const order = orders.find(o => o.id === orderId);
          if (order) { setReturnOrder(order); return; }
      }
      await updateOrderStatusToSupabase(orderId, newStatus, closedAt, returnStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, closedAt, returnStatus: returnStatus as 'On Time' | 'Early' | 'Late' | undefined } : o));
      showNotification(`Order #${orderId} marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification("Failed to update status", "error");
    }
  };

  const addToPosCart = (item: InventoryItem, qty: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
      }
      if (qty > 0) return [...prev, { id: item.id, qty, price: item.price }];
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
        start: portalFormData.start || (new Date().toISOString().split('T')[0] ?? ''),
        end: portalFormData.end || (new Date().toISOString().split('T')[0] ?? '')
    };
    await submitOrder(orderData);
    setSelectedClient(null); setCreateOrderStep('none');
    showNotification("Order created successfully!", "success");
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-medium">Loading Dashboard Data...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* TODAY'S LOGISTICS BANNER */}
      <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary rounded-3xl p-8 shadow-2xl relative overflow-hidden group border border-border">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
          <Truck className="w-64 h-64 -mr-16 -mt-16 text-primary-text dark:text-primary" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-theme-caption font-semibold mb-4 border border-warning/20 shadow-[0_0_15px_var(--color-warning)]/10">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse shadow-[0_0_8px_var(--color-warning)]"></span> Live Operations
            </div>
            <h2 className="text-theme-header mb-2 text-primary-text dark:text-primary font-bold">Today&apos;s Logistics</h2>
            <p className="text-primary-text/60 dark:text-primary/60 text-theme-body font-medium">Overview of pickup and return schedules for today.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8 bg-primary-text/5 dark:bg-primary/5 p-6 rounded-2xl border border-primary-text/10 dark:border-primary/10 backdrop-blur-sm w-full md:w-auto">
            <div className="text-center px-2">
              <span className="block text-theme-header text-primary-text dark:text-primary font-bold">{metrics.pickupsToday}</span>
              <span className="text-theme-caption text-primary-text/60 dark:text-primary/60 uppercase tracking-wider font-semibold">Pickups</span>
            </div>
            <div className="text-center px-2 border-x border-primary-text/10 dark:border-primary/10">
              <span className="block text-theme-header text-primary-text dark:text-primary font-bold">{metrics.returnsToday}</span>
              <span className="text-theme-caption text-primary-text/60 dark:text-primary/60 uppercase tracking-wider font-semibold">Return</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-theme-header text-error font-bold">{metrics.lateRentals}</span>
              <span className="text-theme-caption text-error/80 uppercase tracking-wider font-semibold">Late</span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6 lg:gap-8">
          <FilterCard title="Total Orders" count={orders.length} status="All" active={orderFilter === 'All'} onClick={() => setOrderFilter('All')} color="bg-primary" icon={LayoutDashboard} />
          <FilterCard title="Pending" count={metrics.pendingRequests} status="Pending" active={orderFilter === 'Pending'} onClick={() => setOrderFilter('Pending')} color="bg-primary" icon={ClipboardList} />
          <FilterCard title="Active" count={metrics.activeRentals} status="Active" active={orderFilter === 'Active'} onClick={() => setOrderFilter('Active')} color="bg-primary" icon={Truck} />
          <FilterCard title="Overdue" count={metrics.lateRentals} status="Late" active={orderFilter === 'Late'} onClick={() => setOrderFilter('Late')} color="bg-primary" icon={AlertOctagon} />
          <FilterCard title="Settlement" count={metrics.settlementOrders} status="Settlement" active={orderFilter === 'Settlement'} onClick={() => setOrderFilter('Settlement')} color="bg-primary" icon={CreditCard} />
          <FilterCard title="Completed" count={metrics.completedRentals} status="Completed" active={orderFilter === 'Completed'} onClick={() => setOrderFilter('Completed')} color="bg-primary" icon={Check} />
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
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search orders, clients..." 
                className="w-full pl-12 pr-4 py-2.5 bg-surface border border-border rounded-xl text-theme-label outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="w-full md:w-auto bg-primary text-primary-text hover:opacity-90 shadow-lg shadow-primary/20" onClick={() => setCreateOrderStep('select-client')}>
              <Plus className="w-4 h-4 mr-2" /> NEW ORDER
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
        <ClientSelector clients={clients} onClose={() => setCreateOrderStep('none')} onSelect={(c: Client) => { setSelectedClient(c); setCreateOrderStep('shop'); }} />
      )}

      {createOrderStep === 'shop' && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-surface border-b border-border sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <Button variant="secondary" size="sm" onClick={() => { setCreateOrderStep('none'); setModifyingOrderId(null); setCart([]); setPortalFormData(prev => ({ ...prev, start: '', end: '' })); }}><X className="w-4 h-4 mr-2" /> Cancel</Button>
              <div className="h-6 w-px bg-border"></div>
              <h2 className="text-theme-subtitle text-foreground mr-2 whitespace-nowrap">{modifyingOrderId ? 'Modifying Order #' + modifyingOrderId : 'New Order For'}</h2>
              <div className="bg-surface py-2 px-3 rounded-2xl border border-border shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border transition-all ${selectedClient?.color ? selectedClient.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' border-' + (selectedClient.color.split('-')[1] || 'slate') + '-200' : 'bg-background border-border'}`}>
                    <DynamicIcon 
                        iconString={selectedClient?.image} 
                        color={selectedClient?.color} 
                        className="w-5 h-5" 
                        fallback={<User className={`w-5 h-5 ${selectedClient?.color || 'text-muted'}`} />} 
                    />
                </div>
                <div className="flex flex-col leading-tight pr-1">
                    <span className="text-theme-body-bold text-foreground text-sm font-black">{selectedClient?.firstName} {selectedClient?.lastName}</span>
                    <span className="text-[10px] text-muted font-bold">{selectedClient?.phone} • {selectedClient?.email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2 hidden md:block">
                <p className="text-theme-caption font-bold text-muted uppercase tracking-wider">Estimated Total</p>
                <p className="text-theme-title text-foreground">{formatCurrency(calculateOrderTotal(cart, portalFormData.start, portalFormData.end))}</p>
              </div>
              {modifyingOrderId && (
                  <Button 
                    variant="danger" 
                    size="md" 
                    className="bg-error text-primary-text border-error hover:bg-error/90 dark:bg-error"
                    onClick={() => { setCreateOrderStep('none'); cancelModification(); }}
                  >
                    <X className="w-4 h-4 mr-2" /> Discard Changes
                  </Button>
              )}
              <Button onClick={() => setCreateOrderStep('review')} disabled={cart.length === 0}>Review Order ({cart.length}) <ChevronRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-lg">
                <DatePicker 
                  label="Pickup Date"
                  value={portalFormData.start}
                  onChange={(val) => setPortalFormData(prev => ({ ...prev, start: val }))}
                />
                <DatePicker 
                  label="Planned Return Date"
                  value={portalFormData.end}
                  onChange={(val) => setPortalFormData(prev => ({ ...prev, end: val }))}
                />
              </div>
            </div>
            <Card noPadding><InventoryTable data={inventory} isAdmin={false} onAddToCart={addToPosCart} cart={cart} /></Card>
          </div>
        </div>
      )}

      {createOrderStep === 'review' && (
        <InvoiceModal 
            isOpen={true} 
            onClose={() => setCreateOrderStep('shop')} 
            cart={cart.map(item => ({ ...inventory.find(i => i.id === item.id), ...item })) as (InventoryItem & { qty: number })[]} 
            client={selectedClient} 
            startDate={portalFormData.start} 
            endDate={portalFormData.end} 
            onConfirm={submitAdminOrder} 
        />
      )}

      {viewingInvoice && (
        <InvoiceModal isOpen={true} onClose={() => setViewingInvoice(null)} cart={viewingInvoice.cart} client={viewingInvoice.client} startDate={viewingInvoice.startDate} endDate={viewingInvoice.endDate} penaltyAmount={viewingInvoice.penaltyAmount} status={viewingInvoice.status} closedAt={viewingInvoice.closedAt} amountPaid={viewingInvoice.amountPaid} totalAmount={viewingInvoice.totalAmount} onConfirm={() => setViewingInvoice(null)} />
      )}

      {/* ENHANCED RETURN TRACKING DIALOG */}
      {mounted && returnOrder && (
        <ReturnModal 
          isOpen={true} 
          onClose={() => setReturnOrder(null)} 
          returnOrder={returnOrder} 
          inventory={inventory} 
          latePenaltyPerDay={latePenaltyPerDay}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}
