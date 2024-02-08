import { createServerClient } from '@supabase/ssr'
import type { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from 'service';

export function createClient(url: string, key: string, cookieStore: ReturnType<typeof cookies>): SupabaseClient<Database> {
  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
