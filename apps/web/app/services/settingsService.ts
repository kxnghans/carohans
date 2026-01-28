import { supabase } from '../lib/supabase';
import { BusinessSettings } from '../context/AppContext';

/**
 * Fetches global business settings (name, contact info, etc.) from the settings table.
 */
export const fetchSettingsFromSupabase = async (): Promise<Partial<BusinessSettings>> => {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) throw error;

  const settings: any = {};
  data?.forEach((s: any) => settings[s.key] = s.value);
  return settings;
};

/**
 * Upserts multiple settings keys at once.
 */
export const updateSettingsInSupabase = async (settings: BusinessSettings) => {
  const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from('settings').upsert(updates);
  if (error) throw error;
};
