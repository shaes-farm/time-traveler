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
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StoryWithRelations extends StoryRow {
  story_periods?: StoryPeriodRow[];
  story_characters?: StoryCharacterRow[];
  story_events?: StoryEventRow[];
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

/**
 * Return a paginated list of stories, optionally filtered.
 *
 * Implemented filters: `userId`, `narratorType`, full-text `search` (over the
 * generated `search_vector`), and pagination (`page`/`pageSize`). Results are
 * ordered by `created_at` descending.
 *
 * Deferred to the list-UI ticket (#62), per wireframe 18-stories-list.md:
 * published-state filter, tag filter, perspective-character filter, and
 * caller-selectable sort (`title` / `updated_at` / `created_at`).
 *
 * @param client - Supabase client instance
 * @param filters - Optional filters: userId, narratorType, search, page, pageSize
 * @returns Array of story rows ordered by created_at descending
 */
export async function getStories(
  client: SupabaseClient<Database>,
  filters: StoryFilters = {},
): Promise<StoryRow[]> {
  const { userId, narratorType, search, page, pageSize } = filters;

  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize ?? 20)));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (narratorType !== undefined) {
    query = query.eq("narrator_type", narratorType);
  }
  if (search !== undefined && search.trim().length > 0) {
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  const { data, error } = await query;
  assertNoError(error, "getStories");
  return data ?? [];
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
