import { Order, PortalFormData, CartItem, InventoryItem } from '../types';
import { supabase } from '../lib/supabase';
import { calculateOrderTotal } from '../utils/helpers';

export const createOrder = (
    details: PortalFormData, 
    cart: CartItem[], 
    inventory: InventoryItem[]
): Order => {
    const items = cart.map(i => {
        const invItem = inventory.find(inv => inv.id === i.id);
        return { price: invItem?.price || 0, qty: i.qty };
    });
    
    return {
        id: Math.floor(Math.random() * 10000),
        clientName: `${details.firstName} ${details.lastName}`.trim(),
        phone: details.phone,
        email: details.email || 'no-email@provided.com',
        status: 'Pending',
        items: cart.map(i => ({ itemId: i.id, qty: i.qty, price: i.price })),
        startDate: details.start,
        endDate: details.end,
        totalAmount: calculateOrderTotal(items, details.start, details.end),
        amountPaid: 0,
        penaltyAmount: 0,
        depositPaid: false
    };
};

export const submitOrderToSupabase = async (
    details: PortalFormData,
    cart: CartItem[],
    inventory: InventoryItem[],
    modifyingOrderId?: number | null
) => {
    const items = cart.map(i => {
        const invItem = inventory.find(inv => inv.id === i.id);
        return { price: invItem?.price || 0, qty: i.qty };
    });
    
    const totalAmount = calculateOrderTotal(items, details.start, details.end);

    if (modifyingOrderId) {
        // 1. Update order record
        const { error: orderError } = await supabase
            .from('orders')
            .update({
                start_date: details.start,
                end_date: details.end,
                total_amount: totalAmount,
            })
            .eq('id', modifyingOrderId);
        
        if (orderError) throw orderError;

        // 2. Delete old items and insert new ones
        await supabase.from('order_items').delete().eq('order_id', modifyingOrderId);

        const orderItems = cart.map(item => ({
            order_id: modifyingOrderId,
            inventory_id: item.id,
            quantity: item.qty,
            unit_price: item.price
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        return { id: modifyingOrderId };
    }

    // 1. Find Client ID by Email (assume auth user email matches or form data matches)
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', details.email)
        .single();

    if (clientError) throw new Error("Client not found. Please contact support.");

    // 2. Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            client_id: client.id,
            client_name: `${details.firstName} ${details.lastName}`.trim(),
            phone: details.phone,
            email: details.email,
            status: 'Pending',
            start_date: details.start,
            end_date: details.end,
            total_amount: totalAmount,
            deposit_paid: false
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // 2. Create order items
    const orderItems = cart.map(item => {
        const invItem = inventory.find(i => i.id === item.id);
        return {
            order_id: order.id,
            inventory_id: item.id,
            quantity: item.qty,
            unit_price: invItem?.price || 0
        };
    });

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
};

export const updateOrderDates = async (
    orderId: number, 
    data: { 
        start_date?: string; 
        end_date?: string; 
        closed_at?: string | null;
        total_amount?: number;
        penalty_amount?: number;
    }
) => {
    const { error } = await supabase
        .from('orders')
        .update(data)
        .eq('id', orderId);

    if (error) throw error;
};

export const updateOrderStatusToSupabase = async (
    orderId: number, 
    status: string, 
    closed_at?: string | null, 
    return_status?: string | null
) => {
    const updateData: { status: string; closed_at?: string | null; return_status?: string | null } = { status };
    if (closed_at !== undefined) updateData.closed_at = closed_at;
    if (return_status !== undefined) updateData.return_status = return_status;

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

    if (error) throw error;
};

export const processOrderReturn = async (
    orderId: number,
    data: {
        status: string;
        closedAt?: string;
        returnStatus: string;
        itemIntegrity: string;
        penaltyAmount: number;
        amountPaid: number;
        totalAmount: number;
        items: {
            itemId: number;
            returnedQty: number;
            lostQty: number;
            damagedQty: number;
        }[];
    }
) => {
    // 1. Update the order record
    const { error: orderError } = await supabase
        .from('orders')
        .update({
            status: data.status,
            closed_at: data.closedAt,
            return_status: data.returnStatus,
            item_integrity: data.itemIntegrity,
            penalty_amount: data.penaltyAmount,
            amount_paid: data.amountPaid,
            total_amount: data.totalAmount
        })
        .eq('id', orderId);

    if (orderError) throw orderError;

    // 2. Update order items and inventory stock
    for (const item of data.items) {
        // Update item-level return data
        const { error: itemError } = await supabase
            .from('order_items')
            .update({
                returned_qty: item.returnedQty,
                lost_qty: item.lostQty,
                damaged_qty: item.damagedQty
            })
            .eq('order_id', orderId)
            .eq('inventory_id', item.itemId);

        if (itemError) throw itemError;

        // If items are lost, reduce permanent inventory stock
        if (item.lostQty > 0) {
            const { data: invItem } = await supabase
                .from('inventory')
                .select('stock')
                .eq('id', item.itemId)
                .single();
            
            if (invItem) {
                await supabase
                    .from('inventory')
                    .update({ stock: Math.max(0, invItem.stock - item.lostQty) })
                    .eq('id', item.itemId);
            }
        }
    }
};
