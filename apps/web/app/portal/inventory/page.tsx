"use client";

import React from 'react';
import { useAppStore } from '../../context/AppContext';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { Card } from '../../components/ui/Card';

export default function PortalInventoryPage() {
  const { inventory, cart, setCart, portalFormData, setPortalFormData, loading } = useAppStore();

  const addToCart = (item: any, qty: number) => {
    setCart(prev => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">CaroHans Catalog</h2>
          <p className="text-slate-500">Use the <span className="font-bold text-slate-700">Order</span> column to add items to your cart.</p>
        </div>

        {/* INLINE DATE SELECTION */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase px-2">Pickup</label>
            <input
              type="date"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
              value={portalFormData.start}
              onChange={e => setPortalFormData(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase px-2">Return</label>
            <input
              type="date"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
              value={portalFormData.end}
              onChange={e => setPortalFormData(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <Card noPadding>
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Loading catalog...</p>
            </div>
        ) : (
            <InventoryTable
                data={inventory}
                isAdmin={false} // READ ONLY except for order column
                onAddToCart={addToCart}
                cart={cart}
            />
        )}
      </Card>
    </div>
  );
}
