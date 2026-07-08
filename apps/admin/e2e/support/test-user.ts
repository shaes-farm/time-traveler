/*
 * These env vars configure the e2e run directly (outside the turbo task
 * graph), so the turbo env-var declaration rule doesn't apply here.
 */
/* eslint-disable turbo/no-undeclared-env-vars */
import { createClient } from "@supabase/supabase-js";

/**
 * The seeded editor account the authenticated e2e suite signs in as.
 * Credentials are overridable via env so CI can rotate them, but the
 * local defaults are fine against a throwaway local Supabase.
 */
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL ?? "e2e-editor@timetraveler.test",
  password: process.env.E2E_TEST_PASSWORD ?? "e2e-Password-123!",
  firstName: "Ada",
  lastName: "Lovelace",
} as const;

/**
 * Idempotently create {@link TEST_USER} via the Supabase admin API.
 *
 * `email_confirm: true` skips the email-verification step so the account
 * can sign in immediately, and `user_metadata` feeds the `handle_new_user`
 * trigger (migration 00004) which provisions the matching `profiles` row.
 * Safe to call on every run: a user left over from a previous run is
 * treated as success.
 */
export async function seedTestUser(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "e2e auth setup needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
        "Locally these live in apps/admin/.env.local; in CI source them from `supabase status`.",
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
    user_metadata: {
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
    },
  });

  // Re-running against a warm database is expected — only a genuinely
  // unexpected failure should abort setup.
  if (error && !/already been registered|already exists/i.test(error.message)) {
    throw error;
  }
}
