import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { eventSchema, eventTypeEnum } from "../schemas/event";
import type { EventInput } from "../schemas/event";
import { generateSlug, resolveCollision } from "../utils/slug";
import { MAX_SLUG_LENGTH } from "../schemas/slug";
import type { Database } from "../supabase/types";

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type EventRow = Database["public"]["Tables"]["events"]["Row"];

type EventCategoryRow = Database["public"]["Tables"]["event_categories"]["Row"];

type EventMediaRow = Database["public"]["Tables"]["event_media"]["Row"];

type EventCharacterRow =
  Database["public"]["Tables"]["event_characters"]["Row"];

/** A role in an event as defined by the DB CHECK constraint on event_characters.role */
export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "witness"
  | "participant"
  | "victim"
  | "beneficiary"
  | "performer"
  | "competitor"
  | "owner"
  | "creator"
  | "observer";

/** Significance level as defined by the DB CHECK constraint on event_characters.significance */
export type CharacterSignificance =
  | "primary"
  | "secondary"
  | "minor"
  | "mentioned";

/** Optional filters accepted by getEvents */
export interface EventFilters {
  eventType?: z.infer<typeof eventTypeEnum>;
  importance?: number;
  timelineId?: string;
  userId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** An event row with its related junction rows eagerly loaded */
export interface EventWithRelations extends EventRow {
  event_categories: EventCategoryRow[];
  event_media: EventMediaRow[];
  event_characters: EventCharacterRow[];
}

/**
 * Input for createEvent — slug is derived from title automatically.
 * Uses the Zod *input* type so that fields with schema defaults (event_type,
 * importance) are optional for callers.
 */
export type CreateEventInput = Omit<z.input<typeof eventSchema>, "slug"> & {
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
    throw new Error(`EventService.${context}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Returns a page of events, optionally filtered by event type, importance,
 * timeline, owner, or full-text search using the `search_vector` GIN index.
 *
 * `page` is clamped to ≥ 1; `pageSize` is clamped to [1, 100].
 */
export async function getEvents(
  client: SupabaseClient<Database>,
  filters: EventFilters = {},
): Promise<EventRow[]> {
  const { eventType, importance, timelineId, userId, search } = filters;
  const safePage = Math.max(1, Math.floor(filters.page ?? 1));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(filters.pageSize ?? 20)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client.from("events").select("*");

  if (eventType !== undefined) {
    query = query.eq("event_type", eventType);
  }
  if (importance !== undefined) {
    query = query.eq("importance", importance);
  }
  if (timelineId !== undefined) {
    query = query.eq("timeline_id", timelineId);
  }
  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (search !== undefined && search.length > 0) {
    // Use PostgREST full-text search to leverage the GIN index on search_vector
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  query = query.range(from, to).order("sort_order_years", { ascending: true });

  const { data, error } = await query;
  assertNoError(error, "getEvents");
  return data ?? [];
}

/**
 * Fetches a single event by UUID, including categories, media, and characters.
 */
export async function getEventById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<EventWithRelations> {
  const { data, error } = await client
    .from("events")
    .select("*, event_categories(*), event_media(*), event_characters(*)")
    .eq("id", id)
    .single();

  assertNoError(error, "getEventById");
  return data as EventWithRelations;
}

/**
 * Fetches a single event by (userId, slug), including categories, media, and
 * characters.
 *
 * Both `userId` and `slug` are required because the DB uniqueness constraint is
 * `UNIQUE (user_id, slug)` — slug alone is not globally unique.
 */
export async function getEventBySlug(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<EventWithRelations> {
  const { data, error } = await client
    .from("events")
    .select("*, event_categories(*), event_media(*), event_characters(*)")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();

  assertNoError(error, "getEventBySlug");
  return data as EventWithRelations;
}

/**
 * Creates a new event. The slug is auto-generated from the title; callers may
 * supply an explicit slug which is used as the base (but still subject to
 * collision resolution against existing user slugs).
 *
 * Validates the payload with the Zod `eventSchema` before inserting.
 * `sort_order_years` and `sort_order_end` are GENERATED ALWAYS AS columns and
 * are computed by the database automatically from `temporal_data` and
 * `end_temporal_data`.
 */
export async function createEvent(
  client: SupabaseClient<Database>,
  data: CreateEventInput,
): Promise<EventRow> {
  // Identify the current user so we can scope slug collision checks
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createEvent(auth.getUser)");
  if (user === null) {
    throw new Error("EventService.createEvent: no authenticated user");
  }

  // Fetch existing slugs for this user to resolve collisions
  const { data: existing, error: slugError } = await client
    .from("events")
    .select("slug")
    .eq("user_id", user.id);
  assertNoError(slugError, "createEvent(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  const baseSlug =
    data.slug !== undefined && data.slug.length > 0
      ? data.slug
      : generateSlug(data.title);
  const slug = resolveCollision(baseSlug, existingSlugs);

  type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

  // Retry up to 3 times on unique-violation (23505) — guards against the race
  // where two concurrent createEvent calls compute the same available slug
  // and one wins the DB insert.
  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const attemptValidated = eventSchema.parse({
      ...data,
      slug: attemptSlug,
    });

    const { data: row, error: insertError } = await client
      .from("events")
      .insert({
        ...(attemptValidated as unknown as EventInsert),
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError !== null) {
      if (insertError.code === "23505" && attempt < MAX_SLUG_RETRIES - 1) {
        // Collision — append a random 4-char base-36 suffix and retry.
        // Truncate the base slug to fit the suffix (hyphen + 4 chars = 5),
        // then strip any trailing hyphens so the result never contains
        // consecutive or leading/trailing hyphens that would fail slugSchema.
        const suffix = Math.random().toString(36).slice(2, 6);
        const truncated = slug.slice(0, MAX_SLUG_LENGTH - 5).replace(/-+$/, "");
        attemptSlug = `${truncated}-${suffix}`;
        continue;
      }
      // Non-collision error or exhausted retries — throw
      assertNoError(insertError, "createEvent");
    }

    return row as EventRow;
  }

  // Unreachable: loop always returns or assertNoError throws
  throw new Error("EventService.createEvent: unreachable");
}

/**
 * Applies a partial update to an event. Only supplied fields are mutated.
 * Validates the partial payload with Zod before patching.
 */
export async function updateEvent(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<EventInput>,
): Promise<EventRow> {
  const validated = eventSchema.partial().parse(data);

  if (
    validated.detail_timeline_id !== undefined &&
    validated.timeline_id !== undefined &&
    validated.detail_timeline_id === validated.timeline_id
  ) {
    throw new Error(
      "EventService.updateEvent: detail_timeline_id cannot equal timeline_id (fractal cycle)",
    );
  }

  // The "expands into" drill-down can be set through a plain update, so the
  // fractal-cycle guard that setEventDetailTimeline applies must also run here
  // (an event must not expand into a timeline that transitively contains it).
  // Both fields are `string | null | undefined` after parsing:
  //   - undefined → field not present in the update payload (no change)
  //   - null      → explicitly clearing the association (no cycle possible)
  //   - string    → setting a new association (cycle check required)
  if (validated.detail_timeline_id != null) {
    await assertNoDetailTimelineCycle(client, id, validated.detail_timeline_id);

    // When `timeline_id` and `detail_timeline_id` are updated together, also
    // ensure the detail root cannot reach the new home timeline. Otherwise the
    // check above can miss a cycle that only appears after the update lands —
    // the new home is not yet reflected in the DB.
    if (validated.timeline_id != null) {
      await assertNoTimelineReachableFromDetailRoot(
        client,
        validated.detail_timeline_id,
        validated.timeline_id,
      );
    }
  } else if (validated.timeline_id != null) {
    // Only the home timeline is changing (detail_timeline_id is not being set).
    // If the event already expands into a sub-timeline, that existing drill-down
    // must not reach the new home. Only the new home — not yet in the DB — needs
    // checking; prior containment was validated when the drill-down was assigned.
    const { data: current, error: currentError } = await client
      .from("events")
      .select("detail_timeline_id")
      .eq("id", id)
      .single();
    assertNoError(currentError, "updateEvent(fetchCurrentDetail)");
    const currentDetail = current?.detail_timeline_id ?? null;
    if (currentDetail !== null) {
      await assertNoTimelineReachableFromDetailRoot(
        client,
        currentDetail,
        validated.timeline_id,
      );
    }
  }

  type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
  const { data: row, error } = await client
    .from("events")
    .update(validated as unknown as EventUpdate)
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "updateEvent");
  return row as EventRow;
}

/**
 * Permanently deletes an event. The DB FK constraints on deletion are:
 * - `event_categories`, `event_media`, `event_characters` junction rows are
 *   removed via `ON DELETE CASCADE` on their `event_id` FK.
 * - The event's `timeline_id` FK has `ON DELETE SET NULL` on the *timelines*
 *   table — deleting an event does not affect the timeline, only deleting the
 *   timeline would null out the event's `timeline_id`.
 */
export async function deleteEvent(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await client.from("events").delete().eq("id", id);
  assertNoError(error, "deleteEvent");
}

/**
 * Marks an event as published and records `published_at`.
 */
export async function publishEvent(
  client: SupabaseClient<Database>,
  id: string,
): Promise<EventRow> {
  const { data, error } = await client
    .from("events")
    .update({ published: true, published_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "publishEvent");
  return data as EventRow;
}

/**
 * Reverts an event to unpublished state and clears `published_at`.
 */
export async function unpublishEvent(
  client: SupabaseClient<Database>,
  id: string,
): Promise<EventRow> {
  const { data, error } = await client
    .from("events")
    .update({ published: false, published_at: null })
    .eq("id", id)
    .select()
    .single();

  assertNoError(error, "unpublishEvent");
  return data as EventRow;
}

// ---------------------------------------------------------------------------
// Fractal decomposition (forward drill-down)
// ---------------------------------------------------------------------------
//
// Nesting is forward-only: an event expands into a sub-timeline via
// `detail_timeline_id` (#177), which in turn contains finer events. The earlier
// backward event-to-event `parent_event_id` mechanism — and its `getChildEvents`
// / `setParentEvent` helpers — are retired (#180). To list the events that make
// up an event's decomposition, fetch the events of its `detail_timeline_id` with
// `getEvents({ timelineId })`; `getEventsDetailedBy` is the reverse lookup.

/**
 * Throws if assigning `timelineId` as the drill-down sub-timeline
 * (`detail_timeline_id`) of `eventId` would close a fractal cycle — i.e. if
 * `timelineId` already (transitively) contains `eventId`.
 *
 * The forward fractal graph is `timeline → contained events → (each event's
 * detail_timeline_id) → sub-timeline → …`. "Contained" spans both containment
 * axes: an event's primary/home timeline (`events.timeline_id`) and its guest
 * appearances (`timeline_events` junction). Starting from `timelineId`, we walk
 * this graph breadth-first; if `eventId` is reached, the assignment would make
 * the event expand into a timeline that contains it, which is rejected.
 *
 * Detection is service-layer by design — the database does not constrain it
 * (docs/system-design.md §3.4), consistent with the other self-referential FK
 * cycle guards.
 */
export async function assertNoDetailTimelineCycle(
  client: SupabaseClient<Database>,
  eventId: string,
  timelineId: string,
): Promise<void> {
  const visited = new Set<string>();
  const frontier: string[] = [timelineId];
  let cursor = 0;

  while (cursor < frontier.length) {
    const tl = frontier[cursor];
    cursor += 1;
    if (tl === undefined || visited.has(tl)) {
      continue;
    }
    visited.add(tl);

    // Events whose primary/home timeline is `tl`.
    const { data: homeEvents, error: homeError } = await client
      .from("events")
      .select("id, detail_timeline_id")
      .eq("timeline_id", tl);
    assertNoError(homeError, "assertNoDetailTimelineCycle(home)");

    // Events linked to `tl` as guest appearances via the junction.
    const { data: guestRows, error: guestError } = await client
      .from("timeline_events")
      .select("event_id")
      .eq("timeline_id", tl);
    assertNoError(guestError, "assertNoDetailTimelineCycle(guest)");

    const guestEventIds = (guestRows ?? []).map((r) => r.event_id);
    let guestEvents: { id: string; detail_timeline_id: string | null }[] = [];
    if (guestEventIds.length > 0) {
      const { data, error } = await client
        .from("events")
        .select("id, detail_timeline_id")
        .in("id", guestEventIds);
      assertNoError(error, "assertNoDetailTimelineCycle(guestEvents)");
      guestEvents = data ?? [];
    }

    for (const ev of [...(homeEvents ?? []), ...guestEvents]) {
      if (ev.id === eventId) {
        throw new Error(
          "EventService.assertNoDetailTimelineCycle: an event cannot expand into a " +
            "timeline that contains it (fractal cycle)",
        );
      }
      if (
        ev.detail_timeline_id !== null &&
        !visited.has(ev.detail_timeline_id)
      ) {
        frontier.push(ev.detail_timeline_id);
      }
    }
  }
}

/**
 * Throws if a detail root timeline can (transitively) reach `timelineId` via
 * `event.detail_timeline_id` links. Used by `updateEvent` when both
 * `timeline_id` and `detail_timeline_id` are set in the same payload.
 */
async function assertNoTimelineReachableFromDetailRoot(
  client: SupabaseClient<Database>,
  detailRootTimelineId: string,
  timelineId: string,
): Promise<void> {
  const visited = new Set<string>();
  const frontier: string[] = [detailRootTimelineId];
  let cursor = 0;

  while (cursor < frontier.length) {
    const tl = frontier[cursor];
    cursor += 1;
    if (tl === undefined || visited.has(tl)) {
      continue;
    }
    if (tl === timelineId) {
      throw new Error(
        "EventService.updateEvent: detail_timeline_id cannot reach timeline_id (fractal cycle)",
      );
    }
    visited.add(tl);

    const { data: homeEvents, error: homeError } = await client
      .from("events")
      .select("detail_timeline_id")
      .eq("timeline_id", tl);
    assertNoError(homeError, "assertNoTimelineReachableFromDetailRoot(home)");

    const { data: guestRows, error: guestError } = await client
      .from("timeline_events")
      .select("event_id")
      .eq("timeline_id", tl);
    assertNoError(guestError, "assertNoTimelineReachableFromDetailRoot(guest)");

    const guestEventIds = (guestRows ?? []).map((r) => r.event_id);
    let guestEvents: { detail_timeline_id: string | null }[] = [];
    if (guestEventIds.length > 0) {
      const { data, error } = await client
        .from("events")
        .select("detail_timeline_id")
        .in("id", guestEventIds);
      assertNoError(
        error,
        "assertNoTimelineReachableFromDetailRoot(guestEvents)",
      );
      guestEvents = data ?? [];
    }

    for (const ev of [...(homeEvents ?? []), ...guestEvents]) {
      if (
        ev.detail_timeline_id !== null &&
        !visited.has(ev.detail_timeline_id)
      ) {
        frontier.push(ev.detail_timeline_id);
      }
    }
  }
}

/**
 * Sets (or clears, with `null`) the fractal drill-down sub-timeline an event
 * expands into. When a non-null timeline is given, `assertNoDetailTimelineCycle`
 * runs first to reject an assignment that would close a fractal cycle.
 */
export async function setEventDetailTimeline(
  client: SupabaseClient<Database>,
  eventId: string,
  timelineId: string | null,
): Promise<EventRow> {
  if (timelineId !== null) {
    await assertNoDetailTimelineCycle(client, eventId, timelineId);
  }

  const { data, error } = await client
    .from("events")
    .update({ detail_timeline_id: timelineId })
    .eq("id", eventId)
    .select()
    .single();

  assertNoError(error, "setEventDetailTimeline");
  return data as EventRow;
}

/**
 * Reverse lookup: returns the events that expand into the given timeline —
 * i.e. the events whose `detail_timeline_id` is `timelineId`. Ordered by
 * `sort_order_years` ascending.
 *
 * Returns an array because no DB uniqueness is imposed on `detail_timeline_id`
 * (a timeline could conceivably detail more than one event, #177); the
 * timeline-detail "Details the event" header uses the first.
 */
export async function getEventsDetailedBy(
  client: SupabaseClient<Database>,
  timelineId: string,
): Promise<EventRow[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("detail_timeline_id", timelineId)
    .order("sort_order_years", { ascending: true });

  assertNoError(error, "getEventsDetailedBy");
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Temporal range query
// ---------------------------------------------------------------------------

/**
 * Returns events whose `sort_order_years` falls within [startSort, endSort].
 * Both bounds are inclusive. Values use the era-based sort order formula
 * (CE positive, BCE/KYA/MYA/BYA negative scaled integers).
 */
export async function getEventsInTemporalRange(
  client: SupabaseClient<Database>,
  startSort: number,
  endSort: number,
): Promise<EventRow[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .gte("sort_order_years", startSort)
    .lte("sort_order_years", endSort)
    .order("sort_order_years", { ascending: true });

  assertNoError(error, "getEventsInTemporalRange");
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Junction: event_categories
// ---------------------------------------------------------------------------

/**
 * Links a category to an event via the `event_categories` junction table.
 */
export async function addCategoryToEvent(
  client: SupabaseClient<Database>,
  eventId: string,
  categoryId: string,
): Promise<EventCategoryRow> {
  const { data, error } = await client
    .from("event_categories")
    .insert({ event_id: eventId, category_id: categoryId })
    .select()
    .single();

  assertNoError(error, "addCategoryToEvent");
  return data;
}

/**
 * Removes the link between a category and an event.
 */
export async function removeCategoryFromEvent(
  client: SupabaseClient<Database>,
  eventId: string,
  categoryId: string,
): Promise<void> {
  const { error } = await client
    .from("event_categories")
    .delete()
    .eq("event_id", eventId)
    .eq("category_id", categoryId);

  assertNoError(error, "removeCategoryFromEvent");
}

// ---------------------------------------------------------------------------
// Junction: event_media
// ---------------------------------------------------------------------------

/**
 * Links a media item to an event via the `event_media` junction table.
 * `sortOrder` defaults to 0 and determines the display order of media within
 * the event.
 *
 * Note: captions are a property of the `media` row itself (set during media
 * creation/update) and are not stored on the junction table.
 */
export async function addMediaToEvent(
  client: SupabaseClient<Database>,
  eventId: string,
  mediaId: string,
  sortOrder = 0,
): Promise<EventMediaRow> {
  const { data, error } = await client
    .from("event_media")
    .insert({ event_id: eventId, media_id: mediaId, sort_order: sortOrder })
    .select()
    .single();

  assertNoError(error, "addMediaToEvent");
  return data;
}

/**
 * Removes the link between a media item and an event.
 */
export async function removeMediaFromEvent(
  client: SupabaseClient<Database>,
  eventId: string,
  mediaId: string,
): Promise<void> {
  const { error } = await client
    .from("event_media")
    .delete()
    .eq("event_id", eventId)
    .eq("media_id", mediaId);

  assertNoError(error, "removeMediaFromEvent");
}

// ---------------------------------------------------------------------------
// Junction: event_characters
// ---------------------------------------------------------------------------

/**
 * Records a character's participation in an event via the `event_characters`
 * junction table. `role` defaults to `'participant'` and `significance`
 * defaults to `'secondary'` per the DB CHECK constraints.
 */
export async function addCharacterToEvent(
  client: SupabaseClient<Database>,
  eventId: string,
  characterId: string,
  role: CharacterRole = "participant",
  significance: CharacterSignificance = "secondary",
): Promise<EventCharacterRow> {
  const { data, error } = await client
    .from("event_characters")
    .insert({
      event_id: eventId,
      character_id: characterId,
      role,
      significance,
    })
    .select()
    .single();

  assertNoError(error, "addCharacterToEvent");
  return data;
}

/**
 * Removes the participation record for a character in an event.
 */
export async function removeCharacterFromEvent(
  client: SupabaseClient<Database>,
  eventId: string,
  characterId: string,
): Promise<void> {
  const { error } = await client
    .from("event_characters")
    .delete()
    .eq("event_id", eventId)
    .eq("character_id", characterId);

  assertNoError(error, "removeCharacterFromEvent");
}

/**
 * Returns all `event_characters` junction rows for an event, including the
 * `role`, `significance`, and `description` fields stored on the junction.
 *
 * Note: this returns raw junction records — character profile data (name,
 * type, etc.) is NOT joined. Callers that need full character details must
 * fetch characters separately by `character_id`, or query the
 * `event_participants_view` database view directly.
 */
export async function getEventParticipants(
  client: SupabaseClient<Database>,
  eventId: string,
): Promise<EventCharacterRow[]> {
  const { data, error } = await client
    .from("event_characters")
    .select("*")
    .eq("event_id", eventId);

  assertNoError(error, "getEventParticipants");
  return data ?? [];
}
