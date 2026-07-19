import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded character, with the attributes the list-shell spec filters on.
 */
export interface SeededCharacter {
  slug: string;
  name: string;
  characterType: string;
  significance: string;
  published: boolean;
}

export interface CharactersListFixture {
  /** Timestamp shared by every seeded name — the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  /** Name prefix common to all seeded characters (`E2E List <stamp>`). Typing
   * this into the list search returns exactly the seeded set. */
  namePrefix: string;
  characters: SeededCharacter[];
}

/**
 * Seed a small, deterministic set of characters owned by `userId`, with varied
 * attributes so the list-shell spec can exercise the filters against real rows:
 * distinct `character_type` (Type checkbox) and `significance` (Significance
 * checkbox). All rows are seeded draft so the bulk test can drive publish
 * (`publishCharacter` has no precondition).
 *
 * Every name carries a shared timestamp so the spec can `search` the list down
 * to exactly these rows — the shared authenticated DB accumulates characters
 * from other specs, so the suite never asserts on global counts (#355). Pair
 * with {@link cleanupCharactersList} in an `afterAll` (the #355 teardown note).
 */
export async function seedCharactersList(
  userId: string,
): Promise<CharactersListFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();
  const namePrefix = `E2E List ${stamp}`;

  // One row per (type, significance) combination the spec drives. Two `human`
  // rows so a type=human filter leaves a clean 2-of-4 subset. Kept under one
  // page (PAGE_SIZE = 20) so a stamp search never paginates.
  const specs: Omit<SeededCharacter, "slug" | "name" | "published">[] = [
    { characterType: "human", significance: "critical" },
    { characterType: "animal", significance: "high" },
    { characterType: "mythological", significance: "medium" },
    { characterType: "human", significance: "low" },
  ];

  const characters: SeededCharacter[] = specs.map((s, i) => ({
    ...s,
    published: false,
    slug: `e2e-list-character-${i}-${stamp}`,
    name: `${namePrefix} — ${s.characterType} ${i}`,
  }));

  const { error } = await admin.from("characters").insert(
    characters.map((c, i) => ({
      user_id: userId,
      slug: c.slug,
      name: c.name,
      character_type: c.characterType,
      significance: c.significance,
      published: c.published,
      birth_temporal: { era: "CE", year: 1900 + i },
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, namePrefix, characters };
}

/**
 * Delete every character seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupCharactersList(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("characters")
    .delete()
    .ilike("slug", `e2e-list-character-%-${stamp}`);
  if (error) {
    throw error;
  }
}
