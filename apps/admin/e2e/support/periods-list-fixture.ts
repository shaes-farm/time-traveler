import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded period, with the attributes the list-shell spec filters on.
 */
export interface SeededPeriod {
  slug: string;
  title: string;
  significance: string;
  era: string;
  published: boolean;
}

export interface PeriodsListFixture {
  /** Timestamp shared by every seeded title — the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  /** Title prefix common to all seeded periods (`E2E List <stamp>`). Typing
   * this into the list search returns exactly the seeded set. */
  titlePrefix: string;
  periods: SeededPeriod[];
}

/**
 * Seed a small, deterministic set of periods owned by `userId`, with varied
 * attributes so the list-shell spec can exercise the filters against real rows:
 * distinct `significance` (Significance checkbox) and `era` (Era checkbox). Two
 * `high`-significance rows so a significance=high filter leaves a clean 2-of-4
 * subset. All rows are seeded draft so the bulk test can drive publish
 * (`publishPeriod` has no precondition).
 *
 * The periods list filters entirely client-side over the full fetched set (no
 * server search / URL params), so isolation is a client-side title substring
 * match on the shared timestamp. Pair with {@link cleanupPeriodsList} in an
 * `afterAll` (the #355 teardown note).
 */
export async function seedPeriodsList(
  userId: string,
): Promise<PeriodsListFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();
  const titlePrefix = `E2E List ${stamp}`;

  const specs: Omit<SeededPeriod, "slug" | "title" | "published">[] = [
    { significance: "high", era: "CE" },
    { significance: "high", era: "MYA" },
    { significance: "medium", era: "BCE" },
    { significance: "low", era: "CE" },
  ];

  const periods: SeededPeriod[] = specs.map((s, i) => ({
    ...s,
    published: false,
    slug: `e2e-list-period-${i}-${stamp}`,
    title: `${titlePrefix} — ${s.significance} ${i}`,
  }));

  const { error } = await admin.from("periods").insert(
    periods.map((p) => ({
      user_id: userId,
      slug: p.slug,
      title: p.title,
      significance: p.significance,
      published: p.published,
      temporal_data: temporalForEra(p.era),
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, titlePrefix, periods };
}

/**
 * Delete every period seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupPeriodsList(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("periods")
    .delete()
    .ilike("slug", `e2e-list-period-%-${stamp}`);
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
