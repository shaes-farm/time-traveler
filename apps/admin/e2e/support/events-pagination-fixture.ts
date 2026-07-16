import { createServiceRoleClient } from "./supabase-admin";

/**
 * Fixture for the events list pagination-clamp regression (#330). Unlike the
 * list-shell fixture (which keeps rows under one page on purpose), this seeds a
 * caller-chosen `count` so a deep link to the next page lands on the from ==
 * count empty boundary (PostgREST 206) that triggers the clamp.
 */
export interface EventsPageOverflowFixture {
  /** Timestamp shared by every seeded title/slug; the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  /** Title prefix common to all seeded events (`E2E Pg <stamp>`). */
  titlePrefix: string;
  /** Seeded titles in insertion order. */
  titles: string[];
}

// PAGE_SIZE is 20 in every list client; a deep link to page 2 of an exactly-full
// page requests offset == count, the empty boundary the clamp recovers from.
export const PAGE_SIZE = 20;

/**
 * Seed `count` draft events owned by `userId`, all sharing a timestamped
 * title/slug so the spec can search down to exactly this set (the shared
 * authenticated DB is non-deterministic — never assert global counts, per
 * #355). Pair with {@link cleanupEventsPageOverflow} in an `afterAll`.
 */
export async function seedEventsPageOverflow(
  userId: string,
  count: number,
): Promise<EventsPageOverflowFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();
  const titlePrefix = `E2E Pg ${stamp}`;

  const titles = Array.from(
    { length: count },
    (_, i) => `${titlePrefix} — ${i}`,
  );

  const { error } = await admin.from("events").insert(
    titles.map((title, i) => ({
      user_id: userId,
      slug: `e2e-pg-event-${i}-${stamp}`,
      title,
      event_type: "milestone",
      importance: 5,
      published: false,
      temporal_data: { era: "CE", year: 2000 + i },
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, titlePrefix, titles };
}

/**
 * Delete every event seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupEventsPageOverflow(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("events")
    .delete()
    .ilike("slug", `e2e-pg-event-%-${stamp}`);
  if (error) {
    throw error;
  }
}
