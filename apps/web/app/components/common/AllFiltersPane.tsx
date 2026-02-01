"use client";

import { useState, useRef, useEffect } from 'react';
import { Icons } from '../../lib/icons';

interface SlicerProps {
    label: string;
    children: React.ReactNode;
    className?: string;
}

export const SlicerContainer = ({ label, children, className = "" }: SlicerProps) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">{label}</label>
        {children}
    </div>
);

interface SelectSlicerProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    className?: string;
}

export const SelectSlicer = ({ label, value, options, onChange, className = "" }: SelectSlicerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { ChevronDown, Check } = Icons;

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <SlicerContainer label={label} className={`relative ${className}`} >
            <div ref={containerRef}>
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full h-11 px-4 bg-background border rounded-xl flex items-center justify-between transition-all outline-none shadow-sm group ${isOpen ? 'border-primary ring-4 ring-primary/5' : 'border-border hover:border-muted'}`}
                >
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground truncate">
                        {selectedOption?.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-primary'}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[200px]">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {options.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 text-muted hover:text-primary'}`}
                                    >
                                        <span className="text-theme-body font-semibold uppercase tracking-widest">{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </SlicerContainer>
    );
};

interface ComparisonSlicerProps {
    label: string;
    operator: string;
    value: string;
    onOperatorChange: (op: string) => void;
    onValueChange: (val: string) => void;
    className?: string;
}

export const ComparisonSlicer = ({ label, operator, value, onOperatorChange, onValueChange, className = "" }: ComparisonSlicerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const operators = [
        { v: 'gt', l: '>' },
        { v: 'eq', l: '=' },
        { v: 'lt', l: '<' }
    ];

    const currentOp = operators.find(o => o.v === operator) || operators[0] || { v: 'gt', l: '>' };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    return (
        <SlicerContainer label={label} className={className}>
            <div className="flex items-center bg-background border border-border rounded-xl h-11 focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary transition-all overflow-visible shadow-sm">
                <div className="relative h-full shrink-0" ref={containerRef}>
                    <button 
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`h-full px-4 bg-primary-text text-primary font-black text-lg hover:opacity-90 transition-colors min-w-[48px] flex items-center justify-center outline-none rounded-l-xl ${isOpen ? 'opacity-80' : ''}`}
                    >
                        {currentOp.l}
                    </button>
                    {isOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in slide-in-from-top-2 zoom-in-95 duration-100 min-w-[56px]">
                            {operators.map(op => (
                                <button 
                                    key={op.v} 
                                    className={`w-full px-4 py-2.5 text-center transition-colors font-black ${operator === op.v ? 'bg-white text-slate-900' : 'text-white/60 hover:bg-white/10 hover:text-white'} text-theme-subtitle`} 
                                    onClick={() => { onOperatorChange(op.v); setIsOpen(false); }}
                                >
                                    {op.l}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="w-px bg-border h-6 shrink-0 opacity-60"></div>
                
                <input 
                    type="number" 
                    className="flex-1 h-full px-4 text-theme-body font-semibold outline-none text-left bg-transparent placeholder:font-semibold placeholder:text-foreground/70 min-w-[80px]" 
                    placeholder="0" 
                    value={value} 
                    onChange={(e) => onValueChange(e.target.value)} 
                />
            </div>
        </SlicerContainer>
    );
};
