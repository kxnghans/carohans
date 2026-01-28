import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types';

/**
 * Fetches the entire inventory catalog from Supabase.
 * Maps database snake_case fields to application camelCase fields.
 */
export const fetchInventoryFromSupabase = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase.from('inventory').select('*').order('name');
  if (error) throw error;
  
  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    price: item.price,
    replacementCost: item.replacement_cost,
    maintenance: item.maintenance,
    image: item.image,
    color: item.color
  }));
};
