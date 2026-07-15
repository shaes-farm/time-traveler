import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded event, with the attributes the list-shell spec filters on.
 */
export interface SeededEvent {
  slug: string;
  title: string;
  eventType: string;
  era: string;
  importance: number;
  published: boolean;
}

export interface EventsListFixture {
  /** Timestamp shared by every seeded title — the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  /** Title prefix common to all seeded events (`E2E List <stamp>`). Typing
   * this into the list search returns exactly the seeded set. */
  titlePrefix: string;
  events: SeededEvent[];
}

/**
 * Seed a small, deterministic set of events owned by `userId`, with varied
 * attributes so the list-shell spec can exercise every filter group against
 * real rows: distinct `event_type` (Type checkbox), `era` (Era checkbox), a
 * spread of `importance` (Importance range), and a published/draft mix (Status
 * checkbox + bulk publish/unpublish).
 *
 * Every title carries a shared timestamp so the spec can `search` the list down
 * to exactly these rows — the shared authenticated DB accumulates events from
 * other specs, so the suite never asserts on global counts (#355). Unlike the
 * older fixtures this one is **self-cleaning**: pair it with
 * {@link cleanupEventsList} in an `afterAll` (see the #355 teardown note).
 */
export async function seedEventsList(
  userId: string,
): Promise<EventsListFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();
  const titlePrefix = `E2E List ${stamp}`;

  // One row per (type, era, importance, published) combination the spec drives.
  // Kept under one page (PAGE_SIZE = 20) so a stamp search never paginates.
  const specs: Omit<SeededEvent, "slug" | "title">[] = [
    { eventType: "milestone", era: "CE", importance: 9, published: true },
    { eventType: "discovery", era: "CE", importance: 5, published: false },
    { eventType: "conflict", era: "BCE", importance: 2, published: false },
    { eventType: "milestone", era: "MYA", importance: 7, published: false },
  ];

  const events: SeededEvent[] = specs.map((s, i) => ({
    ...s,
    slug: `e2e-list-event-${i}-${stamp}`,
    title: `${titlePrefix} — ${s.eventType} ${i}`,
  }));

  const { error } = await admin.from("events").insert(
    events.map((e) => ({
      user_id: userId,
      slug: e.slug,
      title: e.title,
      event_type: e.eventType,
      importance: e.importance,
      published: e.published,
      temporal_data: temporalForEra(e.era),
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, titlePrefix, events };
}

/**
 * Delete every event seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupEventsList(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("events")
    .delete()
    .ilike("slug", `e2e-list-event-%-${stamp}`);
  if (error) {
    throw error;
  }
}

/**
 * A minimal temporal_data payload for a given era. Every era uses `year` (the
 * temporal schema forbids sub-year fields for prehistoric eras but still keys
 * off `year`, and the `sort_order_years` generated column computes from it);
 * the era filter itself only reads `temporal_data->>era`.
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
