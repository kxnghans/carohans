import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types';

/**
 * Fetches the entire inventory catalog from Supabase.
 * Maps database snake_case fields to application camelCase fields.
 */
export const fetchInventoryFromSupabase = async (
  startDate?: string, 
  endDate?: string
): Promise<InventoryItem[]> => {
  // Determine date range: Use provided dates OR default to Today
  let checkStart = startDate;
  let checkEnd = endDate;

  if (!checkStart || !checkEnd) {
      const today = new Date().toISOString().split('T')[0];
      checkStart = today;
      checkEnd = today;
  }

  // 1. Get Availability from RPC
  const { data: availabilityData, error: rpcError } = await supabase.rpc('get_available_stock', {
      check_start: checkStart,
      check_end: checkEnd
  });
  
  if (rpcError) {
      console.error("Error fetching stock availability:", rpcError);
      throw rpcError;
  }

  // 2. Fetch Base Inventory
  const { data: baseInventory, error: baseError } = await supabase
      .from('inventory')
      .select('id, name, category, stock, price, replacement_cost, maintenance, image, color, sort_order')
      .order('sort_order', { ascending: true });

  if (baseError) throw baseError;

  // 3. Merge Data
  interface AvailabilityRow {
      item_id: number;
      available_stock: number;
  }
  const availabilityMap = new Map((availabilityData as AvailabilityRow[] || []).map((i) => [i.item_id, i.available_stock]));

  return (baseInventory || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      stock: item.stock, // Total Fleet Count
      // Use mapped availability, fallback to total stock if logic misses (safe default)
      availableStock: availabilityMap.has(item.id) ? availabilityMap.get(item.id) : item.stock, 
      price: item.price,
      replacementCost: item.replacement_cost,
      maintenance: item.maintenance,
      image: item.image,
      color: item.color,
      sortOrder: item.sort_order
  }));
};
