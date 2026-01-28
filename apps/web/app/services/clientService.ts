import { supabase } from '../lib/supabase';
import { Client, PortalFormData } from '../types';

/**
 * Fetches all clients. RBAC is handled via Supabase RLS policies.
 */
export const fetchClientsFromSupabase = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from('clients').select('*').order('name');
  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    firstName: c.first_name || c.name?.split(' ')[0] || '',
    lastName: c.last_name || c.name?.split(' ').slice(1).join(' ') || '',
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
  const fullName = `${details.firstName} ${details.lastName}`.trim();
  const { error } = await supabase
    .from('clients')
    .update({
        name: fullName,
        first_name: details.firstName,
        last_name: details.lastName,
        username: details.username,
        phone: details.phone,
        email: details.email,
        address: details.address,
        image: details.image,
        color: details.color
    })
    .eq('user_id', userId);
    
  if (error) throw error;
};
