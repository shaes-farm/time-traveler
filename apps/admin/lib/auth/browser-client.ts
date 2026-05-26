"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Memoised browser Supabase client. The Supabase SDK keeps a single
 * GoTrue instance per page; calling `createBrowserClient` twice yields
 * two competing auth listeners, which causes flaky session state in
 * dev. Cache the instance per module evaluation.
 */
let cached: SupabaseClient | null = null;

export const getBrowserSupabaseClient = (): SupabaseClient => {
  if (cached) return cached;
  cached = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  return cached;
};
