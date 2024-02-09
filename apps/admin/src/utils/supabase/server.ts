import getConfig from 'next/config';
import type { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from 'service';
import type { NextConfig } from '../../types';

const {
  serverRuntimeConfig: {
    api: {
      baseUrl: apiBaseUrl,
      key: apiKey,
    }
  }
} = getConfig() as NextConfig;

export function createClient(cookieStore: ReturnType<typeof cookies>): SupabaseClient<Database> {
  return createServerClient(
    apiBaseUrl,
    apiKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}