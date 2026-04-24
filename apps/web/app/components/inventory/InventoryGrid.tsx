"use client";

import { useMemo } from 'react';
import { InventoryItem } from '../../types';
import { Icons } from '../../lib/icons';
import { InventoryItemCard } from './InventoryItemCard';

interface InventoryGridProps {
  data: InventoryItem[];
  isAdmin?: boolean;
  isEditMode?: boolean;
  onAddToCart?: (item: InventoryItem, delta: number) => void;
  cart?: { id: number; qty: number }[];
  onOpenDetail?: (item: InventoryItem) => void;
  setInventory?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const InventoryGrid = ({
  data,
  isAdmin = false,
  isEditMode = false,
  onAddToCart,
  cart = [],
  onOpenDetail,
  setInventory
}: InventoryGridProps) => {
  const { Package } = Icons;

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center border border-border">
          <Package className="w-10 h-10 opacity-20" />
        </div>
        <p className="text-theme-body font-bold">No inventory items found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {sortedData.map((item) => {
        const cartItem = cart.find(c => c.id === item.id);

        return (
          <InventoryItemCard
            key={item.id}
            item={item}
            isAdmin={isAdmin}
            isEditMode={isEditMode}
            onAddToCart={onAddToCart}
            cartQty={cartItem?.qty}
            onOpenDetail={onOpenDetail}
            setInventory={setInventory}
          />
        );
      })}
    </div>
  );
};