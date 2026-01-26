import React from 'react';
import { Icons } from '../../lib/icons';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary' | 'success';
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
    if (!isOpen) return null;

    const { Trash2, AlertOctagon } = Icons;

    const variantClasses = {
        danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
        primary: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
        success: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full transform transition-all scale-100">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmVariant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {confirmVariant === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertOctagon className="w-6 h-6" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    {message}
                </p>
                
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={() => onConfirm(false)}
                            className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg ${variantClasses[confirmVariant]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                    {showAlwaysDeleteOption && (
                        <button 
                            onClick={() => onConfirm(true)}
                            className="w-full px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-dashed border-slate-200 hover:border-rose-200"
                        >
                            Always delete without asking in this session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
