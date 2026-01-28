import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing. Authentication and data fetching will fail.');
}

// Fallback to avoid "Cannot read properties of null" crashes. 
// Functional calls will still fail, but the app won't white-screen immediately on load.
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);