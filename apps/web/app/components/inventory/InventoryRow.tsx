import React from 'react';
import { Icons, InventoryIcons } from '../../lib/icons';
import { formatCurrency } from '../../utils/helpers';
import { InventoryItem, CartItem } from '../../types';
import { IconColorPicker } from './IconColorPicker';
import { DynamicIcon } from '../common/DynamicIcon';

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

    const isFieldEditing = (field: string) => 
        editingCell?.id === item.id && editingCell?.field === field;

    return (
        <tr
            id={`row-${item.id}`}
            className={`group transition-colors ${isNew ? 'bg-primary/10/60 dark:bg-indigo-900/20 border-l-4 border-indigo-400' : 'hover:bg-background/50'}`}
            tabIndex={isNew ? 0 : -1} 
            onBlur={handleRowBlur}
        >
            <td className="p-4 pl-6">
                <div className="flex items-center">
                    <div className="w-12 shrink-0 flex justify-start relative">
                        <div 
                            onClick={() => isEditMode && setActivePickerId(activePickerId === item.id ? null : item.id)}
                            className={`${isEditMode ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''}`}
                        >
                            <DynamicIcon iconString={item.image} color={item.color} className="w-10 h-10" fallback={<span>📦</span>} />
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
                    <div className="ml-4 flex-1">
                        {isFieldEditing('name') ? (
                            <input
                                className="border border-primary ring-4 ring-indigo-500/10 rounded px-2 py-1 text-theme-label w-full outline-none bg-surface text-foreground"
                                value={editValue as string}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        ) : (
                            <span 
                                onClick={() => startEditing(item.id, 'name', item.name)}
                                className={`text-theme-label font-semibold ${isNew && item.name === 'Enter Name' ? 'text-indigo-400 italic' : 'text-foreground'} ${isAdmin && isEditMode ? 'cursor-text hover:text-primary' : ''}`}
                            >
                                {item.name}
                            </span>
                        )}
                    </div>
                </div>
            </td>

            <td className="p-4">
                {isFieldEditing('category') ? (
                    <select
                        className="border border-primary ring-4 ring-indigo-500/10 rounded px-2 py-1 text-theme-label w-full outline-none bg-surface text-foreground cursor-pointer"
                        value={editValue as string}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    >
                        {['Catering', 'Glassware', 'Furniture', 'Decor', 'Lighting', 'Cutlery', 'Electronics', 'Tents'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                ) : (
                    <span 
                        onClick={() => startEditing(item.id, 'category', item.category)}
                        className={`text-theme-label text-muted ${isAdmin && isEditMode ? 'cursor-text' : ''}`}
                    >
                        {item.category}
                    </span>
                )}
            </td>

            <td className="p-4 text-right">
                {isFieldEditing('price') ? (
                    <input
                        className="border border-primary ring-4 ring-indigo-500/10 rounded px-2 py-1 text-theme-label w-20 text-right outline-none bg-surface text-foreground dark:[color-scheme:dark]"
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
                        className={`text-theme-label font-semibold ${isNew && item.price === 0 ? 'text-indigo-400' : 'text-foreground'} ${isAdmin && isEditMode ? 'cursor-text' : ''}`}
                    >
                        {formatCurrency(item.price)}
                    </span>
                )}
            </td>

            <td className="p-4 text-right">
                {isFieldEditing('replacementCost') ? (
                    <input
                        className="border border-primary ring-4 ring-indigo-500/10 rounded px-2 py-1 text-theme-label w-20 text-right outline-none bg-surface text-foreground dark:[color-scheme:dark]"
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
                        className={`text-theme-label font-semibold ${isNew && item.replacementCost === 0 ? 'text-indigo-400' : 'text-error bg-error/10 dark:bg-rose-900/30 px-2 py-1 rounded inline-block'} ${isAdmin && isEditMode ? 'cursor-text' : ''}`}
                    >
                        {formatCurrency(item.replacementCost)}
                    </span>
                )}
            </td>

            <td className="p-4 text-right">
                {isFieldEditing('stock') ? (
                    <input
                        className="border border-primary ring-4 ring-indigo-500/10 rounded px-2 py-1 text-theme-label w-16 text-right outline-none bg-surface text-foreground dark:[color-scheme:dark]"
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
                        className="inline-block px-2.5 py-1 rounded-full text-theme-label font-semibold cursor-text bg-background text-muted border border-border"
                    >
                        {item.stock}
                    </span>
                )}
            </td>
            
            {showOrderColumn && (
                <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => onAddToCart && onAddToCart(item, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-background text-muted hover:bg-surface border border-border transition-colors disabled:opacity-50"
                            disabled={!cart?.find((c: CartItem) => c.id === item.id)}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <input
                            type="number"
                            className="w-16 text-right text-theme-label font-semibold bg-surface text-foreground border border-border rounded-md focus:border-primary py-1 outline-none dark:[color-scheme:dark] pr-2"
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
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-background text-muted hover:bg-surface border border-border transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </td>
            )}

            {isEditMode && (
                <td className="p-4 text-left">
                    <button 
                        onClick={() => onDelete && onDelete(item.id)}
                        className="p-2 text-muted hover:text-error hover:bg-error/10 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </td>
            )}
        </tr>
    );
};
