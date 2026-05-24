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

/** Network node/edge returned by the character_network DB function. */
export interface CharacterNetworkNode {
  source_id: string;
  target_id: string;
  rel_type: string;
  source_name: string;
  target_name: string;
  depth: number;
}

export interface RelationshipFilters {
  relationshipType?: z.infer<typeof relationshipTypeEnum>;
  page?: number;
  pageSize?: number;
}

/**
 * Input for creating a relationship. Uses z.input<> so that fields with
 * schema defaults (e.g. metadata) remain optional for callers, consistent
 * with the pattern in period-service and story-service.
 */
export type CreateRelationshipInput = z.input<
  typeof characterRelationshipSchema
>;

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
): Promise<CharacterRelationshipRow> {
  const { data, error } = await client
    .from("character_relationships")
    .select("*")
    .eq("id", id)
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
  data: Partial<CreateRelationshipInput>,
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

/**
 * Traverse the character relationship network from a starting character up to
 * `depth` hops, via the `character_network` database function.
 *
 * @param client - Supabase client instance
 * @param characterId - Starting character UUID
 * @param depth - Number of hops to traverse (default 2)
 * @returns Array of network nodes describing source→target edges at each depth
 */
export async function getCharacterNetwork(
  client: SupabaseClient<Database>,
  characterId: string,
  depth = 2,
): Promise<CharacterNetworkNode[]> {
  const { data, error } = await client.rpc("character_network", {
    p_character_id: characterId,
    p_depth: depth,
  });
  assertNoError(error, "getCharacterNetwork");
  return (data ?? []) as CharacterNetworkNode[];
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
  const { data, error } = await client
    .from("character_relationships")
    .select("*")
    .or(
      `and(character_id.eq.${char1Id},related_character_id.eq.${char2Id}),and(character_id.eq.${char2Id},related_character_id.eq.${char1Id})`,
    );
  assertNoError(error, "getMutualRelationships");
  return data ?? [];
}
