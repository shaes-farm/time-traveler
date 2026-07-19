import { createServiceRoleClient } from "./supabase-admin";

/**
 * Fixture for the pagination-clamp regression (#330). Unlike the list-shell
 * fixtures (which keep rows under one page on purpose), this seeds
 * `PAGE_SIZE + 1` characters so exactly one row lands on page 2 — deleting it
 * shrinks the result set to a single page and must clamp the URL off page 2.
 */
export interface CharactersPageOverflowFixture {
  /** Timestamp shared by every seeded name/slug; the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  /** Name prefix common to all seeded characters (`E2E Pg <stamp>`). */
  namePrefix: string;
  /** Seeded names in insertion order. `names[0]` sorts first (page 1). */
  names: string[];
}

// PAGE_SIZE is 20 in every list client. The two clamp scenarios need different
// counts: a full page (20) so a deep link to page 2 lands on the from==count
// empty boundary (PostgREST 206, not a 416), and one extra row (21) so a single
// character sits alone on page 2 for the bulk-delete path. Keep in sync if the
// list PAGE_SIZE ever changes.
export const PAGE_SIZE = 20;

/**
 * Seed `count` draft characters owned by `userId`, all sharing a timestamped
 * name/slug so the spec can search down to exactly this set (the shared
 * authenticated DB is non-deterministic — never assert global counts, per
 * #355). Pair with {@link cleanupCharactersPageOverflow} in an `afterAll`.
 */
export async function seedCharactersPageOverflow(
  userId: string,
  count: number,
): Promise<CharactersPageOverflowFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();
  const namePrefix = `E2E Pg ${stamp}`;

  const names = Array.from({ length: count }, (_, i) => `${namePrefix} — ${i}`);

  const { error } = await admin.from("characters").insert(
    names.map((name, i) => ({
      user_id: userId,
      slug: `e2e-pg-character-${i}-${stamp}`,
      name,
      character_type: "human",
      significance: "medium",
      published: false,
      birth_temporal: { era: "CE", year: 1000 + i },
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, namePrefix, names };
}

/**
 * Delete every character seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupCharactersPageOverflow(
  stamp: number,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("characters")
    .delete()
    .ilike("slug", `e2e-pg-character-%-${stamp}`);
  if (error) {
    throw error;
  }
}
