import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { storySchema, narratorTypeEnum } from "../schemas/story";
import type { StoryInput } from "../schemas/story";
import { generateSlug, resolveCollision } from "../utils/slug";
import { MAX_SLUG_LENGTH } from "../schemas/slug";
import type { Database } from "../supabase/types";

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type StoryPeriodRow = Database["public"]["Tables"]["story_periods"]["Row"];
type StoryCharacterRow =
  Database["public"]["Tables"]["story_characters"]["Row"];
type StoryEventRow = Database["public"]["Tables"]["story_events"]["Row"];

/** Valid values for the role_in_story column of story_characters. */
export type StoryCharacterRole =
  "protagonist" | "supporting" | "mentioned" | "narrator";

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
  const validated = storySchema.partial().parse(data);
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
  const { data, error } = await client
    .from("story_characters")
    .insert({
      story_id: storyId,
      character_id: characterId,
      role_in_story: roleInStory,
    })
    .select()
    .single();
  assertNoError(error, "addCharacterToStory");
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
 * @param client - Supabase client instance
 * @param storyId - Story UUID
 * @param eventId - Event UUID
 * @param sortOrder - New editorial narrative order
 * @returns The updated junction row
 */
export async function reorderStoryEvent(
  client: SupabaseClient<Database>,
  storyId: string,
  eventId: string,
  sortOrder: number,
): Promise<StoryEventRow> {
  const { data, error } = await client
    .from("story_events")
    .update({ sort_order: sortOrder })
    .eq("story_id", storyId)
    .eq("event_id", eventId)
    .select()
    .single();
  assertNoError(error, "reorderStoryEvent");
  return data;
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
