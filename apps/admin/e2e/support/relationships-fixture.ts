import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded character used by the relationships-editor spec.
 */
export interface SeededRelCharacter {
  id: string;
  slug: string;
  name: string;
}

export interface RelationshipsFixture {
  /** Timestamp shared by every seeded slug/name — used both to isolate rows in
   * the combobox search and to match them for teardown. */
  stamp: number;
  /** The focal character whose detail page the spec drives the editor from. */
  charA: SeededRelCharacter;
  /** The other character; the spec asserts the auto-created reverse entry here. */
  charB: SeededRelCharacter;
}

/**
 * Seed exactly two characters owned by `userId` for the relationships-editor
 * e2e spec. The spec drives relationship create/edit/delete THROUGH THE UI so
 * the service layer's reverse-entry logic (`createRelationship` /
 * `deleteRelationship` in `character-relationship-service.ts`) actually runs —
 * a raw service-role INSERT would NOT create the reverse row, so we deliberately
 * do NOT seed any `character_relationships` here.
 *
 * Both names carry a shared timestamp so the AddRelationshipSheet's combobox
 * search (`getCharacters` FTS on name) returns exactly this pair, and so
 * teardown can match the rows by slug. Pair with {@link cleanupRelationships}
 * in an `afterAll` (the #355 self-cleaning-fixture convention).
 */
export async function seedRelationships(
  userId: string,
): Promise<RelationshipsFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();

  const rows = [
    {
      user_id: userId,
      slug: `e2e-rel-character-a-${stamp}`,
      name: `E2E Rel Alpha ${stamp}`,
      character_type: "human",
      birth_temporal: { era: "CE", year: 1901 },
    },
    {
      user_id: userId,
      slug: `e2e-rel-character-b-${stamp}`,
      name: `E2E Rel Beta ${stamp}`,
      character_type: "human",
      birth_temporal: { era: "CE", year: 1902 },
    },
  ];

  const { data, error } = await admin
    .from("characters")
    .insert(rows)
    .select("id, slug, name");
  if (error) {
    throw error;
  }
  const inserted = (data ?? []) as SeededRelCharacter[];
  const charA = inserted.find((c) => c.slug === rows[0]!.slug);
  const charB = inserted.find((c) => c.slug === rows[1]!.slug);
  if (!charA || !charB) {
    throw new Error("seedRelationships: expected both seeded characters back");
  }

  return { stamp, charA, charB };
}

/**
 * Count the relationship rows involving either seeded character. Lets the spec
 * assert the reverse-entry invariant directly against the DB: exactly 2 rows
 * after a UI-driven create (primary + auto-created reverse), 0 after delete.
 */
export async function countRelationships(
  fx: RelationshipsFixture,
): Promise<number> {
  const admin = createServiceRoleClient();
  const idList = `(${[fx.charA.id, fx.charB.id].join(",")})`;
  const { count, error } = await admin
    .from("character_relationships")
    .select("*", { count: "exact", head: true })
    .or(`character_id.in.${idList},related_character_id.in.${idList}`);
  if (error) {
    throw error;
  }
  return count ?? 0;
}

/**
 * Remove everything the fixture (and the UI-driven flow) created: first the
 * relationship rows involving either seeded character — including the
 * auto-created reverse entry, which lives on the OTHER character and so would
 * survive a slug-only cleanup — then the two characters themselves. Idempotent;
 * call from `afterAll`.
 */
export async function cleanupRelationships(
  fx: RelationshipsFixture,
): Promise<void> {
  const admin = createServiceRoleClient();
  const ids = [fx.charA.id, fx.charB.id];
  const idList = `(${ids.join(",")})`;

  const { error: relError } = await admin
    .from("character_relationships")
    .delete()
    .or(`character_id.in.${idList},related_character_id.in.${idList}`);
  if (relError) {
    throw relError;
  }

  const { error: charError } = await admin
    .from("characters")
    .delete()
    .ilike("slug", `e2e-rel-character-%-${fx.stamp}`);
  if (charError) {
    throw charError;
  }
}
