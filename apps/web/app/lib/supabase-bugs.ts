import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_BUG_REPORTS_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_BUG_REPORTS_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // We don't throw here to avoid crashing the whole app if bug reporting is misconfigured,
  // but we should log it in development.
  if (process.env.NODE_ENV === 'development') {
    console.warn('Missing Bug Reports Supabase Environment Variables');
  }
}

/**
 * Public Supabase client for the bug reporting project.
 */
export const supabaseBugs = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
