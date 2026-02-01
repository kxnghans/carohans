"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { fetchRedemptionsByDiscount } from '../../services/discountService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useScrollLock } from '../../hooks/useScrollLock';

interface Redemption {
    id: number;
    appliedAt: string;
    amount: number;
    orderId: number;
    clientId: number;
    clientName: string;
    orderDates: string;
}

interface RedemptionLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    discountId: number;
    discountName: string;
    discountCode: string;
}

export const RedemptionLedgerModal = ({
    isOpen,
    onClose,
    discountId,
    discountName,
    discountCode
}: RedemptionLedgerModalProps) => {
    const { X, FileText, User, Calendar, ExternalLink, Loader2, Download } = Icons;
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useScrollLock(isOpen);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        if (isOpen) {
            const loadData = async () => {
                setLoading(true);
                const data = await fetchRedemptionsByDiscount(discountId);
                setRedemptions(data as Redemption[]);
                setLoading(false);
            };
            loadData();
        }
        return () => clearTimeout(timer);
    }, [isOpen, discountId]);

    const handleExport = () => {
        const headers = ["Date", "Client", "Order ID", "Amount Saved"];
        const rows = redemptions.map(r => [
            new Date(r.appliedAt).toLocaleDateString(),
            r.clientName,
            r.orderId,
            r.amount
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `redemptions-${discountCode.toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-2xl" 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <Card 
                    className="bg-surface rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-border"
                    noPadding
                >
                {/* Header */}
                <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary p-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg"><FileText className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-theme-title font-bold tracking-tight">Redemption Ledger</h3>
                            <p className="text-theme-caption opacity-70 font-medium">{discountName} ({discountCode})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-surface min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted">
                            <Loader2 className="w-10 h-10 animate-spin opacity-20 mb-4" />
                            <p className="text-theme-body font-medium">Fetching redemption history...</p>
                        </div>
                    ) : redemptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted">
                            <div className="p-4 bg-background rounded-full mb-4 border border-dashed border-border"><FileText className="w-8 h-8 opacity-20" /></div>
                            <p className="text-theme-body font-medium">No redemptions found for this promotion.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-surface z-10 border-b border-border shadow-sm">
                                <tr className="text-theme-caption font-bold text-muted uppercase tracking-widest">
                                    <th className="p-4 pl-6">Date</th>
                                    <th className="p-4">Client</th>
                                    <th className="p-4">Order Ref</th>
                                    <th className="p-4 text-right pr-6">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {redemptions.map((r) => (
                                    <tr key={r.id} className="hover:bg-background/50 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex flex-col">
                                                <span className="text-theme-body font-semibold text-foreground">{formatDate(r.appliedAt)}</span>
                                                <span className="text-[10px] text-muted font-bold uppercase tracking-tighter">
                                                    {new Date(r.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-primary opacity-50" />
                                                <span className="text-theme-body text-foreground font-medium">{r.clientName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-secondary">
                                                    <span className="text-theme-body-bold font-mono">ORD-{r.orderId}</span>
                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="flex items-center gap-1 text-muted">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">{r.orderDates}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <span className="text-theme-body-bold text-foreground">{formatCurrency(r.amount)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-background border-t border-border flex gap-3 shrink-0">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
                    <Button 
                        onClick={handleExport} 
                        variant="secondary" 
                        className="flex-1 bg-surface border-border text-foreground hover:bg-surface/80"
                        disabled={redemptions.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" /> Export Ledger (CSV)
                    </Button>
                </div>
            </Card>
        </div>
    </div>,
    document.body
);
};