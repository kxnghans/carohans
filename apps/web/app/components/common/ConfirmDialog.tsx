"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary' | 'success' | 'secondary';
    showAlwaysDeleteOption?: boolean;
    onConfirm: (always?: boolean) => void;
    onCancel: () => void;
}

export const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = 'primary',
    showAlwaysDeleteOption = false,
    onConfirm,
    onCancel
}: ConfirmDialogProps) => {
    const [mounted, setMounted] = useState(false);
    
    useScrollLock(isOpen);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            clearTimeout(timer);
        };
    }, [isOpen, onCancel]);

    if (!isOpen || !mounted) return null;

    const { Trash2, AlertOctagon } = Icons;

    const variantClasses = {
        danger: 'bg-error hover:opacity-90',
        primary: 'bg-primary hover:opacity-90',
        secondary: 'bg-secondary hover:opacity-90',
        success: 'bg-success hover:opacity-90'
    };

    const iconBgClasses = {
        danger: 'bg-error/10 text-error',
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        success: 'bg-success/10 text-success'
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={onCancel}
        >
            <div 
                className="bg-surface p-6 md:p-8 rounded-3xl shadow-2xl border border-border max-w-sm w-full transform transition-all scale-100 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${iconBgClasses[confirmVariant]}`}>
                    {confirmVariant === 'danger' ? <Trash2 className="w-7 h-7" /> : <AlertOctagon className="w-7 h-7" />}
                </div>
                <h3 className="text-theme-title font-normal text-foreground mb-2">{title}</h3>
                <p className="text-theme-body text-muted mb-8 leading-relaxed font-normal">
                    {message}
                </p>
                
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 text-[10px] font-semibold uppercase text-muted hover:text-foreground bg-background dark:bg-white/5 border border-border hover:border-muted rounded-xl transition-all"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={() => onConfirm(false)}
                            className={`flex-1 px-4 py-3 text-[10px] font-semibold uppercase text-white dark:text-background rounded-xl transition-all shadow-lg shadow-primary/10 ${variantClasses[confirmVariant]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                    {showAlwaysDeleteOption && (
                        <button 
                            onClick={() => onConfirm(true)}
                            className="w-full px-4 py-3 text-[9px] font-semibold uppercase text-error bg-error/5 border border-error/20 hover:bg-error/10 rounded-xl transition-all"
                        >
                            Always confirm in this session
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};