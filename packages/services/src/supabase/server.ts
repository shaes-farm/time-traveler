import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { Database } from "./types.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
  );
}

export type SupabaseCookies = CookieMethodsServer;

export function createClient(cookies: SupabaseCookies) {
  return createServerClient<Database>(url!, anonKey!, { cookies });
}
