"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../lib/icons';
import { InventoryItem, CartItem } from '../../types';
import { InventoryRow } from './InventoryRow';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface TableItem extends InventoryItem {
  isNew?: boolean;
}

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
  const { Plus } = Icons;
  const [editingCell, setEditingCell] = useState<{ id: number, field: string } | null>(null);
  const [editValue, setEditValue] = useState<string | number | undefined>(undefined);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [pendingDiscardId, setPendingDiscardId] = useState<number | null>(null);
  const [activePickerId, setActivePickerId] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState<'ask' | 'auto'>('ask');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!isEditMode) {
        setDeleteMode('ask');
    }
  }, [isEditMode]);

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
    const newItem: TableItem = {
      id: Date.now(),
      name: "Enter Name",
      category: "Uncategorized",
      price: 0,
      replacementCost: 0,
      stock: 0,
      image: "📦",
      maintenance: 0,
      color: "text-slate-600",
      isNew: true
    };
    
    setInventory((prev) => {
      const newData = [...prev];
      newData.splice(index + 1, 0, newItem);
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
    <div className="overflow-x-auto pb-12">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-200">
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Details</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Daily Rate</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Repl. Cost</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock</th>
            {showOrderColumn && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Order</th>}
            {isEditMode && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-12">Delete</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => (
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
                    setEditValue={setEditValue as any}
                    handleSave={handleSave}
                    handleKeyDown={handleKeyDown}
                    handleRowBlur={(e) => handleRowBlur(e, item)}
                    activePickerId={activePickerId}
                    setActivePickerId={setActivePickerId}
                    handleIconChange={handleIconChange}
                />
                {isAdmin && isEditMode && (
                  <tr className="group/separator h-0">
                    <td colSpan={showOrderColumn ? 6 : (isEditMode ? 6 : 5)} className="p-0 relative">
                      <div 
                        className="absolute -top-3 h-6 w-full flex items-center justify-center z-10 cursor-pointer opacity-0 group-hover/separator:opacity-100 transition-opacity"
                        onClick={() => handleAddItem(index)}
                        title="Insert Item Here"
                      >
                        <div className="w-full h-px bg-indigo-200 group-hover/separator:bg-indigo-500 transition-colors relative flex items-center justify-center">
                           <div className="bg-white border border-indigo-500 text-indigo-600 rounded-full p-0.5 shadow-sm transform hover:scale-110 transition-transform">
                             <Plus className="w-3 h-3" />
                           </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
          ))}
          
          {isAdmin && isEditMode && (
             <tr 
                onClick={() => handleAddItem(data.length - 1)}
                className="group cursor-pointer border-t border-dashed border-slate-300 hover:bg-indigo-50/30 transition-all h-[73px]"
             >
                <td className="p-4 pl-6">
                    <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-500 group-hover:bg-white">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-500 italic group-hover:text-indigo-600">Click to add new SKU...</span>
                    </div>
                </td>
                <td className="p-4">
                    <div className="h-2 w-full max-w-[100px] bg-slate-100 rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </td>
                <td className="p-4 text-right">
                    <div className="h-2 w-12 bg-slate-100 rounded-full ml-auto opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </td>
                <td className="p-4 text-right">
                    <div className="h-2 w-12 bg-slate-100 rounded-full ml-auto opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </td>
                <td className="p-4 text-center">
                    <div className="h-2 w-8 bg-slate-100 rounded-full mx-auto opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </td>
                {showOrderColumn && <td className="p-4"></td>}
                {isEditMode && <td className="p-4"></td>}
             </tr>
          )}
        </tbody>
      </table>
    </div>

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