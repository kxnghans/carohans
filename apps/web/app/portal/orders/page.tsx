"use client";

import { useState, useMemo } from 'react';
import { Icons } from '../../lib/icons';
import { OrderTable } from '../../components/orders/OrderTable';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { useAppStore } from '../../context/AppContext';
import { ComparisonSlicer, SelectSlicer, SlicerContainer } from '../../components/common/AllFiltersPane';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DateRangeModal } from '../../components/modals/DateRangeModal';
import { Order, InventoryItem, Client, OrderItem } from '../../types';

export default function PortalOrdersPage() {
  const { orders, user, userRole, portalFormData, loading, inventory } = useAppStore();
  const { Search, Filter, ChevronDown, Calendar } = Icons;
  
  const [viewingInvoice, setViewingInvoice] = useState<(Order & { cart: (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[], client: Partial<Client> }) | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'id',
    direction: 'desc'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showSlicers, setShowSlicers] = useState(false);
  const [rangeModalType, setRangeModalType] = useState<'pickup' | 'return' | null>(null);
  const [currentLimit, setCurrentLimit] = useState(25);

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

  // Filter orders for the current user email (or impersonated client if admin)
  const myOrdersRaw = useMemo(() => {
    const targetEmail = userRole === 'admin' ? portalFormData.email : user?.email;
    if (!targetEmail) return [];
    return orders.filter(o => o.email === targetEmail);
  }, [orders, user, userRole, portalFormData.email]);

  const filteredOrders = useMemo(() => {
    let result = [...myOrdersRaw];

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(o => 
            o.id.toString().includes(q) || 
            (o.publicId && o.publicId.toLowerCase().includes(q))
        );
    }

    if (filters.status !== 'All') {
        result = result.filter(o => o.status === filters.status);
    }

    if (filters.return_status !== 'All') {
        result = result.filter(o => o.returnStatus === filters.return_status);
    }

    if (filters.id) {
        result = result.filter(o => o.id.toString().includes(filters.id) || (o.publicId && o.publicId.includes(filters.id)));
    }

    if (filters.pickup_start) {
        result = result.filter(o => o.startDate >= filters.pickup_start);
    }
    if (filters.pickup_end) {
        result = result.filter(o => o.startDate <= filters.pickup_end);
    }
    if (filters.return_start) {
        result = result.filter(o => o.endDate >= filters.return_start);
    }
    if (filters.return_end) {
        result = result.filter(o => o.endDate <= filters.return_end);
    }

    if (filters.total_value) {
        const val = parseFloat(filters.total_value);
        if (!isNaN(val)) {
            result = result.filter(o => {
                if (filters.total_operator === 'gt') return o.totalAmount > val;
                if (filters.total_operator === 'gte') return o.totalAmount >= val;
                if (filters.total_operator === 'lt') return o.totalAmount < val;
                if (filters.total_operator === 'lte') return o.totalAmount <= val;
                return o.totalAmount === val;
            });
        }
    }

    return result;
  }, [myOrdersRaw, searchQuery, filters]);

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

  // Pagination Logic (Client Side for Portal)
  const paginatedOrders = useMemo(() => {
      return filteredOrders.slice(0, currentLimit);
  }, [filteredOrders, currentLimit]);

  // Sorting Logic
  const sortedOrders = useMemo(() => {
    const sortableItems = [...paginatedOrders];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof typeof a];
        let bVal = b[sortConfig.key as keyof typeof b];

        if (sortConfig.key === 'startDate') {
            aVal = new Date(aVal as string).getTime();
            bVal = new Date(bVal as string).getTime();
        }

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [paginatedOrders, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleViewInvoice = (order: Order) => {
    const reconstructedCart = order.items.map((item: OrderItem) => {
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
      cart: reconstructedCart,
      client: { firstName: order.clientName, email: order.email, phone: order.phone }
    });
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
            <p className="text-theme-body font-medium">Fetching your orders...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
                <h2 className="text-theme-title text-foreground tracking-tight">
                    {!isAnyFilterActive ? 'Recent Orders' : 'Order History'}
                </h2>
                <p className="text-theme-caption text-muted mt-1">Showing {paginatedOrders.length} records</p>
            </div>
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowSlicers(!showSlicers)}
                className={`transition-all font-bold h-[44px] px-6 ${showSlicers ? 'bg-foreground text-background border-foreground shadow-inner' : 'hover:bg-secondary/10 hover:text-secondary'}`}
            >
                <Filter className="w-4 h-4 mr-2" /> 
                {showSlicers ? 'Hide Slicers' : 'All Filters'} 
                {!showSlicers && <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="ID Search..." 
                className="w-full pl-12 pr-4 py-2.5 bg-surface border border-border rounded-xl text-theme-label outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all shadow-sm placeholder:text-muted/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
      </div>

      {/* ADVANCED SLICERS PANEL */}
      {showSlicers && (
            <Card className="bg-surface border-border/60 p-6 shadow-lg animate-in slide-in-from-top-2 duration-300 relative overflow-visible">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-2xl"></div>
                <div className="flex flex-wrap items-end gap-5">
                    <SlicerContainer label="Order IDs" className="flex-1 min-w-[140px]">
                        <input 
                            type="text" 
                            placeholder="ORDER ID"
                            className="w-full h-11 px-4 bg-background border border-border rounded-xl uppercase outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-muted/50 text-theme-body text-foreground font-mono font-bold shadow-sm placeholder:font-semibold"
                            value={filters.id}
                            onChange={(e) => setFilters(f => ({ ...f, id: e.target.value }))}
                        />
                    </SlicerContainer>

                    <SelectSlicer 
                        label="Status"
                        value={filters.status}
                        options={statusOptions}
                        onChange={(val: string) => setFilters({...filters, status: val})}
                        className="flex-1 min-w-[160px]"
                    />

                    <SelectSlicer 
                        label="Variance"
                        value={filters.return_status}
                        options={varianceOptions}
                        onChange={(val: string) => setFilters({...filters, return_status: val})}
                        className="flex-1 min-w-[140px]"
                    />

                    <SlicerContainer label="Pickup Range" className="flex-1 min-w-[160px]">
                        <button 
                            type="button"
                            onClick={() => setRangeModalType('pickup')}
                            className="w-full h-11 flex items-center justify-between px-4 bg-background border border-border rounded-xl uppercase outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-theme-body text-foreground font-bold shadow-sm"
                        >
                            <div className="flex items-center gap-2 overflow-hidden text-left">
                                <Calendar className="w-4 h-4 text-muted shrink-0" />
                                <span className={`truncate text-[11px] font-semibold uppercase tracking-widest ${filters.pickup_start ? 'text-foreground' : 'text-foreground/70'}`}>
                                    {filters.pickup_start ? `${filters.pickup_start} to ${filters.pickup_end}` : 'Select Range'}
                                </span>
                            </div>
                        </button>
                    </SlicerContainer>

                    <SlicerContainer label="Return Range" className="flex-1 min-w-[160px]">
                        <button 
                            type="button"
                            onClick={() => setRangeModalType('return')}
                            className="w-full h-11 flex items-center justify-between px-4 bg-background border border-border rounded-xl uppercase outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-theme-body text-foreground font-bold shadow-sm"
                        >
                            <div className="flex items-center gap-2 overflow-hidden text-left">
                                <Calendar className="w-4 h-4 text-muted shrink-0" />
                                <span className={`truncate text-[11px] font-semibold uppercase tracking-widest ${filters.return_start ? 'text-foreground' : 'text-muted font-normal'}`}>
                                    {filters.return_start ? `${filters.return_start} to ${filters.return_end}` : 'Select Range'}
                                </span>
                            </div>
                        </button>
                    </SlicerContainer>

                    <ComparisonSlicer 
                        label="Total Value (¢)"
                        operator={filters.total_operator}
                        value={filters.total_value}
                        onOperatorChange={(op) => setFilters({...filters, total_operator: op})}
                        onValueChange={(val) => setFilters({...filters, total_value: val})}
                        className="flex-[1.2] min-w-[200px]"
                    />

                    <div className="flex items-end h-11 ml-auto">
                        <button 
                            type="button"
                            onClick={() => { setFilters({ status: 'All', return_status: 'All', id: '', pickup_start: '', pickup_end: '', return_start: '', return_end: '', total_operator: 'gt', total_value: '' }); setSearchQuery(''); setCurrentLimit(25); }}
                            className="h-11 px-8 bg-primary dark:bg-primary text-primary-text rounded-xl text-theme-subtitle uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/10 active:scale-[0.98] whitespace-nowrap w-fit" 
                        >
                            RESET
                        </button>
                    </div>
                </div>
            </Card>
      )}
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-theme-body">No orders found.</p>
        </div>
      ) : (
        <>
            <OrderTable
                orders={sortedOrders}
                inventory={inventory}
                isAdmin={false}
                onViewInvoice={handleViewInvoice}
                sortConfig={sortConfig}
                requestSort={requestSort}
            />

            {/* LOAD MORE BUTTON */}
            {filteredOrders.length > currentLimit && currentLimit < 200 && (
                <div className="flex justify-center pt-8 pb-12">
                    <Button 
                        variant="secondary" 
                        className="px-10 h-11 rounded-2xl shadow-sm hover:shadow-md transition-all border-border bg-surface text-theme-body font-semibold"
                        onClick={() => setCurrentLimit(prev => Math.min(prev + 25, 200))}
                    >
                        <Icons.ChevronDown className="w-4 h-4 mr-2" /> Load More History
                    </Button>
                </div>
            )}
        </>
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
          orderId={viewingInvoice.id}
          publicId={viewingInvoice.publicId}
          onConfirm={() => setViewingInvoice(null)}
        />
      )}

      {/* DATE RANGE FILTER MODAL */}
      <DateRangeModal
        isOpen={!!rangeModalType}
        onClose={() => setRangeModalType(null)}
        initialStart={rangeModalType === 'pickup' ? filters.pickup_start : filters.return_start}
        initialEnd={rangeModalType === 'pickup' ? filters.pickup_end : filters.return_end}
        onSelect={(start: string, end: string) => {
            if (rangeModalType === 'pickup') setFilters({...filters, pickup_start: start, pickup_end: end});
            else setFilters({...filters, return_start: start, return_end: end});
        }}
      />
    </div>
  );
}
