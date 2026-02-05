import { Order, PortalFormData, CartItem, InventoryItem } from '../types';
import { supabase } from '../lib/supabase';
import { calculateOrderTotal } from '../utils/helpers';
import { encodeOrderId, decodeOrderId, isPublicId, maybeHash } from '../utils/idHandler';
import { recordRedemption } from '../services/discountService';

export const createOrder = (
    details: PortalFormData, 
    cart: CartItem[], 
    inventory: InventoryItem[]
): Order => {
    const items = cart.map(i => {
        const invItem = inventory.find(inv => inv.id === i.id);
        return { price: invItem?.price || 0, qty: i.qty };
    });
    
    const tempId = Math.floor(Math.random() * 10000);

    return {
        id: tempId,
        publicId: encodeOrderId(tempId),
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
    modifyingOrderId?: number | null,
    discountCode?: string
) => {
    const items = cart.map(i => {
        const invItem = inventory.find(inv => inv.id === i.id);
        return { 
            inventory_id: i.id, 
            quantity: i.qty, 
            unit_price: invItem?.price || 0 
        };
    });
    
    // Calculate initial total without discount
    let totalAmount = calculateOrderTotal(items.map(i => ({ price: i.unit_price, qty: i.quantity })), details.start, details.end);
    let discountMetadata = {
        name: details.discountName || '',
        type: details.discountType || 'fixed' as 'fixed' | 'percentage',
        value: details.discountValue || 0
    };
    
    let appliedDiscountId: number | null = null;
    let actualDiscountAmount = 0;

    // 1. Existing Discount Logic (ONLY for calculation, NO redemption yet)
    if (discountCode) {
        const { data: discount, error: discountError } = await supabase
            .from('discounts')
            .select('id, name, code, discount_type, discount_value, duration_type, start_date, end_date, status, approval_strategy, created_at')
            .eq('code', discountCode)
            .single();

        if (!discountError && discount) {
            appliedDiscountId = discount.id;
            discountMetadata = {
                name: discount.name,
                type: discount.discount_type,
                value: Number(discount.discount_value)
            };

            let discountAppliedAmount = 0;
            if (discount.discount_type === 'fixed') {
                discountAppliedAmount = Number(discount.discount_value);
            } else {
                discountAppliedAmount = (totalAmount * Number(discount.discount_value)) / 100;
            }
            // Cap discount at total amount
            actualDiscountAmount = Math.min(totalAmount, discountAppliedAmount);
            totalAmount = Math.max(0, totalAmount - actualDiscountAmount);
        }
    } else if (details.discountValue) {
        // 2. Ad-hoc/Manual Discount Logic
        let discountAppliedAmount = 0;
        if (details.discountType === 'fixed') {
            discountAppliedAmount = details.discountValue;
        } else {
            discountAppliedAmount = (totalAmount * details.discountValue) / 100;
        }
         // Cap discount at total amount
        actualDiscountAmount = Math.min(totalAmount, discountAppliedAmount);
        totalAmount = Math.max(0, totalAmount - actualDiscountAmount);
    }

    // 3. Find Client ID
    let clientLookup = supabase.from('clients').select('id');
    
    if (details.email) {
        clientLookup = clientLookup.eq('email', details.email);
    } else {
        clientLookup = clientLookup
            .ilike('first_name', details.firstName.trim())
            .ilike('last_name', details.lastName.trim())
            .eq('phone', details.phone.trim());
    }

    const { data: client, error: clientError } = await clientLookup.maybeSingle();

    if (clientError || !client) {
        console.error("Client lookup failed:", clientError);
        throw new Error("Client record not found. Please ensure you are logged in correctly.");
    }

    // 4. Call the atomic RPC
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

    if (rpcError) {
        // Map custom database exceptions to user-friendly messages
        if (rpcError.message?.includes('Insufficient stock')) {
            throw new Error(rpcError.message.replace('functions: ', '')); // Remove Postgres prefix if present
        }
        console.error("RPC Error during order submission:", rpcError);
        throw new Error("Failed to place order. Please try again or contact support.");
    }

    // 5. Update Order with Discount Metadata for easy UI display
    if (discountMetadata.name || discountMetadata.value) {
         await supabase.from('orders').update({
             discount_name: discountMetadata.name,
             discount_type: discountMetadata.type,
             discount_value: discountMetadata.value
         }).eq('id', orderId);
         
         // 6. Record Redemption if a formal discount code was used
         if (appliedDiscountId) {
             await recordRedemption(orderId, appliedDiscountId, client.id, actualDiscountAmount);
         }
    }

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
        discountName?: string;
        discountType?: string;
        discountValue?: number;
        discountCode?: string;
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
        p_closed_at: data.closedAt || null,
        p_return_status: data.returnStatus,
        p_item_integrity: data.itemIntegrity,
        p_penalty_amount: data.penaltyAmount,
        p_amount_paid: data.amountPaid,
        p_total_amount: data.totalAmount,
        p_discount_name: data.discountName || '',
        p_discount_type: data.discountType || 'fixed',
        p_discount_value: data.discountValue || 0,
        p_discount_code: data.discountCode || '',
        p_items: data.items.map(i => ({
            inventory_id: i.inventoryId,
            returned_qty: i.returnedQty,
            lost_qty: i.lostQty,
            damaged_qty: i.damagedQty
        }))
    });

    if (error) throw error;
};

/**
 * Searches orders using a specialized RPC for ID or Client Name matching.
 */
export const searchOrders = async (
    searchTerm: string, 
    filters: Record<string, string | number | boolean> = {}, 
    limit: number = 200
): Promise<Order[]> => {
    
    let exactId: number | null = null;
    let textSearch = searchTerm;

    if (isPublicId(searchTerm)) {
        // Forced ID search (with prefix)
        exactId = decodeOrderId(searchTerm);
        textSearch = ''; 
    } else if (/^[0-9]+$/.test(searchTerm)) {
        // Numeric ID search
        exactId = parseInt(searchTerm);
        textSearch = '';
    } else if (maybeHash(searchTerm)) {
        // Potential hash (e.g. 5LEMPL). Try decoding but keep text search active.
        const decoded = decodeOrderId(searchTerm);
        if (decoded) exactId = decoded;
    }

    const { data, error } = await supabase.rpc('search_orders', {
        p_search_term: textSearch,
        p_exact_id: exactId,
        p_filters: filters,
        p_limit: limit
    });

    if (error) throw error;

    interface OrderRow {
        id: number;
        client_name: string;
        phone: string;
        email: string;
        status: string;
        start_date: string;
        end_date: string;
        total_amount: number;
        amount_paid: number;
        penalty_amount: number;
        deposit_paid: boolean;
        closed_at?: string;
        return_status?: string | null;
        item_integrity?: string | null;
        discount_name?: string | null;
        discount_type?: string | null;
        discount_value?: number | null;
        item_count?: number;
    }

    // Map database result to Order type
    return (data as OrderRow[] || []).map((o) => ({
        id: o.id,
        publicId: encodeOrderId(o.id),
        clientName: o.client_name,
        phone: o.phone,
        email: o.email,
        status: o.status,
        startDate: o.start_date,
        endDate: o.end_date,
        totalAmount: Number(o.total_amount),
        amountPaid: Number(o.amount_paid || 0),
        penaltyAmount: Number(o.penalty_amount || 0),
        depositPaid: o.deposit_paid,
        closedAt: o.closed_at,
        returnStatus: o.return_status,
        itemIntegrity: o.item_integrity,
        discountName: o.discount_name,
        discountType: o.discount_type,
        discountValue: Number(o.discount_value || 0),
        itemCount: Number(o.item_count || 0),
        // Note: RPC doesn't return full items for listing speed. 
        // Details are fetched when expanding or viewing invoice.
        items: [] 
    }));
};

export const getOrderDetails = async (orderId: number): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (
                inventory_id,
                quantity,
                unit_price,
                returned_qty,
                lost_qty,
                damaged_qty,
                inventory (
                    name,
                    category,
                    image,
                    color
                )
            )
        `)
        .eq('id', orderId)
        .single();

    if (error) {
        console.error("Error fetching order details:", error);
        return null;
    }

    return {
        id: data.id,
        publicId: encodeOrderId(data.id),
        clientName: data.client_name || data.client_id || '',
        phone: data.phone || '',
        email: data.email || '',
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        totalAmount: Number(data.total_amount),
        amountPaid: Number(data.amount_paid || 0),
        penaltyAmount: Number(data.penalty_amount || 0),
        depositPaid: data.deposit_paid,
        closedAt: data.closed_at,
        returnStatus: data.return_status,
        itemIntegrity: data.item_integrity,
        discountName: data.discount_name,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value || 0),
        itemCount: data.items.length,
        items: data.items.map((i: {
            inventory_id: number;
            quantity: number;
            unit_price: number;
            returned_qty?: number;
            lost_qty?: number;
            damaged_qty?: number;
            inventory?: unknown;
        }) => ({
            inventoryId: i.inventory_id,
            qty: i.quantity,
            price: i.unit_price,
            returnedQty: i.returned_qty,
            lostQty: i.lost_qty,
            damagedQty: i.damaged_qty,
            _fallback: i.inventory
        }))
    };
};

/**
 * Batch deletes orders and their items.
 */
export const deleteOrders = async (orderIds: number[]) => {
    if (orderIds.length === 0) return;

    // 1. Delete items first (FK constraint)
    const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);
    
    if (itemsError) throw itemsError;

    // 2. Delete orders
    const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);

    if (ordersError) throw ordersError;
};
