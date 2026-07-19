import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded timeline, with the attributes the list-shell spec filters on.
 */
export interface SeededTimeline {
  slug: string;
  title: string;
  timelineType: string;
  visibility: string;
  era: string;
  published: boolean;
}

export interface TimelinesListFixture {
  /** Timestamp shared by every seeded title — the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  /** Title prefix common to all seeded timelines (`E2E List <stamp>`). Typing
   * this into the list search returns exactly the seeded set. */
  titlePrefix: string;
  timelines: SeededTimeline[];
}

/**
 * Seed a small, deterministic set of timelines owned by `userId`, with varied
 * attributes so the list-shell spec can exercise the filters against real rows:
 * distinct `timeline_type` (Type checkbox) and `visibility` (Visibility
 * checkbox). Every row is seeded **published** so the bulk test can drive
 * unpublish — publishing through the UI is gated on each timeline having a
 * linked event (`publishTimeline`, #212), a precondition a service-role insert
 * bypasses but the UI action would not.
 *
 * Every title carries a shared timestamp so the spec can `search` the list down
 * to exactly these rows — the shared authenticated DB accumulates timelines
 * from other specs, so the suite never asserts on global counts (#355). Pair
 * with {@link cleanupTimelinesList} in an `afterAll` (the #355 teardown note).
 */
export async function seedTimelinesList(
  userId: string,
): Promise<TimelinesListFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();
  const titlePrefix = `E2E List ${stamp}`;

  // One row per (type, visibility, era) combination the spec drives. Two
  // `general` rows so a type=general filter leaves a clean 2-of-4 subset.
  // Kept under one page (PAGE_SIZE = 20) so a stamp search never paginates.
  const specs: Omit<SeededTimeline, "slug" | "title" | "published">[] = [
    { timelineType: "general", visibility: "public", era: "CE" },
    { timelineType: "biographical", visibility: "private", era: "CE" },
    { timelineType: "comparative", visibility: "shared", era: "BCE" },
    { timelineType: "general", visibility: "private", era: "MYA" },
  ];

  const timelines: SeededTimeline[] = specs.map((s, i) => ({
    ...s,
    published: true,
    slug: `e2e-list-timeline-${i}-${stamp}`,
    title: `${titlePrefix} — ${s.timelineType} ${i}`,
  }));

  const { error } = await admin.from("timelines").insert(
    timelines.map((t) => ({
      user_id: userId,
      slug: t.slug,
      title: t.title,
      timeline_type: t.timelineType,
      visibility: t.visibility,
      published: t.published,
      temporal_data: temporalForEra(t.era),
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, titlePrefix, timelines };
}

/**
 * Delete every timeline seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupTimelinesList(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("timelines")
    .delete()
    .ilike("slug", `e2e-list-timeline-%-${stamp}`);
  if (error) {
    throw error;
  }
}

/**
 * A minimal temporal_data payload for a given era. Every era uses `year` (the
 * temporal schema forbids sub-year fields for prehistoric eras but still keys
 * off `year`, and the `sort_order_start` generated column computes from it).
 */
function temporalForEra(era: string): Record<string, unknown> {
  switch (era) {
    case "BCE":
      return { era: "BCE", year: 500 };
    case "KYA":
      return { era: "KYA", year: 10 };
    case "MYA":
      return { era: "MYA", year: 5 };
    case "BYA":
      return { era: "BYA", year: 1 };
    default:
      return { era: "CE", year: 2000 };
  }
}
