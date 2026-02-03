"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { Order } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import { supabase } from '../../lib/supabase';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ScrollableContainer } from '../common/ScrollableContainer';
import { deleteUser } from '../../actions/admin';
import { encodeOrderId } from '../../utils/idHandler';

interface UserCleanupModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    clientName: string;
    clientEmail: string;
    onSuccess: () => void;
    showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UserCleanupModal = ({
    isOpen,
    onClose,
    userId,
    clientName,
    clientEmail,
    onSuccess,
    showNotification
}: UserCleanupModalProps) => {
    const { Trash2, AlertCircle, Ban, Check, X, Loader2 } = Icons;
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
    const [mounted, setMounted] = useState(false);

    useScrollLock(isOpen);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            const fetchUserOrders = async () => {
                setLoading(true);
                try {
                    // Find client ID first
                    const { data: client } = await supabase
                        .from('clients')
                        .select('id')
                        .eq('user_id', userId)
                        .single();
        
                    if (!client) {
                        setOrders([]);
                        setLoading(false);
                        return;
                    }
        
                    const { data, error } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('client_id', client.id)
                        .order('created_at', { ascending: false });
        
                    if (error) throw error;
                    setOrders((data || []).map(o => ({
                        id: o.id,
                        publicId: encodeOrderId(o.id),
                        clientName: o.client_name,
                        status: o.status,
                        startDate: o.start_date,
                        endDate: o.end_date,
                        totalAmount: Number(o.total_amount),
                        amountPaid: Number(o.amount_paid || 0),
                        items: [],
                        phone: o.phone,
                        email: o.email
                    })));
                } catch (e) {
                    console.error("Failed to fetch user orders", e);
                    showNotification("Failed to load user records", "error");
                } finally {
                    setLoading(false);
                }
            };
            fetchUserOrders();
        }
    }, [isOpen, userId, showNotification]);

    const toggleOrderSelection = (id: number) => {
        setSelectedOrderIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === orders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(orders.map(o => o.id));
        }
    };

    const handleExecuteDeletion = async (mode: 'full' | 'unlink') => {
        setProcessing(true);
        try {
            const result = await deleteUser(userId, selectedOrderIds, mode);

            if (result.success) {
                showNotification(
                    mode === 'full' 
                        ? `Access revoked and ${selectedOrderIds.length} orders removed.` 
                        : "Access revoked. Records preserved.", 
                    "success"
                );
                
                onSuccess();
                onClose();
            } else {
                console.error("Cleanup failed", result.error);
                showNotification(`Operation failed: ${result.error}`, "error");
            }
        } catch (e) {
            console.error("Cleanup failed", e);
            showNotification("Operation failed. Please try again.", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-surface rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary p-8 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl text-primary-text dark:text-primary">
                            <Ban className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Revoke System Access</h2>
                            <p className="opacity-70 font-medium">{clientName} • {clientEmail}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col p-8 space-y-6">
                    <div className="bg-error/5 border border-error/20 p-6 rounded-3xl flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-error shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-error font-bold mb-1 uppercase tracking-wider text-[11px]">Action Required</h4>
                            <p className="text-theme-body text-foreground/80 leading-relaxed">
                                This user has <span className="font-bold text-error">{orders.length} associated orders</span>. 
                                To maintain database integrity, you must decide how to handle these records before revoking access.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 text-error animate-spin opacity-40" />
                            <p className="text-theme-body text-muted font-bold animate-pulse uppercase tracking-widest text-[10px]">Scanning Records...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-3xl bg-background/50">
                            <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Review Orders</span>
                                <button 
                                    onClick={toggleSelectAll}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest px-3 py-1 hover:bg-primary/5 rounded-lg transition-all"
                                >
                                    {selectedOrderIds.length === orders.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <ScrollableContainer className="flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-surface z-10">
                                        <tr className="border-b-2 border-border">
                                            <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-center w-12"></th>
                                            <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest">Order ID</th>
                                            <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest">Status</th>
                                            <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest">Date</th>
                                            <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-right pr-6">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {orders.map(order => {
                                            const isSelected = selectedOrderIds.includes(order.id);
                                            return (
                                                <tr 
                                                    key={order.id} 
                                                    className={`hover:bg-primary/5 transition-colors cursor-pointer group ${isSelected ? 'bg-error/5' : ''}`}
                                                    onClick={() => toggleOrderSelection(order.id)}
                                                >
                                                    <td className="p-4 text-center">
                                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-error border-error scale-110' : 'border-border group-hover:border-muted'}`}>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-theme-body-bold text-foreground font-mono">
                                                        {order.publicId || `#${order.id}`}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(order.status)} font-bold uppercase tracking-tighter shadow-sm`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-theme-caption text-muted font-medium">
                                                        {formatDate(order.startDate)}
                                                    </td>
                                                    <td className="p-4 text-right pr-6 text-theme-body-bold text-foreground">
                                                        {formatCurrency(order.totalAmount)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollableContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4 bg-background/50 rounded-3xl border border-dashed border-border">
                            <Check className="w-12 h-12 text-success opacity-20" />
                            <p className="text-theme-body text-muted font-medium">No order history found for this client.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-background border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Button 
                            variant="secondary" 
                            className="w-full font-bold py-4 rounded-2xl border-2"
                            onClick={() => handleExecuteDeletion('unlink')}
                            disabled={processing}
                        >
                            <Ban className="w-4 h-4 mr-2" /> Revoke Only
                        </Button>
                        <p className="text-theme-caption text-muted text-center font-medium uppercase tracking-wide">
                            {orders.length > 0 ? 'Keep all business records' : 'Revoke login only'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button 
                            variant="danger" 
                            className={`w-full font-bold py-4 rounded-2xl shadow-lg shadow-error/20 border-none ${orders.length === 0 || selectedOrderIds.length > 0 ? 'bg-error text-white' : 'opacity-50 grayscale cursor-not-allowed'}`}
                            onClick={() => (orders.length === 0 || selectedOrderIds.length > 0) && handleExecuteDeletion('full')}
                            disabled={processing || (orders.length > 0 && selectedOrderIds.length === 0)}
                        >
                            {processing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <><Trash2 className="w-4 h-4 mr-2" /> {orders.length === 0 ? 'Delete Account' : 'Cleanup & Delete'}</>
                            )}
                        </Button>
                        <p className="text-theme-caption text-error text-center font-bold uppercase tracking-wide">
                            {orders.length === 0 
                                ? 'Permanent Account Deletion'
                                : selectedOrderIds.length > 0 
                                    ? `Delete ${selectedOrderIds.length} orders + revoke` 
                                    : 'Select orders to delete'}
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};