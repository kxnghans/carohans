"use client";

import { useState, Fragment } from 'react';
import { Icons } from '../../lib/icons';
import { getStatusColor, getStatusDescription, formatCurrency, formatDate, getDurationDays, calculateOrderTotal } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Order, InventoryItem } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { ScrollableContainer } from '../common/ScrollableContainer';
import { DiscountManager } from '../common/DiscountManager';
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
    const { ChevronRight, Printer, Undo, Truck, ReturnIcon, Pencil } = Icons;
    const { setModifyingOrderId, setCart, setPortalFormData, showNotification, setOrders, latePenaltyPerDay } = useAppStore();
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [statusEditOrder, setStatusEditOrder] = useState<Order | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    
    interface OrderItemRow {
        inventory_id: number;
        quantity: number;
        unit_price: number;
        returned_qty?: number;
        lost_qty?: number;
        damaged_qty?: number;
    }

    interface OrderQueryResult {
        order_items: OrderItemRow[];
    }

    // Local state for lazy-loaded items
    const [lazyOrderItems, setLazyOrderItems] = useState<Record<number, { 
        inventoryId: number; 
        qty: number; 
        price: number; 
        returnedQty?: number; 
        lostQty?: number; 
        damagedQty?: number; 
    }[]>>({});

    const router = useRouter();
    const statuses = ['Pending', 'Approved', 'Active', 'Late', 'Settlement', 'Completed', 'Rejected', 'Canceled'];

    const toggleExpand = async (orderId: number) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(orderId);
            
            const order = orders.find(o => o.id === orderId);
            if (order && order.items.length === 0 && (order.itemCount || 0) > 0 && !lazyOrderItems[orderId]) {
                try {
                    const { data, error } = await import('../../lib/supabase').then(m => m.supabase
                        .from('orders')
                        .select(`order_items (inventory_id, quantity, unit_price, returned_qty, lost_qty, damaged_qty)`)
                        .eq('id', orderId)
                        .single()
                    );
                    if (data && !error) {
                        const result = data as unknown as OrderQueryResult;
                        if (result.order_items) {
                            const mappedItems = result.order_items.map((oi) => ({
                                inventoryId: oi.inventory_id,
                                qty: oi.quantity,
                                price: Number(oi.unit_price),
                                returnedQty: oi.returned_qty,
                                lostQty: oi.lost_qty,
                                damagedQty: oi.damaged_qty
                            })) as { inventoryId: number; qty: number; price: number; returnedQty?: number; lostQty?: number; damagedQty?: number; }[];
                            setLazyOrderItems(prev => ({ ...prev, [orderId]: mappedItems }));
                        }
                    }
                } catch (e) { console.error("Failed to load order details", e); }
            }
        }
    };

    const handleApplySync = async (order: Order, form: { name: string, type: 'fixed' | 'percentage', value: number, code: string }) => {
        const items = (order.items.length > 0 ? order.items : (lazyOrderItems[order.id] || [])).map(i => ({ price: i.price, qty: i.qty }));
        const newTotal = calculateOrderTotal(items, order.startDate, order.endDate, form.type, form.value) + (order.penaltyAmount || 0);

        setOrders(prev => prev.map(o => o.id === order.id ? {
            ...o,
            discountName: form.name,
            discountType: form.type,
            discountValue: form.value,
            totalAmount: newTotal
        } : o));

        await applyDiscountToOrder(order.id, form, newTotal);
    };

    const handleClearDiscount = async (order: Order) => {
        const items = (order.items.length > 0 ? order.items : (lazyOrderItems[order.id] || [])).map(i => ({ price: i.price, qty: i.qty }));
        const newTotal = calculateOrderTotal(items, order.startDate, order.endDate) + (order.penaltyAmount || 0);
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, discountName: '', discountType: 'fixed', discountValue: 0, totalAmount: newTotal } : o));
        await applyDiscountToOrder(order.id, { name: '', type: 'fixed', value: 0 }, newTotal);
    };

    const handleUpdateStatus = (orderId: number, status: string) => {
        onUpdateStatus?.(orderId, status);
        setStatusEditOrder(null);
    };

    const handleViewInvoiceEnsureItems = async (order: Order) => {
        let itemsToUse: { 
            inventoryId: number; 
            qty: number; 
            price: number; 
            returnedQty?: number; 
            lostQty?: number; 
            damagedQty?: number; 
        }[] = order.items;

        if (itemsToUse.length === 0 && (order.itemCount || 0) > 0) {
            if (lazyOrderItems[order.id]) {
                itemsToUse = lazyOrderItems[order.id] || [];
            } else {
                try {
                    const { data, error } = await import('../../lib/supabase').then(m => m.supabase
                        .from('orders')
                        .select(`order_items (inventory_id, quantity, unit_price, returned_qty, lost_qty, damaged_qty)`)
                        .eq('id', order.id)
                        .single()
                    );
                    if (data && !error) {
                        const result = data as unknown as OrderQueryResult;
                        if (result.order_items) {
                            itemsToUse = result.order_items.map((oi) => ({
                                inventoryId: oi.inventory_id,
                                qty: oi.quantity,
                                price: Number(oi.unit_price),
                                returnedQty: oi.returned_qty,
                                lostQty: oi.lost_qty,
                                damagedQty: oi.damaged_qty
                            })) as { inventoryId: number; qty: number; price: number; returnedQty?: number; lostQty?: number; damagedQty?: number; }[];
                            setLazyOrderItems(prev => ({ ...prev, [order.id]: itemsToUse }));
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch items for invoice", e);
                }
            }
        }
        onViewInvoice({ ...order, items: itemsToUse || [] });
    };

    const handleModifyOrder = async (order: Order) => {
        setModifyingOrderId(order.id);
        
        let itemsToUse: { 
            inventoryId: number; 
            qty: number; 
            price: number; 
            returnedQty?: number; 
            lostQty?: number; 
            damagedQty?: number; 
        }[] = order.items;

        if (itemsToUse.length === 0 && (order.itemCount || 0) > 0) {
            if (lazyOrderItems[order.id]) { 
                itemsToUse = lazyOrderItems[order.id] || []; 
            } else {
                try {
                    const { data, error } = await import('../../lib/supabase').then(m => m.supabase
                        .from('orders').select(`order_items (inventory_id, quantity, unit_price)`).eq('id', order.id).single());
                    if (data && !error) {
                        const result = data as unknown as OrderQueryResult;
                        if (result.order_items) {
                            itemsToUse = result.order_items.map((oi) => ({ 
                                inventoryId: oi.inventory_id, 
                                qty: oi.quantity, 
                                price: Number(oi.unit_price) 
                            })) as { inventoryId: number; qty: number; price: number; returnedQty?: number; lostQty?: number; damagedQty?: number; }[];
                            setLazyOrderItems(prev => ({ ...prev, [order.id]: itemsToUse }));
                        }
                    }
                } catch (e) { console.error("Failed to fetch items", e); }
            }
        }

        const orderItems = (itemsToUse || []);
        setCart(orderItems.map(item => ({ id: item.inventoryId, qty: item.qty, price: item.price })));
        setPortalFormData({
            firstName: order.clientName.split(' ')[0] || '',
            lastName: order.clientName.split(' ').slice(1).join(' ') || '',
            phone: order.phone, 
            email: order.email, 
            start: order.startDate, 
            end: order.endDate,
            discountName: order.discountName || '',
            discountType: (order.discountType as 'fixed' | 'percentage') || 'fixed',
            discountValue: order.discountValue || 0,
            username: ''
        });

        router.push(isAdmin ? '/admin/inventory' : '/portal/inventory');
    };

    return (
        <>
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
                        {orders.map((order) => (
                            <Fragment key={order.id}>
                                <tr className="hover:bg-background/40 transition-colors group cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                    <td className="p-4 pl-6"><span className="text-theme-body-bold text-foreground">{order.publicId || `#${order.id}`}</span></td>
                                    <td className="p-4 text-center"><div className="flex flex-col items-center gap-1"><span title={getStatusDescription(order.status)} className={`text-theme-body px-3 py-1 rounded-full border-2 ${getStatusColor(order.status)} uppercase tracking-tighter shadow-sm inline-block min-w-[95px] cursor-help font-semibold`}>{order.status}</span></div></td>
                                    <td className="p-4 text-theme-body text-muted"><div className="hidden sm:block">{formatDate(order.startDate)} - {formatDate(order.closedAt || order.endDate)}</div><div className="sm:hidden flex flex-col items-start w-max"><span>{formatDate(order.startDate)}</span><span className="w-full text-center leading-none my-0.5">-</span><span>{formatDate(order.closedAt || order.endDate)}</span></div></td>
                                    {isAdmin && (
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-1.5">
                                                    {order.status === 'Pending' && (
                                                        <>
                                                            <button onClick={() => onUpdateStatus?.(order.id, 'Rejected')} className="px-3 py-1.5 bg-status-rejected text-primary-text rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5" title="Reject Order">
                                                                <Icons.X className="w-3.5 h-3.5" />
                                                                <span className="hidden sm:inline">Reject</span>
                                                            </button>
                                                            <button onClick={() => onUpdateStatus?.(order.id, 'Approved')} className="px-3 py-1.5 bg-status-approved text-primary-text rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5" title="Approve Order">
                                                                <Icons.Check className="w-3.5 h-3.5" />
                                                                <span className="hidden sm:inline">Approve</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    {order.status === 'Approved' && (
                                                        <div className="flex gap-1.5">
                                                            <button onClick={() => onUpdateStatus?.(order.id, 'Pending')} className="px-3 py-1.5 bg-status-pending text-primary-text rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5" title="Move back to Pending">
                                                                <Undo className="w-3.5 h-3.5" />
                                                                <span className="hidden sm:inline">Pull Back</span>
                                                            </button>
                                                            <button onClick={() => onUpdateStatus?.(order.id, 'Active')} className="px-3 py-1.5 bg-status-active text-primary-text rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5" title="Dispatch Pickup">
                                                                <Truck className="w-3.5 h-3.5" />
                                                                <span className="hidden sm:inline">Dispatch</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {(order.status === 'Active' || order.status === 'Late' || order.status === 'Settlement') && (
                                                        <button onClick={() => onUpdateStatus?.(order.id, 'Completed')} className="px-3 py-1.5 bg-status-completed text-primary-text rounded-xl text-theme-body font-semibold uppercase tracking-tight hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5" title="Complete Return">
                                                            <ReturnIcon className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">Return</span>
                                                        </button>
                                                    )}
                                                    {['Completed', 'Rejected', 'Canceled'].includes(order.status) && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-theme-caption font-bold text-muted uppercase italic px-3 py-1 bg-background border border-border rounded-lg shadow-sm">
                                                                Closed
                                                            </span>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setStatusEditOrder(order); setSelectedStatus(order.status); }}
                                                                className="p-1.5 hover:bg-primary/10 text-muted hover:text-primary rounded-lg transition-all active:scale-90 border border-transparent hover:border-primary/20"
                                                                title="Update Status"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => handleViewInvoiceEnsureItems(order)}
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl bg-surface hover:bg-background text-muted text-theme-body transition-all shadow-sm group-hover:border-slate-300 mx-auto"
                                            title="View Invoice"
                                        >
                                            <Printer className="w-4 h-4" /> Invoice
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-theme-title text-foreground">{formatCurrency(order.totalAmount)}</span>
                                            <span className="text-theme-caption text-muted">{order.items.length || order.itemCount || 0} items</span>
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className={`transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-90' : ''}`}>
                                            <ChevronRight className={`w-5 h-5 ${expandedOrderId === order.id ? 'text-secondary dark:text-warning' : 'text-muted'}`} />
                                        </div>
                                    </td>
                                </tr>
                                {expandedOrderId === order.id && (
                                    <tr className="bg-background/20">
                                        <td colSpan={isAdmin ? 7 : 6} className="p-0">
                                            <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                                                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                                                    <ScrollableContainer>
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
                                                                {(order.items.length > 0 ? order.items : (lazyOrderItems[order.id] || [])).map((item, idx) => {
                                                                    const invItem = inventory.find(i => i.id === item.inventoryId);
                                                                    const price = (item.price ?? invItem?.price) || 0;
                                                                    const actualDuration = getDurationDays(order.startDate, order.closedAt || order.endDate);
                                                                    const lineSubtotal = price * item.qty * actualDuration;
                                                                    return (
                                                                        <tr key={idx} className="hover:bg-background/50 transition-colors">
                                                                            <td className="p-3 pl-6">
                                                                                <div className="flex items-center gap-3">
                                                                                    <DynamicIcon iconString={invItem?.image} color={invItem?.color} className="w-5 h-5" fallback={<span>📦</span>} />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-theme-body-bold text-foreground">{invItem?.name || `Item #${item.inventoryId}`}</span>
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
                                                                
                                                                {/* PENALTY SECTION */}
                                                                {(order.penaltyAmount ?? 0) > 0 && (
                                                                    <tr className="bg-error/5 dark:bg-rose-900/10 border-t border-border">
                                                                        <td colSpan={7} className="p-0">
                                                                            <div className="p-6 flex flex-col gap-4">
                                                                                <div className="flex justify-between items-center border-b border-error/10 pb-2">
                                                                                    <span className="text-theme-caption font-black text-error dark:text-rose-400 uppercase tracking-widest">Penalty Breakdown</span>
                                                                                    <span className="text-theme-body-bold text-error dark:text-rose-400">+{formatCurrency(order.penaltyAmount)}</span>
                                                                                </div>
                                                                                
                                                                                {(() => {
                                                                                    const activeItems = (order.items.length > 0 ? order.items : (lazyOrderItems[order.id] || []));
                                                                                    let assetPenalty = 0;
                                                                                    // Capture full inventory item for rendering icon
                                                                                    const brokenItems: { invItem: InventoryItem | undefined; type: string; qty: number; cost: number }[] = [];

                                                                                    activeItems.forEach(item => {
                                                                                        const invItem = inventory.find(i => i.id === item.inventoryId);
                                                                                        const replacementCost = invItem?.replacementCost || 0;
                                                                                        if ((item.lostQty || 0) > 0) {
                                                                                            const cost = (item.lostQty || 0) * replacementCost;
                                                                                            assetPenalty += cost;
                                                                                            brokenItems.push({ invItem, type: 'Lost', qty: item.lostQty || 0, cost });
                                                                                        }
                                                                                        if ((item.damagedQty || 0) > 0) {
                                                                                            const cost = (item.damagedQty || 0) * replacementCost;
                                                                                            assetPenalty += cost;
                                                                                            brokenItems.push({ invItem, type: 'Damaged', qty: item.damagedQty || 0, cost });
                                                                                        }
                                                                                    });

                                                                                    const lateFee = Math.max(0, (order.penaltyAmount || 0) - assetPenalty);
                                                                                    
                                                                                    // Calculate days late
                                                                                    const actualReturn = order.closedAt ? new Date(order.closedAt) : new Date();
                                                                                    const plannedReturn = new Date(order.endDate);
                                                                                    // Set to midnight for fair day comparison
                                                                                    actualReturn.setHours(0,0,0,0);
                                                                                    plannedReturn.setHours(0,0,0,0);
                                                                                    const diffTime = actualReturn.getTime() - plannedReturn.getTime();
                                                                                    const daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            {lateFee > 0 && (
                                                                                                <div className="flex justify-between items-center text-sm bg-error/5 p-3 rounded-xl border border-error/10">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="text-theme-body font-bold text-muted">Late Fees</span>
                                                                                                        <span className="text-xs px-2 py-0.5 rounded-md bg-error/10 text-error font-black uppercase tracking-wide">
                                                                                                            {daysLate} {daysLate === 1 ? 'day' : 'days'} overdue
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <span className="text-theme-body font-bold text-error dark:text-rose-400">+{formatCurrency(lateFee)}</span>
                                                                                                </div>
                                                                                            )}

                                                                                            {brokenItems.length > 0 && (
                                                                                                <div className="space-y-2">
                                                                                                    <div className="flex justify-between items-center text-sm px-1">
                                                                                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Asset Integrity Details</span>
                                                                                                        <span className="text-theme-body font-bold text-error dark:text-rose-400">+{formatCurrency(assetPenalty)}</span>
                                                                                                    </div>
                                                                                                    
                                                                                                    <div className="border border-error/10 rounded-xl overflow-hidden">
                                                                                                        <table className="w-full text-left text-sm">
                                                                                                            <thead>
                                                                                                                <tr className="bg-error/5 text-muted text-[10px] uppercase tracking-wider border-b border-error/10">
                                                                                                                    <th className="py-2 px-4 font-bold">Item</th>
                                                                                                                    <th className="py-2 px-4 font-bold">Status</th>
                                                                                                                    <th className="py-2 px-4 text-right font-bold">Qty</th>
                                                                                                                    <th className="py-2 px-4 text-right font-bold">Unit Cost</th>
                                                                                                                    <th className="py-2 px-4 text-right font-bold">Line Total</th>
                                                                                                                </tr>
                                                                                                            </thead>
                                                                                                            <tbody className="divide-y divide-error/5 bg-background/50">
                                                                                                                {brokenItems.map((row, i) => (
                                                                                                                    <tr key={i} className="hover:bg-error/5 transition-colors">
                                                                                                                        <td className="py-2 px-4">
                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                                <DynamicIcon iconString={row.invItem?.image} color={row.invItem?.color} className="w-4 h-4" fallback={<span>📦</span>} />
                                                                                                                                <span className="text-theme-body font-medium">{row.invItem?.name || 'Unknown Item'}</span>
                                                                                                                            </div>
                                                                                                                        </td>
                                                                                                                        <td className="py-2 px-4">
                                                                                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${row.type === 'Lost' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                                                                                                                                {row.type}
                                                                                                                            </span>
                                                                                                                        </td>
                                                                                                                        <td className="py-2 px-4 text-right font-bold text-theme-body">{row.qty}</td>
                                                                                                                        <td className="py-2 px-4 text-right text-muted text-theme-body">{formatCurrency(row.invItem?.replacementCost)}</td>
                                                                                                                        <td className="py-2 px-4 text-right font-bold text-error text-theme-body">+{formatCurrency(row.cost)}</td>
                                                                                                                    </tr>
                                                                                                                ))}
                                                                                                            </tbody>
                                                                                                        </table>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}

                                                                {/* DISCOUNT SECTION */}
                                                                <tr className="border-t border-border">
                                                                    <td colSpan={7} className="p-0">
                                                                        <DiscountManager 
                                                                            subtotal={calculateOrderTotal((order.items.length > 0 ? order.items : (lazyOrderItems[order.id] || [])).map(i => ({ price: i.price, qty: i.qty })), order.startDate, order.endDate)} 
                                                                            onApply={(form) => handleApplySync(order, form)} 
                                                                            onClear={() => handleClearDiscount(order)} 
                                                                            variant="compact" 
                                                                            initialDiscount={{ name: order.discountName || '', type: order.discountType as 'fixed' | 'percentage' || 'fixed', value: order.discountValue || 0, code: '' }} 
                                                                            isConfirmedInitial={!!order.discountName}
                                                                            showNotification={showNotification} 
                                                                        />
                                                                    </td>
                                                                </tr>

                                                                {/* GRAND TOTAL ROW */}
                                                                <tr className="bg-background/50 border-t border-border">
                                                                    <td colSpan={6} className="p-4 pl-6 text-right text-theme-body-bold text-foreground uppercase tracking-tighter">
                                                                        Grand Total
                                                                    </td>
                                                                    <td className="p-4 text-right pr-6 text-theme-title text-foreground font-black">
                                                                        {formatCurrency(order.totalAmount)}
                                                                    </td>
                                                                </tr>

                                                                {/* SUMMARY FOOTER ROW */}
                                                                <tr className="bg-primary/5 dark:bg-white/5 border-t border-border">
                                                                    <td colSpan={7} className="p-6">
                                                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                                                            {/* DATES WRAPPER (Left) */}
                                                                            <div className="flex flex-wrap gap-8 text-[10px] uppercase font-bold text-muted tracking-widest">
                                                                                <div className="flex flex-col">
                                                                                    <span>Pickup Date</span>
                                                                                    <span className="text-theme-body text-foreground font-semibold">{formatDate(order.startDate)}</span>
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span>Planned Return</span>
                                                                                    <span className="text-theme-body text-foreground font-semibold">{formatDate(order.endDate)}</span>
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span>Actual Return</span>
                                                                                    <span className="text-theme-body text-foreground font-semibold">{order.closedAt ? formatDate(order.closedAt) : '—'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span>Order Variance</span>
                                                                                    {(() => {
                                                                                        if (!order.closedAt) return <span className="text-theme-body text-muted font-semibold italic">In Progress</span>;
                                                                                        const actual = new Date(order.closedAt).setHours(0,0,0,0);
                                                                                        const planned = new Date(order.endDate).setHours(0,0,0,0);
                                                                                        const diffDays = Math.round((actual - planned) / (1000 * 60 * 60 * 24));
                                                                                        if (diffDays < 0) return <span className="text-theme-body text-secondary font-semibold">{Math.abs(diffDays)} Days Early</span>;
                                                                                        if (diffDays > 0) return <span className="text-theme-body text-error font-semibold">{diffDays} Days Late</span>;
                                                                                        return <span className="text-theme-body text-status-completed font-semibold">On Time</span>;
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <Button 
                                                                                onClick={() => handleModifyOrder(order)} 
                                                                                variant="primary" 
                                                                                size="sm" 
                                                                                className="font-bold px-8 shadow-md hover:scale-105 transition-all w-full sm:w-auto"
                                                                            >
                                                                                <Pencil className="w-4 h-4 mr-2" /> Modify Order
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </ScrollableContainer>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </ScrollableContainer>
        </Card>

        {statusEditOrder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setStatusEditOrder(null)}>
                <div className="bg-surface rounded-3xl shadow-2xl w-[95%] max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border" onClick={e => e.stopPropagation()}>
                    <div className="p-6 bg-primary dark:bg-primary-text text-primary-text dark:text-primary flex justify-between items-center border-b border-white/10">
                        <div className="flex items-center gap-3"><div className="bg-white/10 p-2 rounded-lg"><Pencil className="w-5 h-5" /></div><div><h2 className="text-xl font-bold tracking-tight">Order Status</h2><p className="opacity-70 text-sm font-medium">Order #{statusEditOrder.id} • {statusEditOrder.clientName}</p></div></div>
                        <button onClick={() => setStatusEditOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-theme-body text-muted mb-4 font-medium">Select the new status for this order. This change will be applied immediately.</p>
                        <div className="grid grid-cols-1 gap-2">
                            {statuses.map(status => {
                                const descriptions: Record<string, string> = { 'Pending': 'awaiting approval', 'Approved': 'items reserved', 'Active': 'out with client', 'Late': 'overdue for return', 'Settlement': 'awaiting final audit', 'Completed': 'returned and paid', 'Rejected': 'declined by admin', 'Canceled': 'withdrawn by client' };
                                const statusColorClass = getStatusColor(status); const isSelected = selectedStatus === status;
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
                                return (<label key={status} className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer group ${isSelected ? `bg-surface border-current ${radioColor.split(' ')[0]}` : 'border-border hover:border-muted hover:bg-background'}`}><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${radioColor}`}>{isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}</div><input type="radio" name="orderStatus" className="hidden" checked={isSelected} onChange={() => setSelectedStatus(status)} /><div className="flex flex-col"><span className={`text-theme-body font-bold uppercase tracking-tight ${isSelected ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}>{status} <span className="mx-1 text-muted opacity-40 font-normal">-</span> <span className="text-theme-caption font-medium lowercase tracking-normal text-muted group-hover:text-muted/80">{descriptions[status]}</span></span></div><span className={`ml-auto w-2 h-2 rounded-full ${statusColorClass.includes('bg-') ? statusColorClass.match(/bg-[\w-]+/)?.[0] : 'bg-muted'}`}></span></label>);
                            })}
                        </div>
                    </div>
                    <div className="p-6 bg-background border-t border-border flex gap-3"><Button variant="danger" className="flex-1 font-bold" onClick={() => setStatusEditOrder(null)}>Discard</Button><Button variant="primary" className="flex-1 font-bold" onClick={() => handleUpdateStatus(statusEditOrder.id, selectedStatus)}>Confirm Change</Button></div>
                </div>
            </div>
        )}
        </>
    );
};