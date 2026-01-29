"use client";

import React, { useState } from 'react';
import { Icons, InventoryIcons } from '../../lib/icons';
import { getStatusColor, getStatusDescription, formatCurrency, formatDate, getReturnStatusColor, getItemIntegrityColor, getDurationDays } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Order, InventoryItem } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';

interface OrderTableProps {
    orders: Order[];
    inventory: InventoryItem[];
    isAdmin?: boolean;
    onUpdateStatus?: (orderId: number, status: string) => void;
    onViewInvoice: (order: Order) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    requestSort: (key: string) => void;
}

export const OrderTable = ({ 
    orders, 
    inventory, 
    isAdmin = false, 
    onUpdateStatus, 
    onViewInvoice,
    sortConfig,
    requestSort
}: OrderTableProps) => {
    const { Check, X, ChevronRight, Printer, ChevronDown, ChevronUp, Undo, Truck, Package, ReturnIcon } = Icons;
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    const toggleExpand = (orderId: number) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ChevronUp className="w-3.5 h-3.5 text-muted opacity-30" />;
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="w-3.5 h-3.5 text-primary dark:text-warning" /> 
            : <ChevronDown className="w-3.5 h-3.5 text-primary dark:text-warning" />;
    };

        return (
            <Card noPadding className="overflow-hidden border-border shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border bg-background/50 text-theme-caption">
                                <th className="p-4 pl-6 text-theme-body text-muted uppercase tracking-widest cursor-pointer hover:bg-surface transition-colors" onClick={() => requestSort('id')}>
                                    <div className="flex items-center gap-2">Order ID <SortIcon column="id" /></div>
                                </th>
                                <th className="p-4 text-theme-body text-muted uppercase tracking-widest text-center" onClick={() => requestSort('status')}>
                                    <div className="flex items-center justify-center gap-2">Status <SortIcon column="status" /></div>
                                </th>
                                <th className="p-4 text-theme-body text-muted uppercase tracking-widest cursor-pointer hover:bg-surface transition-colors" onClick={() => requestSort('startDate')}>
                                    <div className="flex items-center gap-2">Dates <SortIcon column="startDate" /></div>
                                </th>
                                {isAdmin && <th className="p-4 text-theme-body text-muted uppercase tracking-widest text-center">Action</th>}
                                <th className="p-4 text-theme-body text-muted uppercase tracking-widest text-center">Invoice</th>
                                <th className="p-4 pr-6 text-theme-body text-muted uppercase tracking-widest text-right cursor-pointer hover:bg-surface transition-colors" onClick={() => requestSort('totalAmount')}>
                                    <div className="flex items-center justify-end gap-2">Total <SortIcon column="totalAmount" /></div>
                                </th>
                                <th className="p-4 pr-6 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.map((order) => {
                                const duration = getDurationDays(order.startDate, order.endDate);
                                const calculatedTotal = order.items.reduce((sum, item) => {
                                    const invItem = inventory.find(i => i.id === item.itemId);
                                    const price = (item.price ?? invItem?.price) || 0;
                                    return sum + (price * item.qty * duration);
                                }, 0);
    
                                return (
                                <React.Fragment key={order.id}>
                                    <tr className="hover:bg-background/40 transition-colors group cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                        <td className="p-4 pl-6">
                                            <span className="text-theme-body-bold text-foreground">#{order.id}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span 
                                                    title={getStatusDescription(order.status)}
                                                    className={`text-theme-caption px-3 py-1 rounded-full border-2 ${getStatusColor(order.status)} uppercase tracking-tighter shadow-sm inline-block min-w-[95px] cursor-help`}
                                                >
                                                    {order.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-theme-body text-muted">
                                            {formatDate(order.startDate)} - {formatDate(order.endDate)}
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-1.5">
                                                        {order.status === 'Pending' && (
                                                            <>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Rejected')} className="px-3 py-1.5 bg-status-rejected-bg text-status-rejected border border-status-rejected/20 rounded-xl text-theme-body uppercase tracking-tight hover:bg-status-rejected/20 transition-colors shadow-sm flex items-center gap-1.5" title="Reject Order">
                                                                    <X className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Reject</span>
                                                                </button>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Approved')} className="px-3 py-1.5 bg-status-approved-bg text-status-approved border border-status-approved/20 rounded-xl text-theme-body uppercase tracking-tight hover:bg-status-approved/20 transition-colors shadow-sm flex items-center gap-1.5" title="Approve Order">
                                                                    <Check className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Approve</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        {order.status === 'Approved' && (
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Pending')} className="px-3 py-1.5 bg-status-pending-bg text-status-pending border border-status-pending/20 rounded-xl text-theme-body uppercase tracking-tight hover:bg-status-pending/20 transition-colors shadow-sm flex items-center gap-1.5" title="Move back to Pending">
                                                                    <Undo className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Pull Back</span>
                                                                </button>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Active')} className="px-3 py-1.5 bg-status-active-bg text-status-active border border-status-active/20 rounded-xl text-theme-body uppercase tracking-tight hover:bg-status-active/20 transition-colors shadow-sm flex items-center gap-1.5" title="Dispatch Pickup">
                                                                    <Truck className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Dispatch</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                        {(order.status === 'Active' || order.status === 'Late' || order.status === 'Settlement') && (
                                                            <button onClick={() => onUpdateStatus?.(order.id, 'Completed')} className="px-3 py-1.5 bg-status-completed-bg text-status-completed border border-status-completed/20 rounded-xl text-theme-body uppercase tracking-tight hover:bg-status-completed/20 transition-colors shadow-sm flex items-center gap-1.5" title="Complete Return">
                                                                <ReturnIcon className="w-3.5 h-3.5" /> 
                                                                <span className="hidden sm:inline">Return</span>
                                                            </button>
                                                        )}
                                                        {['Completed', 'Rejected', 'Canceled'].includes(order.status) && (
                                                            <span className="text-theme-caption font-bold text-muted uppercase italic px-3 py-1 bg-background border border-border rounded-lg shadow-sm">
                                                                Closed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => onViewInvoice(order)} 
                                                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl bg-surface hover:bg-background text-muted text-theme-body transition-all shadow-sm group-hover:border-slate-300 mx-auto"
                                            >
                                                <Printer className="w-4 h-4" /> Invoice
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-theme-title text-foreground">{formatCurrency(order.totalAmount)}</span>
                                                <span className="text-theme-caption text-muted">{order.items.length} items</span>
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className={`transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-90' : ''}`}>
                                                <ChevronRight className={`w-5 h-5 ${expandedOrderId === order.id ? 'text-primary dark:text-warning' : 'text-muted'}`} />
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrderId === order.id && (
                                        <tr className="bg-background/30">
                                            <td colSpan={isAdmin ? 8 : 7} className="p-0">
                                                <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                                                        <div className="overflow-x-auto custom-scrollbar">
                                                            <table className="w-full text-left border-collapse min-w-[600px]">
                                                                <thead>
                                                                    <tr className="bg-background border-b border-border text-theme-body text-muted uppercase tracking-widest">
                                                                        <th className="p-3 pl-6">Item Details</th>
                                                                        <th className="p-3">Category</th>
                                                                        <th className="p-3 text-right">Repl. Cost</th>
                                                                        <th className="p-3 text-right">Qty</th>
                                                                        <th className="p-3 text-right">Rate</th>
                                                                        <th className="p-3 text-right">Duration</th>
                                                                        <th className="p-3 text-right pr-6">Subtotal</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border">
                                                                    {order.items.map((item, idx) => {
                                                                        const invItem = inventory.find(i => i.id === item.itemId);
                                                                        const price = (item.price ?? invItem?.price) || 0;
                                                                        const lineSubtotal = price * item.qty * duration;
    
                                                                                                                                            return (
    
                                                                                                                                                <tr key={idx} className="hover:bg-background/50 transition-colors">
    
                                                                                                                                                    <td className="p-3 pl-6">
    
                                                                                                                                                        <div className="flex items-center gap-3">
    
                                                                                                                                                            <DynamicIcon 
    
                                                                                                                                                                iconString={invItem?.image} 
    
                                                                                                                                                                color={invItem?.color} 
    
                                                                                                                                                                fallback={<span>📦</span>}
    
                                                                                                                                                            />
    
                                                                                                                                                            <div className="flex flex-col">
    
                                                                        
                                                                                            <span className="text-theme-body-bold text-foreground">{invItem?.name || 'Deleted Item'}</span>
                                                                                            {((item.lostQty ?? 0) > 0 || (item.damagedQty ?? 0) > 0) && (
                                                                                                <div className="flex gap-2">
                                                                                                    {(item.lostQty ?? 0) > 0 && <span className="text-[9px] font-black text-error uppercase">Lost: {item.lostQty}</span>}
                                                                                                    {(item.damagedQty ?? 0) > 0 && <span className="text-[9px] font-black text-warning uppercase">Damaged: {item.damagedQty}</span>}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-3 text-theme-body text-muted">{invItem?.category || 'N/A'}</td>
                                                                                <td className="p-3 text-right text-theme-body text-error">{formatCurrency(invItem?.replacementCost || 0)}</td>
                                                                                <td className="p-3 text-right text-theme-body-bold text-foreground">{item.qty}</td>
                                                                                <td className="p-3 text-right text-theme-body text-muted">{formatCurrency(price)}</td>
                                                                                <td className="p-3 text-right text-theme-body text-muted">{duration} {duration === 1 ? 'day' : 'days'}</td>
                                                                    <td className="p-3 text-right pr-6 text-theme-body-bold text-foreground">{formatCurrency(lineSubtotal)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {(order.penaltyAmount ?? 0) > 0 && (
                                                            <tr className="bg-error/10/30 dark:bg-rose-900/10">
                                                                <td colSpan={6} className="p-3 pl-6 text-right text-theme-body text-error dark:text-rose-400 uppercase tracking-widest">
                                                                    Penalties (Late/Damage/Loss)
                                                                </td>
                                                                <td className="p-3 text-right pr-6 text-theme-body-bold text-error dark:text-rose-400">
                                                                    +{formatCurrency(order.penaltyAmount)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="bg-background/50 border-t border-border">
                                                            <td colSpan={6} className="p-3 pl-6 text-right text-theme-body-bold text-foreground uppercase tracking-tighter">
                                                                Grand Total
                                                            </td>
                                                            <td className="p-3 text-right pr-6 text-theme-title text-foreground">
                                                                {formatCurrency(order.totalAmount)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                );
            })}
        </tbody>
    </table>
</div>
</Card>
);
};
