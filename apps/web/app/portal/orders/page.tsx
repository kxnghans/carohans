"use client";

import { useState, useMemo } from 'react';
import { useAppStore } from '../../context/AppContext';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { OrderTable } from '../../components/orders/OrderTable';

import { Order, OrderItem, InventoryItem, Client } from '../../types';

export default function PortalOrdersPage() {
  const { orders, user, userRole, portalFormData, loading, inventory } = useAppStore();
  
  const [viewingInvoice, setViewingInvoice] = useState<(Order & { cart: (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[], client: Partial<Client> }) | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'id',
    direction: 'desc'
  });

  // Filter orders for the current user email (or impersonated client if admin)
  const myOrders = useMemo(() => {
    const targetEmail = userRole === 'admin' ? portalFormData.email : user?.email;
    if (!targetEmail) return [];
    return orders.filter(o => o.email === targetEmail);
  }, [orders, user, userRole, portalFormData.email]);

  // Sorting Logic
  const sortedOrders = useMemo(() => {
    const sortableItems = [...myOrders];
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
  }, [myOrders, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleViewInvoice = (order: Order) => {
    const reconstructedCart = order.items.map((item: OrderItem) => {
      const inventoryItem = inventory.find(i => i.id === item.itemId);
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
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-theme-title text-foreground">My Order History</h2>
      
      {myOrders.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-theme-body">No orders found.</p>
        </div>
      ) : (
        <OrderTable
            orders={sortedOrders}
            inventory={inventory}
            isAdmin={false}
            onViewInvoice={handleViewInvoice}
            sortConfig={sortConfig}
            requestSort={requestSort}
        />
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
          onConfirm={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}
