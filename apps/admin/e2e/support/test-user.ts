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
 * The seeded **admin** account, for specs that exercise admin-only surfaces
 * (the relationship vocabulary manager, #428).
 *
 * Separate from {@link TEST_USER} rather than promoting it: the editor account
 * is what proves the admin gate actually blocks someone, so at least one
 * account must stay non-admin.
 */
export const ADMIN_TEST_USER = {
  email: process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@timetraveler.test",
  password: process.env.E2E_ADMIN_PASSWORD ?? "e2e-Password-123!",
  firstName: "Grace",
  lastName: "Hopper",
} as const;

/**
 * Every account this suite seeds and signs in as. {@link sweepE2eAuthUsers}
 * exempts these from its age floor and only removes them when explicitly told
 * to, so an entry sweep cannot delete an account a project is about to use.
 */
export const SEEDED_ACCOUNT_EMAILS: readonly string[] = [
  TEST_USER.email,
  ADMIN_TEST_USER.email,
];

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
export async function seedTestUser(
  account: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  } = TEST_USER,
): Promise<string> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      first_name: account.firstName,
      last_name: account.lastName,
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

  // Already existed — page through the admin user list to find it. listUsers
  // paginates (default 50 users/page) and the admin API has no getByEmail, so a
  // single unpaged call silently misses the account once the shared local auth
  // table exceeds one page (it accumulates a user per auth-flow run). Page until
  // the account is found or a short page signals the end.
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (listError) {
      throw listError;
    }
    const existing = list.users.find((u) => u.email === account.email);
    if (existing) {
      return existing.id;
    }
    if (list.users.length < perPage) {
      break;
    }
  }
  throw new Error(`Test user ${account.email} not found after createUser`);
}

/**
 * Seed {@link ADMIN_TEST_USER} and promote it to `role = 'admin'`.
 *
 * The promotion is a separate step because `handle_new_user` (migration 00004)
 * provisions every new profile as an `editor` — there is no way to ask the auth
 * admin API for an admin. Written with the service-role client, which bypasses
 * RLS; `is_admin()` reads this column, so an editor could not grant it.
 *
 * Idempotent, like {@link seedTestUser}: a re-run re-asserts the role rather
 * than failing on the existing account.
 */
export async function seedAdminTestUser(): Promise<string> {
  const userId = await seedTestUser(ADMIN_TEST_USER);
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) {
    throw new Error(
      `seedAdminTestUser failed to promote ${ADMIN_TEST_USER.email}: ${error.message}`,
    );
  }

  return userId;
}
