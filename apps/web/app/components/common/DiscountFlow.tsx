"use client";

import { Icons } from '../../lib/icons';
import { Discount } from '../../types';

interface DiscountFlowProps {
    mode: 'new' | 'existing' | 'na';
    setMode: (mode: 'new' | 'existing' | 'na') => void;
    name: string;
    setName: (name: string) => void;
    percentage: string;
    onPercentageChange: (val: string) => void;
    amount: number | string;
    onAmountChange: (val: string) => void;
    activeDiscounts: Discount[];
    selectedDiscountId: string;
    onSelectDiscount: (id: string) => void;
    onCancel: () => void;
    onConfirm?: () => void;
    isConfirmed?: boolean;
    showConfirmButton?: boolean;
    type?: 'fixed' | 'percentage';
}

export const DiscountFlow = ({
    mode,
    setMode,
    name,
    setName,
    percentage,
    onPercentageChange,
    amount,
    onAmountChange,
    activeDiscounts,
    selectedDiscountId,
    onSelectDiscount,
    onCancel,
    onConfirm,
    isConfirmed = false,
    showConfirmButton = true,
    type = 'fixed'
}: DiscountFlowProps) => {
    const { X, Check } = Icons;

    return (
        <div className="flex flex-wrap items-end gap-4 animate-in slide-in-from-top-2 duration-300">
            {/* Strategy / Mode */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Strategy</label>
                <div className="flex bg-background border border-border rounded-xl p-0.5 h-[38px]">
                    {(['new', 'existing', 'na'] as const).filter(m => m !== 'na').map((m) => {
                        const isActive = mode === m;
                        const labels = { new: 'New', existing: 'Existing', na: 'N/A' };
                        return (
                            <button 
                                key={m} 
                                type="button" 
                                onClick={() => setMode(m)} 
                                className={`flex-1 text-theme-body font-semibold uppercase rounded-lg transition-all ${isActive ? 'bg-secondary text-white dark:text-primary-text shadow-sm' : 'text-muted hover:text-foreground'}`}
                            >
                                {labels[m]}
                            </button>
                        );
                    })}
                    {mode === 'na' && (
                        <button type="button" className="flex-1 text-theme-body font-semibold uppercase rounded-lg bg-muted text-white shadow-sm">N/A</button>
                    )}
                </div>
            </div>

            {/* Discount Name / Discount Selector */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[200px]">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Name / Selection</label>
                {isConfirmed ? (
                    <div className="h-[38px] w-full bg-secondary/5 dark:bg-secondary/10 border border-secondary/20 rounded-xl px-4 flex items-center">
                        <span className="text-theme-body-bold text-secondary uppercase font-mono">{name || (activeDiscounts.find(d => d.id.toString() === selectedDiscountId)?.name)}</span>
                    </div>
                ) : mode === 'new' ? (
                    <input 
                        className="h-[38px] w-full bg-background border border-border rounded-xl px-4 text-theme-label outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all placeholder:italic" 
                        placeholder="Promotion Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                    />
                ) : mode === 'existing' ? (
                    <select 
                        className="h-[38px] w-full bg-background border border-border rounded-xl px-3 text-theme-body font-semibold outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all cursor-pointer" 
                        value={selectedDiscountId} 
                        onChange={(e) => onSelectDiscount(e.target.value)}
                    >
                        <option value="">Select Discount...</option>
                        {activeDiscounts.map(discount => (
                            <option key={discount.id} value={discount.id.toString()}>{discount.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className="h-[38px] flex items-center justify-center bg-background border border-dashed border-border rounded-xl text-theme-body text-muted font-semibold italic uppercase">No Discount</div>
                )}
            </div>

            {/* Percentage Input */}
            <div className="flex flex-col gap-1.5 w-24">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Percent</label>
                <div className="relative group">
                    <input 
                        type="number" 
                        disabled={isConfirmed || mode === 'existing' || mode === 'na'} 
                        className="w-full h-[38px] bg-background border border-border rounded-xl px-3 text-right text-theme-body font-semibold outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all pr-7 disabled:opacity-60 dark:disabled:opacity-80" 
                        placeholder="0" 
                        value={mode === 'existing' ? (type === 'percentage' ? amount : '') : percentage} 
                        onChange={(e) => onPercentageChange(e.target.value)} 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-body font-semibold text-muted">%</span>
                </div>
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Amount</label>
                <div className="relative group">
                    <input 
                        type="number" 
                        disabled={isConfirmed || mode === 'existing' || mode === 'na'} 
                        className="w-full h-[38px] bg-background border border-border rounded-xl pl-7 pr-3 text-right text-theme-body font-semibold outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all disabled:opacity-60 dark:disabled:opacity-80" 
                        placeholder="0" 
                        value={amount} 
                        onChange={(e) => onAmountChange(e.target.value)} 
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-body font-semibold text-muted">¢</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 h-[38px]">
                <button 
                    onClick={onCancel} 
                    className="w-10 h-10 flex items-center justify-center bg-error text-white dark:text-primary-text rounded-xl hover:opacity-90 transition-all shadow-lg shadow-error/20"
                >
                    <X className="w-5 h-5" />
                </button>
                {showConfirmButton && mode !== 'na' && !isConfirmed && (
                    <button 
                        onClick={onConfirm} 
                        className="w-10 h-10 flex items-center justify-center bg-secondary text-white dark:text-primary-text rounded-xl hover:opacity-90 transition-all shadow-lg shadow-secondary/20"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};