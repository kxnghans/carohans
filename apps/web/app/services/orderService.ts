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
        items: cart.map(i => ({ inventoryId: i.id, qty: i.qty, price: i.price })),
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
        return { 
            inventory_id: i.id, 
            quantity: i.qty, 
            unit_price: invItem?.price || 0 
        };
    });
    
    const totalAmount = calculateOrderTotal(items.map(i => ({ price: i.unit_price, qty: i.quantity })), details.start, details.end);

    // 1. Find Client ID by Email if not provided (assume details.email is consistent)
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', details.email)
        .single();

    if (clientError) throw new Error("Client not found. Please contact support.");

    // 2. Call the atomic RPC
    const { data: orderId, error: rpcError } = await supabase.rpc('submit_order', {
        p_client_id: client.id,
        p_client_name: `${details.firstName} ${details.lastName}`.trim(),
        p_phone: details.phone,
        p_email: details.email,
        p_start_date: details.start,
        p_end_date: details.end,
        p_total_amount: totalAmount,
        p_items: items,
        p_order_id: modifyingOrderId || null
    });

    if (rpcError) throw rpcError;

    return { id: orderId };
};

/**
 * Applies a discount to an existing order.
 */
export const applyDiscountToOrder = async (
    orderId: number,
    discount: {
        name: string;
        type: 'fixed' | 'percentage';
        value: number;
    },
    newTotal: number
) => {
    const { error } = await supabase
        .from('orders')
        .update({
            discount_name: discount.name,
            discount_type: discount.type,
            discount_value: discount.value,
            total_amount: newTotal
        })
        .eq('id', orderId);

    if (error) throw error;
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
            inventoryId: number;
            returnedQty: number;
            lostQty: number;
            damagedQty: number;
        }[];
    }
) => {
    const { error } = await supabase.rpc('process_order_return', {
        p_order_id: orderId,
        p_status: data.status,
        p_closed_at: data.closedAt ? new Date(data.closedAt).toISOString() : null,
        p_return_status: data.returnStatus,
        p_item_integrity: data.itemIntegrity,
        p_penalty_amount: data.penaltyAmount,
        p_amount_paid: data.amountPaid,
        p_total_amount: data.totalAmount,
        p_items: data.items.map(i => ({
            inventory_id: i.inventoryId,
            returned_qty: i.returnedQty,
            lost_qty: i.lostQty,
            damaged_qty: i.damagedQty
        }))
    });

    if (error) throw error;
};
