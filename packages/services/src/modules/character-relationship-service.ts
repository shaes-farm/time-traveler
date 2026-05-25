import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  characterRelationshipSchema,
  characterRelationshipBaseSchema,
  relationshipTypeEnum,
  validateTypeRoleCombination,
} from "../schemas/character-relationship.js";
import type { Database } from "../supabase/types.js";

type CharacterRelationshipRow =
  Database["public"]["Tables"]["character_relationships"]["Row"];
// Use the generated RPC return type instead of the events table row to avoid
// drift if the function's SELECT list changes (it includes computed columns
// not present on the raw table).
type SharedEventRow =
  Database["public"]["Functions"]["events_shared_by_characters"]["Returns"][number];
// Use the generated return type for the character_network RPC to avoid drift
// if the DB function signature changes.
type CharacterNetworkRow =
  Database["public"]["Functions"]["character_network"]["Returns"][number];
// character_network_view joins both character names onto each relationship row.
type CharacterNetworkViewRow =
  Database["public"]["Views"]["character_network_view"]["Row"];

/** Re-export the generated network row type for consumers. */
export type { CharacterNetworkRow };

export interface RelationshipFilters {
  relationshipType?: z.infer<typeof relationshipTypeEnum>;
  page?: number;
  pageSize?: number;
}

/**
 * Input for creating a relationship. `characterRelationshipSchema` has no Zod
 * defaults, so z.infer<> and z.input<> are equivalent here.
 */
export type CreateRelationshipInput = z.infer<
  typeof characterRelationshipSchema
>;

/**
 * Input for updating a relationship. Restricted to mutable fields only —
 * `character_id` and `related_character_id` are intentionally excluded to
 * prevent "moving" a relationship to different characters, which would risk
 * creating self-relationships or duplicates that bypass the creation guards.
 */
export type UpdateRelationshipInput = Partial<
  Pick<
    z.infer<typeof characterRelationshipSchema>,
    | "relationship_type"
    | "relationship_role"
    | "description"
    | "start_temporal"
    | "end_temporal"
    | "metadata"
  >
>;

/** RFC 4122 UUID pattern (versions 1-8, plus nil/max UUIDs). */
const UUID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

/**
 * Throws if `value` is not a valid UUID. Used before constructing raw PostgREST
 * filter strings to prevent filter-injection via crafted UUIDs.
 */
function assertValidUuid(value: string, paramName: string): void {
  if (!UUID_RE.test(value)) {
    throw new Error(
      `CharacterRelationshipService: ${paramName} is not a valid UUID`,
    );
  }
}

function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(
      `CharacterRelationshipService.${context}: ${error.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Reciprocal-edge support (#119 / Batch 2 design)
// ---------------------------------------------------------------------------

/**
 * Relationship types that store direction by type alone — no reciprocal row
 * is created or expected. For these, "Marie mentors Pierre" is a single row;
 * "Pierre mentors Marie" would be a separate, independent assertion the user
 * must opt into explicitly. See `06-relationships-editor.md` for the
 * design rationale.
 */
const ASYMMETRIC_TYPES: ReadonlySet<string> = new Set([
  "mentor_student",
  "owner_pet",
  "trainer_trainee",
  "creator_creation",
  "worship",
]);

/**
 * Maps each sub-role to the role its reciprocal row should carry. Paired
 * roles invert (parent ↔ child); symmetric roles map to themselves
 * (spouse ↔ spouse). Roles not in this map are treated as "no role on
 * reciprocal" — i.e., the reciprocal carries `relationship_role = null`.
 */
const ROLE_INVERSE: Readonly<Record<string, string>> = {
  // Paired (asymmetric within type)
  parent: "child",
  child: "parent",
  grandparent: "grandchild",
  grandchild: "grandparent",
  aunt_uncle: "niece_nephew",
  niece_nephew: "aunt_uncle",
  step_parent: "step_child",
  step_child: "step_parent",
  adoptive_parent: "adoptive_child",
  adoptive_child: "adoptive_parent",
  employer: "employee",
  employee: "employer",
  supervisor: "subordinate",
  subordinate: "supervisor",
  client: "vendor",
  vendor: "client",
  // Symmetric sub-roles (map to themselves)
  spouse: "spouse",
  sibling: "sibling",
  cousin: "cousin",
  in_law: "in_law",
  step_sibling: "step_sibling",
  colleague: "colleague",
  business_partner: "business_partner",
  co_author: "co_author",
  co_founder: "co_founder",
  research_partner: "research_partner",
  performance_partner: "performance_partner",
  band_member: "band_member",
  creative_partner: "creative_partner",
  other: "other",
};

type RelationshipInsert =
  Database["public"]["Tables"]["character_relationships"]["Insert"];

/**
 * Given a freshly-inserted (or fetched) relationship row, compute the
 * reciprocal insert payload — or return `null` if no reciprocal applies.
 *
 * - Asymmetric types (`mentor_student`, etc.) return null: single-row by design.
 * - Self-relationships return null defensively (the DB also rejects them).
 * - For paired or symmetric sub-roles, characters swap and the role inverts via `ROLE_INVERSE`.
 * - For symmetric type-only (`friendship`, `rivalry`, `enemy`, and `professional`/`collaboration` without role), characters swap and type/role carry through unchanged.
 *
 * `description` is intentionally NOT carried to the reciprocal — each card holds
 * its own perspective text per Batch 2 Q1.
 */
export function computeReciprocalRow(row: {
  user_id: string;
  character_id: string;
  related_character_id: string;
  relationship_type: string;
  relationship_role: string | null;
  start_temporal: unknown;
  end_temporal: unknown;
  metadata?: unknown;
}): RelationshipInsert | null {
  if (ASYMMETRIC_TYPES.has(row.relationship_type)) {
    return null;
  }
  if (row.character_id === row.related_character_id) {
    return null;
  }
  const reverseRole =
    row.relationship_role !== null
      ? (ROLE_INVERSE[row.relationship_role] ?? null)
      : null;
  return {
    user_id: row.user_id,
    character_id: row.related_character_id,
    related_character_id: row.character_id,
    relationship_type: row.relationship_type,
    relationship_role: reverseRole,
    start_temporal: (row.start_temporal ??
      null) as RelationshipInsert["start_temporal"],
    end_temporal: (row.end_temporal ??
      null) as RelationshipInsert["end_temporal"],
    metadata: (row.metadata ?? undefined) as RelationshipInsert["metadata"],
  };
}

/**
 * Return all relationships involving a character — regardless of which column
 * (character_id or related_character_id) they appear in — optionally filtered
 * by type and paginated.
 *
 * @param client - Supabase client instance
 * @param characterId - Character UUID
 * @param filters - Optional filters: relationshipType, page, pageSize
 * @returns Array of relationship rows
 */
export async function getRelationships(
  client: SupabaseClient<Database>,
  characterId: string,
  filters: RelationshipFilters = {},
): Promise<CharacterRelationshipRow[]> {
  const { relationshipType, page, pageSize } = filters;

  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize ?? 20)));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  // Validate UUID before embedding in raw PostgREST filter string.
  assertValidUuid(characterId, "characterId");

  // Both column positions must be checked to surface all relationships
  // involving this character, since the schema uses directed column pairs
  // with no is_bidirectional flag.
  let query = client
    .from("character_relationships")
    .select("*")
    .or(`character_id.eq.${characterId},related_character_id.eq.${characterId}`)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (relationshipType !== undefined) {
    query = query.eq("relationship_type", relationshipType);
  }

  const { data, error } = await query;
  assertNoError(error, "getRelationships");
  return data ?? [];
}

/**
 * Fetch a single relationship by its UUID.
 *
 * @param client - Supabase client instance
 * @param id - Relationship UUID
 * @returns The matching relationship row
 */
export async function getRelationshipById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<CharacterNetworkViewRow> {
  // Select from character_network_view to include both characters' names
  // alongside the relationship data, as required by the issue spec.
  const { data, error } = await client
    .from("character_network_view")
    .select("*")
    .eq("relationship_id", id)
    .single();
  assertNoError(error, "getRelationshipById");
  return data;
}

/**
 * Create a new relationship between two characters.
 * Rejects self-relationships at the service level (the DB also enforces this
 * via CHECK constraint). Duplicate relationships (same pair + type) surface
 * as a descriptive error via the unique index.
 *
 * @param client - Supabase client instance
 * @param data - Relationship data
 * @returns The newly created relationship row
 */
export async function createRelationship(
  client: SupabaseClient<Database>,
  data: CreateRelationshipInput,
): Promise<CharacterRelationshipRow> {
  if (data.character_id === data.related_character_id) {
    throw new Error(
      "CharacterRelationshipService.createRelationship: a character cannot have a relationship with itself",
    );
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createRelationship.getUser");
  if (user === null) {
    throw new Error(
      "CharacterRelationshipService.createRelationship: no authenticated user",
    );
  }
  const userId = user.id;

  const validated = characterRelationshipSchema.parse(data);

  const { data: row, error: insertError } = await client
    .from("character_relationships")
    .insert({
      ...(validated as unknown as RelationshipInsert),
      user_id: userId,
    })
    .select()
    .single();

  if (insertError !== null) {
    if (insertError.code === "23505") {
      throw new Error(
        `CharacterRelationshipService.createRelationship: a ${data.relationship_type} relationship between these characters already exists`,
      );
    }
    if (insertError.code === "23514") {
      throw new Error(
        "CharacterRelationshipService.createRelationship: a character cannot have a relationship with itself",
      );
    }
    assertNoError(insertError, "createRelationship");
  }

  const primary = row as CharacterRelationshipRow;

  // Reciprocal-edge creation per Batch 2 design (#119). The reciprocal
  // insert is best-effort: if it fails, the primary stays committed and the
  // caller is told to retry. This matches the multi-step pattern documented
  // in system-design §5.3.
  const reciprocal = computeReciprocalRow(primary);
  if (reciprocal !== null) {
    const { error: recipError } = await client
      .from("character_relationships")
      .insert(reciprocal)
      .select()
      .single();
    if (recipError !== null && recipError.code !== "23505") {
      // 23505 means the reciprocal already exists — design intent is met,
      // so swallow it. Any other error is a genuine failure to report.
      throw new Error(
        `CharacterRelationshipService.createRelationship: primary saved (id=${primary.id}); reciprocal insert failed: ${recipError.message}`,
      );
    }
  }

  return primary;
}

/**
 * Apply a partial update to a relationship's type, description, or temporal scope.
 *
 * @param client - Supabase client instance
 * @param id - Relationship UUID
 * @param data - Partial relationship fields to update
 * @returns The updated relationship row
 */
export async function updateRelationship(
  client: SupabaseClient<Database>,
  id: string,
  data: UpdateRelationshipInput,
): Promise<CharacterRelationshipRow> {
  // Use a schema restricted to the mutable fields so that — even if a caller
  // bypasses TypeScript via `any` — `character_id` and `related_character_id`
  // are never forwarded to Supabase. Uses the base schema (without superRefine)
  // because Zod v4 does not support .pick() on refined schemas.
  const mutableSchema = characterRelationshipBaseSchema
    .pick({
      relationship_type: true,
      relationship_role: true,
      description: true,
      start_temporal: true,
      end_temporal: true,
      metadata: true,
    })
    .partial();
  const validated = mutableSchema.parse(data);
  type RelationshipUpdate =
    Database["public"]["Tables"]["character_relationships"]["Update"];

  // Fetch the current row so we know how to find the reciprocal (the find
  // uses the CURRENT type/role; the sync writes the NEW type/role).
  const { data: current, error: fetchError } = await client
    .from("character_relationships")
    .select("*")
    .eq("id", id)
    .single();
  assertNoError(fetchError, "updateRelationship.fetchCurrent");

  // Cross-validate the resulting (type, role) combination before hitting the
  // DB. The Zod mutable schema (used above) cannot run the cross-field
  // refinement because Zod v4 doesn't support .pick() on refined schemas; so
  // an invalid combination like (professional, parent) would otherwise pass
  // Zod and surface as an opaque 23514 from the DB CHECK. Compute the
  // effective values (new fields if provided, current values otherwise),
  // skipping `undefined` so it means "not provided" rather than "clear".
  if (current !== null) {
    const effectiveType = (validated.relationship_type ??
      current.relationship_type) as z.infer<typeof relationshipTypeEnum>;
    const effectiveRole =
      validated.relationship_role !== undefined
        ? validated.relationship_role
        : current.relationship_role;
    const roleError = validateTypeRoleCombination(effectiveType, effectiveRole);
    if (roleError !== null) {
      throw new Error(
        `CharacterRelationshipService.updateRelationship: ${roleError}`,
      );
    }
  }

  // Update primary.
  const { data: updated, error } = await client
    .from("character_relationships")
    .update(validated as unknown as RelationshipUpdate)
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "updateRelationship");

  // Sync the reciprocal row per Batch 2 Q1: dates and type/role mirror,
  // description does NOT. Asymmetric types have no reciprocal. If the fetch
  // returned no row (legacy or test mocks), skip sync gracefully.
  if (current !== null && !ASYMMETRIC_TYPES.has(current.relationship_type)) {
    await syncReciprocalUpdate(client, current, validated);
  }

  return updated;
}

/**
 * Sync mutable fields (type, role, dates, metadata) to the reciprocal row.
 * Description is intentionally NOT synced per Batch 2 Q1.
 *
 * The lookup uses the CURRENT row's type and inverted role (so we can find
 * the existing reciprocal even if the user is changing type/role in this
 * update). Missing reciprocal is silently ignored — legacy single-row data
 * stays single-row.
 */
async function syncReciprocalUpdate(
  client: SupabaseClient<Database>,
  current: CharacterRelationshipRow,
  partial: Partial<{
    relationship_type: string;
    relationship_role: string | null | undefined;
    start_temporal: unknown;
    end_temporal: unknown;
    metadata: unknown;
  }>,
): Promise<void> {
  // For each potentially-synced field, distinguish "not provided" (undefined)
  // from "explicitly cleared" (null). PostgREST drops undefined keys when
  // serializing the update, so the primary's column is unchanged in that
  // case; the reciprocal sync must match by also skipping the field. Only
  // explicit values (null included) are synced.
  const syncFields: Record<string, unknown> = {};
  if (partial.relationship_type !== undefined) {
    syncFields.relationship_type = partial.relationship_type;
  }
  if (partial.relationship_role !== undefined) {
    const newRole = partial.relationship_role;
    syncFields.relationship_role =
      newRole !== null ? (ROLE_INVERSE[newRole] ?? null) : null;
  }
  if (partial.start_temporal !== undefined) {
    syncFields.start_temporal = partial.start_temporal;
  }
  if (partial.end_temporal !== undefined) {
    syncFields.end_temporal = partial.end_temporal;
  }
  if (partial.metadata !== undefined) {
    syncFields.metadata = partial.metadata;
  }
  if (Object.keys(syncFields).length === 0) {
    return; // Nothing to sync — the partial update only touched description
    // (or only contained explicit undefineds, which are no-ops).
  }

  const oldReciprocalRole =
    current.relationship_role !== null
      ? (ROLE_INVERSE[current.relationship_role] ?? null)
      : null;

  type RelationshipUpdate =
    Database["public"]["Tables"]["character_relationships"]["Update"];

  let query = client
    .from("character_relationships")
    .update(syncFields as RelationshipUpdate)
    .eq("character_id", current.related_character_id)
    .eq("related_character_id", current.character_id)
    .eq("relationship_type", current.relationship_type);

  query =
    oldReciprocalRole === null
      ? query.is("relationship_role", null)
      : query.eq("relationship_role", oldReciprocalRole);

  const { error } = await query;
  if (error !== null) {
    throw new Error(
      `CharacterRelationshipService.updateRelationship: primary updated, reciprocal sync failed: ${error.message}`,
    );
  }
}

/**
 * Delete a relationship by its UUID.
 *
 * @param client - Supabase client instance
 * @param id - Relationship UUID
 */
export async function deleteRelationship(
  client: SupabaseClient<Database>,
  id: string,
  options: { deleteReciprocal?: boolean } = {},
): Promise<void> {
  const { deleteReciprocal = true } = options;

  // Fetch first so we can find the reciprocal after the primary is gone. If
  // `deleteReciprocal` is false we still fetch — it's cheap, and it gives us
  // a clearer error if the id is invalid.
  const { data: current, error: fetchError } = await client
    .from("character_relationships")
    .select("*")
    .eq("id", id)
    .single();
  assertNoError(fetchError, "deleteRelationship.fetchCurrent");

  const { error } = await client
    .from("character_relationships")
    .delete()
    .eq("id", id);
  assertNoError(error, "deleteRelationship");

  // Reciprocal delete is enabled by default (Batch 2 design). The opt-out
  // covers the rare "one-sided orphan" case from the wireframe.
  if (!deleteReciprocal) return;
  if (current === null) return;
  if (ASYMMETRIC_TYPES.has(current.relationship_type)) return;

  const reciprocalRole =
    current.relationship_role !== null
      ? (ROLE_INVERSE[current.relationship_role] ?? null)
      : null;

  let query = client
    .from("character_relationships")
    .delete()
    .eq("character_id", current.related_character_id)
    .eq("related_character_id", current.character_id)
    .eq("relationship_type", current.relationship_type);

  query =
    reciprocalRole === null
      ? query.is("relationship_role", null)
      : query.eq("relationship_role", reciprocalRole);

  const { error: recipError } = await query;
  if (recipError !== null) {
    throw new Error(
      `CharacterRelationshipService.deleteRelationship: primary deleted, reciprocal delete failed: ${recipError.message}`,
    );
  }
}

/**
 * Return events that both characters participated in, via the
 * `events_shared_by_characters` database function.
 *
 * @param client - Supabase client instance
 * @param char1Id - First character UUID
 * @param char2Id - Second character UUID
 * @returns Array of event rows shared by both characters
 */
export async function getSharedEvents(
  client: SupabaseClient<Database>,
  char1Id: string,
  char2Id: string,
): Promise<SharedEventRow[]> {
  const { data, error } = await client.rpc("events_shared_by_characters", {
    p_character_ids: [char1Id, char2Id],
  });
  assertNoError(error, "getSharedEvents");
  return (data ?? []) as SharedEventRow[];
}

/** Maximum depth allowed for getCharacterNetwork to prevent runaway recursive CTEs. */
const MAX_NETWORK_DEPTH = 5;

/**
 * Traverse the character relationship network from a starting character up to
 * `depth` hops, via the `character_network` database function. Depth is
 * clamped to [1, MAX_NETWORK_DEPTH]. The DB function defaults to 2 when
 * depth is omitted.
 *
 * DECISION NEEDED: The `character_network` RPC only seeds traversal from the
 * `character_id` column (i.e., relationships where the starting character is
 * the source). Relationships where the starting character appears only in
 * `related_character_id` are NOT traversed. If a fully bidirectional network
 * is required, the DB function must be updated to union both directions, or
 * this service must pre-fetch reversed edges and merge results.
 *
 * @param client - Supabase client instance
 * @param characterId - Starting character UUID
 * @param depth - Number of hops to traverse; clamped to [1, 5]
 * @returns Array of network edges describing source→target pairs at each depth
 */
export async function getCharacterNetwork(
  client: SupabaseClient<Database>,
  characterId: string,
  depth?: number,
): Promise<CharacterNetworkRow[]> {
  const safeDepth =
    depth !== undefined
      ? Math.min(MAX_NETWORK_DEPTH, Math.max(1, Math.floor(depth)))
      : undefined;

  const { data, error } = await client.rpc("character_network", {
    p_character_id: characterId,
    ...(safeDepth !== undefined ? { p_depth: safeDepth } : {}),
  });
  assertNoError(error, "getCharacterNetwork");
  return data ?? [];
}

/**
 * Return all direct relationships between exactly two characters, in either
 * direction (char1→char2 or char2→char1).
 *
 * DECISION NEEDED: Issue #32 also mentions "indirect connections" for
 * getMutualRelationships. Indirect/multi-hop traversal is exposed via
 * getCharacterNetwork(characterId, depth). Decide whether getMutualRelationships
 * should also accept a depth parameter and delegate to character_network, or
 * whether keeping it as a direct-only query is the right API boundary.
 *
 * @param client - Supabase client instance
 * @param char1Id - First character UUID
 * @param char2Id - Second character UUID
 * @returns Array of relationship rows between the two characters
 */
export async function getMutualRelationships(
  client: SupabaseClient<Database>,
  char1Id: string,
  char2Id: string,
): Promise<CharacterRelationshipRow[]> {
  // Validate UUIDs before embedding in raw PostgREST filter string.
  assertValidUuid(char1Id, "char1Id");
  assertValidUuid(char2Id, "char2Id");

  const { data, error } = await client
    .from("character_relationships")
    .select("*")
    .or(
      `and(character_id.eq.${char1Id},related_character_id.eq.${char2Id}),and(character_id.eq.${char2Id},related_character_id.eq.${char1Id})`,
    );
  assertNoError(error, "getMutualRelationships");
  return data ?? [];
}
