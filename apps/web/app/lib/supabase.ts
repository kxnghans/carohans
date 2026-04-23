import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time (Node environment) or if variables are missing, 
// we use placeholders to prevent @supabase/ssr from throwing a validation error.
// This allows the build to complete for pages that don't strictly require Supabase data.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing. Using placeholders for build stability.');
}

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);