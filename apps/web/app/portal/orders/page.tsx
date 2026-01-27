"use client";

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icons } from '../../lib/icons';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { getStatusColor, formatCurrency, formatDate, getReturnStatusColor, getItemIntegrityColor } from '../../utils/helpers';
import { InventoryIcons } from '../../lib/icons';
import { OrderTable } from '../../components/orders/OrderTable';

export default function PortalOrdersPage() {
  const { orders, user, loading, inventory } = useAppStore();
  const { Printer } = Icons;
  
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'id',
    direction: 'desc'
  });

  // Filter orders for the current user email
  const myOrders = useMemo(() => orders.filter(o => o.email === user?.email), [orders, user]);

  // Sorting Logic
  const sortedOrders = useMemo(() => {
    let sortableItems = [...myOrders];
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

  const handleViewInvoice = (order: any) => {
    const reconstructedCart = order.items.map((item: any) => {
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
      client: {
        name: order.clientName,
        email: order.email,
        phone: order.phone
      }
    });
  };



  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Fetching your orders...</p>
        </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-900">My Order History</h2>
      
      {myOrders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No orders found.</p>
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
          total={viewingInvoice.totalAmount}
          startDate={viewingInvoice.startDate}
          endDate={viewingInvoice.endDate}
          penaltyAmount={viewingInvoice.penaltyAmount}
          status={viewingInvoice.status}
          onConfirm={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}