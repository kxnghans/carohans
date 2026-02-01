'use server';

import { createClient } from '../lib/supabase-server';
import { Client } from '../types';

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