import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Session accessors. Take a Supabase client (built via
 * `createServerSupabaseClient`) so the same code runs in any server-
 * side context. Both return `null` if there's no active session — no
 * exceptions thrown for the unauthenticated case, which is the common
 * branch in layout-level checks.
 */

export const getSession = async (
  client: SupabaseClient,
): Promise<Session | null> => {
  const { data } = await client.auth.getSession();
  return data.session;
};

/**
 * Returns the authenticated user. Prefer this over `getSession().user`
 * — `getUser()` round-trips to GoTrue and validates the JWT, while
 * `getSession()` trusts whatever the cookie says. Layout/proxy gates
 * must use `getUser()` to avoid forged-cookie bypasses.
 */
export const getUser = async (client: SupabaseClient): Promise<User | null> => {
  const { data } = await client.auth.getUser();
  return data.user;
};

/**
 * Profile shape relevant to gate checks. Reads the `role` column from
 * `profiles` for the supplied user id. Returns `null` if the profile
 * row doesn't exist (handle_new_user trigger should have created it
 * on signup; null indicates the trigger didn't run or RLS hid the row).
 */
export interface AuthProfile {
  id: string;
  role: "editor" | "admin";
  firstName: string;
  lastName: string;
}

export const getProfile = async (
  client: SupabaseClient,
  userId: string,
): Promise<AuthProfile | null> => {
  const { data, error } = await client
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  // `profiles.role` is nullable in the schema — normalise null to 'editor'
  // so downstream role checks always work against the non-null union type.
  const rawRole = data.role as "editor" | "admin" | null;
  return {
    id: data.id as string,
    role: rawRole ?? "editor",
    firstName: data.first_name as string,
    lastName: data.last_name as string,
  };
};
