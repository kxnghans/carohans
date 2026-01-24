"use client";

import React from 'react';
import { useAppStore } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { getStatusColor, formatCurrency } from '../../utils/helpers';

export default function PortalOrdersPage() {
  const { orders, portalFormData } = useAppStore();
  
  // Filter orders for the current user (mocked by portalFormData.name)
  const myOrders = orders.filter(o => o.customerName === portalFormData.name);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-900">My Rental History</h2>
      
      {myOrders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No orders found.</p>
        </div>
      ) : (
        myOrders.map((order: any) => (
          <Card key={order.id}>
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)} font-bold uppercase`}>
                  {order.status}
                </span>
                <h3 className="font-bold mt-1">Order #{order.id}</h3>
                <p className="text-sm text-slate-500">{order.startDate} - {order.endDate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                <p className="text-xs text-slate-400">{order.items.length} items</p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
