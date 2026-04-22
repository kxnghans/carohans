import { supabase } from '../lib/supabase';

export interface Blackout {
    id: number;
    start_date: string;
    end_date: string;
    reason: string | null;
    created_at: string;
}

/**
 * Fetches all global blackout dates.
 */
export const fetchBlackoutsFromSupabase = async (): Promise<Blackout[]> => {
  const { data, error } = await supabase
    .from('blackouts')
    .select('*')
    .order('start_date', { ascending: true });
    
  if (error) throw error;
  return data || [];
};

/**
 * Adds a new blackout range.
 */
export const addBlackoutToSupabase = async (start: string, end: string, reason: string | null = null) => {
  const { data, error } = await supabase
    .from('blackouts')
    .insert([{ start_date: start, end_date: end, reason }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Deletes a blackout range.
 */
export const deleteBlackoutFromSupabase = async (id: number) => {
  const { error } = await supabase
    .from('blackouts')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};
