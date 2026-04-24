"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { useScrollLock } from '../../hooks/useScrollLock';
import { InventoryItem } from '../../types';
import { InventoryItemCard } from '../inventory/InventoryItemCard';

interface InventoryDetailModalProps {
    isOpen: boolean;
    item: InventoryItem | null;
    onClose: () => void;
    isAdmin?: boolean;
    onAddToCart?: (item: InventoryItem, delta: number) => void;
    cartQty?: number;
    items?: InventoryItem[];
    onItemChange?: (item: InventoryItem) => void;
}

export const InventoryDetailModal = ({
    isOpen,
    item,
    onClose,
    isAdmin = false,
    onAddToCart,
    cartQty = 0,
    items = [],
    onItemChange
}: InventoryDetailModalProps) => {
    const [mounted, setMounted] = useState(false);
    
    useScrollLock(isOpen);

    useEffect(() => {
        setMounted(true);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') {
                if (items.length > 0 && item && onItemChange) {
                    const currentIndex = items.findIndex(i => i.id === item.id);
                    const nextIndex = (currentIndex + 1) % items.length;
                    const nextItem = items[nextIndex];
                    if (nextItem) onItemChange(nextItem);
                }
            }
            if (e.key === 'ArrowLeft') {
                if (items.length > 0 && item && onItemChange) {
                    const currentIndex = items.findIndex(i => i.id === item.id);
                    const prevIndex = (currentIndex - 1 + items.length) % items.length;
                    const prevItem = items[prevIndex];
                    if (prevItem) onItemChange(prevItem);
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, item, items, onItemChange]);

    if (!isOpen || !mounted || !item) return null;

    const { X, Package, ChevronLeft, ChevronRight } = Icons;

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (items.length > 0 && item && onItemChange) {
            const currentIndex = items.findIndex(i => i.id === item.id);
            const nextIndex = (currentIndex + 1) % items.length;
            const nextItem = items[nextIndex];
            if (nextItem) onItemChange(nextItem);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (items.length > 0 && item && onItemChange) {
            const currentIndex = items.findIndex(i => i.id === item.id);
            const prevIndex = (currentIndex - 1 + items.length) % items.length;
            const prevItem = items[prevIndex];
            if (prevItem) onItemChange(prevItem);
        }
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4"
            onClick={onClose}
        >
            <div className="flex items-center justify-center gap-4 md:gap-8 w-full max-w-3xl">
                {items && items.length > 1 && (
                    <button 
                        onClick={handlePrev}
                        className="hidden sm:flex p-2 sm:p-3 bg-background/80 backdrop-blur-md text-foreground rounded-full hover:scale-110 hover:bg-primary hover:text-primary-text transition-all shadow-xl border border-border z-[60] shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                )}

                <div 
                    className="bg-surface rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-border relative shrink"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Pattern to match Calendar Modal */}
                    <div className="p-6 bg-primary dark:bg-primary-text text-primary-text dark:text-primary flex justify-between items-center shrink-0 border-b border-transparent dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-xl">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Item Details</h2>
                                <p className="opacity-70 text-[11px] font-black uppercase tracking-widest">Catalog Intelligence</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-2 relative">
                        <InventoryItemCard 
                            item={item}
                            isAdmin={isAdmin}
                            onAddToCart={onAddToCart}
                            cartQty={cartQty}
                            variant="modal"
                        />
                    </div>
                </div>

                {items && items.length > 1 && (
                    <button 
                        onClick={handleNext}
                        className="hidden sm:flex p-2 sm:p-3 bg-background/80 backdrop-blur-md text-foreground rounded-full hover:scale-110 hover:bg-primary hover:text-primary-text transition-all shadow-xl border border-border z-[60] shrink-0"
                    >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                )}
            </div>

            {/* Mobile Floating Chevrons */}
            {items && items.length > 1 && (
                <div className="sm:hidden absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-2 z-[60]">
                    <button 
                        onClick={handlePrev}
                        className="pointer-events-auto p-2 bg-background/80 backdrop-blur-md text-foreground rounded-full shadow-xl border border-border hover:bg-primary hover:text-primary-text transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleNext}
                        className="pointer-events-auto p-2 bg-background/80 backdrop-blur-md text-foreground rounded-full shadow-xl border border-border hover:bg-primary hover:text-primary-text transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>,
        document.body
    );
};