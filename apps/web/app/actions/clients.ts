'use server';

import { createClient } from '../lib/supabase-server';
import { createAdminClient } from '../lib/supabase-admin';
import { Client, PortalFormData } from '../types';

export const getClients = async (): Promise<Client[]> => {
    const supabase = await createClient();
    
    // RBAC: Authenticated request via createClient (cookies)
    
    const { data, error } = await supabase.from('clients').select('*').order('first_name');
    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      username: c.username || '',
      phone: c.phone || '',
      email: c.email || '',
      totalOrders: c.total_orders,
      totalSpent: Number(c.total_spent),
      lastOrder: c.last_order,
      image: c.image,
      color: c.color,
      address: c.address
    }));
};

interface ClientRecord {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address?: string;
    username?: string;
    image?: string;
    color?: string;
}

export interface OrderRecord {
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
    return_status?: string;
    item_integrity?: string;
    discount_name?: string;
    discount_type?: string;
    discount_value?: number;
    order_items: {
        inventory_id: number;
        quantity: number;
        unit_price: number;
        returned_qty?: number;
        lost_qty?: number;
        damaged_qty?: number;
    }[];
}

export const createClientAction = async (clientData: Partial<Client>): Promise<{ success: boolean; data?: ClientRecord; error?: string }> => {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
        .from('clients')
        .insert([{
            first_name: clientData.firstName,
            last_name: clientData.lastName,
            phone: clientData.phone,
            email: clientData.email,
            address: clientData.address,
            username: clientData.username,
            color: clientData.color,
            image: clientData.image
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as ClientRecord };
};

export const getClientProfileAction = async (clientId: number): Promise<{ success: boolean; data?: ClientRecord; error?: string }> => {
    const supabase = createAdminClient();
    
    const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

    return { success: true, data: data as ClientRecord };
};

export const getClientOrdersAction = async (clientId: number): Promise<{ success: boolean; data?: OrderRecord[]; error?: string }> => {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, client_id, client_name, phone, email, status, start_date, end_date, total_amount, amount_paid, 
            penalty_amount, deposit_paid, closed_at, return_status, item_integrity, 
            discount_name, discount_type, discount_value,
            order_items (
                inventory_id,
                quantity,
                unit_price,
                returned_qty,
                lost_qty,
                damaged_qty
            )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching client orders:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: (data as unknown) as OrderRecord[] || [] };
};

export const updateClientProfileAction = async (identifier: { userId?: string, clientId?: number }, details: PortalFormData): Promise<{ success: boolean; error?: string }> => {
    const supabase = createAdminClient();
    
    let query = supabase.from('clients').update({
        first_name: details.firstName,
        last_name: details.lastName,
        username: details.username?.toLowerCase() || '',
        phone: details.phone,
        email: details.email,
        address: details.address,
        image: details.image,
        color: details.color
    });

    if (identifier.clientId) {
        query = query.eq('id', identifier.clientId);
    } else if (identifier.userId) {
        query = query.eq('user_id', identifier.userId);
    } else {
        return { success: false, error: "No client identifier provided" };
    }

    const { error } = await query;

    if (error) {
        console.error('Error updating client profile:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
};