import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { timelineSchema } from "../schemas/timeline";
import type { TimelineInput } from "../schemas/timeline";
import { generateSlug, resolveCollision } from "../utils/slug";
import type { Database } from "../supabase/types";

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

/** Optional filters accepted by getTimelines / getTimelinesPage */
export interface TimelineFilters {
  /** Scalar or multi-value visibility filter; multiple values use SQL IN. */
  visibility?:
    "private" | "public" | "shared" | Array<"private" | "public" | "shared">;
  /** Scalar or multi-value timeline_type filter; multiple values use SQL IN. */
  timelineType?:
    | "general"
    | "biographical"
    | "comparative"
    | Array<"general" | "biographical" | "comparative">;
  /** When true → only published rows; false → only draft rows; omit → no filter. */
  published?: boolean;
  userId?: string;
  search?: string;
  /** Sort column. Defaults to "updated_at". */
  sortBy?: "title" | "updated_at" | "created_at";
  /** Sort direction. Defaults to "desc". */
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  /**
   * When true, include sub-timelines (those referenced by an event's
   * `events.detail_timeline_id` FK). Defaults to false (root-only view).
   * NOTE: the `detail_timeline_id` column exists (migration 00017) but the
   * root/sub query partition is not yet implemented — this flag is a no-op
   * and all timelines are currently returned regardless of this setting.
   */
  includeSubTimelines?: boolean;
}

/** Paginated result from getTimelinesPage — includes the total filtered count. */
export interface TimelinesPage {
  rows: TimelineRow[];
  total: number;
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
// Typed errors
// ---------------------------------------------------------------------------

export class TimelinePublishError extends Error {
  constructor(
    public readonly code: "no_events",
    message: string,
  ) {
    super(message);
    this.name = "TimelinePublishError";
  }
}

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
 * Returns a page of timelines, optionally filtered by visibility, timeline_type,
 * published state, owner, or full-text search using the `search_vector` GIN index.
 *
 * `page` is clamped to ≥ 1; `pageSize` is clamped to [1, 100].
 *
 * Backward-compatible wrapper around getTimelinesPage that returns only the row
 * array. Prefer getTimelinesPage when a total count is needed.
 */
export async function getTimelines(
  client: SupabaseClient<Database>,
  filters: TimelineFilters = {},
): Promise<TimelineRow[]> {
  const { rows } = await getTimelinesPage(client, filters);
  return rows;
}

/**
 * Returns a page of timelines together with the total filtered count, enabling
 * accurate pagination controls.
 *
 * `page` is clamped to ≥ 1; `pageSize` is clamped to [1, 100].
 */
export async function getTimelinesPage(
  client: SupabaseClient<Database>,
  filters: TimelineFilters = {},
): Promise<TimelinesPage> {
  const {
    visibility,
    timelineType,
    published,
    userId,
    search,
    sortBy = "updated_at",
    sortDirection = "desc",
  } = filters;

  const safePage = Math.max(1, Math.floor(filters.page ?? 1));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(filters.pageSize ?? 20)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client.from("timelines").select("*", { count: "exact" });

  if (visibility !== undefined) {
    if (Array.isArray(visibility) && visibility.length > 1) {
      query = query.in("visibility", visibility);
    } else {
      const scalar = Array.isArray(visibility) ? visibility[0] : visibility;
      if (scalar !== undefined) query = query.eq("visibility", scalar);
    }
  }

  if (timelineType !== undefined) {
    if (Array.isArray(timelineType) && timelineType.length > 1) {
      query = query.in("timeline_type", timelineType);
    } else {
      const scalar = Array.isArray(timelineType)
        ? timelineType[0]
        : timelineType;
      if (scalar !== undefined) query = query.eq("timeline_type", scalar);
    }
  }

  // Only filter by published when exactly one value is requested.
  // Omitting the predicate when both or neither are selected avoids a no-op filter.
  if (published !== undefined) {
    // "draft" (published === false) must also match NULL rows: `published` is
    // nullable (BOOLEAN DEFAULT false, no NOT NULL — migration 00001) and the
    // list badge renders NULL as "Draft", so the filter has to too — otherwise
    // a NULL row shows "Draft" yet vanishes under the Draft filter.
    // `not.is.true` = published IS NOT TRUE (false OR NULL). See #331.
    query = published
      ? query.eq("published", true)
      : query.not("published", "is", true);
  }

  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }

  if (search !== undefined && search.length > 0) {
    // Build a prefix-aware tsquery for type-as-you-search UX.
    // The tsvector is indexed with 'english' stemming (e.g. 'physics' → 'physic').
    // websearch_to_tsquery treats tokens as complete words, so 'phys' never matches
    // the stored lexeme 'physic'. Using raw to_tsquery with ':*' on the last token
    // enables prefix matching: 'phys:*' matches 'physic', 'ph:*' matches 'physic', etc.
    //
    // Input is sanitized first: tsquery metacharacters are stripped to prevent injection.
    const words = search
      .replace(/[&|!:*'"<>()[\]{}\\]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length > 0) {
      const tsQuery = [
        ...words.slice(0, -1),
        `${words[words.length - 1]!}:*`,
      ].join(" & ");
      // No 'type' → PostgREST calls to_tsquery(), which supports :* prefix syntax.
      query = query.textSearch("search_vector", tsQuery);
    }
  }

  const ascending = sortDirection === "asc";
  query = query.order(sortBy, { ascending, nullsFirst: false }).range(from, to);

  const { data, count, error } = await query;
  assertNoError(error, "getTimelinesPage");
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * Fetches a single timeline by UUID, including collaborators, linked events,
 * and linked media. This is the canonical detail lookup: the UUID primary key
 * is globally unique, so it resolves deterministically for owners *and*
 * collaborators (RLS `read_timelines` = owner OR is_timeline_collaborator).
 * Routing on the UUID avoids the slug ambiguity of `UNIQUE (user_id, slug)`
 * (#234). Returns `null` when the id is unknown, deleted, or RLS-hidden — a
 * missing row is a not-found, not an exception (cf. ADR-0029 IMP-004). This
 * also avoids a raw PostgREST coercion error during the brief window a detail
 * page refetches an entity that was just deleted. Still throws on a real DB
 * error.
 */
export async function getTimelineById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<TimelineWithRelations | null> {
  const { data, error } = await client
    .from("timelines")
    .select(
      "*, timeline_collaborators(*), timeline_events(*), timeline_media(*)",
    )
    .eq("id", id)
    .maybeSingle();

  assertNoError(error, "getTimelineById");
  return data as TimelineWithRelations | null;
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
  // Check both home events (events.timeline_id) and junction events (timeline_events)
  // to match what the UI shows via getTimelineEventsUnion.
  const [
    { count: homeCount, error: homeErr },
    { count: linkedCount, error: linkedErr },
  ] = await Promise.all([
    client
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("timeline_id", id),
    client
      .from("timeline_events")
      .select("*", { count: "exact", head: true })
      .eq("timeline_id", id),
  ]);

  assertNoError(homeErr, "publishTimeline.homeEventCount");
  assertNoError(linkedErr, "publishTimeline.linkedEventCount");

  if ((homeCount ?? 0) + (linkedCount ?? 0) === 0) {
    throw new TimelinePublishError(
      "no_events",
      "Cannot publish a timeline with no linked events.",
    );
  }

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
 * `sortOrder` defaults to 0; when all rows for a timeline share the default,
 * consumers should fall back to ordering by the joined `events.sort_order_start`
 * (chronological order). Set a non-zero value to enforce an editorial ordering
 * (e.g., for comparative or thematic timelines).
 */
export async function addEventToTimeline(
  client: SupabaseClient<Database>,
  timelineId: string,
  eventId: string,
  sortOrder = 0,
): Promise<TimelineEventRow> {
  const { data, error } = await client
    .from("timeline_events")
    .insert({
      timeline_id: timelineId,
      event_id: eventId,
      sort_order: sortOrder,
    })
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

/**
 * Returns the ids of the timelines an event "also appears in" — i.e. its
 * `timeline_events` junction memberships. This is the secondary, comparative
 * membership only; it does NOT include the event's primary `events.timeline_id`
 * home timeline. The event editor uses it to pre-populate the "also appears in"
 * multi-select when editing an existing event.
 */
export async function getEventTimelineLinks(
  client: SupabaseClient<Database>,
  eventId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("timeline_events")
    .select("timeline_id")
    .eq("event_id", eventId);

  assertNoError(error, "getEventTimelineLinks");
  return (data ?? []).map((row) => row.timeline_id);
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
): Promise<TimelineMediaRow | null> {
  // Idempotent: re-attaching an already-linked (timeline_id, media_id) pair is a
  // no-op via the composite PK. `ignoreDuplicates` leaves the existing row's
  // sort_order untouched and returns no row, so this resolves to `null` rather
  // than throwing 23505. Lets the same media be reused across entities.
  const { data, error } = await client
    .from("timeline_media")
    .upsert(
      {
        timeline_id: timelineId,
        media_id: mediaId,
        sort_order: sortOrder,
      },
      { onConflict: "timeline_id,media_id", ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();

  assertNoError(error, "addMediaToTimeline");
  return data;
}

/**
 * Removes the link between a media item and a timeline. The `media` row itself
 * is left untouched.
 */
export async function removeMediaFromTimeline(
  client: SupabaseClient<Database>,
  timelineId: string,
  mediaId: string,
): Promise<void> {
  const { error } = await client
    .from("timeline_media")
    .delete()
    .eq("timeline_id", timelineId)
    .eq("media_id", mediaId);

  assertNoError(error, "removeMediaFromTimeline");
}

/**
 * Updates the `sort_order` of a media item within a timeline, determining its
 * display order relative to the timeline's other media.
 */
export async function reorderTimelineMedia(
  client: SupabaseClient<Database>,
  timelineId: string,
  mediaId: string,
  sortOrder: number,
): Promise<TimelineMediaRow> {
  const { data, error } = await client
    .from("timeline_media")
    .update({ sort_order: sortOrder })
    .eq("timeline_id", timelineId)
    .eq("media_id", mediaId)
    .select()
    .single();

  assertNoError(error, "reorderTimelineMedia");
  return data;
}

// ---------------------------------------------------------------------------
// Union query: home + linked events for the detail page Events tab
// ---------------------------------------------------------------------------

type EventRow = Database["public"]["Tables"]["events"]["Row"];

/** An event row tagged with its containment relationship to this timeline. */
export interface TimelineEventWithMembership extends EventRow {
  /** "home" = primary timeline_id points here; "linked" = via timeline_events junction. */
  membership: "home" | "linked";
  /** The sort_order from the timeline_events junction row (0 when not set). */
  junction_sort_order: number;
}

/**
 * Returns all events for a timeline as a merged, sorted list.
 *
 * "Home" events have `events.timeline_id = timelineId`.
 * "Linked" events are connected via the `timeline_events` junction table.
 *
 * If any junction row has a non-zero `sort_order`, results are ordered by
 * `junction_sort_order ASC` (editorial order). Otherwise results fall back to
 * `sort_order_years ASC` (chronological). Home events win deduplication when
 * an event appears in both sets.
 */
export async function getTimelineEventsUnion(
  client: SupabaseClient<Database>,
  timelineId: string,
): Promise<TimelineEventWithMembership[]> {
  const [homeResult, junctionResult] = await Promise.all([
    client.from("events").select("*").eq("timeline_id", timelineId),
    client
      .from("timeline_events")
      .select("event_id, sort_order")
      .eq("timeline_id", timelineId),
  ]);

  assertNoError(homeResult.error, "getTimelineEventsUnion(home)");
  assertNoError(junctionResult.error, "getTimelineEventsUnion(junction)");

  const homeRows = (homeResult.data ?? []) as EventRow[];
  const junctionRows = junctionResult.data ?? [];

  const homeIds = new Set(homeRows.map((e) => e.id));

  const linkedEventIds = junctionRows
    .map((j) => j.event_id)
    .filter((id) => !homeIds.has(id));

  let linkedRows: EventRow[] = [];
  if (linkedEventIds.length > 0) {
    const { data, error } = await client
      .from("events")
      .select("*")
      .in("id", linkedEventIds);
    assertNoError(error, "getTimelineEventsUnion(linked)");
    linkedRows = (data ?? []) as EventRow[];
  }

  const sortOrderMap = new Map<string, number>();
  for (const j of junctionRows) {
    sortOrderMap.set(j.event_id, j.sort_order ?? 0);
  }

  const merged: TimelineEventWithMembership[] = [
    ...homeRows.map((e) => ({
      ...e,
      membership: "home" as const,
      junction_sort_order: sortOrderMap.get(e.id) ?? 0,
    })),
    ...linkedRows.map((e) => ({
      ...e,
      membership: "linked" as const,
      junction_sort_order: sortOrderMap.get(e.id) ?? 0,
    })),
  ];

  const hasEditorialOrder = merged.some((e) => e.junction_sort_order !== 0);

  // Stable tie-break shared by both ordering modes so the list is deterministic
  // across fetches (DB row order is not guaranteed): chronological, then id.
  const byChronologyThenId = (
    a: TimelineEventWithMembership,
    b: TimelineEventWithMembership,
  ) =>
    (a.sort_order_years ?? 0) - (b.sort_order_years ?? 0) ||
    a.id.localeCompare(b.id);

  if (hasEditorialOrder) {
    merged.sort((a, b) => {
      // Treat sort_order=0 as "not yet placed" and push those events after explicit positions.
      if (a.junction_sort_order === 0 && b.junction_sort_order !== 0) return 1;
      if (a.junction_sort_order !== 0 && b.junction_sort_order === 0) return -1;
      // Within the same editorial position (incl. all-zero ties), fall back to
      // chronological then id so equal/unset values have a stable order.
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
 * Sets the editorial sort_order for an event on a timeline.
 *
 * For "linked" events this upserts into the `timeline_events` junction row.
 * For "home" events (where `events.timeline_id = timelineId`) a junction row is
 * upserted so all events share a single editorial ordering mechanism once manual
 * reordering begins.
 */
export async function setTimelineEventSortOrder(
  client: SupabaseClient<Database>,
  timelineId: string,
  eventId: string,
  sortOrder: number,
): Promise<TimelineEventRow> {
  const { data, error } = await client
    .from("timeline_events")
    .upsert(
      { timeline_id: timelineId, event_id: eventId, sort_order: sortOrder },
      { onConflict: "timeline_id,event_id" },
    )
    .select()
    .single();

  assertNoError(error, "setTimelineEventSortOrder");
  return data;
}
