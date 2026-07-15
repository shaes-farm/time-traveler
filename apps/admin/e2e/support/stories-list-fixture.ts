import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded story, with the attributes the list-shell spec filters on.
 */
export interface SeededStory {
  slug: string;
  title: string;
  narratorType: string;
  published: boolean;
}

export interface StoriesListFixture {
  /** Timestamp shared by every seeded title — the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  /** Title prefix common to all seeded stories (`E2E List <stamp>`). Typing
   * this into the list search returns exactly the seeded set. */
  titlePrefix: string;
  stories: SeededStory[];
}

/**
 * Seed a small, deterministic set of stories owned by `userId`, with varied
 * attributes so the list-shell spec can exercise the filters against real rows:
 * distinct `narrator_type` (Narrator checkbox — two `third_person` and two
 * `omniscient` so a narrator=third_person filter leaves a clean 2-of-4 subset).
 *
 * `first_person` is deliberately avoided — the story data contract requires a
 * `perspective_character_id` for first-person narratives (see `storySchema`),
 * which would drag a seeded character into the fixture; the narrator filter is
 * exercised just as well with the other two values.
 *
 * All rows are seeded draft so the bulk test can drive publish (`publishStory`
 * has no precondition, unlike `publishTimeline`). The stories list is URL-driven
 * (like events), so isolation is a full-text search on the shared timestamp
 * baked into every title. Pair with {@link cleanupStoriesList} in an `afterAll`
 * (the #355 teardown note).
 */
export async function seedStoriesList(
  userId: string,
): Promise<StoriesListFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();
  const titlePrefix = `E2E List ${stamp}`;

  // Kept under one page (PAGE_SIZE = 20) so a stamp search never paginates.
  const specs: Omit<SeededStory, "slug" | "title" | "published">[] = [
    { narratorType: "third_person" },
    { narratorType: "third_person" },
    { narratorType: "omniscient" },
    { narratorType: "omniscient" },
  ];

  const stories: SeededStory[] = specs.map((s, i) => ({
    ...s,
    published: false,
    slug: `e2e-list-story-${i}-${stamp}`,
    title: `${titlePrefix} — ${s.narratorType} ${i}`,
  }));

  const { error } = await admin.from("stories").insert(
    stories.map((s) => ({
      user_id: userId,
      slug: s.slug,
      title: s.title,
      narrator_type: s.narratorType,
      published: s.published,
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, titlePrefix, stories };
}

/**
 * Delete every story seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupStoriesList(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("stories")
    .delete()
    .ilike("slug", `e2e-list-story-%-${stamp}`);
  if (error) {
    throw error;
  }
}
