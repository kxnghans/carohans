"use client";

import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { DiscountFlow } from './DiscountFlow';
import { useDiscountManager } from '../../hooks/useDiscountManager';
import { formatCurrency, generateSecureCode } from '../../utils/helpers';

interface DiscountManagerProps {
    subtotal: number;
    initialDiscount?: {
        name: string;
        type: 'fixed' | 'percentage';
        value: number;
        code?: string;
    };
    isConfirmedInitial?: boolean;
    onApply: (discount: { name: string; type: 'fixed' | 'percentage'; value: number; code: string }) => void;
    onClear: () => void;
    variant?: 'compact' | 'featured';
    showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DiscountManager = ({
    subtotal,
    initialDiscount,
    isConfirmedInitial = false,
    onApply,
    onClear,
    variant = 'compact',
    showNotification
}: DiscountManagerProps) => {
    const { Sparkles, Tag, Pencil, X } = Icons;
    const {
        isApplyingDiscount,
        setIsApplyingDiscount,
        isDiscountConfirmed,
        setIsDiscountConfirmed,
        discountMode,
        setDiscountMode,
        activeDiscounts,
        selectedDiscountId,
        discountPercentage,
        discountForm,
        setDiscountForm,
        handlePercentageChange,
        handleMonetaryChange,
        handleSelectDiscount,
        reset
    } = useDiscountManager(subtotal, initialDiscount, isConfirmedInitial);

    const handleConfirm = () => {
        if (discountForm.name && discountForm.value) {
            setIsDiscountConfirmed(true);
            
            const finalDiscount = { ...discountForm };
            // Auto-generate code for ad-hoc new discounts
            if (discountMode === 'new' && !finalDiscount.code) {
                finalDiscount.code = generateSecureCode();
            }
            
            onApply(finalDiscount);
        } else {
            showNotification("Please fill required fields", "error");
        }
    };

    const handleClear = () => {
        reset();
        onClear();
    };

    // 1. Render Empty State
    if (!isApplyingDiscount && !isDiscountConfirmed) {
        if (variant === 'compact') {
            return (
                <div className="flex items-center justify-end gap-8 p-6 bg-surface border-y border-border/50 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-xl text-secondary"><Sparkles className="w-5 h-5" /></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-secondary">Apply Order Discount</span>
                    </div>
                    <Button 
                        onClick={() => setIsApplyingDiscount(true)} 
                        className="bg-secondary text-white dark:text-background hover:opacity-90 shadow-lg shadow-secondary/20 px-8 h-[38px] font-black uppercase tracking-widest text-[10px] rounded-xl border-none"
                    >
                        Apply Discount
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between gap-6 px-6 py-8 bg-surface border-y border-border/50 animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary/10 dark:bg-secondary/20 rounded-2xl text-secondary"><Sparkles className="w-6 h-6" /></div>
                    <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-secondary">Operational Incentives</span>
                        <p className="text-theme-body text-muted font-medium">Apply special rates or promotional discounts to this order.</p>
                    </div>
                </div>
                <Button 
                    onClick={() => setIsApplyingDiscount(true)} 
                    className="bg-secondary text-white dark:text-background hover:opacity-90 shadow-lg shadow-secondary/20 px-8 h-[48px] font-black uppercase tracking-widest text-[11px] rounded-xl border-none"
                >
                    Apply Discount
                </Button>
            </div>
        );
    }

    // 2. Render Applied State (Summary View)
    if (isDiscountConfirmed) {
        if (variant === 'compact') {
            return (
                <div className="flex items-center justify-end gap-12 p-6 bg-surface border-y border-border/50 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 dark:bg-secondary/20 rounded-xl text-secondary"><Tag className="w-5 h-5" /></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-secondary">Applied Discount</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Promotion</span>
                            <span className="text-theme-body-bold text-foreground font-mono uppercase">{discountForm.name}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Value</span>
                            <span className="text-theme-body-bold text-secondary">
                                {discountForm.type === 'percentage' ? `${discountPercentage}%` : formatCurrency(discountForm.value)}
                            </span>
                        </div>
                        <div className="flex flex-col text-right min-w-[100px]">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Impact</span>
                            <span className="text-theme-body-bold text-foreground">-{formatCurrency(discountForm.type === 'percentage' ? (subtotal * parseFloat(discountPercentage)) / 100 : discountForm.value)}</span>
                        </div>
                        {discountForm.code && (
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Code</span>
                                <span className="text-theme-body font-mono text-muted uppercase">{discountForm.code}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsDiscountConfirmed(false)} 
                                className="p-2.5 bg-secondary/20 dark:bg-secondary/30 text-secondary hover:bg-secondary hover:text-white dark:text-primary-text rounded-xl transition-all shadow-sm active:scale-90 border border-secondary/10 dark:border-secondary/20" 
                                title="Modify Discount"
                            >
                                <Pencil className="w-4.5 h-4.5" />
                            </button>
                            <button 
                                onClick={handleClear} 
                                className="p-2.5 bg-error/20 dark:bg-error/30 text-error hover:bg-error hover:text-white dark:text-primary-text rounded-xl transition-all shadow-sm active:scale-90 border border-error/10 dark:border-error/20" 
                                title="Remove Discount"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Featured Summary (used in Modals/Inventory)
        return (
            <div className="p-6 bg-secondary/5 dark:bg-secondary/10 border-2 border-secondary/20 rounded-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-secondary text-white dark:text-primary-text rounded-xl shadow-lg shadow-secondary/20">
                            <Tag className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Active Incentive</span>
                                {discountForm.code && <span className="text-[9px] font-mono bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-bold">{discountForm.code}</span>}
                            </div>
                            <h4 className="text-theme-title font-bold text-foreground uppercase tracking-tight">{discountForm.name}</h4>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Rate Applied</span>
                            <span className="text-theme-header text-secondary font-black">
                                {discountForm.type === 'percentage' ? `${discountPercentage}%` : formatCurrency(discountForm.value)}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Total Savings</span>
                            <span className="text-theme-header text-foreground font-black">
                                -{formatCurrency(discountForm.type === 'percentage' ? (subtotal * parseFloat(discountPercentage)) / 100 : discountForm.value)}
                            </span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button 
                                onClick={() => setIsDiscountConfirmed(false)} 
                                className="w-12 h-12 flex items-center justify-center bg-background border border-border text-muted hover:text-secondary hover:border-secondary/30 rounded-xl transition-all shadow-sm active:scale-90"
                                title="Modify Rate"
                            >
                                <Pencil className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleClear} 
                                className="w-12 h-12 flex items-center justify-center bg-background border border-border text-muted hover:text-error hover:border-error/30 rounded-xl transition-all shadow-sm active:scale-90"
                                title="Remove Incentive"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Render Discount Flow (Applying State)
    return (
        <div className={`p-6 bg-surface border-y border-border/50 animate-in fade-in duration-300 ${variant === 'featured' ? 'p-2' : ''}`}>
                            <DiscountFlow
                                mode={discountMode}
                                setMode={(m) => m !== 'na' && setDiscountMode(m)}
                                name={discountForm.name}                setName={(val) => setDiscountForm(prev => ({ ...prev, name: val.toUpperCase() }))}
                percentage={discountPercentage}
                onPercentageChange={handlePercentageChange}
                amount={discountForm.type === 'fixed' ? discountForm.value : ''}
                onAmountChange={handleMonetaryChange}
                activeDiscounts={activeDiscounts}
                selectedDiscountId={selectedDiscountId}
                onSelectDiscount={handleSelectDiscount}
                onCancel={handleClear}
                onConfirm={handleConfirm}
                isConfirmed={false}
                type={discountForm.type}
            />
        </div>
    );
};