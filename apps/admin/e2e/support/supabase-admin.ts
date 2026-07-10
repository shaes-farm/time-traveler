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

/**
 * Create an already-confirmed user (email verification pre-satisfied) so an
 * auth-flow spec can sign in immediately. Used for isolated accounts — e.g.
 * logout and the password-reset round-trip — that must NOT share the seeded
 * `authenticated` session (a global signOut / password change would disrupt
 * it). Idempotent on a re-run against a warm database.
 */
export async function createConfirmedUser(
  email: string,
  password: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "E2E", last_name: "User" },
  });
  if (error) {
    const alreadyExists =
      error.code === "email_exists" ||
      /already been registered|already exists/i.test(error.message);
    if (!alreadyExists) {
      throw error;
    }
  }
}
