import React from 'react';
import { Icons, InventoryIcons } from '../../lib/icons';
import { formatCurrency } from '../../utils/helpers';
import { InventoryItem, CartItem } from '../../types';
import { IconColorPicker } from './IconColorPicker';

interface InventoryRowProps {
    item: InventoryItem & { isNew?: boolean };
    isAdmin: boolean;
    isEditMode: boolean;
    showOrderColumn: boolean;
    cart?: CartItem[];
    onAddToCart?: (item: InventoryItem, qty: number) => void;
    onDelete?: (id: number) => void;
    editingCell: { id: number, field: string } | null;
    editValue: string | number | undefined;
    startEditing: (id: number, field: string, value: string | number) => void;
    setEditValue: (value: string | number) => void;
    handleSave: () => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleRowBlur: (e: React.FocusEvent<HTMLTableRowElement>) => void;
    activePickerId: number | null;
    setActivePickerId: (id: number | null) => void;
    handleIconChange: (id: number, data: { image: string, color: string }) => void;
}

export const InventoryRow = ({
    item,
    isAdmin,
    isEditMode,
    showOrderColumn,
    cart,
    onAddToCart,
    onDelete,
    editingCell,
    editValue,
    startEditing,
    setEditValue,
    handleSave,
    handleKeyDown,
    handleRowBlur,
    activePickerId,
    setActivePickerId,
    handleIconChange
}: InventoryRowProps) => {
    const { Minus, Plus, Trash2 } = Icons;
    const isNew = item.isNew;

    const RenderItemIcon = ({ className = "text-2xl" }: { className?: string }) => {
        if (item.image?.startsWith('icon:')) {
            const iconKey = item.image.replace('icon:', '');
            const IconComp = InventoryIcons[iconKey];
            return IconComp ? <IconComp className={`${className.replace('text-2xl', 'w-6 h-6')} ${item.color || 'text-slate-600'}`} /> : <span>📦</span>;
        }
        return <div className={className}>{item.image || '📦'}</div>;
    };

    const isFieldEditing = (field: string) => 
        editingCell?.id === item.id && editingCell?.field === field;

    return (
        <tr
            id={`row-${item.id}`}
            className={`group transition-colors ${isNew ? 'bg-indigo-50/60 border-l-4 border-indigo-400' : 'hover:bg-slate-50/50'}`}
            tabIndex={isNew ? 0 : -1} 
            onBlur={handleRowBlur}
        >
            <td className="p-4 pl-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div 
                            onClick={() => isEditMode && setActivePickerId(activePickerId === item.id ? null : item.id)}
                            className={`${isEditMode ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''}`}
                        >
                            <RenderItemIcon />
                        </div>
                        {activePickerId === item.id && (
                            <IconColorPicker 
                                currentIcon={item.image || "📦"}
                                currentColor={item.color || ""}
                                onChange={(data) => handleIconChange(item.id, data)}
                                onClose={() => setActivePickerId(null)}
                            />
                        )}
                    </div>
                    {isFieldEditing('name') ? (
                        <input
                            className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-full outline-none"
                            value={editValue as string}
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
                {isFieldEditing('category') ? (
                    <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-full outline-none"
                        value={editValue as string}
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
                {isFieldEditing('price') ? (
                    <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-20 text-right outline-none"
                        type="number"
                        value={editValue as number}
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
                {isFieldEditing('replacementCost') ? (
                    <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-20 text-right outline-none"
                        type="number"
                        value={editValue as number}
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
                {isFieldEditing('stock') ? (
                    <input
                        className="border border-indigo-500 ring-2 ring-indigo-100 rounded px-2 py-1 text-sm w-16 text-center outline-none"
                        type="number"
                        value={editValue as number}
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
                            disabled={!cart?.find((c: CartItem) => c.id === item.id)}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <input
                            type="number"
                            className="w-16 text-center text-sm font-bold bg-white border border-slate-200 rounded-md focus:outline-indigo-500 py-1"
                            value={cart?.find((c: CartItem) => c.id === item.id)?.qty || 0}
                            onChange={(e) => {
                                const newVal = parseInt(e.target.value) || 0;
                                const currentVal = cart?.find((c: CartItem) => c.id === item.id)?.qty || 0;
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
                        onClick={() => onDelete && onDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </td>
            )}
        </tr>
    );
};
