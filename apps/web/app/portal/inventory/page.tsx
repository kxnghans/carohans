"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../context/AppContext';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InventoryGrid } from '../../components/inventory/InventoryGrid';
import { InventoryDetailModal } from '../../components/modals/InventoryDetailModal';
import { Card } from '../../components/ui/Card';
import { InventoryItem } from '../../types';
import { Icons } from '../../lib/icons';

export default function PortalInventoryPage() {
  const { inventory, cart, setCart, portalFormData, setPortalFormData, loading, checkAvailability } = useAppStore();
  const { LayoutList, LayoutGrid, Search, X } = Icons;

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem('inventoryViewMode') as 'list' | 'grid';
    if (savedMode) setViewMode(savedMode);
  }, []);

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('inventoryViewMode', mode);
  };

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

  const filteredData = useMemo(() => {
    if (!searchQuery) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

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
        </div>
      </div>

      <Card noPadding={viewMode === 'list'}>
        <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Filter by name or category..." 
                    className="w-full pl-10 pr-10 py-2 bg-surface border border-border rounded-xl text-theme-label outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all shadow-sm text-center"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-muted" />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-surface border border-border p-1 rounded-xl print:hidden">
                  <button 
                    onClick={() => handleViewModeChange('list')}
                    className={`p-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-text shadow-md' : 'text-muted hover:text-foreground'}`}
                    title="List View"
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-1 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-text shadow-md' : 'text-muted hover:text-foreground'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-theme-caption text-muted font-medium">
                    Showing {filteredData.length} of {inventory.length} items
                </p>
            </div>
        </div>
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
                <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
                <p className="text-theme-body font-medium">Loading catalog...</p>
            </div>
        ) : viewMode === 'list' ? (
            <InventoryTable
                data={filteredData}
                isAdmin={false} // READ ONLY except for order column
                onAddToCart={addToCart}
                cart={cart}
                onOpenDetail={setSelectedItemForDetail}
            />
        ) : (
            <InventoryGrid 
              data={filteredData}
              isAdmin={false}
              onAddToCart={(item, delta) => addToCart(item, delta)}
              cart={cart}
              onOpenDetail={setSelectedItemForDetail}
            />
        )}
      </Card>

      <InventoryDetailModal 
        isOpen={!!selectedItemForDetail}
        item={selectedItemForDetail}
        items={filteredData}
        onItemChange={setSelectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        isAdmin={false}
        onAddToCart={addToCart}
        cartQty={cart.find(c => c.id === selectedItemForDetail?.id)?.qty || 0}
      />
    </div>
  );
}
