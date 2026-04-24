"use client";

import { useState } from 'react';
import { InventoryItem } from '../../types';
import { Icons } from '../../lib/icons';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { IconColorPicker } from './IconColorPicker';

interface InventoryItemCardProps {
  item: InventoryItem;
  isAdmin?: boolean;
  isEditMode?: boolean;
  onAddToCart?: (item: InventoryItem, delta: number) => void;
  cartQty?: number;
  onOpenDetail?: (item: InventoryItem) => void;
  variant?: 'grid' | 'modal';
  setInventory?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const InventoryItemCard = ({
  item,
  isAdmin = false,
  isEditMode = false,
  onAddToCart,
  cartQty = 0,
  onOpenDetail,
  variant = 'grid',
  setInventory
}: InventoryItemCardProps) => {
  const { Package, ShoppingCart, Plus, Minus, Maximize2, Shield, Tag, RefreshCw } = Icons;
  const imageUrl = getImageUrl(item.image);

  const isModal = variant === 'modal';
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');
  const [showPicker, setShowPicker] = useState(false);

  const startEditing = (field: string, value: string | number) => {
    if (!isAdmin || !isEditMode) return;
    setEditingField(field);
    setEditValue(value);
  };

  const handleSave = () => {
    if (!editingField || !setInventory) return;
    setInventory((prev) => prev.map((i) => 
      i.id === item.id ? { ...i, [editingField]: editValue } : i
    ));
    setEditingField(null);
  };

  const handleIconChange = (data: { image: string, color: string }) => {
    if (!setInventory) return;
    setInventory((prev) => prev.map((i) => 
      i.id === item.id ? { ...i, ...data } : i
    ));
  };

  return (
    <div 
      className={`group bg-background dark:bg-surface rounded-[2rem] border border-border transition-all duration-500 overflow-hidden flex flex-col ${isModal ? 'border-none shadow-none' : 'hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer'}`}
      onClick={() => { if (!isModal && onOpenDetail && !isEditMode) onOpenDetail(item); }}
    >
      {/* Image Container */}
      <div className={`relative aspect-square overflow-hidden bg-surface dark:bg-black/20 transition-colors duration-500 ${isModal ? '' : 'group-hover:bg-primary/5'}`}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.name}
            className={`w-full h-full object-contain transition-transform duration-700 ease-out ${isModal ? '' : 'p-4 group-hover:scale-110'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Package className="w-20 h-20" />
          </div>
        )}

        {/* Overlay Actions */}
        {!isModal && (
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center gap-3 ${isEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
             {isEditMode ? (
               <button 
                 onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
                 className="px-4 py-2 bg-error/10 text-error border border-error/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-error hover:text-white transition-all shadow-xl"
               >
                 <RefreshCw className={`w-3 h-3 ${showPicker ? 'animate-spin' : ''}`} />
                 Replace Icon
               </button>
             ) : onOpenDetail && (
               <div 
                 className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl flex items-center justify-center"
               >
                 <Maximize2 className="w-5 h-5" />
               </div>
             )}
          </div>
        )}

        {/* Icon Picker */}
        {showPicker && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <IconColorPicker 
              currentIcon={item.image}
              currentColor={item.color}
              onChange={handleIconChange}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          {editingField === 'category' ? (
            <select
              className="px-3 py-1.5 bg-white dark:bg-black text-[10px] font-black uppercase tracking-widest border border-primary rounded-full outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            >
              {['Catering', 'Glassware', 'Furniture', 'Decor', 'Lighting', 'Cutlery', 'Electronics', 'Tents'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <span 
              onClick={(e) => { if (isEditMode) { e.stopPropagation(); startEditing('category', item.category); } }}
              className={`px-3 py-1.5 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-sm ${isEditMode ? 'cursor-text hover:border-primary' : ''}`}
            >
              {item.category}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="space-y-1.5">
          {editingField === 'name' ? (
            <input
              className="text-theme-title font-bold text-foreground leading-tight w-full bg-surface border border-primary rounded-lg px-2 py-1 outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              onClick={(e) => { if (isEditMode) { e.stopPropagation(); startEditing('name', item.name); } }}
              className={`text-theme-title font-bold text-foreground leading-tight transition-colors line-clamp-1 ${isModal ? 'text-2xl' : 'group-hover:text-primary'} ${isEditMode ? 'cursor-text hover:text-primary' : ''}`}
            >
              {item.name}
            </h3>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span 
                title={isAdmin ? 
                    ((item.availableStock ?? item.stock) <= 0 ? "No stock available" : 
                     (item.availableStock ?? item.stock) < item.stock ? "Partially booked" : "Full stock available") :
                    ((item.availableStock ?? item.stock) <= 0 ? "Out of stock" : "Available")
                }
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                    (item.availableStock ?? item.stock) <= 0 
                    ? 'bg-error/10 text-error border-error/20' 
                    : (!isAdmin)
                        ? 'bg-success/10 text-success border-success/20'
                        : (item.availableStock ?? item.stock) < item.stock 
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-success/10 text-success border-success/20'
                }`}
            >
                {item.availableStock ?? item.stock} Available
            </span>
            {isAdmin && (
              <>
                {editingField === 'stock' ? (
                  <input
                    type="number"
                    className="w-16 px-2 py-0.5 bg-surface border border-primary rounded-full text-[10px] font-bold text-foreground outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span 
                    onClick={(e) => { if (isEditMode) { e.stopPropagation(); startEditing('stock', item.stock); } }}
                    className={`text-[10px] font-bold text-muted uppercase tracking-wider ${isEditMode ? 'cursor-text hover:text-primary' : ''}`}
                  >
                      / {item.stock} Total
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Admin 2x2 Grid or Client Flex */}
        {isAdmin ? (
          <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1"><Tag className="w-3 h-3" /> Daily Rate</p>
              {editingField === 'price' ? (
                <input
                  type="number"
                  className="w-full px-2 py-1 bg-surface border border-primary rounded-lg text-theme-body font-black text-primary outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(Number(e.target.value))}
                  onBlur={handleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p 
                  onClick={(e) => { if (isEditMode) { e.stopPropagation(); startEditing('price', item.price); } }}
                  className={`text-theme-body font-black text-primary ${isEditMode ? 'cursor-text hover:text-secondary' : ''}`}
                >
                  {formatCurrency(item.price)}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1 opacity-70"><Shield className="w-3 h-3" /> Replace</p>
              {editingField === 'replacementCost' ? (
                <input
                  type="number"
                  className="w-full px-2 py-1 bg-surface border border-primary rounded-lg text-theme-body font-bold text-foreground outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(Number(e.target.value))}
                  onBlur={handleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p 
                  onClick={(e) => { if (isEditMode) { e.stopPropagation(); startEditing('replacementCost', item.replacementCost); } }}
                  className={`text-theme-body font-bold text-foreground opacity-70 ${isEditMode ? 'cursor-text hover:text-primary' : ''}`}
                >
                  {formatCurrency(item.replacementCost)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1"><Tag className="w-3 h-3" /> Daily Rate</p>
               <p className="text-lg font-black text-primary">{formatCurrency(item.price)}</p>
             </div>
          </div>
        )}

        {/* Order Controls */}
        {!isAdmin && onAddToCart && (
          <div className="pt-2 flex items-center justify-between gap-3">
            {cartQty > 0 ? (
              <div className="flex items-center bg-primary/10 dark:bg-primary/20 rounded-2xl p-1 w-full justify-between border border-primary/20" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddToCart(item, -1); }}
                  className="p-2 hover:bg-white dark:hover:bg-black/40 rounded-xl transition-all text-primary"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-theme-body font-black text-primary">{cartQty}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddToCart(item, 1); }}
                  className="p-2 hover:bg-white dark:hover:bg-black/40 rounded-xl transition-all text-primary disabled:opacity-50"
                  disabled={cartQty >= (item.availableStock ?? item.stock)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={(e) => { e.stopPropagation(); onAddToCart(item, 1); }}
                className="w-full rounded-2xl font-bold py-3"
                disabled={(item.availableStock ?? item.stock) <= 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Order
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};