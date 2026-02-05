"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '../../lib/icons';
import { Order, Client, InventoryItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { FilterCard } from '../../components/dashboard/FilterCard';
import { SelectSlicer, ComparisonSlicer, SlicerContainer } from '../../components/common/AllFiltersPane';
import { OrderTable } from '../../components/orders/OrderTable';
import { useAppStore } from '../../context/AppContext';
import { calculateMetrics } from '../../utils/helpers';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { ReturnModal } from '../../components/modals/ReturnModal';
import { DateRangeModal } from '../../components/modals/DateRangeModal';
import { ClientSelector } from '../../components/modals/ClientSelector';
import { Button } from '../../components/ui/Button';
import { searchOrders, updateOrderStatusToSupabase } from '../../services/orderService';
import { getUserFriendlyErrorMessage } from '../../utils/errorMapping';

interface ExtendedOrder extends Order {
  cart: (InventoryItem & { qty: number; lostQty?: number; damagedQty?: number })[];
  client: { firstName: string; lastName: string; email: string; phone: string; };
}

export default function AdminOverviewPage() {
  const { Truck, LayoutDashboard, ClipboardList, AlertOctagon, Check, Search, Plus, Loader2, Filter, CreditCard } = Icons;
  const router = useRouter();
  const { 
    orders, setOrders, clients, showNotification, inventory, 
    latePenaltyPerDay, portalFormData, setPortalFormData, createOrderStep, setCreateOrderStep 
  } = useAppStore();
  
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dashboardOrders, setDashboardOrders] = useState<Order[]>([]);
  const [showSlicers, setShowSlicers] = useState(false);
  const [rangeModalType, setRangeModalType] = useState<'pickup' | 'return' | null>(null);

  const statusOptions = [
    { value: 'All', label: 'ALL' },
    { value: 'Pending', label: 'PENDING' },
    { value: 'Approved', label: 'APPROVED' },
    { value: 'Active', label: 'ACTIVE' },
    { value: 'Late', label: 'OVERDUE' },
    { value: 'Settlement', label: 'SETTLEMENT' },
    { value: 'Completed', label: 'COMPLETED' },
    { value: 'Rejected', label: 'REJECTED' },
    { value: 'Canceled', label: 'CANCELED' }
  ];

  const varianceOptions = [
    { value: 'All', label: 'ALL' },
    { value: 'Early', label: 'EARLY' },
    { value: 'On Time', label: 'ON TIME' },
    { value: 'Late', label: 'LATE' }
  ];

  const [filters, setFilters] = useState({
      status: 'All',
      return_status: 'All',
      id: '',
      pickup_start: '',
      pickup_end: '',
      return_start: '',
      return_end: '',
      total_operator: 'gt',
      total_value: ''
  });

  const isAnyFilterActive = useMemo(() => {
    return (
        searchQuery.trim() !== '' ||
        filters.status !== 'All' ||
        filters.return_status !== 'All' ||
        filters.id !== '' ||
        filters.pickup_start !== '' ||
        filters.pickup_end !== '' ||
        filters.return_start !== '' ||
        filters.return_end !== '' ||
        filters.total_value !== ''
    );
  }, [searchQuery, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
        setIsSearching(true);
        try {
            const results = await searchOrders(searchQuery, filters, 25);
            setDashboardOrders(results);
        } catch (e) { 
            console.error("Search failed:", e); 
            showNotification(getUserFriendlyErrorMessage(e, "Order search"), "error");
        }
        finally { setIsSearching(false); }
    };

    if (mounted) {
        const handler = setTimeout(fetchOrders, 300);
        return () => {
            clearTimeout(handler);
        };
    }
    return undefined;
  }, [searchQuery, filters, mounted, showNotification]);

  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<ExtendedOrder | null>(null);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    if (status === 'Completed') {
        const order = orders.find(o => o.id === orderId);
        if (order) setReturnOrder(order);
        return;
    }

    // 1. OPTIMISTIC UPDATE
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    try {
      // 2. NETWORK REQUEST (Background)
      await updateOrderStatusToSupabase(orderId, status);
      showNotification(`Order status updated to ${status.toLowerCase()}`, "success");
    } catch (e) {
      console.error("Status update failed:", e);
      // 3. ROLLBACK on failure
      setOrders(previousOrders);
      showNotification(getUserFriendlyErrorMessage(e, "Status update"), "error");
    }
  };

  const handleViewInvoice = (order: Order) => {
    setViewingInvoice({
      ...order,
      cart: order.items.map(item => ({
        ...inventory.find(i => i.id === item.inventoryId),
        ...item,
        inventoryId: item.inventoryId
      })) as (InventoryItem & { qty: number; lostQty?: number; damagedQty?: number })[],
      client: {
        firstName: order.clientName.split(' ')[0] || '',
        lastName: order.clientName.split(' ').slice(1).join(' ') || '',
        email: order.email,
        phone: order.phone
      }
    } as ExtendedOrder);
  };

  if (!mounted) return null;

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

      {createOrderStep === 'none' && (
        <>
          {/* OPERATIONAL FILTER ENGINE (MIDDLE) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-theme-caption text-muted uppercase tracking-[0.25em]">Operational Filter Engine</h3>
                <div className="h-px flex-1 bg-border mx-6 hidden sm:block"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6 lg:gap-8">
              <FilterCard title="Total Orders" count={orders.length} status="All" active={filters.status === 'All'} onClick={() => setFilters({ ...filters, status: 'All' })} color="bg-primary" icon={LayoutDashboard} />
              <FilterCard title="Pending" count={metrics.pendingRequests} status="Pending" active={filters.status === 'Pending'} onClick={() => setFilters({ ...filters, status: 'Pending' })} color="bg-primary" icon={ClipboardList} />
              <FilterCard title="Active" count={metrics.activeRentals} status="Active" active={filters.status === 'Active'} onClick={() => setFilters({ ...filters, status: 'Active' })} color="bg-primary" icon={Truck} />
              <FilterCard title="Overdue" count={metrics.lateRentals} status="Late" active={filters.status === 'Late'} onClick={() => setFilters({ ...filters, status: 'Late' })} color="bg-primary" icon={AlertOctagon} />
              <FilterCard title="Settlement" count={metrics.settlementOrders} status="Settlement" active={filters.status === 'Settlement'} onClick={() => setFilters({ ...filters, status: 'Settlement' })} color="bg-primary" icon={CreditCard} />
              <FilterCard title="Completed" count={metrics.completedRentals} status="Completed" active={filters.status === 'Completed'} onClick={() => setFilters({ ...filters, status: 'Completed' })} color="bg-primary" icon={Check} />
            </div>
          </div>

          <div className="space-y-6">
            {/* ACTION BAR */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-theme-title text-foreground tracking-tight">
                  {isAnyFilterActive ? "Order History" : "Recent Orders"}
                </h2>
                <p className="text-theme-caption text-muted mt-1">Showing {dashboardOrders.length} records</p>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                 {/* Search Bar - Full row on mobile */}
                 <div className="relative group w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                   <input 
                     type="text" 
                     placeholder="ID or Client Name..." 
                     className="w-full pl-12 pr-12 py-2.5 h-[44px] bg-surface border border-border rounded-xl text-theme-body font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm text-center"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                   {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
                 </div>

                 {/* Action Buttons - Side-by-side on mobile */}
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="secondary" 
                        className={`flex-1 md:flex-none font-bold h-[44px] px-6 transition-all ${showSlicers ? 'bg-foreground text-background border-foreground shadow-inner' : ''}`} 
                        onClick={() => setShowSlicers(!showSlicers)}
                    >
                        <Filter className="w-4 h-4 mr-2" /> {showSlicers ? 'Hide' : 'Filters'}
                    </Button>
                    <Button 
                        variant="primary" 
                        className="flex-1 md:flex-none font-bold h-[44px] px-6 shadow-lg shadow-primary/20 whitespace-nowrap" 
                        onClick={() => router.push('/admin/inventory?mode=order')}
                    >
                        <Plus className="w-4 h-4 mr-2" /> NEW ORDER
                    </Button>
                 </div>
              </div>
            </div>

            {showSlicers && (
                <Card className="p-6 bg-surface border-border/60 shadow-lg animate-in slide-in-from-top-2 duration-300 relative overflow-visible">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-x-5 gap-y-8 items-end">
                        <SlicerContainer label="Order IDs">
                            <input 
                                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-theme-body font-mono font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:font-sans placeholder:font-semibold placeholder:text-muted/50 shadow-sm" 
                                placeholder="ORDER ID" 
                                value={filters.id} 
                                onChange={(e) => setFilters({...filters, id: e.target.value})} 
                            />
                        </SlicerContainer>

                        <SelectSlicer 
                            label="Order Status"
                            value={filters.status}
                            options={statusOptions}
                            onChange={(val) => setFilters({...filters, status: val})}
                        />

                        <SelectSlicer 
                            label="Order Variance"
                            value={filters.return_status}
                            options={varianceOptions}
                            onChange={(val) => setFilters({...filters, return_status: val})}
                        />

                        <SlicerContainer label="Pickup Range">
                            <button 
                                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-left text-theme-body font-bold flex items-center justify-between group hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm" 
                                onClick={() => setRangeModalType('pickup')}
                            >
                                <span className={`truncate text-[11px] font-semibold uppercase tracking-widest ${filters.pickup_start ? 'text-foreground' : 'text-foreground/70'}`}>
                                    {filters.pickup_start ? `${filters.pickup_start.split('-').reverse().slice(0,2).join('/')} - ${filters.pickup_end.split('-').reverse().slice(0,2).join('/')}` : 'Select Dates'}
                                </span>
                                <Icons.Calendar className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
                            </button>
                        </SlicerContainer>

                        <SlicerContainer label="Return Range">
                            <button 
                                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-left text-theme-body font-bold flex items-center justify-between group hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm" 
                                onClick={() => setRangeModalType('return')}
                            >
                                <span className={`truncate text-[11px] font-semibold uppercase tracking-widest ${filters.return_start ? 'text-foreground' : 'text-foreground/70'}`}>
                                    {filters.return_start ? `${filters.return_start.split('-').reverse().slice(0,2).join('/')} - ${filters.return_end.split('-').reverse().slice(0,2).join('/')}` : 'Select Dates'}
                                </span>
                                <Icons.Calendar className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
                            </button>
                        </SlicerContainer>

                        <ComparisonSlicer 
                            label="Total Value (¢)"
                            operator={filters.total_operator}
                            value={filters.total_value}
                            onOperatorChange={(op) => setFilters({...filters, total_operator: op})}
                            onValueChange={(val) => setFilters({...filters, total_value: val})}
                        />

                        <div className="flex items-end h-11 col-span-2 md:col-span-3 xl:col-span-1 justify-center xl:justify-end mt-2">
                            <Button 
                                variant="primary" 
                                className="h-11 px-6 text-theme-subtitle uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 w-fit whitespace-nowrap" 
                                onClick={() => { 
                                    setSearchQuery(''); 
                                    setFilters({status:'All', return_status:'All', id:'', pickup_start:'', pickup_end:'', return_start:'', return_end:'', total_operator:'gt', total_value:''}); 
                                }}
                            >
                                RESET FILTERS
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {dashboardOrders.length === 0 && !isSearching ? (
                <div className="text-center py-20 bg-surface border border-dashed border-border rounded-3xl animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-muted/40" />
                    </div>
                    <h3 className="text-theme-subtitle text-foreground font-bold mb-2">No Records Found</h3>
                    <p className="text-theme-body text-muted max-w-sm mx-auto">We couldn&apos;t find any orders matching your current filters or search query.</p>
                    <Button 
                        variant="secondary" 
                        className="mt-8 font-black uppercase tracking-widest text-[10px]"
                        onClick={() => {
                            setSearchQuery('');
                            setFilters({status:'All', return_status:'All', id:'', pickup_start:'', pickup_end:'', return_start:'', return_end:'', total_operator:'gt', total_value:''});
                        }}
                    >
                        Clear All Filters
                    </Button>
                </div>
            ) : (
                <OrderTable 
                  orders={dashboardOrders} 
                  inventory={inventory} 
                  isAdmin={true} 
                  onUpdateStatus={handleUpdateStatus} 
                  onViewInvoice={handleViewInvoice}
                  sortConfig={null}
                  requestSort={() => {}}
                />
            )}
          </div>
        </>
      )}

      {createOrderStep === 'select-client' && (
        <ClientSelector clients={clients} onClose={() => setCreateOrderStep('none')} onSelect={(c: Client) => { 
            setPortalFormData({
                ...portalFormData,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                phone: c.phone,
                username: c.username || ''
            });
            setCreateOrderStep('shop'); 
        }} />
      )}

      {viewingInvoice && (
        <InvoiceModal 
            isOpen={true} 
            onClose={() => setViewingInvoice(null)} 
            cart={viewingInvoice.cart} 
            client={viewingInvoice.client} 
            startDate={viewingInvoice.startDate} 
            endDate={viewingInvoice.endDate} 
            penaltyAmount={viewingInvoice.penaltyAmount} 
            status={viewingInvoice.status} 
            closedAt={viewingInvoice.closedAt} 
            amountPaid={viewingInvoice.amountPaid} 
            totalAmount={viewingInvoice.totalAmount} 
            discountName={viewingInvoice.discountName}
            discountType={viewingInvoice.discountType}
            discountValue={viewingInvoice.discountValue}
            orderId={viewingInvoice.id}
            publicId={viewingInvoice.publicId}
            onConfirm={() => setViewingInvoice(null)} 
        />
      )}

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

      <DateRangeModal 
        isOpen={!!rangeModalType}
        onClose={() => setRangeModalType(null)}
        initialStart={rangeModalType === 'pickup' ? filters.pickup_start : filters.return_start}
        initialEnd={rangeModalType === 'pickup' ? filters.pickup_end : filters.return_end}
        onSelect={(start, end) => {
            if (rangeModalType === 'pickup') setFilters({...filters, pickup_start: start, pickup_end: end});
            else setFilters({...filters, return_start: start, return_end: end});
        }}
      />
    </div>
  );
}