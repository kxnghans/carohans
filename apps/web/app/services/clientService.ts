import { supabase } from '../lib/supabase';
import { Client, PortalFormData } from '../types';

/**
 * Fetches all clients. RBAC is handled via Supabase RLS policies.
 */
export const fetchClientsFromSupabase = async (): Promise<Client[]> => {
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

/**
 * Updates a client's profile information.
 */
export const updateClientProfile = async (userId: string, details: PortalFormData) => {
  const { error } = await supabase
    .from('clients')
    .update({
        first_name: details.firstName,
        last_name: details.lastName,
        username: details.username.toLowerCase(),
        phone: details.phone,
        email: details.email,
        address: details.address,
        image: details.image,
        color: details.color
    })
    .eq('user_id', userId);
    
  if (error) throw error;
};
