"use client";

import { useState, Fragment } from 'react';
import { Icons } from '../../lib/icons';
import { getStatusColor, getStatusDescription, formatCurrency, formatDate, getDurationDays } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Order, InventoryItem } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { ScrollableContainer } from '../common/ScrollableContainer';
import { useAppStore } from '../../context/AppContext';
import { useRouter } from 'next/navigation';

const SortIcon = ({ 
    column, 
    sortConfig 
}: { 
    column: string, 
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null 
}) => {
    const { ChevronDown, ChevronUp } = Icons;
    if (sortConfig?.key !== column) return <ChevronUp className="w-3.5 h-3.5 text-muted opacity-30" />;
    return sortConfig.direction === 'asc' 
        ? <ChevronUp className="w-3.5 h-3.5 text-secondary dark:text-warning" /> 
        : <ChevronDown className="w-3.5 h-3.5 text-secondary dark:text-warning" />;
};

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
    const { Check, X, ChevronRight, Printer, Undo, Truck, ReturnIcon, Pencil } = Icons;
    const { setModifyingOrderId, setCart, setPortalFormData, setCreateOrderStep } = useAppStore();
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const router = useRouter();

    const toggleExpand = (orderId: number) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const handleModifyOrder = (order: Order) => {
        setModifyingOrderId(order.id);
        setCreateOrderStep('shop');
        // Pre-populate cart
        setCart(order.items.map(item => ({ id: item.itemId, qty: item.qty, price: item.price })));
        // Pre-populate dates
        setPortalFormData(prev => ({
            ...prev,
            firstName: order.clientName.split(' ')[0] || '',
            lastName: order.clientName.split(' ').slice(1).join(' ') || '',
            phone: order.phone,
            email: order.email,
            start: order.startDate,
            end: order.endDate
        }));

        if (isAdmin) {
            router.push('/admin/overview');
        } else {
            // Check if current user owns this order or is admin
            router.push('/portal/inventory');
        }
    };

        return (
            <Card noPadding className="overflow-hidden border-border shadow-sm">
                <ScrollableContainer>
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border bg-background/50 text-theme-caption">
                                <th className="p-4 pl-6 text-theme-body text-muted uppercase tracking-widest cursor-pointer hover:bg-surface transition-colors" onClick={() => requestSort('id')}>
                                    <div className="flex items-center gap-2">Order ID <SortIcon column="id" sortConfig={sortConfig} /></div>
                                </th>
                                <th className="p-4 text-theme-body text-muted uppercase tracking-widest text-center" onClick={() => requestSort('status')}>
                                    <div className="flex items-center justify-center gap-2">Status <SortIcon column="status" sortConfig={sortConfig} /></div>
                                </th>
                                <th className="p-4 text-theme-body text-muted uppercase tracking-widest cursor-pointer hover:bg-surface transition-colors" onClick={() => requestSort('startDate')}>
                                    <div className="flex items-center gap-2">Dates (Pickup - Planned) <SortIcon column="startDate" sortConfig={sortConfig} /></div>
                                </th>
                                {isAdmin && <th className="p-4 text-theme-body text-muted uppercase tracking-widest text-center">Action</th>}
                                <th className="p-4 text-theme-body text-muted uppercase tracking-widest text-center">Invoice</th>
                                <th className="p-4 pr-6 text-theme-body text-muted uppercase tracking-widest text-right cursor-pointer hover:bg-surface transition-colors" onClick={() => requestSort('totalAmount')}>
                                    <div className="flex items-center justify-end gap-2">Total <SortIcon column="totalAmount" sortConfig={sortConfig} /></div>
                                </th>
                                <th className="p-4 pr-6 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.map((order) => {
                                return (
                                <Fragment key={order.id}>
                                    <tr className="hover:bg-background/40 transition-colors group cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                        <td className="p-4 pl-6">
                                            <span className="text-theme-body-bold text-foreground">#{order.id}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span 
                                                    title={getStatusDescription(order.status)}
                                                    className={`text-theme-body px-3 py-1 rounded-full border-2 ${getStatusColor(order.status)} uppercase tracking-tighter shadow-sm inline-block min-w-[95px] cursor-help font-semibold`}
                                                >
                                                    {order.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-theme-body text-muted">
                                            {/* DESKTOP VIEW */}
                                            <div className="hidden sm:block">
                                                {formatDate(order.startDate)} - {formatDate(order.closedAt || order.endDate)}
                                            </div>
                                            {/* MOBILE VIEW */}
                                            <div className="sm:hidden flex flex-col items-start w-max">
                                                <span>{formatDate(order.startDate)}</span>
                                                <span className="w-full text-center leading-none my-0.5">-</span>
                                                <span>{formatDate(order.closedAt || order.endDate)}</span>
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-1.5">
                                                        {order.status === 'Pending' && (
                                                            <>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Rejected')} className="px-3 py-1.5 bg-status-rejected text-white border border-status-rejected dark:bg-status-rejected-bg dark:text-status-rejected dark:border-status-rejected/20 rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-rejected/90 dark:hover:bg-status-rejected/20 transition-colors shadow-sm flex items-center gap-1.5" title="Reject Order">
                                                                    <X className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Reject</span>
                                                                </button>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Approved')} className="px-3 py-1.5 bg-status-approved text-white border border-status-approved dark:bg-status-approved-bg dark:text-status-approved dark:border-status-approved/20 rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-approved/90 dark:hover:bg-status-approved/20 transition-colors shadow-sm flex items-center gap-1.5" title="Approve Order">
                                                                    <Check className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Approve</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        {order.status === 'Approved' && (
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Pending')} className="px-3 py-1.5 bg-status-pending text-white border border-status-pending dark:bg-status-pending-bg dark:text-status-pending dark:border-status-pending/20 rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-pending/90 dark:hover:bg-status-pending/20 transition-colors shadow-sm flex items-center gap-1.5" title="Move back to Pending">
                                                                    <Undo className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Pull Back</span>
                                                                </button>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Active')} className="px-3 py-1.5 bg-status-active text-white border border-status-active dark:bg-status-active-bg dark:text-status-active dark:border-status-active/20 rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-active/90 dark:hover:bg-status-active/20 transition-colors shadow-sm flex items-center gap-1.5" title="Dispatch Pickup">
                                                                    <Truck className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Dispatch</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                        {(order.status === 'Active' || order.status === 'Late' || order.status === 'Settlement') && (
                                                            <button onClick={() => onUpdateStatus?.(order.id, 'Completed')} className="px-3 py-1.5 bg-status-completed text-white border border-status-completed dark:bg-status-completed-bg dark:text-status-completed dark:border-status-completed/20 rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-completed/90 dark:hover:bg-status-completed/20 transition-colors shadow-sm flex items-center gap-1.5" title="Complete Return">
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
                                                <ChevronRight className={`w-5 h-5 ${expandedOrderId === order.id ? 'text-secondary dark:text-warning' : 'text-muted'}`} />
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrderId === order.id && (
                                        <tr className="bg-background/30">
                                            <td colSpan={isAdmin ? 8 : 7} className="p-0">
                                                <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                                                                                                    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                                                                                                        <ScrollableContainer>
                                                                                                            <table className="w-full text-left border-collapse min-w-[600px]">
                                                                                                                <thead>                                                                    <tr className="bg-background border-b border-border text-theme-body text-muted uppercase tracking-widest">
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
                                                                        // Calculate actual duration for this item row
                                                                        const actualDuration = getDurationDays(order.startDate, order.closedAt || order.endDate);
                                                                        const lineSubtotal = price * item.qty * actualDuration;
    
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
                                                                                <td className="p-3 text-right text-theme-body text-muted">{actualDuration} {actualDuration === 1 ? 'day' : 'days'}</td>
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
                                                                                                    </ScrollableContainer>
                                                                                                                                                                                                                                            {/* MODIFICATION & DATE SUMMARY ACTION */}
                                                                                                                                                                                                                                            <div className="p-4 bg-background/50 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                                                                                                                                                                                                                                                <div className="flex flex-wrap gap-8 text-[10px] uppercase font-bold text-muted tracking-widest">
                                                                                                                                                                                                                                                    <div className="flex flex-col">
                                                                                                                                                                                                                                                        <span>Pickup</span>
                                                                                                                                                                                                                                                        <span className="text-theme-body text-foreground font-semibold">{formatDate(order.startDate)}</span>
                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                    <div className="flex flex-col">
                                                                                                                                                                                                                                                        <span>Planned Return</span>
                                                                                                                                                                                                                                                        <span className="text-theme-body text-foreground font-semibold">{formatDate(order.endDate)}</span>
                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                    {order.closedAt && (
                                                                                                                                                                                                                                                        <>
                                                                                                                                                                                                                                                            {(() => {
                                                                                                                                                                                                                                                                const actual = new Date(order.closedAt).setHours(0,0,0,0);
                                                                                                                                                                                                                                                                const planned = new Date(order.endDate).setHours(0,0,0,0);
                                                                                                                                                                                                                                                                const diffDays = Math.round((actual - planned) / (1000 * 60 * 60 * 24));
                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                let colorClass = "";
                                                                                                                                                                                                                                                                let label = "";
                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                if (diffDays < 0) {
                                                                                                                                                                                                                                                                    colorClass = "text-secondary dark:text-status-active";
                                                                                                                                                                                                                                                                    label = `-${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`;
                                                                                                                                                                                                                                                                } else if (diffDays > 0) {
                                                                                                                                                                                                                                                                    colorClass = "text-error dark:text-status-rejected";
                                                                                                                                                                                                                                                                    label = `+${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
                                                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                                                    colorClass = "text-status-completed";
                                                                                                                                                                                                                                                                    label = "Same Day";
                                                                                                                                                                                                                                                                }
                                                                                                                                                                        
                                                                                                                                                                                                                                                                return (
                                                                                                                                                                                                                                                                    <>
                                                                                                                                                                                                                                                                        <div className="flex flex-col">
                                                                                                                                                                                                                                                                            <span>Actual Return</span>
                                                                                                                                                                                                                                                                            <span className={`text-theme-body ${colorClass} font-semibold`}>{formatDate(order.closedAt)}</span>
                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                        <div className="flex flex-col">
                                                                                                                                                                                                                                                                            <span>Variance</span>
                                                                                                                                                                                                                                                                            <span className={`text-theme-body ${colorClass} font-semibold`}>{label}</span>
                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                    </>
                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                            })()}
                                                                                                                                                                                                                                                        </>
                                                                                                                                                                                                                                                    )}
                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                {!['Completed', 'Rejected', 'Canceled'].includes(order.status) && (
                                                                                                                                                                                                                                                    <Button 
                                                                                                                                                                                                                                                        variant="primary" 
                                                                                                                                                                                                                                                        size="sm" 
                                                                                                                                                                                                                                                        className="font-semibold w-full sm:w-auto shadow-md"
                                                                                                                                                                                                                                                        onClick={() => handleModifyOrder(order)}
                                                                                                                                                                                                                                                    >
                                                                                                                                                                                                                                                        <Pencil className="w-3.5 h-3.5 mr-2" /> Modify Order
                                                                                                                                                                                                                                                    </Button>
                                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                            </div>                                                                                                </div>
                                                                                            </div>                                </td>
                            </tr>
                        )}
                    </Fragment>
                );
            })}
                            </tbody>
                        </table>
                    </ScrollableContainer>
                </Card>
            );
        };

