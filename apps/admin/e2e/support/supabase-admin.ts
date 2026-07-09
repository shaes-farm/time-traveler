import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * A service-role Supabase client for e2e seeding. It bypasses RLS, so every
 * inserted row must set its owning `user_id` explicitly. Fine against a
 * throwaway local database — never point it at a shared environment (the
 * future CI smoke job must not carry this key; see ADR-0036 IMP-002).
 */
export function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "e2e seeding needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
        "Locally these live in apps/admin/.env.local; in CI source them from `supabase status`.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
