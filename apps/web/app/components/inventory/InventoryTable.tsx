"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icons, InventoryIcons } from '../../lib/icons';
import { formatCurrency } from '../../utils/helpers';
import { INVENTORY } from '../../lib/mockData';
import { IconColorPicker } from './IconColorPicker';

export const InventoryTable = ({
  data,
  isAdmin = false,
  isEditMode = false,
  onDelete,
  setInventory,
  onAddToCart,
  cart,
  showOrderColumn = true
}: {
  data: typeof INVENTORY,
  isAdmin?: boolean,
  isEditMode?: boolean,
  onDelete?: (id: number) => void,
  setInventory?: any,
  onAddToCart?: (item: any, qty: number) => void,
  cart?: any,
  showOrderColumn?: boolean
}) => {
  const { Minus, Plus, Trash2 } = Icons;
  const [editingCell, setEditingCell] = useState<{ id: number, field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [pendingDiscardId, setPendingDiscardId] = useState<number | null>(null);
  
  // Icon Picker State
  const [activePickerId, setActivePickerId] = useState<number | null>(null);

  // ... (rest of the component state/hooks remain same)

  const RenderItemIcon = ({ item, className = "text-2xl" }: { item: any, className?: string }) => {
    if (item.image?.startsWith('icon:')) {
      const iconKey = item.image.replace('icon:', '');
      const IconComp = InventoryIcons[iconKey];
      return IconComp ? <IconComp className={`${className.replace('text-2xl', 'w-6 h-6')} ${item.color || 'text-slate-600'}`} /> : <span>📦</span>;
    }
    return <div className={className}>{item.image || '📦'}</div>;
  };

  const handleIconChange = (id: number, { image, color }: { image: string, color: string }) => {
    if (!setInventory) return;
    setInventory((prev: any) => prev.map((item: any) => 
      item.id === id ? { ...item, image, color } : item
    ));
  };
  
  // Delete Logic State
  const [deleteMode, setDeleteMode] = useState<'ask' | 'auto'>('ask');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Ref to track latest data for event listeners/timeouts
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Reset delete mode when Edit Mode is toggled off
  useEffect(() => {
    if (!isEditMode) {
        setDeleteMode('ask');
    }
  }, [isEditMode]);

  const startEditing = (id: number, field: string, value: any) => {
    if (!isAdmin || !isEditMode) return;
    setEditingCell({ id, field });
    setEditValue(value);
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

  const handleSave = () => {
    if (!editingCell || !setInventory) return;
    setInventory((prev: any) => prev.map((item: any) => 
      item.id === editingCell.id ? { ...item, [editingCell.field]: editValue } : item
    ));
    setEditingCell(null);
    setEditValue(null);
  };

  const handleAddItem = (index: number) => {
    if (!setInventory || !isEditMode) return;
    const newItem = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now(),
      name: "Enter Name",
      category: "Uncategorized",
      price: 0,
      replacementCost: 0,
      stock: 0,
      image: "📦",
      order: 0,
      isNew: true
    };
    
    setInventory((prev: any[]) => {
      const newData = [...prev];
      newData.splice(index + 1, 0, newItem);
      return newData;
    });
  };

  const handleRowBlur = (e: React.FocusEvent<HTMLTableRowElement>, item: any) => {
    // Only apply logic for new items and if in edit mode
    if (!item.isNew || !isAdmin || !isEditMode) return;

    // Check if focus is moving outside the row
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
       // Allow time for cell save to commit to state/ref
       setTimeout(() => {
           const currentItem = dataRef.current.find((i: any) => i.id === item.id);
           if (!currentItem) return; 

           // Validation Rules
           const isValid = currentItem.name !== "Enter Name" && currentItem.price > 0 && currentItem.replacementCost > 0 && currentItem.stock >= 0;

           if (!isValid) {
               setPendingDiscardId(currentItem.id);
               setShowDiscardWarning(true);
           } else {
               // Auto-commit: Remove isNew flag
               setInventory((prev: any) => prev.map((i: any) => i.id === currentItem.id ? { ...i, isNew: false } : i));
           }
       }, 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue(null);
    }
  };

  const isFieldEditing = (id: number, field: string) => 
    editingCell?.id === id && editingCell?.field === field;

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
          {data.map((item, index) => {
            // @ts-ignore - isNew doesn't exist on standard type
            const isNew = item.isNew;
            
            return (
              <React.Fragment key={item.id}>
                <tr
                  id={`row-${item.id}`}
                  className={`group transition-colors ${isNew ? 'bg-indigo-50/60 border-l-4 border-indigo-400' : 'hover:bg-slate-50/50'}`}
                  tabIndex={isNew ? 0 : -1} 
                  onBlur={(e) => handleRowBlur(e, item)}
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div 
                          onClick={() => isEditMode && setActivePickerId(activePickerId === item.id ? null : item.id)}
                          className={`${isEditMode ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''}`}
                        >
                          <RenderItemIcon item={item} />
                        </div>
                        {activePickerId === item.id && (
                          <IconColorPicker 
                            currentIcon={item.image}
                            currentColor={item.color}
                            onChange={(data) => handleIconChange(item.id, data)}
                            onClose={() => setActivePickerId(null)}
                          />
                        )}
                      </div>
                      {isFieldEditing(item.id, 'name') ? (
                        <input
                          className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-full outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSave}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item.id, 'name', item.name)}
                          className={`font-bold ${isNew && item.name === 'Enter Name' ? 'text-indigo-400 italic' : 'text-slate-800'} ${isAdmin && isEditMode ? 'cursor-text hover:text-indigo-600' : ''}`}
                        >
                          {item.name}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    {isFieldEditing(item.id, 'category') ? (
                      <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-full outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                      />
                    ) : (
                      <span 
                        onClick={() => startEditing(item.id, 'category', item.category)}
                        className={`text-sm text-slate-500 ${isAdmin && isEditMode ? 'cursor-text' : ''}`}
                      >
                        {item.category}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    {isFieldEditing(item.id, 'price') ? (
                      <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-20 text-right outline-none"
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                      />
                    ) : (
                      <span 
                        onClick={() => startEditing(item.id, 'price', item.price)}
                        className={`text-sm font-medium ${isNew && item.price === 0 ? 'text-indigo-400' : 'text-slate-700'} ${isAdmin && isEditMode ? 'cursor-text' : ''}`}
                      >
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    {isFieldEditing(item.id, 'replacementCost') ? (
                      <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-20 text-right outline-none"
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                      />
                    ) : (
                      <span 
                        onClick={() => startEditing(item.id, 'replacementCost', item.replacementCost)}
                        className={`text-sm font-medium ${isNew && item.replacementCost === 0 ? 'text-indigo-400' : 'text-rose-600 bg-rose-50 px-2 py-1 rounded inline-block'} ${isAdmin && isEditMode ? 'cursor-text' : ''}`}
                      >
                        {formatCurrency(item.replacementCost)}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    {isFieldEditing(item.id, 'stock') ? (
                      <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-16 text-center outline-none"
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                      />
                    ) : (
                      <span 
                        onClick={() => startEditing(item.id, 'stock', item.stock)}
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold cursor-text ${item.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {item.stock}
                      </span>
                    )}
                  </td>
                  
                  {showOrderColumn && (
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onAddToCart && onAddToCart(item, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                            disabled={!cart?.find((c: any) => c.id === item.id)}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            className="w-16 text-center text-sm font-bold bg-white border border-slate-200 rounded-md focus:outline-indigo-500 py-1"
                            value={cart?.find((c: any) => c.id === item.id)?.qty || 0}
                            onChange={(e) => {
                              const newVal = parseInt(e.target.value) || 0;
                              const currentVal = cart?.find((c: any) => c.id === item.id)?.qty || 0;
                              const delta = newVal - currentVal;
                              if (delta !== 0 && onAddToCart) onAddToCart(item, delta);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            onClick={() => onAddToCart && onAddToCart(item, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                    </td>
                  )}

                  {isEditMode && (
                      <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDeleteClick(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </td>
                  )}
                </tr>
                {/* INSERTION SEPARATOR - Only in Edit Mode */}
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
            );
          })}
          
          {/* PLACEHOLDER ADD ROW (Edit Mode Only) */}
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

    {/* DISCARD WARNING MODAL */}
    {showDiscardWarning && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full transform transition-all scale-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Incomplete Item</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                This new item has incomplete fields. You must provide a valid <strong>Name</strong>, <strong>Daily Rate</strong>, and <strong>Replacement Cost</strong>.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => {
                      setInventory((prev: any) => prev.filter((i: any) => i.id !== pendingDiscardId));
                      setShowDiscardWarning(false);
                      setPendingDiscardId(null);
                  }}
                  className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                >
                  Discard Item
                </button>
                <button 
                  onClick={() => setShowDiscardWarning(false)}
                  className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-lg shadow-slate-200"
                >
                  Keep Editing
                </button>
              </div>
          </div>
      </div>
    )}

    {/* DELETE CONFIRMATION MODAL */}
    {pendingDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full transform transition-all scale-100">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                    <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Item?</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Are you sure you want to remove this item from inventory? This action cannot be undone.
                </p>
                
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setPendingDeleteId(null)}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            No, Cancel
                        </button>
                        <button 
                            onClick={() => confirmDelete(false)}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-lg shadow-rose-100"
                        >
                            Yes, Delete
                        </button>
                    </div>
                    <button 
                        onClick={() => confirmDelete(true)}
                        className="w-full px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-dashed border-slate-200 hover:border-rose-200"
                    >
                        Always delete without asking in this session
                    </button>
                </div>
             </div>
        </div>
    )}
    </>
  );
};
