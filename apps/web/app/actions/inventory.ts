'use server';

import { unstable_cache, revalidateTag } from 'next/cache';
import { createStaticClient, createClient } from '../lib/supabase-server';
import { InventoryItem } from '../types';

export const getInventoryCached = unstable_cache(
  async (): Promise<InventoryItem[]> => {
    const supabase = createStaticClient();
    
    const { data, error } = await supabase.from('inventory').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      stock: item.stock,
      availableStock: item.stock, // Default to total for cached catalog
      price: item.price,
      replacementCost: item.replacement_cost,
      maintenance: item.maintenance,
      image: item.image,
      color: item.color,
      sortOrder: item.sort_order
    }));
  },
  ['inventory'],
  { tags: ['inventory'], revalidate: false }
);

export async function saveInventoryItem(item: InventoryItem) {
    const supabase = await createClient();
    
    const dbItem = {
        name: item.name,
        category: item.category,
        stock: item.stock,
        price: item.price,
        replacement_cost: item.replacementCost,
        maintenance: item.maintenance,
        image: item.image,
        color: item.color,
        sort_order: item.sortOrder
    };

    const { error } = await supabase
        .from('inventory')
        .upsert({ id: item.id, ...dbItem })
        .eq('id', item.id);

    if (error) throw error;
    revalidateTag('inventory', 'page');
}

export async function deleteInventoryItem(id: number) {
    const supabase = await createClient();
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw error;
    revalidateTag('inventory', 'page');
}

export async function bulkSaveInventory(items: InventoryItem[]) {
    const supabase = await createClient();
    
    const dbItems = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        stock: item.stock,
        price: item.price,
        replacement_cost: item.replacementCost,
        maintenance: item.maintenance,
        image: item.image,
        color: item.color,
        sort_order: item.sortOrder
    }));

    const { error } = await supabase.from('inventory').upsert(dbItems);
    if (error) throw error;
    revalidateTag('inventory', 'page');
}