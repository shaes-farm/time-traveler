import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  characterSchema,
  characterTypeEnum,
  characterTypeProfileSchema,
} from "../schemas/character";
import type {
  CharacterInput,
  CreateCharacterInput,
} from "../schemas/character";
import { generateSlug, resolveCollision } from "../utils/slug";
import { MAX_SLUG_LENGTH } from "../schemas/slug";
import type { Database } from "../supabase/types";

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type CharacterRow = Database["public"]["Tables"]["characters"]["Row"];

type CharacterMediaRow = Database["public"]["Tables"]["character_media"]["Row"];

type CharacterRelationshipRow =
  Database["public"]["Tables"]["character_relationships"]["Row"];

type CharacterTimelineViewRow =
  Database["public"]["Views"]["character_timeline_view"]["Row"];

type CharacterNetworkRow =
  Database["public"]["Functions"]["character_network"]["Returns"][number];

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

/** Optional filters accepted by getCharacters */
export interface CharacterFilters {
  characterType?: z.infer<typeof characterTypeEnum>;
  userId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** A character row with its related junction rows eagerly loaded */
export interface CharacterWithRelations extends CharacterRow {
  character_media: CharacterMediaRow[];
  character_relationships: CharacterRelationshipRow[];
}

export type { CreateCharacterInput };

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Throws a descriptive error when a Supabase call returns an error object.
 * All service functions call this after every query to surface DB errors.
 */
function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(`CharacterService.${context}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Returns a page of characters, optionally filtered by character type,
 * owner, or full-text search using the `search_vector` GIN index.
 *
 * `page` is clamped to ≥ 1; `pageSize` is clamped to [1, 100].
 */
export async function getCharacters(
  client: SupabaseClient<Database>,
  filters: CharacterFilters = {},
): Promise<CharacterRow[]> {
  const { characterType, userId, search } = filters;
  const safePage = Math.max(1, Math.floor(filters.page ?? 1));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(filters.pageSize ?? 20)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client.from("characters").select("*");

  if (characterType !== undefined) {
    query = query.eq("character_type", characterType);
  }
  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (search !== undefined && search.length > 0) {
    // Use PostgREST full-text search to leverage the GIN index on search_vector
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  query = query.range(from, to).order("name", { ascending: true });

  const { data, error } = await query;
  assertNoError(error, "getCharacters");
  return data ?? [];
}

/**
 * Fetches a single character by UUID, including media and relationships.
 */
export async function getCharacterById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<CharacterWithRelations> {
  const { data, error } = await client
    .from("characters")
    .select(
      "*, character_media(*), character_relationships!character_relationships_character_id_fkey(*)",
    )
    .eq("id", id)
    .single();

  assertNoError(error, "getCharacterById");
  return data as unknown as CharacterWithRelations;
}

/**
 * Fetches a single character by (userId, slug), including media and
 * relationships.
 *
 * Both `userId` and `slug` are required because the DB uniqueness constraint
 * is `UNIQUE (user_id, slug)` — slug alone is not globally unique.
 */
export async function getCharacterBySlug(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<CharacterWithRelations> {
  const { data, error } = await client
    .from("characters")
    .select(
      "*, character_media(*), character_relationships!character_relationships_character_id_fkey(*)",
    )
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();

  assertNoError(error, "getCharacterBySlug");
  return data as unknown as CharacterWithRelations;
}

/**
 * Creates a new character. The slug is auto-generated from the name; callers
 * may supply an explicit slug which is used as the base (but is still subject
 * to collision resolution against existing user slugs).
 *
 * Validates the payload with both `characterSchema` (top-level fields) and the
 * per-type `characterTypeProfileSchema` (profile_data fields) before inserting.
 */
export async function createCharacter(
  client: SupabaseClient<Database>,
  data: CreateCharacterInput,
): Promise<CharacterRow> {
  // Identify the current user so we can scope slug collision checks
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createCharacter(auth.getUser)");
  if (user === null) {
    throw new Error("CharacterService.createCharacter: no authenticated user");
  }

  // Validate type-specific profile_data fields if provided.
  // Spread profile_data first, then override character_type with the
  // top-level value so a caller cannot smuggle in a different type via
  // profile_data (e.g. { character_type: "animal", ... } inside profile_data
  // would otherwise shadow the intended type after the spread).
  if (data.profile_data !== undefined) {
    characterTypeProfileSchema.parse({
      ...data.profile_data,
      character_type: data.character_type,
    });
  }

  // Fetch existing slugs for this user to resolve collisions
  const { data: existing, error: slugError } = await client
    .from("characters")
    .select("slug")
    .eq("user_id", user.id);
  assertNoError(slugError, "createCharacter(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  const baseSlug =
    data.slug !== undefined && data.slug.length > 0
      ? data.slug
      : generateSlug(data.name);
  const slug = resolveCollision(baseSlug, existingSlugs);

  type CharacterInsert = Database["public"]["Tables"]["characters"]["Insert"];

  // Retry up to 3 times on unique-violation (23505) — guards against the race
  // where two concurrent createCharacter calls compute the same available slug
  // and one wins the DB insert.
  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const attemptValidated = characterSchema.parse({
      ...data,
      slug: attemptSlug,
    });

    const { data: row, error: insertError } = await client
      .from("characters")
      .insert({
        ...(attemptValidated as unknown as CharacterInsert),
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError !== null) {
      if (insertError.code === "23505" && attempt < MAX_SLUG_RETRIES - 1) {
        // Collision — append a random 4-char base-36 suffix and retry.
        const suffix = Math.random().toString(36).slice(2, 6);
        const truncated = slug.slice(0, MAX_SLUG_LENGTH - 5).replace(/-+$/, "");
        attemptSlug = `${truncated}-${suffix}`;
        continue;
      }
      // Non-collision error or exhausted retries — throw
      assertNoError(insertError, "createCharacter");
    }

    return row as CharacterRow;
  }

  // Unreachable: loop always returns or assertNoError throws
  throw new Error("CharacterService.createCharacter: unreachable");
}

/**
 * Applies a partial update to a character. Only supplied fields are mutated.
 * Validates the partial payload with Zod before patching. When profile_data is
 * supplied alongside character_type, the type-specific profile schema is also
 * validated.
 */
export async function updateCharacter(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<CharacterInput>,
): Promise<CharacterRow> {
  // Validate type-specific profile_data when character_type is included in the
  // patch. Spread profile_data first, then set character_type authoritatively so
  // the caller cannot override the type via profile_data keys.
  //
  // DECISION NEEDED: when only profile_data is updated (character_type omitted),
  // validation is skipped because we don't know the persisted type without an
  // extra DB round-trip. Until a fetch-then-validate strategy is adopted, callers
  // MUST include character_type whenever they patch profile_data.
  if (data.profile_data !== undefined && data.character_type !== undefined) {
    characterTypeProfileSchema.parse({
      ...data.profile_data,
      character_type: data.character_type,
    });
  }

  const validated = characterSchema.partial().parse(data);

  type CharacterUpdate = Database["public"]["Tables"]["characters"]["Update"];
  const { data: row, error } = await client
    .from("characters")
    .update(validated as unknown as CharacterUpdate)
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "updateCharacter");
  return row as CharacterRow;
}

/**
 * Permanently deletes a character. The DB FK constraints ensure that
 * `character_media` and `character_relationships` junction rows are removed
 * via `ON DELETE CASCADE` on their `character_id` FK.
 */
export async function deleteCharacter(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await client.from("characters").delete().eq("id", id);
  assertNoError(error, "deleteCharacter");
}

// ---------------------------------------------------------------------------
// View queries
// ---------------------------------------------------------------------------

/**
 * Returns all events a character participated in, sourced from the
 * `character_timeline_view` database view. Results are ordered by
 * `sort_order_years` ascending (chronological order).
 */
export async function getCharacterTimeline(
  client: SupabaseClient<Database>,
  characterId: string,
): Promise<CharacterTimelineViewRow[]> {
  const { data, error } = await client
    .from("character_timeline_view")
    .select("*")
    .eq("character_id", characterId)
    .order("sort_order_years", { ascending: true });

  assertNoError(error, "getCharacterTimeline");
  return data ?? [];
}

/** Maximum depth allowed for `getCharacterNetwork` to prevent runaway
 * recursive CTEs. Matches the practical display limit in the UI. */
const MAX_NETWORK_DEPTH = 5;

/**
 * Returns the relationship graph centred on a character using the
 * `character_network` database function. Each row represents a directed edge
 * in the graph. `depth` controls how many hops to traverse; the database
 * function defaults to 2 when omitted. Clamped to [1, MAX_NETWORK_DEPTH].
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
 * Returns all `event_characters` junction rows for a character. This surfaces
 * which events the character participated in along with the role and
 * significance assigned to each participation.
 */
export async function getCharacterEvents(
  client: SupabaseClient<Database>,
  characterId: string,
): Promise<Database["public"]["Tables"]["event_characters"]["Row"][]> {
  const { data, error } = await client
    .from("event_characters")
    .select("*")
    .eq("character_id", characterId);

  assertNoError(error, "getCharacterEvents");
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Junction: character_media
// ---------------------------------------------------------------------------

/**
 * Links a media item to a character via the `character_media` junction table.
 * Set `isPrimary` to `true` to mark this as the character's primary/profile
 * image.
 */
export async function addMediaToCharacter(
  client: SupabaseClient<Database>,
  characterId: string,
  mediaId: string,
  isPrimary = false,
): Promise<CharacterMediaRow> {
  const { data, error } = await client
    .from("character_media")
    .insert({
      character_id: characterId,
      media_id: mediaId,
      is_primary: isPrimary,
    })
    .select()
    .single();

  assertNoError(error, "addMediaToCharacter");
  return data;
}

/**
 * Removes the link between a media item and a character.
 */
export async function removeMediaFromCharacter(
  client: SupabaseClient<Database>,
  characterId: string,
  mediaId: string,
): Promise<void> {
  const { error } = await client
    .from("character_media")
    .delete()
    .eq("character_id", characterId)
    .eq("media_id", mediaId);

  assertNoError(error, "removeMediaFromCharacter");
}

/**
 * Sets a media item as the character's primary/profile image via a sequential
 * two-step swap (clear existing primary, then set new primary). There is a
 * brief window between steps where no item is primary; callers should not
 * assume all-or-nothing semantics.
 *
 * The partial unique index `character_media_one_primary` (migration 00013)
 * rejects a second `is_primary = true` row for the same character, so the
 * existing primary must be cleared *before* the new one is set — otherwise the
 * index transiently sees two primaries and the update fails.
 */
export async function setPrimaryCharacterMedia(
  client: SupabaseClient<Database>,
  characterId: string,
  mediaId: string,
): Promise<CharacterMediaRow> {
  // Clear the current primary first (no-op if there isn't one).
  const { error: clearError } = await client
    .from("character_media")
    .update({ is_primary: false })
    .eq("character_id", characterId)
    .eq("is_primary", true);

  assertNoError(clearError, "setPrimaryCharacterMedia");

  const { data, error } = await client
    .from("character_media")
    .update({ is_primary: true })
    .eq("character_id", characterId)
    .eq("media_id", mediaId)
    .select()
    .single();

  assertNoError(error, "setPrimaryCharacterMedia");
  return data;
}
