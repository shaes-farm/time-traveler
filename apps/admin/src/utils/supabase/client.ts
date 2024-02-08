import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from 'service';

export function createClient(url: string, key: string): SupabaseClient<Database> {
  return createBrowserClient(url, key);
}
