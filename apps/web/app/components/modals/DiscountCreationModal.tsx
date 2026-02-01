"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { Discount } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';
import { generateSecureCode } from '../../utils/helpers';

interface DiscountCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (discount: Omit<Discount, 'id'>) => Promise<void>;
    isSaving: boolean;
}

export const DiscountCreationModal = ({
    isOpen,
    onClose,
    onSave,
    isSaving
}: DiscountCreationModalProps) => {
    const { X, Tag, Check, Calendar, Sparkles, Loader2 } = Icons;
    const [mounted, setMounted] = useState(false);

    const [form, setForm] = useState<Omit<Discount, 'id'>>({
        name: '',
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        duration_type: 'unlimited',
        status: 'active',
        approval_strategy: 'auto',
        start_date: '',
        end_date: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useScrollLock(isOpen);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const handleGenerateCode = () => {
        setForm(prev => ({ ...prev, code: generateSecureCode() }));
        if (errors.code) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.code;
                return next;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Required";
        if (!form.code.trim()) newErrors.code = "Required";
        
        if (form.discount_value <= 0) {
            newErrors.value = "Must be > 0";
        } else if (form.discount_type === 'percentage' && form.discount_value > 100) {
            newErrors.value = "Max 100%";
        }

        if (form.duration_type === 'period') {
            if (!form.start_date) newErrors.start_date = "Required";
            if (!form.end_date) newErrors.end_date = "Required";
            if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
                newErrors.end_date = "Invalid range";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        await onSave(form);
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-2xl bg-surface rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Sticky */}
                <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary p-6 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg"><Tag className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-theme-title">Create Promotion</h3>
                            <p className="text-theme-body opacity-70">Configure advanced discount rules</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-surface">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-theme-subtitle text-muted block ml-1">
                                Promotion Name 
                                {errors.name && <span className="text-error ml-2">({errors.name})</span>}
                            </label>
                            <input 
                                className={`w-full p-4 bg-background border ${errors.name ? 'border-error' : 'border-border focus:border-secondary'} rounded-2xl outline-none transition-all text-theme-label placeholder:text-muted/40 font-sans`} 
                                placeholder="Summer Sale 2026" 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-theme-subtitle text-muted block ml-1">
                                Discount Code
                                {errors.code && <span className="text-error ml-2">({errors.code})</span>}
                            </label>
                            <div className="relative group">
                                <input 
                                    className={`w-full p-4 pr-12 bg-background border ${errors.code ? 'border-error' : 'border-border focus:border-secondary'} rounded-2xl outline-none transition-all font-mono text-theme-label placeholder:text-muted/40 uppercase`} 
                                    placeholder="SUMMER-26" 
                                    value={form.code} 
                                    onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
                                />
                                <button 
                                    type="button"
                                    onClick={handleGenerateCode}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-secondary bg-secondary/10 hover:bg-secondary/20 transition-all"
                                    title="Generate secure code"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Value Configuration */}
                    <div className="bg-background rounded-3xl p-6 border border-border space-y-6 shadow-inner">
                        <div className="flex items-center gap-2 mb-2 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                            <label className="text-theme-subtitle text-muted">Pricing Strategy</label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-theme-subtitle text-muted block mb-2 ml-1">Calculation Type</label>
                                <div className="flex gap-2 p-1.5 bg-surface border border-border rounded-2xl">
                                    {(['percentage', 'fixed'] as const).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setForm({...form, discount_type: t})}
                                            className={`flex-1 py-2.5 rounded-xl text-theme-body-bold transition-all ${form.discount_type === t ? 'bg-secondary text-white dark:text-background shadow-md' : 'text-muted hover:bg-background'}`}
                                        >
                                            {t === 'percentage' ? 'Percent' : 'Fixed'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-theme-subtitle text-muted block mb-2 ml-1">
                                    Benefit Value
                                    {errors.value && <span className="text-error ml-2">({errors.value})</span>}
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-title text-muted group-focus-within:text-secondary">
                                        {form.discount_type === 'percentage' ? '%' : '¢'}
                                    </span>
                                    <input 
                                        type="number" 
                                        className={`w-full pl-10 pr-4 py-4 bg-surface border ${errors.value ? 'border-error' : 'border-border focus:border-secondary'} rounded-2xl outline-none transition-all text-theme-header text-foreground dark:[color-scheme:dark] font-sans`} 
                                        value={form.discount_value} 
                                        onChange={e => setForm({...form, discount_value: parseFloat(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Behavior & Validity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 ml-1">
                                <Calendar className="w-4 h-4 text-muted" />
                                <label className="text-theme-subtitle text-muted">Usage Frequency</label>
                            </div>
                            <div className="space-y-2">
                                {(['unlimited', 'one_time', 'period'] as const).map(t => {
                                    const isActive = form.duration_type === t;
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setForm({...form, duration_type: t})}
                                            className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${isActive ? 'border-secondary bg-secondary/5 text-foreground' : 'border-border bg-background text-muted hover:border-muted/50'}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="text-theme-body-bold capitalize">{t.replace('_', ' ')}</span>
                                                <span className="text-theme-body opacity-60">
                                                    {t === 'unlimited' ? 'Unlimited redemptions' : 
                                                     t === 'one_time' ? 'One use per client email' : 
                                                     'Active between specific dates'}
                                                </span>
                                            </div>
                                            {isActive && <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center"><Check className="w-3 h-3 text-white dark:text-background" /></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 ml-1">
                                <Check className="w-4 h-4 text-muted" />
                                <label className="text-theme-subtitle text-muted">Approval Strategy</label>
                            </div>
                            <div className="space-y-2">
                                {(['auto', 'manual'] as const).map(s => {
                                    const isActive = form.approval_strategy === s;
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setForm({...form, approval_strategy: s})}
                                            className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${isActive ? 'border-secondary bg-secondary/5 text-foreground' : 'border-border bg-background text-muted hover:border-muted/50'}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="text-theme-body-bold capitalize">{s} Approval</span>
                                                <span className="text-theme-body opacity-60">
                                                    {s === 'auto' ? 'Applies instantly at checkout' : 'Requires manual admin audit'}
                                                </span>
                                            </div>
                                            {isActive && <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center"><Check className="w-3 h-3 text-white dark:text-background" /></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Conditional Dates */}
                    {form.duration_type === 'period' && (
                        <div className="grid grid-cols-2 gap-6 p-6 bg-secondary/5 border-2 border-dashed border-secondary/20 rounded-3xl animate-in slide-in-from-top-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-theme-subtitle text-muted block mb-2 ml-1">
                                    Starts On
                                    {errors.start_date && <span className="text-error ml-2">({errors.start_date})</span>}
                                </label>
                                <input 
                                    type="date" 
                                    className={`w-full p-4 bg-background border ${errors.start_date ? 'border-error' : 'border-border focus:border-secondary'} rounded-2xl outline-none text-theme-label dark:[color-scheme:dark] font-sans`} 
                                    value={form.start_date} 
                                    onChange={e => setForm({...form, start_date: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-theme-subtitle text-muted block mb-2 ml-1">
                                    Ends On
                                    {errors.end_date && <span className="text-error ml-2">({errors.end_date})</span>}
                                </label>
                                <input 
                                    type="date" 
                                    className={`w-full p-4 bg-background border ${errors.end_date ? 'border-error' : 'border-border focus:border-secondary'} rounded-2xl outline-none text-theme-label dark:[color-scheme:dark] font-sans`} 
                                    value={form.end_date} 
                                    onChange={e => setForm({...form, end_date: e.target.value})} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Sticky */}
                <div className="p-6 bg-background border-t border-border flex gap-3 flex-shrink-0">
                    <Button 
                        variant="secondary" 
                        className="flex-1 rounded-2xl" 
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button 
                        className="flex-[2] bg-secondary text-white dark:text-background rounded-2xl shadow-lg shadow-secondary/20" 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /><span>Processing...</span></div>
                        ) : (
                            'Launch Promotion'
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};