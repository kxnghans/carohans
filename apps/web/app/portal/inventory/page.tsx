"use client";

import { useAppStore } from '../../context/AppContext';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { Card } from '../../components/ui/Card';
import { InventoryItem } from '../../types';
import { validateDiscount } from '../../services/discountService';
import { useEffect } from 'react';

export default function PortalInventoryPage() {
  const { inventory, cart, setCart, portalFormData, setPortalFormData, loading, checkAvailability, showNotification, user } = useAppStore();

  // Debounced Discount Validation
  useEffect(() => {
      const code = portalFormData.discountCode;
      if (!code || code.length < 3) return;

      const timer = setTimeout(async () => {
          try {
              const clientId = (user as { clientId?: number } | null)?.clientId;
              const { isValid, message } = await validateDiscount(code, clientId);
              if (!isValid) {
                  showNotification(message || "Invalid discount code", "error");
              } else {
                  showNotification("Discount applied successfully!", "success");
              }
          } catch (error) {
              console.error("Discount validation failed", error);
          }
      }, 800);

      return () => clearTimeout(timer);
  }, [portalFormData.discountCode, user, showNotification]);

  const addToCart = (item: InventoryItem, qty: number) => {
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

  const handleDateChange = (field: 'start' | 'end', value: string) => {
      setPortalFormData(prev => {
          const newData = { ...prev, [field]: value };
          if (newData.start && newData.end) {
              checkAvailability(newData.start, newData.end);
          }
          return newData;
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-theme-title text-foreground">CaroHans Catalog</h2>
          <p className="text-theme-body text-muted">Use the <span className="font-bold text-foreground">Order</span> column to add items to your cart.</p>
        </div>

        {/* INLINE DATE & DISCOUNT SELECTION */}
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-surface p-2 rounded-xl border border-border shadow-sm">
          {/* DATES - LEFT */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-theme-subtitle text-muted uppercase px-2">Pickup</label>
              <input
                type="date"
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-theme-label text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
                value={portalFormData.start}
                onChange={e => handleDateChange('start', e.target.value)}
              />
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex items-center gap-2">
              <label className="text-theme-subtitle text-muted uppercase px-2">Return</label>
              <input
                type="date"
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-theme-label text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
                value={portalFormData.end}
                onChange={e => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-border mx-2"></div>

          {/* DISCOUNT - RIGHT */}
          <div className="flex items-center gap-2 px-2 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
            <label className="text-theme-subtitle text-muted uppercase">Code</label>
            <input
              type="text"
              placeholder="DISCOUNT"
              className="flex-1 sm:w-24 bg-background border border-border rounded-lg px-3 py-1.5 text-theme-label text-foreground outline-none focus:border-secondary transition-all uppercase font-mono placeholder:normal-case placeholder:font-sans placeholder:text-[10px]"
              value={portalFormData.discountCode || ''}
              onChange={(e) => setPortalFormData(prev => ({ ...prev, discountCode: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <Card noPadding>
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
                <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
                <p className="text-theme-body font-medium">Loading catalog...</p>
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
