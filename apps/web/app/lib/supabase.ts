import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Only throw if we are in a browser environment in production.
  // During build time (Node environment), we warn instead of throwing to allow static generation to proceed.
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: Supabase environment variables are not configured.');
  }
  console.warn('Supabase environment variables are not configured. Initialization might fail if used.');
}

export const supabase = createBrowserClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);