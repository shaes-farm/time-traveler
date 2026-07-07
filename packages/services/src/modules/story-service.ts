import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  storySchema,
  storyBaseSchema,
  narratorTypeEnum,
  storyCharacterRoleEnum,
} from "../schemas/story";
import type { StoryInput } from "../schemas/story";
import { generateSlug, resolveCollision } from "../utils/slug";
import { MAX_SLUG_LENGTH } from "../schemas/slug";
import type { Database } from "../supabase/types";

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type StoryPeriodRow = Database["public"]["Tables"]["story_periods"]["Row"];
type StoryCharacterRow =
  Database["public"]["Tables"]["story_characters"]["Row"];
type StoryEventRow = Database["public"]["Tables"]["story_events"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

/** Valid values for the role_in_story column of story_characters. */
export type StoryCharacterRole = z.infer<typeof storyCharacterRoleEnum>;

/** An event row tagged with its editorial narrative order within a story. */
export interface StoryEventWithOrder extends EventRow {
  /** The sort_order from the story_events junction row (0 when not set). */
  junction_sort_order: number;
}

export interface StoryFilters {
  userId?: string;
  narratorType?: z.infer<typeof narratorTypeEnum>;
  /** Filter to stories told through a specific perspective character. */
  perspectiveCharacterId?: string;
  /** Match stories carrying ANY of these tags (SQL array overlap). */
  tags?: string[];
  /** When true → only published rows; false → only draft rows; omit → no filter. */
  published?: boolean;
  search?: string;
  /** Sort column. Defaults to "updated_at" (stories are work surfaces). */
  sortBy?: "title" | "created_at" | "updated_at";
  /** Sort direction. Defaults to "desc". */
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StoryWithRelations extends StoryRow {
  story_periods?: StoryPeriodRow[];
  story_characters?: StoryCharacterRow[];
  story_events?: StoryEventRow[];
}

/**
 * A story row as returned by getStoriesPage — carries the event and character
 * link counts the list renders on each row (`N ev · M ch`).
 */
export interface StoryListRow extends StoryRow {
  story_events: { count: number }[];
  story_characters: { count: number }[];
}

/** Paginated result from getStoriesPage — includes the total filtered count. */
export interface StoriesPage {
  rows: StoryListRow[];
  total: number;
}

/** Per-option counts for the stories list filter rail (see getStoryFacetCounts). */
export interface StoryFacetCounts {
  narratorType: Record<z.infer<typeof narratorTypeEnum>, number>;
  published: { published: number; draft: number };
}

export type CreateStoryInput = Omit<StoryInput, "slug"> & { slug?: string };

function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(`StoryService.${context}: ${error.message}`);
  }
}

/** Builder surface needed by applyStoryFilters. */
interface StoryFilterBuilder<T> {
  eq(column: string, value: string | boolean): T;
  overlaps(column: string, value: readonly string[]): T;
  not(column: string, op: string, value: boolean | null): T;
  textSearch(column: string, query: string, opts: { type: "websearch" }): T;
}

/**
 * Applies the owner, narrator-type, perspective-character, tag, published, and
 * full-text-search predicates shared by getStories, getStoriesPage, and every
 * getStoryFacetCounts per-option count query. Skip flags omit a group's own
 * predicate so counting that group's options isn't constrained by the group's
 * own current selection — the standard faceted-filter convention (mirrors
 * CharacterService.applyCharacterListFilters).
 */
function applyStoryFilters<T extends StoryFilterBuilder<T>>(
  builder: T,
  filters: StoryFilters,
  opts: { skipNarratorType?: boolean; skipPublished?: boolean } = {},
): T {
  let q = builder;
  const {
    userId,
    narratorType,
    perspectiveCharacterId,
    tags,
    published,
    search,
  } = filters;

  if (userId !== undefined) {
    q = q.eq("user_id", userId);
  }
  if (!opts.skipNarratorType && narratorType !== undefined) {
    q = q.eq("narrator_type", narratorType);
  }
  if (perspectiveCharacterId !== undefined) {
    q = q.eq("perspective_character_id", perspectiveCharacterId);
  }
  if (tags !== undefined && tags.length > 0) {
    q = q.overlaps("tags", tags);
  }
  if (!opts.skipPublished && published !== undefined) {
    // "draft" (published === false) must also match NULL rows — `published` is
    // nullable, and the list badge renders NULL as "Draft", so the filter must
    // too. `not.is.true` = published IS NOT TRUE. Mirrors CharacterService (#331).
    q = published ? q.eq("published", true) : q.not("published", "is", true);
  }
  if (search !== undefined && search.trim().length > 0) {
    q = q.textSearch("search_vector", search, { type: "websearch" });
  }
  return q;
}

/**
 * Return a paginated list of stories, optionally filtered.
 *
 * Filters: `userId`, `narratorType`, `perspectiveCharacterId`, `tags` (array
 * overlap — matches ANY), `published`, and full-text `search` (over the
 * generated `search_vector`). Sorts by `sortBy`/`sortDirection` (default
 * `updated_at` desc — stories are work surfaces, per wireframe 18) with an `id`
 * tie-break for deterministic paging.
 *
 * `page` is clamped to ≥ 1; `pageSize` is clamped to [1, 100].
 *
 * @param client - Supabase client instance
 * @param filters - Optional filters + sort + pagination
 * @returns Array of story rows in the requested order
 */
export async function getStories(
  client: SupabaseClient<Database>,
  filters: StoryFilters = {},
): Promise<StoryRow[]> {
  const { sortBy = "updated_at", sortDirection = "desc" } = filters;

  const safePage = Math.max(1, Math.floor(filters.page ?? 1));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(filters.pageSize ?? 20)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const base = client.from("stories").select("*");
  let query = applyStoryFilters(
    base as unknown as StoryFilterBuilder<typeof base>,
    filters,
  ) as unknown as typeof base;

  const ascending = sortDirection === "asc";
  query = query
    .order(sortBy, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  const { data, error } = await query;
  assertNoError(error, "getStories");
  return data ?? [];
}

/**
 * Returns a page of stories together with the total filtered count and the
 * event/character link counts the stories list renders on each row.
 *
 * Supports the same filter + sort set as getStories. `page` is clamped to ≥ 1;
 * `pageSize` is clamped to [1, 100].
 */
export async function getStoriesPage(
  client: SupabaseClient<Database>,
  filters: StoryFilters = {},
): Promise<StoriesPage> {
  const { sortBy = "updated_at", sortDirection = "desc" } = filters;

  const safePage = Math.max(1, Math.floor(filters.page ?? 1));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(filters.pageSize ?? 20)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const base = client
    .from("stories")
    .select("*, story_events(count), story_characters(count)", {
      count: "exact",
    });
  let query = applyStoryFilters(
    base as unknown as StoryFilterBuilder<typeof base>,
    filters,
  ) as unknown as typeof base;

  const ascending = sortDirection === "asc";
  query = query
    .order(sortBy, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  const { data, count, error } = await query;
  assertNoError(error, "getStoriesPage");

  return {
    rows: (data ?? []) as unknown as StoryListRow[],
    total: count ?? 0,
  };
}

/**
 * Fetch a single story by its UUID, including junction relations.
 *
 * @param client - Supabase client instance
 * @param id - Story UUID
 * @returns The matching story row with relations
 */
export async function getStoryById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<StoryWithRelations> {
  const { data, error } = await client
    .from("stories")
    .select("*, story_periods(*), story_characters(*), story_events(*)")
    .eq("id", id)
    .single();
  assertNoError(error, "getStoryById");
  return data as StoryWithRelations;
}

/**
 * Fetch a single story by its owner and slug, including junction relations.
 *
 * @param client - Supabase client instance
 * @param userId - Owner's user UUID
 * @param slug - Story slug
 * @returns The matching story row with relations
 */
export async function getStoryBySlug(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<StoryWithRelations> {
  const { data, error } = await client
    .from("stories")
    .select("*, story_periods(*), story_characters(*), story_events(*)")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();
  assertNoError(error, "getStoryBySlug");
  return data as StoryWithRelations;
}

/**
 * Create a new story. Slug is auto-generated from the title if not supplied;
 * uniqueness collisions are retried up to 3 times using suffix tokens.
 *
 * @param client - Supabase client instance
 * @param data - Story data (slug optional)
 * @returns The newly created story row
 */
export async function createStory(
  client: SupabaseClient<Database>,
  data: CreateStoryInput,
): Promise<StoryRow> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createStory.getUser");
  if (user === null) {
    throw new Error("StoryService.createStory: no authenticated user");
  }
  const userId = user.id;

  // Pre-fetch existing slugs to resolve collisions before the insert
  const { data: existing, error: slugError } = await client
    .from("stories")
    .select("slug")
    .eq("user_id", userId);
  assertNoError(slugError, "createStory(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  const baseSlug =
    data.slug !== undefined && data.slug.length > 0
      ? data.slug
      : generateSlug(data.title);
  const slug = resolveCollision(baseSlug, existingSlugs);

  type StoryInsert = Database["public"]["Tables"]["stories"]["Insert"];

  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const validated = storySchema.parse({ ...data, slug: attemptSlug });

    const { data: row, error: insertError } = await client
      .from("stories")
      .insert({
        ...(validated as unknown as StoryInsert),
        user_id: userId,
      })
      .select()
      .single();

    if (insertError !== null) {
      if (insertError.code === "23505" && attempt < MAX_SLUG_RETRIES - 1) {
        const suffix = Math.random().toString(36).slice(2, 6);
        const truncated = slug.slice(0, MAX_SLUG_LENGTH - 5).replace(/-+$/, "");
        attemptSlug = `${truncated}-${suffix}`;
        continue;
      }
      assertNoError(insertError, "createStory");
    }

    return row as StoryRow;
  }

  // Unreachable: loop always returns or assertNoError throws
  throw new Error("StoryService.createStory: unreachable");
}

/**
 * Apply a partial update to a story.
 *
 * The first-person perspective rule is enforced conservatively for partial
 * updates, without re-reading the stored row. A patch that explicitly clears
 * `perspective_character_id` is rejected unless it also explicitly sets
 * `narrator_type` to a non-first-person value — clearing the perspective while
 * leaving the narrator as (a possibly-stored) `first_person` would strand the
 * story in an invalid state. A patch that switches to first-person while
 * omitting `perspective_character_id` is still allowed, since it may rely on an
 * already-persisted perspective character.
 *
 * @param client - Supabase client instance
 * @param id - Story UUID
 * @param data - Partial story fields to update
 * @returns The updated story row
 */
export async function updateStory(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<StoryInput>,
): Promise<StoryRow> {
  const validated = storyBaseSchema.partial().parse(data);

  // Reject an explicit clear of the perspective character unless the same patch
  // declares a non-first-person narrator. Because there is no DB CHECK tying the
  // two columns together and we do not re-read the stored row, this is the only
  // way to keep the service from leaving an existing first_person story without
  // a perspective character.
  const clearingPerspective =
    "perspective_character_id" in validated &&
    validated.perspective_character_id == null;
  const settingNonFirstPerson =
    validated.narrator_type !== undefined &&
    validated.narrator_type !== "first_person";

  if (clearingPerspective && !settingNonFirstPerson) {
    throw new Error(
      "StoryService.updateStory: perspective_character_id is required when narrator_type is first_person",
    );
  }

  const { data: updated, error } = await client
    .from("stories")
    .update(validated)
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "updateStory");
  return updated;
}

/**
 * Delete a story by its UUID.
 *
 * @param client - Supabase client instance
 * @param id - Story UUID
 */
export async function deleteStory(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await client.from("stories").delete().eq("id", id);
  assertNoError(error, "deleteStory");
}

/**
 * Marks a story as published and records `published_at`.
 *
 * Stories carry no publish precondition (unlike timelines, which gate on event
 * count) — the story wireframes specify none. Publishing is owner-gated in the
 * UI and re-checked by RLS on the write path (defense in depth).
 */
export async function publishStory(
  client: SupabaseClient<Database>,
  id: string,
): Promise<StoryRow> {
  const { data, error } = await client
    .from("stories")
    .update({ published: true, published_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "publishStory");
  return data;
}

/**
 * Reverts a story to unpublished state and clears `published_at`.
 */
export async function unpublishStory(
  client: SupabaseClient<Database>,
  id: string,
): Promise<StoryRow> {
  const { data, error } = await client
    .from("stories")
    .update({ published: false, published_at: null })
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "unpublishStory");
  return data;
}

// ---------------------------------------------------------------------------
// Facet counts
// ---------------------------------------------------------------------------

/** Builder surface for the per-option count predicates (`.eq`, `.not`). */
interface StoryCountPredicateBuilder {
  eq(column: string, value: string | boolean): StoryCountPredicateBuilder;
  not(
    column: string,
    op: string,
    value: boolean | null,
  ): StoryCountPredicateBuilder;
}

/** One head-count round-trip: count stories matching the base filters plus `apply`. */
async function countStoriesWith(
  client: SupabaseClient<Database>,
  filters: StoryFilters,
  skip: { skipNarratorType?: boolean; skipPublished?: boolean },
  apply: (q: StoryCountPredicateBuilder) => StoryCountPredicateBuilder,
  context: string,
): Promise<number> {
  const base = client
    .from("stories")
    .select("*", { count: "exact", head: true });
  const filtered = applyStoryFilters(
    base as unknown as StoryFilterBuilder<typeof base>,
    filters,
    skip,
  ) as unknown as typeof base;
  apply(filtered as unknown as StoryCountPredicateBuilder);
  const { count, error } = await filtered;
  assertNoError(error, context);
  return count ?? 0;
}

/**
 * Returns per-option counts for the stories list filter rail. The narrator-type
 * and published groups are each counted with their OWN selection removed (so
 * toggling an option within a group does not zero out its siblings) but with
 * the other groups + owner + perspective + tags + search applied — OR within a
 * group, AND across groups. Mirrors CharacterService.getCharacterFacetCounts.
 *
 * Perspective (a combobox) and tags (a free-form chip input) are not enumerable
 * facets, so they contribute no per-option counts.
 */
export async function getStoryFacetCounts(
  client: SupabaseClient<Database>,
  filters: StoryFilters = {},
): Promise<StoryFacetCounts> {
  const narratorOptions = narratorTypeEnum.options;

  const [narratorCounts, publishedCount, draftCount] = await Promise.all([
    Promise.all(
      narratorOptions.map((n) =>
        countStoriesWith(
          client,
          filters,
          { skipNarratorType: true },
          (q) => q.eq("narrator_type", n),
          "getStoryFacetCounts.narratorType",
        ),
      ),
    ),
    countStoriesWith(
      client,
      filters,
      { skipPublished: true },
      (q) => q.eq("published", true),
      "getStoryFacetCounts.published.published",
    ),
    countStoriesWith(
      client,
      filters,
      { skipPublished: true },
      // Draft = published IS NOT TRUE (false OR null), matching the list badge
      // and the getStories draft filter.
      (q) => q.not("published", "is", true),
      "getStoryFacetCounts.published.draft",
    ),
  ]);

  return {
    narratorType: {
      first_person:
        narratorCounts[narratorOptions.indexOf("first_person")] ?? 0,
      third_person:
        narratorCounts[narratorOptions.indexOf("third_person")] ?? 0,
      omniscient: narratorCounts[narratorOptions.indexOf("omniscient")] ?? 0,
    },
    published: { published: publishedCount, draft: draftCount },
  };
}

/**
 * Associate a character with a story via the story_characters junction.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param characterId - Character UUID
 * @param roleInStory - Character's role; defaults to 'mentioned'
 * @returns The created junction row
 */
export async function addCharacterToStory(
  client: SupabaseClient<Database>,
  storyId: string,
  characterId: string,
  roleInStory: StoryCharacterRole = "mentioned",
): Promise<StoryCharacterRow> {
  const role = storyCharacterRoleEnum.parse(roleInStory);
  const { data, error } = await client
    .from("story_characters")
    .insert({
      story_id: storyId,
      character_id: characterId,
      role_in_story: role,
    })
    .select()
    .single();
  assertNoError(error, "addCharacterToStory");
  return data;
}

/**
 * Change the `role_in_story` of an existing story↔character link.
 *
 * Unlike {@link addCharacterToStory}, this updates a row that already exists,
 * supporting the inline role select on the story detail page. The role is
 * validated against {@link storyCharacterRoleEnum} before the update.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param characterId - Character UUID
 * @param roleInStory - New role for the character within the story
 * @returns The updated junction row
 */
export async function updateStoryCharacterRole(
  client: SupabaseClient<Database>,
  storyId: string,
  characterId: string,
  roleInStory: StoryCharacterRole,
): Promise<StoryCharacterRow> {
  const role = storyCharacterRoleEnum.parse(roleInStory);
  const { data, error } = await client
    .from("story_characters")
    .update({ role_in_story: role })
    .eq("story_id", storyId)
    .eq("character_id", characterId)
    .select()
    .single();
  assertNoError(error, "updateStoryCharacterRole");
  return data;
}

/**
 * Remove the association between a character and a story.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param characterId - Character UUID
 */
export async function removeCharacterFromStory(
  client: SupabaseClient<Database>,
  storyId: string,
  characterId: string,
): Promise<void> {
  const { error } = await client
    .from("story_characters")
    .delete()
    .eq("story_id", storyId)
    .eq("character_id", characterId);
  assertNoError(error, "removeCharacterFromStory");
}

/**
 * Associate an event with a story via the story_events junction.
 *
 * `sortOrder` defaults to 0; when all rows for a story share the default,
 * consumers should fall back to ordering by the joined `events.sort_order_years`
 * (chronological order). Set a non-zero value to enforce an editorial narrative
 * order (e.g., flashbacks, thematic grouping). Mirrors
 * `timeline-service.addEventToTimeline`.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param eventId - Event UUID
 * @param sortOrder - Editorial narrative order; defaults to 0
 * @returns The created junction row
 */
export async function addEventToStory(
  client: SupabaseClient<Database>,
  storyId: string,
  eventId: string,
  sortOrder = 0,
): Promise<StoryEventRow> {
  const { data, error } = await client
    .from("story_events")
    .insert({ story_id: storyId, event_id: eventId, sort_order: sortOrder })
    .select()
    .single();
  assertNoError(error, "addEventToStory");
  return data;
}

/**
 * Remove the association between an event and a story.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param eventId - Event UUID
 */
export async function removeEventFromStory(
  client: SupabaseClient<Database>,
  storyId: string,
  eventId: string,
): Promise<void> {
  const { error } = await client
    .from("story_events")
    .delete()
    .eq("story_id", storyId)
    .eq("event_id", eventId);
  assertNoError(error, "removeEventFromStory");
}

/**
 * Set the editorial narrative `sort_order` for a single story↔event link.
 *
 * Upserts on `(story_id, event_id)` — mirrors
 * `timeline-service.setTimelineEventSortOrder` — so reordering creates the
 * junction row if it does not yet exist rather than silently affecting zero
 * rows.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param eventId - Event UUID
 * @param sortOrder - New editorial narrative order
 * @returns The upserted junction row
 */
export async function reorderStoryEvent(
  client: SupabaseClient<Database>,
  storyId: string,
  eventId: string,
  sortOrder: number,
): Promise<StoryEventRow> {
  const { data, error } = await client
    .from("story_events")
    .upsert(
      { story_id: storyId, event_id: eventId, sort_order: sortOrder },
      { onConflict: "story_id,event_id" },
    )
    .select()
    .single();
  assertNoError(error, "reorderStoryEvent");
  return data;
}

/**
 * Return a story's events in narrative display order.
 *
 * If any junction row carries a non-zero `sort_order`, results are ordered by
 * that editorial order, with unplaced events (`sort_order === 0`) pushed last.
 * Otherwise results fall back to `events.sort_order_years` ascending
 * (chronological). Both modes use a stable chronology-then-id tie-break so the
 * order is deterministic across fetches. Mirrors
 * `timeline-service.getTimelineEventsUnion`, minus the "home" events concept —
 * every story event is a junction link.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @returns Event rows tagged with their junction sort_order, in display order
 */
export async function getStoryEvents(
  client: SupabaseClient<Database>,
  storyId: string,
): Promise<StoryEventWithOrder[]> {
  const { data, error } = await client
    .from("story_events")
    .select("sort_order, events(*)")
    .eq("story_id", storyId);
  assertNoError(error, "getStoryEvents");

  const rows = (data ?? []) as unknown as Array<{
    sort_order: number | null;
    events: EventRow | null;
  }>;

  const merged: StoryEventWithOrder[] = rows
    .filter((r): r is { sort_order: number | null; events: EventRow } =>
      Boolean(r.events),
    )
    .map((r) => ({ ...r.events, junction_sort_order: r.sort_order ?? 0 }));

  const hasEditorialOrder = merged.some((e) => e.junction_sort_order !== 0);

  // Stable tie-break shared by both ordering modes so the list is deterministic
  // across fetches (DB row order is not guaranteed): chronological, then id.
  // Undated events (`sort_order_years` null) sort last, matching the repo's
  // usual `nullsFirst: false` ordering. Compare with `<` rather than
  // subtraction so two +Infinity values don't yield `NaN`.
  const byChronologyThenId = (
    a: StoryEventWithOrder,
    b: StoryEventWithOrder,
  ) => {
    const ay = a.sort_order_years ?? Number.POSITIVE_INFINITY;
    const by = b.sort_order_years ?? Number.POSITIVE_INFINITY;
    if (ay !== by) return ay < by ? -1 : 1;
    return a.id.localeCompare(b.id);
  };

  if (hasEditorialOrder) {
    merged.sort((a, b) => {
      // Treat sort_order=0 as "not yet placed" and push those events after
      // explicit positions.
      if (a.junction_sort_order === 0 && b.junction_sort_order !== 0) return 1;
      if (a.junction_sort_order !== 0 && b.junction_sort_order === 0) return -1;
      return (
        a.junction_sort_order - b.junction_sort_order ||
        byChronologyThenId(a, b)
      );
    });
  } else {
    merged.sort(byChronologyThenId);
  }

  return merged;
}

/**
 * Associate a period with a story via the story_periods junction.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param periodId - Period UUID
 * @returns The created junction row
 */
export async function addPeriodToStory(
  client: SupabaseClient<Database>,
  storyId: string,
  periodId: string,
): Promise<StoryPeriodRow> {
  const { data, error } = await client
    .from("story_periods")
    .insert({ story_id: storyId, period_id: periodId })
    .select()
    .single();
  assertNoError(error, "addPeriodToStory");
  return data;
}

/**
 * Remove the association between a period and a story.
 *
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param periodId - Period UUID
 */
export async function removePeriodFromStory(
  client: SupabaseClient<Database>,
  storyId: string,
  periodId: string,
): Promise<void> {
  const { error } = await client
    .from("story_periods")
    .delete()
    .eq("story_id", storyId)
    .eq("period_id", periodId);
  assertNoError(error, "removePeriodFromStory");
}
