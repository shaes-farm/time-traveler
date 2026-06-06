import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(`ProfileService.${context}: ${error.message}`);
  }
}

/**
 * Resolve a `profiles.username` to its row.
 *
 * Profiles are globally readable (`read_profiles` RLS is `USING (true)`), so any
 * authenticated user can resolve a `@username`. Returns `null` when no profile
 * matches — callers (e.g. the collaborator add dialog) need the "no user found"
 * path rather than a thrown error. `profiles.username` is unique-when-set, so at
 * most one row matches.
 */
export async function getProfileByUsername(
  client: SupabaseClient<Database>,
  username: string,
): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  assertNoError(error, "getProfileByUsername");
  return data;
}

/**
 * Fetch profile rows for a set of user ids, for enriching collaborator lists and
 * the timeline owner with display name / avatar. Short-circuits to `[]` for an
 * empty id list so callers can pass derived arrays without a guard.
 */
export async function getProfilesByIds(
  client: SupabaseClient<Database>,
  ids: string[],
): Promise<ProfileRow[]> {
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .in("id", ids);

  assertNoError(error, "getProfilesByIds");
  return data ?? [];
}
