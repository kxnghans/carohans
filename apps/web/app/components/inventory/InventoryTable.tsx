"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons } from '../../lib/icons';
import { InventoryItem, CartItem } from '../../types';
import { InventoryRow } from './InventoryRow';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ScrollableContainer } from '../common/ScrollableContainer';

interface TableItem extends InventoryItem {
  isNew?: boolean;
}

const SortIcon = ({ 
    column, 
    sortConfig 
}: { 
    column: keyof InventoryItem, 
    sortConfig: { key: keyof InventoryItem; direction: 'asc' | 'desc' } | null 
}) => {
    const { SortUp, SortDown } = Icons;
    if (sortConfig?.key !== column) return <SortUp className="w-3.5 h-3.5 text-muted opacity-30" />;
    return sortConfig.direction === 'asc' 
        ? <SortUp className="w-3.5 h-3.5 text-secondary dark:text-warning" /> 
        : <SortDown className="w-3.5 h-3.5 text-secondary dark:text-warning" />;
};

interface InventoryTableProps {
  data: InventoryItem[];
  isAdmin?: boolean;
  isEditMode?: boolean;
  onDelete?: (id: number) => void;
  setInventory?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onAddToCart?: (item: InventoryItem, qty: number) => void;
  cart?: CartItem[];
  showOrderColumn?: boolean;
}

export const InventoryTable = ({
  data,
  isAdmin = false,
  isEditMode = false,
  onDelete,
  setInventory,
  onAddToCart,
  cart,
  showOrderColumn = true
}: InventoryTableProps) => {
  const { Plus, Search, X } = Icons;
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [editingCell, setEditingCell] = useState<{ id: number, field: string } | null>(null);
  const [editValue, setEditValue] = useState<string | number | undefined>(undefined);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [pendingDiscardId, setPendingDiscardId] = useState<number | null>(null);
  const [activePickerId, setActivePickerId] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState<'ask' | 'auto'>('ask');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'asc' | 'desc' } | null>({
    key: 'sortOrder',
    direction: 'asc'
  });

  const totalCols = 5 + (isAdmin ? 1 : 0) + (showOrderColumn ? 1 : 0) + (isEditMode ? 1 : 0);

  const isManualSort = sortConfig?.key === 'sortOrder' && sortConfig?.direction === 'asc' && !searchQuery;

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
      return sortedData.slice(0, visibleCount);
  }, [sortedData, visibleCount]);

  const handleViewMore = () => {
    setVisibleCount(prev => {
        if (prev < 200) return prev + 50;
        return prev + 20;
    });
  };

  const requestSort = (key: keyof InventoryItem) => {
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ key, direction: 'desc' });
      } else {
        setSortConfig({ key: 'sortOrder', direction: 'asc' });
      }
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const saved = sessionStorage.getItem('inventory_delete_pref');
    if (saved === 'auto') setDeleteMode('auto');
  }, []);

  const startEditing = (id: number, field: string, value: string | number) => {
    if (!isAdmin || !isEditMode) return;
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const handleSave = () => {
    if (!editingCell || !setInventory) return;
    setInventory((prev) => prev.map((item) => 
      item.id === editingCell.id ? { ...item, [editingCell.field]: editValue } : item
    ));
    setEditingCell(null);
    setEditValue(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue(undefined);
    }
  };

  const handleAddItem = (index: number) => {
    if (!setInventory || !isEditMode) return;
    
    let newSortOrder: number;
    const prevItem = sortedData[index];
    const nextItem = sortedData[index + 1];

    if (!prevItem && !nextItem) {
        newSortOrder = 10;
    } else if (!prevItem) {
        newSortOrder = (nextItem?.sortOrder || 10) / 2;
    } else if (!nextItem) {
        newSortOrder = prevItem.sortOrder + 10;
    } else {
        newSortOrder = (prevItem.sortOrder + nextItem.sortOrder) / 2;
    }

    setInventory((prev) => {
      const newItem: TableItem = {
        id: Date.now(),
        name: "Enter Name",
        category: "Furniture",
        price: 0,
        replacementCost: 0,
        stock: 0,
        image: "📦",
        maintenance: 0,
        color: "text-slate-600",
        sortOrder: newSortOrder,
        isNew: true
      };
      
      const newData = [...prev];
      const stateIndex = prev.findIndex(item => item.id === (prevItem?.id || nextItem?.id));
      const finalInsertIndex = !prevItem ? 0 : stateIndex + 1;
      
      newData.splice(finalInsertIndex, 0, newItem);
      return newData;
    });
  };

  const handleRowBlur = (e: React.FocusEvent<HTMLTableRowElement>, item: TableItem) => {
    if (!item.isNew || !isAdmin || !isEditMode || !setInventory) return;

    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
       setTimeout(() => {
           const currentItem = dataRef.current.find((i) => i.id === item.id);
           if (!currentItem) return; 

           const isValid = currentItem.name !== "Enter Name" && currentItem.price > 0 && currentItem.replacementCost > 0 && currentItem.stock >= 0;

           if (!isValid) {
               setPendingDiscardId(currentItem.id);
               setShowDiscardWarning(true);
           } else {
               setInventory((prev) => prev.map((i) => {
                   if (i.id === currentItem.id) {
                       const { isNew, ...rest } = i as TableItem; 
                       return rest as InventoryItem; 
                   }
                   return i;
               }));
           }
       }, 200);
    }
  };

  const handleDeleteClick = (id: number) => {
      if (deleteMode === 'auto' && onDelete) {
          onDelete(id);
      } else {
          setPendingDeleteId(id);
      }
  };

  const confirmDelete = (autoAcceptSession = false) => {
      if (pendingDeleteId && onDelete) {
          onDelete(pendingDeleteId);
          if (autoAcceptSession) {
              setDeleteMode('auto');
              sessionStorage.setItem('inventory_delete_pref', 'auto');
          }
          setPendingDeleteId(null);
      }
  };

  const handleIconChange = (id: number, { image, color }: { image: string, color: string }) => {
    if (!setInventory) return;
    setInventory((prev) => prev.map((item) => 
      item.id === id ? { ...item, image, color } : item
    ));
  };

  return (
    <>
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
        <p className="text-theme-caption text-muted font-medium">
            Showing {Math.min(visibleCount, filteredData.length)} of {filteredData.length} items
        </p>
    </div>
    <ScrollableContainer className="mb-8 overflow-visible">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md shadow-sm">
            <tr className="border-b border-border">
                <th
                  className="p-4 pl-6 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] cursor-pointer group hover:bg-surface transition-colors"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    <div className="w-12 shrink-0" />
                    <div className="ml-4 flex items-center gap-2">
                      Item Details
                      <SortIcon column="name" sortConfig={sortConfig} />
                    </div>
                  </div>
                </th>
                <th
                  className="p-4 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] cursor-pointer group hover:bg-surface transition-colors"
                  onClick={() => requestSort('category')}
                >
                  <div className="flex items-center gap-2">
                    Category
                    <SortIcon column="category" sortConfig={sortConfig} />
                  </div>
                </th>
                <th
                  className="p-4 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] text-right cursor-pointer group hover:bg-surface transition-colors"
                  onClick={() => requestSort('price')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Daily Rate
                    <SortIcon column="price" sortConfig={sortConfig} />
                  </div>
                </th>
                <th
                  className="p-4 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] text-right cursor-pointer group hover:bg-surface transition-colors"
                  onClick={() => requestSort('replacementCost')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Replacement Cost
                    <SortIcon column="replacementCost" sortConfig={sortConfig} />
                  </div>
                </th>
                {isAdmin && (
                  <th
                    className="p-4 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] text-right cursor-pointer group hover:bg-surface transition-colors"
                    onClick={() => requestSort('stock')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Total Stock
                      <SortIcon column="stock" sortConfig={sortConfig} />
                    </div>
                  </th>
                )}
                <th
                  className="p-4 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] text-right"
                  title="Real-time availability based on selected dates (or today if none selected)"
                >
                  Available
                </th>
                {showOrderColumn && <th className="p-4 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] text-right">Order</th>}
                {isEditMode && <th className="p-4 text-theme-caption font-semibold text-muted uppercase tracking-[0.15em] text-left pr-6">Action</th>}
            </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paginatedData.map((item, index) => (
              <React.Fragment key={item.id}>
                <InventoryRow 
                    item={item}
                    isAdmin={isAdmin}
                    isEditMode={isEditMode}
                    showOrderColumn={showOrderColumn}
                    cart={cart}
                    onAddToCart={onAddToCart}
                    onDelete={handleDeleteClick}
                    editingCell={editingCell}
                    editValue={editValue}
                    startEditing={startEditing}
                    setEditValue={(val: string | number) => setEditValue(val)}
                    handleSave={handleSave}
                    handleKeyDown={handleKeyDown}
                    handleRowBlur={(e) => handleRowBlur(e, item)}
                    activePickerId={activePickerId}
                    setActivePickerId={setActivePickerId}
                    handleIconChange={handleIconChange}
                />
                {isAdmin && isEditMode && isManualSort && (
                  <tr className="group/separator h-0">
                    <td colSpan={totalCols} className="p-0 relative">
                      <div 
                        className="absolute -top-3 h-6 w-full flex items-center justify-center z-10 cursor-pointer opacity-0 group-hover/separator:opacity-100 transition-opacity"
                        onClick={() => handleAddItem(index)}
                        title="Insert Item Here"
                      >
                        <div className="w-full h-px bg-primary/30 group-hover/separator:bg-primary transition-colors relative flex items-center justify-center">
                           <div className="bg-surface border border-primary text-primary rounded-full p-0.5 shadow-sm transform hover:scale-110 transition-transform">
                             <Plus className="w-3 h-3" />
                           </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
          ))}
          
          {isAdmin && isEditMode && isManualSort && sortedData.length <= visibleCount && (
             <tr 
                onClick={() => handleAddItem(sortedData.length - 1)}
                className="group cursor-pointer border-t border-dashed border-border hover:bg-primary/5 transition-all h-[73px]"
             >
                <td colSpan={totalCols} className="p-4 pl-6">
                    <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                        <div className="h-8 w-8 rounded-lg bg-background border border-dashed border-border flex items-center justify-center text-muted group-hover:border-primary group-hover:text-primary group-hover:bg-surface">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-theme-body font-medium text-muted italic group-hover:text-primary">Click to add new SKU...</span>
                    </div>
                </td>
             </tr>
          )}
        </tbody>
      </table>

      {sortedData.length > visibleCount && (
          <div className="p-8 flex justify-center border-t border-border bg-background/20">
              <button 
                  onClick={handleViewMore}
                  className="group flex items-center gap-3 px-8 py-3 bg-surface border-2 border-primary/20 rounded-2xl text-primary font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-primary-text hover:border-primary transition-all shadow-lg shadow-primary/5 active:scale-95"
              >
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  View More ({sortedData.length - visibleCount} remaining)
              </button>
          </div>
      )}
    </ScrollableContainer>

    <ConfirmDialog 
        isOpen={showDiscardWarning}
        title="Incomplete Item"
        message="This new item has incomplete fields. You must provide a valid Name, Daily Rate, and Replacement Cost."
        confirmText="Discard Item"
        cancelText="Keep Editing"
        confirmVariant="danger"
        onConfirm={() => {
            if (setInventory) {
                setInventory((prev) => prev.filter((i) => i.id !== pendingDiscardId));
            }
            setShowDiscardWarning(false);
            setPendingDiscardId(null);
        }}
        onCancel={() => setShowDiscardWarning(false)}
    />

    <ConfirmDialog 
        isOpen={!!pendingDeleteId}
        title="Delete Item?"
        message="Are you sure you want to remove this item from inventory? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        confirmVariant="danger"
        showAlwaysDeleteOption={true}
        onConfirm={(always) => confirmDelete(always)}
        onCancel={() => setPendingDeleteId(null)}
    />
    </>
  );
};
