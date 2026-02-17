import { createBrowserClient } from '@supabase/ssr'

/**
 * 
 * @todo remove supabase dependency and import from packages/supabase
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}