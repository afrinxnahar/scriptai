import { createSupabaseClient, createSupabaseServerClient, getSupabaseEnv, SupabaseClient } from '@repo/supabase';
import { cookies } from 'next/headers';


export const getSupabaseServer = async (): Promise<SupabaseClient> => {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createSupabaseServerClient(url, key, {
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch (error) {
        console.error('Failed to set cookies:', error);
      }
    },
  });
}