import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  characterSchema,
  characterTypeEnum,
  characterTypeProfileSchema,
  significanceEnum,
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
  /** Scalar or multi-value character_type filter; multiple values use SQL IN. */
  characterType?:
    z.infer<typeof characterTypeEnum> | z.infer<typeof characterTypeEnum>[];
  /** Scalar or multi-value significance filter; multiple values use SQL IN. */
  significance?:
    z.infer<typeof significanceEnum> | z.infer<typeof significanceEnum>[];
  userId?: string;
  search?: string;
  /** When true → only published rows; false → only draft rows; omit → no filter. */
  published?: boolean;
  /** When true → only characters with at least one media item; false → none; omit → no filter. */
  hasMedia?: boolean;
  /**
   * Sort column. Defaults to "name". Excludes birth/death date — the
   * characters table has no sort_order generated column (unlike
   * events/timelines, whose sort_order columns derive from the era
   * conversion formula in docs/system-design.md §4); see #326.
   */
  sortBy?: "name" | "created_at" | "updated_at";
  /** Sort direction. Defaults to "asc". */
  sortDirection?: "asc" | "desc";
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

/**
 * Enforces the invariant that an `animal` character must have a non-empty
 * top-level `species`. Shared by createCharacter (payload values) and
 * updateCharacter (effective values resolved from the patch + stored row).
 */
function assertAnimalHasSpecies(
  characterType: string | undefined,
  species: unknown,
  context: string,
): void {
  if (characterType !== "animal") return;

  if (typeof species !== "string" || species.trim().length === 0) {
    throw new Error(
      `CharacterService.${context}: species is required and must be non-empty when character_type is "animal"`,
    );
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Returns a page of characters, optionally filtered by character type,
 * significance, owner, published state, has-media, or full-text search using
 * the `search_vector` GIN index. Supports sorting by name/created_at/updated_at
 * (see `CharacterFilters.sortBy` for why birth/death date sorting isn't
 * supported yet).
 *
 * `page` is clamped to ≥ 1; `pageSize` is clamped to [1, 100].
 */
export async function getCharacters(
  client: SupabaseClient<Database>,
  filters: CharacterFilters = {},
): Promise<CharacterRow[]> {
  const {
    characterType,
    significance,
    userId,
    search,
    published,
    hasMedia,
    sortBy = "name",
    sortDirection = "asc",
  } = filters;
  const safePage = Math.max(1, Math.floor(filters.page ?? 1));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(filters.pageSize ?? 20)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  // Same three-way embed trick as EventService.getEventsPage: "has at least
  // one" uses an !inner embed; "has none" needs a plain column embed (an
  // aggregate (count) embed combined with is.null returns the right count but
  // empty rows). No embed is added when hasMedia is omitted, matching
  // getCharacters' historical select("*") shape when the filter is unused.
  const mediaEmbed =
    hasMedia === true
      ? "character_media!inner(count)"
      : hasMedia === false
        ? "character_media(character_id)"
        : undefined;
  const selectClause = mediaEmbed !== undefined ? `*, ${mediaEmbed}` : "*";

  let query = client.from("characters").select(selectClause);

  if (characterType !== undefined) {
    if (Array.isArray(characterType)) {
      if (characterType.length === 1) {
        query = query.eq("character_type", characterType[0]!);
      } else if (characterType.length > 1) {
        query = query.in("character_type", characterType);
      }
    } else {
      query = query.eq("character_type", characterType);
    }
  }
  if (significance !== undefined) {
    if (Array.isArray(significance)) {
      if (significance.length === 1) {
        query = query.eq("significance", significance[0]!);
      } else if (significance.length > 1) {
        query = query.in("significance", significance);
      }
    } else {
      query = query.eq("significance", significance);
    }
  }
  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (published !== undefined) {
    query = query.eq("published", published);
  }
  if (hasMedia === false) {
    query = query.is("character_media", null);
  }
  if (search !== undefined && search.length > 0) {
    // Use PostgREST full-text search to leverage the GIN index on search_vector
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  const ascending = sortDirection === "asc";
  query = query.order(sortBy, { ascending }).range(from, to);

  const { data, error } = await query;
  assertNoError(error, "getCharacters");
  return (data ?? []) as unknown as CharacterRow[];
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
 * Enforces the animal-species invariant: an `animal` character must supply a
 * non-empty top-level `species`.
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

  // Animal characters require a non-empty top-level species column.
  assertAnimalHasSpecies(data.character_type, data.species, "createCharacter");

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
 * Validates the partial payload with Zod before patching.
 *
 * Type-specific `profile_data` is always validated: against the patched
 * `character_type` when present, otherwise against the stored type resolved by
 * a single narrow `select("character_type, species")` round-trip. Callers never
 * need to re-send `character_type` just to patch `profile_data`.
 *
 * The animal-species invariant is enforced on the *effective* values: effective
 * type is the patched type (else stored), effective species is the patched
 * species when that key is present (else stored). The fetch is skipped whenever
 * the patch cannot violate either check (e.g. no profile_data, and species is
 * either untouched or set to a non-empty value, and type is not being set to
 * animal without species).
 */
export async function updateCharacter(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<CharacterInput>,
): Promise<CharacterRow> {
  // Determine whether we need the stored row to resolve the effective
  // character_type and/or species. A single fetch covers both needs.
  const speciesPatched = data.species !== undefined;
  const speciesBlank =
    data.species !== undefined && data.species.trim().length === 0;
  const needsFetch =
    // profile_data present without a type in the patch → need stored type
    (data.profile_data !== undefined && data.character_type === undefined) ||
    // asserting/switching to animal without species in the patch → need stored species
    (data.character_type === "animal" && !speciesPatched) ||
    // blanking species without a type in the patch → need stored type
    (data.character_type === undefined && speciesBlank);

  let stored: { character_type: string; species: string | null } | null = null;
  if (needsFetch) {
    const { data: current, error: fetchError } = await client
      .from("characters")
      .select("character_type, species")
      .eq("id", id)
      .single();
    assertNoError(fetchError, "updateCharacter(fetchCurrent)");
    stored = current;
  }

  const effectiveType = data.character_type ?? stored?.character_type;

  // Validate type-specific profile_data. Spread profile_data first, then set
  // character_type authoritatively so the caller cannot override the type via
  // profile_data keys.
  if (data.profile_data !== undefined) {
    characterTypeProfileSchema.parse({
      ...data.profile_data,
      character_type: effectiveType,
    });
  }

  // Animal characters require a non-empty species. Resolve species from the
  // patch when present, otherwise from the stored row.
  const effectiveSpecies = speciesPatched ? data.species : stored?.species;
  assertAnimalHasSpecies(effectiveType, effectiveSpecies, "updateCharacter");

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
 *
 * Shape mirrors EventService.getEventParticipants (both select("*") from the
 * same junction table, filtered on the opposite FK) — see
 * event-service.test.ts for a cross-check that the two stay in sync.
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
): Promise<CharacterMediaRow | null> {
  // Idempotent: re-attaching an already-linked (character_id, media_id) pair is
  // a no-op via the composite PK. `ignoreDuplicates` leaves the existing row's
  // is_primary untouched and returns no row, so this resolves to `null` rather
  // than throwing 23505. Lets the same media be reused across entities.
  const { data, error } = await client
    .from("character_media")
    .upsert(
      {
        character_id: characterId,
        media_id: mediaId,
        is_primary: isPrimary,
      },
      { onConflict: "character_id,media_id", ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();

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
