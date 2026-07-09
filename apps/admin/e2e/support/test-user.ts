/*
 * These env vars configure the e2e run directly (outside the turbo task
 * graph), so the turbo env-var declaration rule doesn't apply here.
 */
/* eslint-disable turbo/no-undeclared-env-vars */
import { createServiceRoleClient } from "./supabase-admin";

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
 * Idempotently create {@link TEST_USER} via the Supabase admin API and
 * return its auth id (callers seed fixtures owned by that id).
 *
 * `email_confirm: true` skips email verification so the account can sign in
 * immediately, and `user_metadata` feeds the `handle_new_user` trigger
 * (migration 00004) which provisions the matching `profiles` row. Safe to
 * call on every run: a user left over from a previous run is looked up
 * rather than treated as a failure.
 */
export async function seedTestUser(): Promise<string> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
    user_metadata: {
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
    },
  });

  if (!error && data.user) {
    return data.user.id;
  }

  // Re-running against a warm database is expected: a duplicate user is not a
  // failure. Prefer the structured error code; fall back to the message text
  // only for older SDKs that don't populate `code`.
  if (error) {
    const alreadyExists =
      error.code === "email_exists" ||
      /already been registered|already exists/i.test(error.message);
    if (!alreadyExists) {
      throw error;
    }
  }

  // Already existed — look the account up so we can return its id.
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    throw listError;
  }
  const existing = list.users.find((u) => u.email === TEST_USER.email);
  if (!existing) {
    throw new Error(`Test user ${TEST_USER.email} not found after createUser`);
  }
  return existing.id;
}
