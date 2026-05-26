import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Cookie adapter contract. The caller (Server Component, Route Handler,
 * Server Action, or proxy) provides read + write hooks; the auth core
 * stays unaware of `next/headers` or `NextResponse`.
 *
 * `getAll()` returns the request's cookies.
 * `setAll(cookies)` writes refreshed-session cookies back. Some
 * environments (Server Components in Next 16) can't write — passing a
 * no-op `setAll` is supported; the proxy refreshes on the next request.
 */
export interface CookieAdapter {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: { name: string; value: string; options?: CookieOptions }[],
  ) => void;
}

export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
}

/**
 * Build a Supabase client bound to the supplied cookie adapter. The
 * client reads + refreshes session cookies through the adapter, which
 * lets the same code run in Server Components, Server Actions, Route
 * Handlers, and the edge proxy — each providing its own adapter shape.
 */
export const createServerSupabaseClient = (
  cookies: CookieAdapter,
): SupabaseClient =>
  createSsrServerClient(getSupabaseUrl(), getSupabaseAnonKey(), { cookies });
