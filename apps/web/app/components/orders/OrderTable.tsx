"use client";

import { useState, Fragment } from 'react';
import { Icons } from '../../lib/icons';
import { getStatusColor, getStatusDescription, formatCurrency, formatDate, getDurationDays, calculateOrderTotal } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Order, InventoryItem } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { ScrollableContainer } from '../common/ScrollableContainer';
import { useAppStore } from '../../context/AppContext';
import { useRouter } from 'next/navigation';
import { applyDiscountToOrder } from '../../services/orderService';

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
    const { Check, X, ChevronRight, Printer, Undo, Truck, ReturnIcon, Pencil, Sparkles, Cash } = Icons;
    const { setModifyingOrderId, setCart, setPortalFormData, setCreateOrderStep, showNotification, setOrders } = useAppStore();
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [statusEditOrder, setStatusEditOrder] = useState<Order | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    
    // Discount State
    const [discountForm, setDiscountForm] = useState<{
        orderId: number | null;
        name: string;
        type: 'fixed' | 'percentage';
        value: string;
    }>({ orderId: null, name: '', type: 'fixed', value: '' });

    const router = useRouter();

    const statuses = ['Pending', 'Approved', 'Active', 'Late', 'Settlement', 'Completed', 'Rejected', 'Canceled'];

    const toggleExpand = (orderId: number) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setDiscountForm({ orderId: null, name: '', type: 'fixed', value: '' });
        } else {
            setExpandedOrderId(orderId);
            const order = orders.find(o => o.id === orderId);
            if (order && order.discountName) {
                setDiscountForm({
                    orderId: order.id,
                    name: order.discountName,
                    type: order.discountType || 'fixed',
                    value: order.discountValue?.toString() || ''
                });
            } else {
                setDiscountForm({ orderId, name: '', type: 'fixed', value: '' });
            }
        }
    };

    const handleUpdateStatus = (orderId: number, status: string) => {
        onUpdateStatus?.(orderId, status);
        setStatusEditOrder(null);
    };

    const handleApplyDiscount = async (order: Order) => {
        try {
            if (!discountForm.name || !discountForm.value) {
                showNotification("Please provide a name and value for the discount.", "error");
                return;
            }

            const val = parseFloat(discountForm.value);
            if (isNaN(val)) {
                showNotification("Invalid discount value.", "error");
                return;
            }

            // Calculate new total
            const items = order.items.map(i => ({ price: i.price, qty: i.qty }));
            const newTotal = calculateOrderTotal(items, order.startDate, order.endDate, discountForm.type, val);
            
            await applyDiscountToOrder(order.id, {
                name: discountForm.name,
                type: discountForm.type,
                value: val
            }, newTotal + (order.penaltyAmount || 0));

            setOrders(prev => prev.map(o => o.id === order.id ? {
                ...o,
                discountName: discountForm.name,
                discountType: discountForm.type,
                discountValue: val,
                totalAmount: newTotal + (order.penaltyAmount || 0)
            } : o));

            showNotification("Discount applied successfully!", "success");
        } catch (error) {
            console.error("Failed to apply discount", error);
            showNotification("Failed to apply discount", "error");
        }
    };

    const handleModifyOrder = (order: Order) => {
        setModifyingOrderId(order.id);
        setCreateOrderStep('shop');
        // Pre-populate cart
        setCart(order.items.map(item => ({ id: item.inventoryId, qty: item.qty, price: item.price })));
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
            <>
            <Card noPadding className="overflow-hidden border-border shadow-sm">
                <ScrollableContainer>
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead><tr className="border-b border-border bg-background/50 text-theme-caption">
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
                            </tr></thead>
                        <tbody className="divide-y divide-border">{orders.map((order) => {
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
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Rejected')} className="px-3 py-1.5 bg-status-rejected text-white border border-status-rejected dark:bg-status-rejected dark:text-background dark:border-status-rejected rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-rejected/90 dark:hover:bg-status-rejected/90 transition-colors shadow-sm flex items-center gap-1.5" title="Reject Order">
                                                                    <X className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Reject</span>
                                                                </button>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Approved')} className="px-3 py-1.5 bg-status-approved text-white border border-status-approved dark:bg-status-approved dark:text-background dark:border-status-approved rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-approved/90 dark:hover:bg-status-approved/90 transition-colors shadow-sm flex items-center gap-1.5" title="Approve Order">
                                                                    <Check className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Approve</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        {order.status === 'Approved' && (
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Pending')} className="px-3 py-1.5 bg-status-pending text-white border border-status-pending dark:bg-status-pending dark:text-background dark:border-status-pending rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-pending/90 dark:hover:bg-status-pending/90 transition-colors shadow-sm flex items-center gap-1.5" title="Move back to Pending">
                                                                    <Undo className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Pull Back</span>
                                                                </button>
                                                                <button onClick={() => onUpdateStatus?.(order.id, 'Active')} className="px-3 py-1.5 bg-status-active text-white border border-status-active dark:bg-status-active dark:text-background dark:border-status-active rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-active/90 dark:hover:bg-status-active/90 transition-colors shadow-sm flex items-center gap-1.5" title="Dispatch Pickup">
                                                                    <Truck className="w-3.5 h-3.5" /> 
                                                                    <span className="hidden sm:inline">Dispatch</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                        {(order.status === 'Active' || order.status === 'Late' || order.status === 'Settlement') && (
                                                            <button onClick={() => onUpdateStatus?.(order.id, 'Completed')} className="px-3 py-1.5 bg-status-completed text-white border border-status-completed dark:bg-status-completed dark:text-background dark:border-status-completed rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:bg-status-completed/90 dark:hover:bg-status-completed/90 transition-colors shadow-sm flex items-center gap-1.5" title="Complete Return">
                                                                <ReturnIcon className="w-3.5 h-3.5" /> 
                                                                <span className="hidden sm:inline">Return</span>
                                                            </button>
                                                        )}
                                                        {['Completed', 'Rejected', 'Canceled'].includes(order.status) && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-theme-caption font-bold text-muted uppercase italic px-3 py-1 bg-background border border-border rounded-lg shadow-sm">
                                                                    Closed
                                                                </span>
                                                                {isAdmin && (
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setStatusEditOrder(order);
                                                                            setSelectedStatus(order.status);
                                                                        }}
                                                                        className="p-1.5 hover:bg-surface rounded-full transition-colors text-muted hover:text-primary active:scale-90"
                                                                        title="Change Status"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
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
                                                                <thead><tr className="bg-background border-b border-border text-theme-body text-muted uppercase tracking-widest">
                                                                        <th className="p-3 pl-6">Item Details</th>
                                                                        <th className="p-3">Category</th>
                                                                        <th className="p-3 text-right">Repl. Cost</th>
                                                                        <th className="p-3 text-right">Qty</th>
                                                                        <th className="p-3 text-right">Rate</th>
                                                                        <th className="p-3 text-right">Duration</th>
                                                                        <th className="p-3 text-right pr-6">Subtotal</th>
                                                                    </tr></thead>
                                                                <tbody className="divide-y divide-border">{order.items.map((item, idx) => {
                                                                        const invItem = inventory.find(i => i.id === item.inventoryId);
                                                                        const price = (item.price ?? invItem?.price) || 0;
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
                                                                    </tr></tbody>
                                                            </table>
                                                        </ScrollableContainer>
                                                        
                                                                                                                                                                                                                                                                                                                                                            {/* DISCOUNT & MODIFY ACTIONS */}
                                                                                                                                                                                                                                                                                                                                                            <div className="p-6 bg-background/50 border-t border-border space-y-6">
                                                                                                                                                                                                                                                                                                                                                                {isAdmin && !['Completed', 'Rejected', 'Canceled'].includes(order.status) && (
                                                                                                                                                                                                                                                                                                                                                                    <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm max-w-2xl relative overflow-hidden">
                                                                                                                                                                                                                                                                                                                                                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                                                                                                                                                                                                                                                                                                                                            <Cash className="w-24 h-24 -mr-6 -mt-6 text-foreground" />
                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                        <div className="relative z-10">
                                                                                                                                                                                                                                                                                                                                                                            <div className="flex items-center gap-2 mb-4">
                                                                                                                                                                                                                                                                                                                                                                                <div className="p-1.5 bg-secondary/10 rounded-lg text-secondary">
                                                                                                                                                                                                                                                                                                                                                                                    <Cash className="w-4 h-4" />
                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                <h4 className="text-theme-caption font-bold uppercase tracking-widest text-foreground">Apply Order Discount</h4>
                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                                                                                                                                                                                                                                                                                                                                                                <div className="space-y-1.5">
                                                                                                                                                                                                                                                                                                                                                                                    <label className="text-[10px] font-bold text-muted uppercase ml-1">Discount Name</label>
                                                                                                                                                                                                                                                                                                                                                                                    <input 
                                                                                                                                                                                                                                                                                                                                                                                        className="w-full p-2.5 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all placeholder:font-normal" 
                                                                                                                                                                                                                                                                                                                                                                                        placeholder="e.g. Holiday Special"
                                                                                                                                                                                                                                                                                                                                                                                        value={discountForm.name}
                                                                                                                                                                                                                                                                                                                                                                                        onChange={e => setDiscountForm({...discountForm, name: e.target.value})}
                                                                                                                                                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                <div className="space-y-1.5">
                                                                                                                                                                                                                                                                                                                                                                                    <label className="text-[10px] font-bold text-muted uppercase ml-1">Type & Value</label>
                                                                                                                                                                                                                                                                                                                                                                                    <div className="flex shadow-sm rounded-xl">
                                                                                                                                                                                                                                                                                                                                                                                        <select 
                                                                                                                                                                                                                                                                                                                                                                                            className="p-2.5 bg-background border border-border rounded-l-xl border-r-0 text-theme-body-bold text-foreground outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all w-16 text-center"
                                                                                                                                                                                                                                                                                                                                                                                            value={discountForm.type}
                                                                                                                                                                                                                                                                                                                                                                                            onChange={e => setDiscountForm({...discountForm, type: e.target.value as 'fixed' | 'percentage'})}
                                                                                                                                                                                                                                                                                                                                                                                        >
                                                                                                                                                                                                                                                                                                                                                                                            <option value="fixed">¢</option>
                                                                                                                                                                                                                                                                                                                                                                                            <option value="percentage">%</option>
                                                                                                                                                                                                                                                                                                                                                                                        </select>
                                                                                                                                                                                                                                                                                                                                                                                        <input 
                                                                                                                                                                                                                                                                                                                                                                                            type="number"
                                                                                                                                                                                                                                                                                                                                                                                            className="w-full p-2.5 bg-background border border-border rounded-r-xl text-theme-body-bold text-foreground outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all placeholder:font-normal" 
                                                                                                                                                                                                                                                                                                                                                                                            placeholder="0.00"
                                                                                                                                                                                                                                                                                                                                                                                            value={discountForm.value}
                                                                                                                                                                                                                                                                                                                                                                                            onChange={e => setDiscountForm({...discountForm, value: e.target.value})}
                                                                                                                                                                                                                                                                                                                                                                                        />
                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                <Button 
                                                                                                                                                                                                                                                                                                                                                                                    variant="secondary" 
                                                                                                                                                                                                                                                                                                                                                                                    size="md" 
                                                                                                                                                                                                                                                                                                                                                                                    className="w-full h-[42px] border-secondary text-secondary hover:bg-secondary hover:text-white shadow-none hover:shadow-lg hover:shadow-secondary/20 transition-all font-bold uppercase tracking-tight"
                                                                                                                                                                                                                                                                                                                                                                                    onClick={() => handleApplyDiscount(order)}
                                                                                                                                                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                                                                                                                                    <Sparkles className="w-3.5 h-3.5 mr-2" /> Apply
                                                                                                                                                                                                                                                                                                                                                                                </Button>
                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border/50">                                                                                                                                                                                                                                                                                                            <div className="flex flex-wrap gap-8 text-[10px] uppercase font-bold text-muted tracking-widest">                                                                                                                                                                                                                                                    <div className="flex flex-col">
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
                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                            </td>
                                                                                                                                                                                                                        </tr>
                                                                                                                                                                                                                    )}
                    </Fragment>
                );
            })}
                            </tbody>
                        </table>
                    </ScrollableContainer>
                </Card>

                {/* STATUS CHANGE MODAL */}
                {statusEditOrder && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setStatusEditOrder(null)}>
                        <div className="bg-surface rounded-3xl shadow-2xl w-[95%] max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border" onClick={e => e.stopPropagation()}>
                            <div className="p-6 bg-primary dark:bg-primary-text text-primary-text dark:text-primary flex justify-between items-center border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/10 p-2 rounded-lg"><Pencil className="w-5 h-5" /></div>
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">Order Status</h2>
                                        <p className="opacity-70 text-sm font-medium">Order #{statusEditOrder.id} • {statusEditOrder.clientName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setStatusEditOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-theme-body text-muted mb-4 font-medium">Select the new status for this order. This change will be applied immediately.</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {statuses.map(status => {
                                        const descriptions: Record<string, string> = {
                                            'Pending': 'awaiting approval',
                                            'Approved': 'items reserved',
                                            'Active': 'out with client',
                                            'Late': 'overdue for return',
                                            'Settlement': 'awaiting final audit',
                                            'Completed': 'returned and paid',
                                            'Rejected': 'declined by admin',
                                            'Canceled': 'withdrawn by client'
                                        };
                                        // Extract base color from status utility for radio border/text
                                        const statusColorClass = getStatusColor(status);
                                        const isSelected = selectedStatus === status;
                                        
                                        // Dynamic classes for radio button
                                        let radioColor = "border-muted text-muted";
                                        if (isSelected) {
                                            if (status === 'Pending') radioColor = "border-status-pending text-status-pending";
                                            else if (status === 'Approved') radioColor = "border-status-approved text-status-approved";
                                            else if (status === 'Active') radioColor = "border-status-active text-status-active";
                                            else if (status === 'Late') radioColor = "border-status-late text-status-late";
                                            else if (status === 'Completed') radioColor = "border-status-completed text-status-completed";
                                            else if (status === 'Settlement') radioColor = "border-status-settlement text-status-settlement";
                                            else if (status === 'Rejected') radioColor = "border-status-rejected text-status-rejected";
                                            else if (status === 'Canceled') radioColor = "border-status-canceled text-status-canceled";
                                        }

                                        return (
                                            <label 
                                                key={status} 
                                                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer group ${isSelected ? `bg-surface border-current ${radioColor.split(' ')[0]}` : 'border-border hover:border-muted hover:bg-background'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${radioColor}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                                                </div>
                                                <input 
                                                    type="radio" 
                                                    name="orderStatus" 
                                                    className="hidden" 
                                                    checked={isSelected}
                                                    onChange={() => setSelectedStatus(status)}
                                                />
                                                <div className="flex flex-col">
                                                    <span className={`text-theme-body font-bold uppercase tracking-tight ${isSelected ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}>
                                                        {status} <span className="mx-1 text-muted opacity-40 font-normal">-</span> 
                                                        <span className="text-theme-caption font-medium lowercase tracking-normal text-muted group-hover:text-muted/80">{descriptions[status]}</span>
                                                    </span>
                                                </div>
                                                <span className={`ml-auto w-2 h-2 rounded-full ${statusColorClass.includes('bg-') ? statusColorClass.match(/bg-[\w-]+/)?.[0] : 'bg-muted'}`}></span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-6 bg-background border-t border-border flex gap-3">
                                <Button variant="danger" className="flex-1 font-bold" onClick={() => setStatusEditOrder(null)}>Discard</Button>
                                <Button variant="primary" className="flex-1 font-bold" onClick={() => handleUpdateStatus(statusEditOrder.id, selectedStatus)}>Confirm Change</Button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };
