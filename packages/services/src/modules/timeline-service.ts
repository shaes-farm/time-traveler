import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { timelineSchema } from "../schemas/timeline.js";
import type { TimelineInput } from "../schemas/timeline.js";
import { generateSlug, resolveCollision } from "../utils/slug.js";
import type { Database } from "../supabase/types.js";

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type TimelineRow = Database["public"]["Tables"]["timelines"]["Row"];

type CollaboratorRow =
  Database["public"]["Tables"]["timeline_collaborators"]["Row"];

type TimelineEventRow = Database["public"]["Tables"]["timeline_events"]["Row"];

type TimelineMediaRow = Database["public"]["Tables"]["timeline_media"]["Row"];

/** Roles as defined by the DB CHECK constraint on timeline_collaborators.role */
export type CollaboratorRole = "viewer" | "editor" | "admin";

/** Optional filters accepted by getTimelines */
export interface TimelineFilters {
  visibility?: "private" | "public" | "shared";
  userId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** A timeline row with its related junction rows eagerly loaded */
export interface TimelineWithRelations extends TimelineRow {
  timeline_collaborators: CollaboratorRow[];
  timeline_events: TimelineEventRow[];
  timeline_media: TimelineMediaRow[];
}

/**
 * Input for createTimeline — slug is derived from title automatically.
 * Uses the Zod *input* type so that fields with schema defaults (timeline_type,
 * visibility, fractal_depth) are optional for callers.
 */
export type CreateTimelineInput = Omit<
  z.input<typeof timelineSchema>,
  "slug"
> & {
  slug?: string;
};

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
    throw new Error(`TimelineService.${context}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Returns a page of timelines, optionally filtered by visibility, owner, or
 * full-text search using the `search_vector` GIN index.
 *
 * `page` is clamped to ≥ 1; `pageSize` is clamped to [1, 100].
 */
export async function getTimelines(
  client: SupabaseClient<Database>,
  filters: TimelineFilters = {},
): Promise<TimelineRow[]> {
  const { visibility, userId, search } = filters;
  const safePage = Math.max(1, Math.floor(filters.page ?? 1));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(filters.pageSize ?? 20)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client.from("timelines").select("*");

  if (visibility !== undefined) {
    query = query.eq("visibility", visibility);
  }
  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (search !== undefined && search.length > 0) {
    // Use PostgREST full-text search to leverage the GIN index on search_vector
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  query = query.range(from, to).order("sort_order_start", { ascending: true });

  const { data, error } = await query;
  assertNoError(error, "getTimelines");
  return data ?? [];
}

/**
 * Fetches a single timeline by UUID, including collaborators, linked events,
 * and linked media.
 */
export async function getTimelineById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<TimelineWithRelations> {
  const { data, error } = await client
    .from("timelines")
    .select(
      "*, timeline_collaborators(*), timeline_events(*), timeline_media(*)",
    )
    .eq("id", id)
    .single();

  assertNoError(error, "getTimelineById");
  return data as TimelineWithRelations;
}

/**
 * Fetches a single timeline by (userId, slug), including collaborators, linked
 * events, and linked media.
 *
 * Both `userId` and `slug` are required because the DB uniqueness constraint is
 * `UNIQUE (user_id, slug)` — slug alone is not globally unique.
 */
export async function getTimelineBySlug(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<TimelineWithRelations> {
  const { data, error } = await client
    .from("timelines")
    .select(
      "*, timeline_collaborators(*), timeline_events(*), timeline_media(*)",
    )
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();

  assertNoError(error, "getTimelineBySlug");
  return data as TimelineWithRelations;
}

/**
 * Creates a new timeline. The slug is auto-generated from the title; callers
 * may supply an explicit slug which is used as the base (but still subject to
 * collision resolution against existing user slugs).
 *
 * Validates the payload with the Zod `timelineSchema` before inserting.
 */
export async function createTimeline(
  client: SupabaseClient<Database>,
  data: CreateTimelineInput,
): Promise<TimelineRow> {
  // Identify the current user so we can scope slug collision checks
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createTimeline(auth.getUser)");
  if (user === null) {
    throw new Error("TimelineService.createTimeline: no authenticated user");
  }

  // Fetch existing slugs for this user to resolve collisions
  const { data: existing, error: slugError } = await client
    .from("timelines")
    .select("slug")
    .eq("user_id", user.id);
  assertNoError(slugError, "createTimeline(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  const baseSlug =
    data.slug !== undefined && data.slug.length > 0
      ? data.slug
      : generateSlug(data.title);
  const slug = resolveCollision(baseSlug, existingSlugs);

  type TimelineInsert = Database["public"]["Tables"]["timelines"]["Insert"];

  // Retry up to 3 times on unique-violation (23505) — guards against the race
  // where two concurrent createTimeline calls compute the same available slug
  // and one wins the DB insert.
  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const attemptValidated = timelineSchema.parse({
      ...data,
      slug: attemptSlug,
    });
    const { data: row, error: insertError } = await client
      .from("timelines")
      .insert({
        ...(attemptValidated as unknown as TimelineInsert),
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError !== null) {
      if (insertError.code === "23505" && attempt < MAX_SLUG_RETRIES - 1) {
        // Collision — append a random 4-char hex suffix and retry
        attemptSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        continue;
      }
      // Non-collision error or exhausted retries — throw
      assertNoError(insertError, "createTimeline");
    }

    return row as TimelineRow;
  }

  // Unreachable: loop always returns or assertNoError throws
  throw new Error("TimelineService.createTimeline: unreachable");
}

/**
 * Applies a partial update to a timeline. Only supplied fields are mutated.
 * Validates the partial payload with Zod before patching.
 */
export async function updateTimeline(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<TimelineInput>,
): Promise<TimelineRow> {
  const validated = timelineSchema.partial().parse(data);

  type TimelineUpdate = Database["public"]["Tables"]["timelines"]["Update"];
  const { data: row, error } = await client
    .from("timelines")
    .update(validated as unknown as TimelineUpdate)
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "updateTimeline");
  return row as TimelineRow;
}

/**
 * Permanently deletes a timeline. The `ON DELETE CASCADE` constraint in the
 * DB automatically removes all junction rows (timeline_events, timeline_media,
 * timeline_collaborators) for the deleted timeline.
 */
export async function deleteTimeline(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await client.from("timelines").delete().eq("id", id);
  assertNoError(error, "deleteTimeline");
}

/**
 * Marks a timeline as published and records `published_at`.
 */
export async function publishTimeline(
  client: SupabaseClient<Database>,
  id: string,
): Promise<TimelineRow> {
  const { data, error } = await client
    .from("timelines")
    .update({ published: true, published_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "publishTimeline");
  return data as TimelineRow;
}

/**
 * Reverts a timeline to unpublished state and clears `published_at`.
 */
export async function unpublishTimeline(
  client: SupabaseClient<Database>,
  id: string,
): Promise<TimelineRow> {
  const { data, error } = await client
    .from("timelines")
    .update({ published: false, published_at: null })
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "unpublishTimeline");
  return data as TimelineRow;
}

// ---------------------------------------------------------------------------
// Collaborator management
// ---------------------------------------------------------------------------

/**
 * Lists all collaborators for a timeline.
 *
 * ⚠️ Known limitation: profile data (display names, avatars) is NOT joined
 * because `timeline_collaborators` has no FK to a public `profiles` table in
 * the current schema. Callers that need display names must fetch profiles
 * separately by `user_id`. This is intentional pending issue #23 or a
 * dedicated collaborator view — update this function once that work lands.
 */
export async function getCollaborators(
  client: SupabaseClient<Database>,
  timelineId: string,
): Promise<CollaboratorRow[]> {
  const { data, error } = await client
    .from("timeline_collaborators")
    .select("*")
    .eq("timeline_id", timelineId);

  assertNoError(error, "getCollaborators");
  return data ?? [];
}

/**
 * Adds a collaborator to a timeline with the given role.
 * Throws if the (timelineId, userId) pair already exists (DB unique PK).
 */
export async function addCollaborator(
  client: SupabaseClient<Database>,
  timelineId: string,
  userId: string,
  role: CollaboratorRole,
): Promise<CollaboratorRow> {
  const { data, error } = await client
    .from("timeline_collaborators")
    .insert({ timeline_id: timelineId, user_id: userId, role })
    .select()
    .single();

  assertNoError(error, "addCollaborator");
  return data;
}

/**
 * Removes a collaborator from a timeline.
 */
export async function removeCollaborator(
  client: SupabaseClient<Database>,
  timelineId: string,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from("timeline_collaborators")
    .delete()
    .eq("timeline_id", timelineId)
    .eq("user_id", userId);

  assertNoError(error, "removeCollaborator");
}

/**
 * Updates the role of an existing collaborator.
 */
export async function updateCollaboratorRole(
  client: SupabaseClient<Database>,
  timelineId: string,
  userId: string,
  role: CollaboratorRole,
): Promise<CollaboratorRow> {
  const { data, error } = await client
    .from("timeline_collaborators")
    .update({ role })
    .eq("timeline_id", timelineId)
    .eq("user_id", userId)
    .select()
    .single();

  assertNoError(error, "updateCollaboratorRole");
  return data;
}

// ---------------------------------------------------------------------------
// Junction: timeline_events
// ---------------------------------------------------------------------------

/**
 * Links an event to a timeline via the `timeline_events` junction table.
 *
 * // DECISION NEEDED: The issue spec mentions a `sortOrder` parameter but the
 * //  `timeline_events` junction table has no `sort_order` column (unlike
 * //  `timeline_media`). This function omits sortOrder until the schema is
 * //  updated or a decision is made to add the column. Tracked in #122.
 */
export async function addEventToTimeline(
  client: SupabaseClient<Database>,
  timelineId: string,
  eventId: string,
): Promise<TimelineEventRow> {
  const { data, error } = await client
    .from("timeline_events")
    .insert({ timeline_id: timelineId, event_id: eventId })
    .select()
    .single();

  assertNoError(error, "addEventToTimeline");
  return data;
}

/**
 * Removes the link between an event and a timeline.
 */
export async function removeEventFromTimeline(
  client: SupabaseClient<Database>,
  timelineId: string,
  eventId: string,
): Promise<void> {
  const { error } = await client
    .from("timeline_events")
    .delete()
    .eq("timeline_id", timelineId)
    .eq("event_id", eventId);

  assertNoError(error, "removeEventFromTimeline");
}

// ---------------------------------------------------------------------------
// Junction: timeline_media
// ---------------------------------------------------------------------------

/**
 * Links a media item to a timeline. `sortOrder` defaults to 0 and determines
 * the display order of media within the timeline.
 */
export async function addMediaToTimeline(
  client: SupabaseClient<Database>,
  timelineId: string,
  mediaId: string,
  sortOrder = 0,
): Promise<TimelineMediaRow> {
  const { data, error } = await client
    .from("timeline_media")
    .insert({
      timeline_id: timelineId,
      media_id: mediaId,
      sort_order: sortOrder,
    })
    .select()
    .single();

  assertNoError(error, "addMediaToTimeline");
  return data;
}
