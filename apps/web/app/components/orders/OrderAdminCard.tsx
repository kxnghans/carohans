"use client";

import { useState } from 'react';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { getStatusColor, getStatusDescription } from '../../utils/helpers';
import { Order, InventoryItem, OrderItem } from '../../types';

interface OrderAdminCardProps {
  order: Order;
  updateStatus: (id: number, status: string) => void;
  onInvoice: (order: Order) => void;
  inventory: InventoryItem[];
}

export const OrderAdminCard = ({ order, updateStatus, onInvoice, inventory }: OrderAdminCardProps) => {
  const { Printer, ChevronRight } = Icons;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground">#{order.id}</span>
            <span 
              title={getStatusDescription(order.status)}
              className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)} font-bold uppercase tracking-wider cursor-help`}
            >
              {order.status}
            </span>
          </div>
          <h4 className="font-bold text-lg">{order.clientName}</h4>
          <p className="text-sm text-muted">{order.startDate} • {order.items.length} Items</p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center">
          <Button variant="secondary" size="sm" onClick={() => onInvoice(order)}>
            <Printer className="w-4 h-4 mr-2" /> Invoice
          </Button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 hover:bg-surface rounded-full transition-transform"
          >
            <ChevronRight className={`w-5 h-5 text-muted transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="bg-background p-4 border-t border-border animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h5 className="font-bold text-xs uppercase tracking-wider text-muted mb-3">Order Items</h5>
              <div className="space-y-2 mb-6">
                {order.items.map((item: OrderItem, idx: number) => {
                  // Start of rudimentary item lookup - ideally pass inventory
                  const itemName = inventory.find(i => i.id === item.itemId)?.name || 'Unknown Item';
                  return (
                    <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded border border-border">
                      <span className="font-medium text-slate-700">{itemName}</span>
                      <span className="font-mono text-muted">x{item.qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <h5 className="font-bold text-xs uppercase tracking-wider text-muted mb-3">Actions</h5>
              <div className="flex flex-wrap gap-2">
                {order.status === 'Pending' && (
                  <>
                    <Button variant="danger" size="sm" onClick={() => updateStatus(order.id, 'Canceled')}>
                      <Icons.X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button variant="info" size="sm" onClick={() => updateStatus(order.id, 'Approved')}>
                      <Icons.Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </>
                )}
                {order.status === 'Approved' && (
                  <>
                    <Button variant="warning" size="sm" onClick={() => updateStatus(order.id, 'Pending')}>
                      <Icons.Undo className="w-4 h-4 mr-2" /> Pull Back
                    </Button>
                    <Button variant="success" size="sm" onClick={() => updateStatus(order.id, 'Active')}>
                      <Icons.ReturnIcon className="w-4 h-4 mr-2" /> Process Dispatch
                    </Button>
                  </>
                )}
                {(order.status === 'Active' || order.status === 'Late') && (
                  <Button variant="success" size="sm" onClick={() => updateStatus(order.id, 'Completed')}>
                    <Icons.ReturnIcon className="w-4 h-4 mr-2" /> Process Return
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
