import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  characterRelationshipSchema,
  relationshipTypeEnum,
} from "../schemas/character-relationship.js";
import type { Database } from "../supabase/types.js";

type CharacterRelationshipRow =
  Database["public"]["Tables"]["character_relationships"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
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

  type RelationshipInsert =
    Database["public"]["Tables"]["character_relationships"]["Insert"];

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

  return row as CharacterRelationshipRow;
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
  const validated = characterRelationshipSchema.partial().parse(data);
  type RelationshipUpdate =
    Database["public"]["Tables"]["character_relationships"]["Update"];
  const { data: updated, error } = await client
    .from("character_relationships")
    .update(validated as unknown as RelationshipUpdate)
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "updateRelationship");
  return updated;
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
): Promise<void> {
  const { error } = await client
    .from("character_relationships")
    .delete()
    .eq("id", id);
  assertNoError(error, "deleteRelationship");
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
): Promise<EventRow[]> {
  const { data, error } = await client.rpc("events_shared_by_characters", {
    p_character_ids: [char1Id, char2Id],
  });
  assertNoError(error, "getSharedEvents");
  return (data ?? []) as EventRow[];
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
