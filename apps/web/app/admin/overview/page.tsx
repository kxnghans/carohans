"use client";

import React, { useState, useMemo } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { calculateMetrics, formatCurrency } from '../../utils/helpers';
import { FilterCard } from '../../components/dashboard/FilterCard';
import { OrderAdminCard } from '../../components/orders/OrderAdminCard';
import { CustomerSelector } from '../../components/modals/CustomerSelector';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Order, Customer, InventoryItem, Metrics, CartItem } from '../../types';

export default function AdminOverviewPage() {
  const { Truck, LayoutDashboard, ClipboardList, AlertOctagon, Check, Search, Plus, X, ChevronRight } = Icons;
  const { orders, setOrders, customers, showNotification, inventory } = useAppStore();
  
  // Local state for filters and POS flow
  const [orderFilter, setOrderFilter] = useState('All');
  const [createOrderStep, setCreateOrderStep] = useState<'none' | 'select-customer' | 'shop' | 'review'>('none');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [posCart, setPosCart] = useState<(InventoryItem & { qty: number })[]>([]);
  const [posDates, setPosDates] = useState({ start: '', end: '' });
  const [viewingInvoice, setViewingInvoice] = useState<(Order & { cart: any[], customer: any }) | null>(null);

  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'All') return orders;
    return orders.filter(o => o.status === orderFilter);
  }, [orders, orderFilter]);

  const handleOrderInvoice = (order: Order) => {
    // Reconstruct the cart items for the InvoiceModal
    const reconstructedCart = order.items.map((item) => {
      const inventoryItem = inventory.find(i => i.id === item.itemId);
      return {
        ...inventoryItem,
        qty: item.qty
      };
    });

    setViewingInvoice({
      ...order,
      cart: reconstructedCart,
      customer: {
        name: order.customerName,
        email: order.email,
        phone: order.phone
      }
    });
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showNotification(`Order #${orderId} marked as ${newStatus}`);
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

  const submitAdminOrder = () => {
    if (!selectedCustomer) return;
    const newOrder: Order = {
      id: Math.floor(Math.random() * 10000),
      customerName: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
      status: 'Approved',
      items: posCart.map(i => ({ itemId: i.id, qty: i.qty })),
      startDate: posDates.start || '2026-02-25',
      endDate: posDates.end || '2026-02-27',
      totalAmount: posCart.reduce((sum, i) => sum + (i.price * i.qty * 2), 0),
      depositPaid: false
    };
    setOrders(prev => [newOrder, ...prev]);
    setPosCart([]);
    setSelectedCustomer(null);
    setPosDates({ start: '', end: '' });
    setCreateOrderStep('none');
    setOrderFilter('All');
    showNotification("Order Created Successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* TODAY'S LOGISTICS BANNER */}
      <div className="bg-slate-800 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
          <Truck className="w-64 h-64 -mr-16 -mt-16" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-4 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Live Operations
            </div>
            <h2 className="text-3xl font-bold mb-2">Today's Logistics</h2>
            <p className="text-slate-400">Overview of pickup and return schedules for today.</p>
          </div>

          <div className="flex items-center gap-8 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-center">
              <span className="block text-3xl font-bold text-white">3</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Pickups</span>
            </div>
            <div className="w-px bg-white/10 h-10"></div>
            <div className="text-center">
              <span className="block text-3xl font-bold text-white">1</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Return</span>
            </div>
            <div className="w-px bg-white/10 h-10"></div>
            <div className="text-center">
              <span className="block text-3xl font-bold text-rose-400">{metrics.overdueRentals}</span>
              <span className="text-xs text-rose-400/80 uppercase tracking-wider font-bold">Overdue</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERABLE STATUS CARDS */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 ml-1">Order Status</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <FilterCard
            title="Total Orders"
            count={orders.length}
            status="All"
            active={orderFilter === 'All'}
            onClick={() => setOrderFilter('All')}
            color="bg-slate-500"
            icon={LayoutDashboard}
          />
          <FilterCard
            title="Pending Requests"
            count={metrics.pendingRequests}
            status="Pending"
            active={orderFilter === 'Pending'}
            onClick={() => setOrderFilter('Pending')}
            color="bg-amber-500"
            icon={ClipboardList}
          />
          <FilterCard
            title="Active Rentals"
            count={metrics.activeRentals}
            status="Active"
            active={orderFilter === 'Active'}
            onClick={() => setOrderFilter('Active')}
            color="bg-indigo-500"
            icon={Truck}
          />
          <FilterCard
            title="Overdue Returns"
            count={metrics.overdueRentals}
            status="Overdue"
            active={orderFilter === 'Overdue'}
            onClick={() => setOrderFilter('Overdue')}
            color="bg-rose-500"
            icon={AlertOctagon}
          />
          <FilterCard
            title="Completed History"
            count={metrics.completedRentals}
            status="Completed"
            active={orderFilter === 'Completed'}
            onClick={() => setOrderFilter('Completed')}
            color="bg-emerald-500"
            icon={Check}
          />
        </div>
      </div>

      {/* ORDER MANAGEMENT SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {orderFilter === 'All' ? 'Recent Orders' : `${orderFilter} Orders`}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{filteredOrders.length} records found</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                placeholder="Search Order ID..."
                className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:border-slate-400 hover:border-slate-300 transition-colors"
              />
            </div>
          </div>
          <Button size="sm" className="whitespace-nowrap" onClick={() => setCreateOrderStep('select-customer')}>
            <Plus className="w-4 h-4 mr-2" /> CREATE ORDER
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h4 className="text-slate-900 font-bold mb-1">No orders found</h4>
            <p className="text-slate-500 text-sm mb-4">There are no {orderFilter.toLowerCase()} orders to display.</p>
            <button onClick={() => setOrderFilter('All')} className="text-indigo-600 text-sm font-bold hover:underline">View All Orders</button>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderAdminCard 
              key={order.id} 
              order={order} 
              updateStatus={updateOrderStatus} 
              onInvoice={handleOrderInvoice}
            />
          ))
        )}
      </div>

      {/* POS MODALS & OVERLAYS */}
      {createOrderStep === 'select-customer' && (
        <CustomerSelector
          customers={customers}
          onClose={() => setCreateOrderStep('none')}
          onSelect={(c: any) => { setSelectedCustomer(c); setCreateOrderStep('shop'); }}
        />
      )}

      {createOrderStep === 'shop' && (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <Button variant="secondary" size="sm" onClick={() => { setCreateOrderStep('none'); setPosCart([]); }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div>
                <h2 className="font-bold text-slate-900">New Order</h2>
                <p className="text-xs text-slate-500">for <span className="font-bold text-indigo-600">{selectedCustomer?.name}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2 hidden md:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total (Est. 2 Days)</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(posCart.reduce((sum, i) => sum + (i.price * i.qty * 2), 0))}</p>
              </div>
              <Button onClick={() => setCreateOrderStep('review')} disabled={posCart.length === 0}>
                Review Order ({posCart.length}) <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full md:w-96">
                <div className="pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  className="w-full p-2 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  placeholder="Search catalog..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-lg">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Pickup Date</label>
                  <input
                    type="date"
                    className="w-full bg-transparent text-slate-900 font-bold outline-none text-base p-1"
                    value={posDates.start}
                    onChange={e => setPosDates({ ...posDates, start: e.target.value })}
                  />
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Return Date</label>
                  <input
                    type="date"
                    className="w-full bg-transparent text-slate-900 font-bold outline-none text-base p-1"
                    value={posDates.end}
                    onChange={e => setPosDates({ ...posDates, end: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Card noPadding>
              <InventoryTable
                data={inventory}
                isAdmin={false} // Use same as client view (order column only) for POS
                onAddToCart={addToPosCart}
                cart={posCart}
              />
            </Card>
          </div>
        </div>
      )}

      {createOrderStep === 'review' && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setCreateOrderStep('shop')}
          cart={posCart}
          customer={selectedCustomer}
          total={posCart.reduce((sum, i) => sum + (i.price * i.qty * 2), 0)}
          onConfirm={submitAdminOrder}
        />
      )}

      {viewingInvoice && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setViewingInvoice(null)}
          cart={viewingInvoice.cart}
          customer={viewingInvoice.customer}
          total={viewingInvoice.totalAmount}
          onConfirm={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}
