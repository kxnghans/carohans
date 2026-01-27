"use client";

import React, { useState } from 'react';
import { Icons, InventoryIcons } from '../../lib/icons';
import { getStatusColor, getStatusDescription, formatCurrency, formatDate, getReturnStatusColor, getItemIntegrityColor, getDurationDays } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Order, InventoryItem } from '../../types';

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
        if (sortConfig?.key !== column) return <ChevronUp className="w-3.5 h-3.5 opacity-20" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />;
    };

    return (
        <Card noPadding className="overflow-hidden border-slate-100 shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px]">
                        <th className="p-4 pl-6 font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('id')}>
                            <div className="flex items-center gap-2">Order ID <SortIcon column="id" /></div>
                        </th>
                        <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-center" onClick={() => requestSort('status')}>
                            <div className="flex items-center justify-center gap-2">Status <SortIcon column="status" /></div>
                        </th>
                        <th className="p-4 font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('startDate')}>
                            <div className="flex items-center gap-2">Dates <SortIcon column="startDate" /></div>
                        </th>
                        {isAdmin && <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>}
                        <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-center">Invoice</th>
                        <th className="p-4 pr-6 font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('totalAmount')}>
                            <div className="flex items-center justify-end gap-2">Total <SortIcon column="totalAmount" /></div>
                        </th>
                        <th className="p-4 pr-6 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                        const duration = getDurationDays(order.startDate, order.endDate);
                        const calculatedTotal = order.items.reduce((sum, item) => {
                            const invItem = inventory.find(i => i.id === item.itemId);
                            const price = (item.price ?? invItem?.price) || 0;
                            return sum + (price * item.qty * duration);
                        }, 0);
                        
                        return (
                        <React.Fragment key={order.id}>
                            <tr className="hover:bg-slate-50/40 transition-colors group cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                <td className="p-4 pl-6">
                                    <span className="font-bold text-slate-900 text-sm">#{order.id}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <span 
                                            title={getStatusDescription(order.status)}
                                            className={`text-[10px] px-3 py-1 rounded-full border-2 ${getStatusColor(order.status)} font-black uppercase tracking-tighter shadow-sm inline-block min-w-[95px] cursor-help`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-xs font-bold text-slate-500">
                                    {formatDate(order.startDate)} - {formatDate(order.endDate)}
                                </td>
                                {isAdmin && (
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-1.5">
                                                {order.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => onUpdateStatus?.(order.id, 'Canceled')} className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-sm" title="Cancel"><X className="w-4 h-4" /></button>
                                                        <button onClick={() => onUpdateStatus?.(order.id, 'Approved')} className="p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm" title="Approve"><Check className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                                {order.status === 'Approved' && (
                                                    <div className="flex gap-1.5">
                                                        <button onClick={() => onUpdateStatus?.(order.id, 'Pending')} className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-sm" title="Pull Back"><Undo className="w-4 h-4" /></button>
                                                        <button onClick={() => onUpdateStatus?.(order.id, 'Active')} className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm" title="Process Dispatch"><ReturnIcon className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                                {(order.status === 'Active' || order.status === 'Late' || order.status === 'Settlement') && (
                                                    <button onClick={() => onUpdateStatus?.(order.id, 'Completed')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-tight hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-1.5"><ReturnIcon className="w-3.5 h-3.5" /> Return</button>
                                                )}
                                                {['Completed', 'Rejected', 'Canceled'].includes(order.status) && (
                                                    <span className="text-[11px] text-slate-400 font-bold uppercase italic px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">Closed</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                )}
                                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => onViewInvoice(order)} 
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm group-hover:border-slate-300 mx-auto"
                                    >
                                        <Printer className="w-4 h-4" /> Invoice
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 text-lg">{formatCurrency(calculatedTotal)}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{order.items.length} items</span>
                                    </div>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className={`transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-90' : ''}`}>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                </td>
                            </tr>
                            {expandedOrderId === order.id && (
                                <tr className="bg-slate-50/30">
                                    <td colSpan={isAdmin ? 8 : 7} className="p-0">
                                        <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            <th className="p-3 pl-6">Item Details</th>
                                                            <th className="p-3">Category</th>
                                                            <th className="p-3 text-right">Repl. Cost</th>
                                                            <th className="p-3 text-right">Qty</th>
                                                            <th className="p-3 text-right">Rate</th>
                                                            <th className="p-3 text-right">Duration</th>
                                                            <th className="p-3 text-right pr-6">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {order.items.map((item, idx) => {
                                                            const invItem = inventory.find(i => i.id === item.itemId);
                                                            const price = (item.price ?? invItem?.price) || 0;
                                                            const lineSubtotal = price * item.qty * duration;
                                                            
                                                            const RenderItemIcon = () => {
                                                                if (invItem?.image?.startsWith('icon:')) {
                                                                    const iconKey = invItem.image.replace('icon:', '');
                                                                    const IconComp = InventoryIcons[iconKey];
                                                                    return IconComp ? <IconComp className={`w-5 h-5 ${invItem.color || 'text-slate-600'}`} /> : <span>📦</span>;
                                                                }
                                                                return <div className="text-xl">{invItem?.image || '📦'}</div>;
                                                            };

                                                            return (
                                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="p-3 pl-6">
                                                                        <div className="flex items-center gap-3">
                                                                            <RenderItemIcon />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-bold text-slate-800 text-xs">{invItem?.name || 'Deleted Item'}</span>
                                                                                {((item.lostQty ?? 0) > 0 || (item.damagedQty ?? 0) > 0) && (
                                                                                    <div className="flex gap-2">
                                                                                        {(item.lostQty ?? 0) > 0 && <span className="text-[9px] font-black text-rose-600 uppercase">Lost: {item.lostQty}</span>}
                                                                                        {(item.damagedQty ?? 0) > 0 && <span className="text-[9px] font-black text-amber-600 uppercase">Damaged: {item.damagedQty}</span>}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-xs text-slate-500">{invItem?.category || 'N/A'}</td>
                                                                    <td className="p-3 text-right text-xs text-rose-600">{formatCurrency(invItem?.replacementCost || 0)}</td>
                                                                    <td className="p-3 text-right text-xs font-bold text-slate-700">{item.qty}</td>
                                                                    <td className="p-3 text-right text-xs text-slate-500">{formatCurrency(price)}</td>
                                                                    <td className="p-3 text-right text-xs text-slate-500">{duration} {duration === 1 ? 'day' : 'days'}</td>
                                                                    <td className="p-3 text-right pr-6 text-xs font-bold text-slate-900">{formatCurrency(lineSubtotal)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
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
        </Card>
    );
};