import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CookieOptions, createServerClient } from '@supabase/ssr';

// Generic client for backend (no cookies, handled by JWT token)
export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string): SupabaseClient => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
};

// SSR client for frontend (with cookies)
export const createSupabaseServerClient = (
  supabaseUrl: string,
  supabaseKey: string,
  cookies: {
    getAll: () => Array<{ name: string; value: string; options?: CookieOptions }>;
    setAll: (cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) => void;
  }
) => {
  return createServerClient(supabaseUrl, supabaseKey, { cookies });
};

// Shared env vars
export const getSupabaseEnv = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
});
export const getSupabaseServiceEnv = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  key: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
});

export type { SupabaseClient };