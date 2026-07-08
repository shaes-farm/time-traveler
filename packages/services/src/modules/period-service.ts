import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { periodSchema, periodUpdateSchema } from "../schemas/period";
import type { PeriodInput } from "../schemas/period";
import { temporalRangeSchema } from "../schemas/temporal";
import { generateSlug, resolveCollision } from "../utils/slug";
import { MAX_SLUG_LENGTH } from "../schemas/slug";
import type { Database } from "../supabase/types";

type PeriodRow = Database["public"]["Tables"]["periods"]["Row"];
type PeriodTimelineRow =
  Database["public"]["Tables"]["period_timelines"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

export interface PeriodFilters {
  userId?: string;
  parentPeriodId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PeriodWithRelations extends PeriodRow {
  child_periods?: PeriodRow[];
  /**
   * The `period_timelines` junction rows for this period — the timelines it
   * overlays. Timeline titles/spans are resolved separately by the UI (via the
   * timelines list) rather than embedded, mirroring the story ⇄ period pattern.
   */
  period_timelines?: { timeline_id: string }[];
}

export type CreatePeriodInput = Omit<z.input<typeof periodSchema>, "slug"> & {
  slug?: string;
};

function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(`PeriodService.${context}: ${error.message}`);
  }
}

/**
 * Return a paginated list of periods, optionally filtered.
 *
 * @param client - Supabase client instance
 * @param filters - Optional filters: userId, parentPeriodId, search, page, pageSize
 * @returns Array of period rows ordered by sort_order_start ascending
 */
export async function getPeriods(
  client: SupabaseClient<Database>,
  filters: PeriodFilters = {},
): Promise<PeriodRow[]> {
  const { userId, parentPeriodId, search, page, pageSize } = filters;

  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize ?? 20)));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client
    .from("periods")
    .select("*")
    .order("sort_order_start", { ascending: true })
    .range(from, to);

  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (parentPeriodId !== undefined) {
    if (parentPeriodId === null) {
      query = query.is("parent_period_id", null);
    } else {
      query = query.eq("parent_period_id", parentPeriodId);
    }
  }
  if (search !== undefined && search.trim().length > 0) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error } = await query;
  assertNoError(error, "getPeriods");
  return data ?? [];
}

/**
 * Fetch a single period by its UUID, with its direct child periods attached.
 *
 * Children are fetched in a second query rather than via a PostgREST embed:
 * the owner-scoped composite self-FK (`00028`, `(user_id, parent_period_id)`)
 * is not resolvable as a self-referential embed relationship, so
 * `periods!parent_period_id(*)` no longer works. `getChildPeriods` reads the
 * same rows ordered by `sort_order_start`.
 *
 * @param client - Supabase client instance
 * @param id - Period UUID
 * @returns The matching period row with `child_periods`
 */
export async function getPeriodById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<PeriodWithRelations> {
  const { data, error } = await client
    .from("periods")
    .select("*")
    .eq("id", id)
    .single();
  assertNoError(error, "getPeriodById");
  // The children + overlays reads are independent — fetch them in parallel
  // rather than waterfalling, to cut latency on the detail/editor critical path.
  const [child_periods, period_timelines] = await Promise.all([
    getChildPeriods(client, data.id),
    getPeriodTimelines(client, data.id),
  ]);
  return { ...data, child_periods, period_timelines };
}

/**
 * Fetch a single period by its owner and slug, with its direct child periods
 * attached (see {@link getPeriodById} for why children are a separate query).
 *
 * @param client - Supabase client instance
 * @param userId - Owner's user UUID
 * @param slug - Period slug
 * @returns The matching period row with `child_periods`
 */
export async function getPeriodBySlug(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<PeriodWithRelations> {
  const { data, error } = await client
    .from("periods")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();
  assertNoError(error, "getPeriodBySlug");
  // Independent follow-up reads — run them in parallel (see getPeriodById).
  const [child_periods, period_timelines] = await Promise.all([
    getChildPeriods(client, data.id),
    getPeriodTimelines(client, data.id),
  ]);
  return { ...data, child_periods, period_timelines };
}

/**
 * Create a new period. Slug is auto-generated from the title if not supplied;
 * uniqueness collisions are retried up to 3 times using suffix tokens.
 *
 * @param client - Supabase client instance
 * @param data - Period data (slug optional)
 * @returns The newly created period row
 */
export async function createPeriod(
  client: SupabaseClient<Database>,
  data: CreatePeriodInput,
): Promise<PeriodRow> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createPeriod.getUser");
  if (user === null) {
    throw new Error("PeriodService.createPeriod: no authenticated user");
  }

  const userId = user.id;

  // Pre-fetch existing slugs to resolve collisions before the insert
  const { data: existing, error: slugError } = await client
    .from("periods")
    .select("slug")
    .eq("user_id", userId);
  assertNoError(slugError, "createPeriod(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  const baseSlug =
    data.slug !== undefined && data.slug.length > 0
      ? data.slug
      : generateSlug(data.title);
  const slug = resolveCollision(baseSlug, existingSlugs);

  type PeriodInsert = Database["public"]["Tables"]["periods"]["Insert"];

  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const validated = periodSchema.parse({ ...data, slug: attemptSlug });

    const { data: row, error: insertError } = await client
      .from("periods")
      .insert({
        ...(validated as unknown as PeriodInsert),
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
      assertNoError(insertError, "createPeriod");
    }

    return row as PeriodRow;
  }

  throw new Error("PeriodService.createPeriod: unreachable");
}

/**
 * Throws if assigning `newParentId` as the parent of `periodId` would create a
 * circular hierarchy — i.e. if `periodId` is `newParentId` itself, or is an
 * ancestor of `newParentId`.
 *
 * Detection walks the ancestor chain upward from `newParentId` via
 * `parent_period_id`. A cycle would form exactly when `periodId` appears on that
 * chain, so a single upward walk is sufficient (and cheaper than enumerating
 * `periodId`'s descendants). A `visited` set guards against an already-corrupt
 * chain looping forever.
 *
 * Detection is service-layer by design — `parent_period_id` is not
 * cycle-constrained at the database level (docs/system-design.md §3.4),
 * consistent with the other self-referential FK cycle guards
 * (see `category-service.assertNoCategoryCycle`).
 *
 * @param client - Supabase client instance
 * @param periodId - The period being reparented
 * @param newParentId - The candidate parent
 */
export async function assertNoPeriodCycle(
  client: SupabaseClient<Database>,
  periodId: string,
  newParentId: string,
): Promise<void> {
  const visited = new Set<string>();
  let cursor: string | null = newParentId;

  while (cursor !== null) {
    if (cursor === periodId) {
      throw new Error(
        "PeriodService.assertNoPeriodCycle: a period cannot be its own " +
          "ancestor (circular hierarchy)",
      );
    }
    if (visited.has(cursor)) {
      // Pre-existing cycle in the stored data; stop rather than loop forever.
      return;
    }
    visited.add(cursor);

    // maybeSingle (not single): a non-existent `newParentId` returns no row
    // without erroring, so the walk ends here and the guard passes. The real
    // "parent does not exist" error is then raised cleanly by the FK on the
    // subsequent UPDATE, rather than surfacing as a misleading cycle/fetch error.
    const {
      data,
      error,
    }: {
      data: { parent_period_id: string | null } | null;
      error: { message: string } | null;
    } = await client
      .from("periods")
      .select("parent_period_id")
      .eq("id", cursor)
      .maybeSingle();
    assertNoError(error, "assertNoPeriodCycle");
    cursor = data?.parent_period_id ?? null;
  }
}

/**
 * Update an existing period. A patch touching only one temporal bound is
 * re-validated against the stored row so it can't create an inverted span
 * (end before start). When the payload reparents the period under a non-null
 * parent, `assertNoPeriodCycle` runs to reject circular hierarchies;
 * reparenting to root (`null`) skips the walk.
 *
 * @param client - Supabase client instance
 * @param id - Period UUID
 * @param data - Partial period fields to update
 * @returns The updated period row
 */
export async function updatePeriod(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<PeriodInput>,
): Promise<PeriodRow> {
  const validated = periodUpdateSchema.parse(data);

  // Span validity on partial patches: periodUpdateSchema can only compare the
  // two bounds when both are in the payload. When a patch touches exactly one
  // bound, merge it with the stored row and re-check, so a partial update can't
  // slip in an end that precedes the start (or vice versa).
  const touchesStart = validated.temporal_data !== undefined;
  const touchesEnd = validated.end_temporal_data !== undefined;
  if (touchesStart !== touchesEnd) {
    const { data: current, error: spanError } = await client
      .from("periods")
      .select("temporal_data, end_temporal_data")
      .eq("id", id)
      .single();
    assertNoError(spanError, "updatePeriod(span)");
    const start = touchesStart
      ? validated.temporal_data
      : current.temporal_data;
    const end = touchesEnd
      ? validated.end_temporal_data
      : current.end_temporal_data;
    // Open-ended (end null/absent) is always valid; only check a real span.
    if (start != null && end != null) {
      temporalRangeSchema.parse({ start, end });
    }
  }

  if (
    validated.parent_period_id !== undefined &&
    validated.parent_period_id !== null
  ) {
    await assertNoPeriodCycle(client, id, validated.parent_period_id);
  }

  const { data: updated, error } = await client
    .from("periods")
    .update(validated)
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "updatePeriod");
  return updated;
}

/**
 * Delete a period by its UUID.
 *
 * @param client - Supabase client instance
 * @param id - Period UUID
 */
export async function deletePeriod(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await client.from("periods").delete().eq("id", id);
  assertNoError(error, "deletePeriod");
}

/**
 * Publish a period: set `published=true` and stamp `published_at`.
 *
 * Publish is a dedicated call (not part of {@link updatePeriod}) because the
 * `periods` Zod schema intentionally omits `published`/`published_at`, so an
 * update would strip them. Mirrors `story-service.publishStory`.
 *
 * @param client - Supabase client instance
 * @param id - Period UUID
 * @returns The updated period row
 */
export async function publishPeriod(
  client: SupabaseClient<Database>,
  id: string,
): Promise<PeriodRow> {
  const { data, error } = await client
    .from("periods")
    .update({ published: true, published_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "publishPeriod");
  return data;
}

/**
 * Revert a period to draft: set `published=false` and clear `published_at`.
 *
 * @param client - Supabase client instance
 * @param id - Period UUID
 * @returns The updated period row
 */
export async function unpublishPeriod(
  client: SupabaseClient<Database>,
  id: string,
): Promise<PeriodRow> {
  const { data, error } = await client
    .from("periods")
    .update({ published: false, published_at: null })
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "unpublishPeriod");
  return data;
}

/**
 * Return all direct child periods of a given parent period.
 *
 * @param client - Supabase client instance
 * @param parentId - Parent period UUID
 * @returns Array of child period rows ordered by sort_order_start ascending
 */
export async function getChildPeriods(
  client: SupabaseClient<Database>,
  parentId: string,
): Promise<PeriodRow[]> {
  const { data, error } = await client
    .from("periods")
    .select("*")
    .eq("parent_period_id", parentId)
    .order("sort_order_start", { ascending: true });
  assertNoError(error, "getChildPeriods");
  return data ?? [];
}

/**
 * Associate a period with a timeline via the period_timelines junction.
 *
 * Idempotent: the junction has composite PK `(period_id, timeline_id)`, so a
 * repeated association is a no-op (upsert with `ignoreDuplicates`) rather than a
 * `23505` unique-violation error.
 *
 * @param client - Supabase client instance
 * @param periodId - Period UUID
 * @param timelineId - Timeline UUID
 * @returns The junction row (existing or newly created)
 */
export async function addPeriodToTimeline(
  client: SupabaseClient<Database>,
  periodId: string,
  timelineId: string,
): Promise<PeriodTimelineRow> {
  const { error } = await client
    .from("period_timelines")
    .upsert(
      { period_id: periodId, timeline_id: timelineId },
      { onConflict: "period_id,timeline_id", ignoreDuplicates: true },
    );
  assertNoError(error, "addPeriodToTimeline");
  // The junction is fully described by its composite key; return it rather than
  // relying on a RETURNING row, which upsert-ignoreDuplicates omits on conflict.
  return { period_id: periodId, timeline_id: timelineId };
}

/**
 * Remove the association between a period and a timeline.
 *
 * @param client - Supabase client instance
 * @param periodId - Period UUID
 * @param timelineId - Timeline UUID
 */
export async function removePeriodFromTimeline(
  client: SupabaseClient<Database>,
  periodId: string,
  timelineId: string,
): Promise<void> {
  const { error } = await client
    .from("period_timelines")
    .delete()
    .eq("period_id", periodId)
    .eq("timeline_id", timelineId);
  assertNoError(error, "removePeriodFromTimeline");
}

/**
 * Return the `period_timelines` junction rows for a period — i.e. the ids of
 * the timelines it overlays. Timeline titles/spans are resolved by the caller
 * against the timelines list (the junction carries no timeline detail), keeping
 * this a single, cheap key lookup.
 *
 * @param client - Supabase client instance
 * @param periodId - Period UUID
 * @returns Array of `{ timeline_id }` rows
 */
export async function getPeriodTimelines(
  client: SupabaseClient<Database>,
  periodId: string,
): Promise<{ timeline_id: string }[]> {
  const { data, error } = await client
    .from("period_timelines")
    .select("timeline_id")
    .eq("period_id", periodId);
  assertNoError(error, "getPeriodTimelines");
  return data ?? [];
}

export interface EventsInPeriodOptions {
  /**
   * When true, restrict results to events belonging to a timeline the period
   * overlays (via the `period_timelines` junction) — either as their home
   * timeline (`events.timeline_id`) or a guest appearance (`timeline_events`).
   * When false (default), return every event in the period's temporal span
   * regardless of timeline.
   */
  timelineScoped?: boolean;
  /** 1-based page number. Defaults to 1; clamped to ≥ 1. */
  page?: number;
  /** Page size. Defaults to 25; clamped to [1, 200]. */
  pageSize?: number;
}

/** A page of events-in-range plus the total count of matches. */
export interface EventsInPeriodPage {
  rows: EventRow[];
  total: number;
}

/**
 * Events-in-range contract (span-overlay model). Returns the events whose
 * `sort_order_years` falls within the period's temporal span
 * `[sort_order_start, sort_order_end]` (inclusive), ordered by
 * `sort_order_years` ascending.
 *
 * There is **no `period_events` junction** — a period gathers events by date,
 * read-only. An open-ended period (`end_temporal_data` NULL) collapses to the
 * single instant at `sort_order_start`. Note the generated `sort_order_end` is
 * `0` (not NULL) when `end_temporal_data` has no era, so open-endedness is keyed
 * off `end_temporal_data`, not `sort_order_end`. Both sort columns are
 * DB-generated from the era formula (docs/system-design.md §4).
 *
 * With `timelineScoped: true`, results are further limited to the timelines the
 * period overlays; a period that overlays no timeline yields an empty page.
 *
 * Paginated: a wide (e.g. BYA-spanning) period can match many events, so the
 * result is a single page plus the total count. The unscoped path paginates in
 * the database (`.range()` + exact count); the scoped path must build the
 * home+guest union first, then slices that union server-side (its `total` is the
 * full union size).
 *
 * @param client - Supabase client instance
 * @param periodId - Period UUID
 * @param options - See {@link EventsInPeriodOptions}
 * @returns A page of matching event rows (ordered by `sort_order_years`) + total
 */
export async function getEventsInPeriod(
  client: SupabaseClient<Database>,
  periodId: string,
  options: EventsInPeriodOptions = {},
): Promise<EventsInPeriodPage> {
  const safePage = Math.max(1, Math.floor(options.page ?? 1));
  const safePageSize = Math.min(
    200,
    Math.max(1, Math.floor(options.pageSize ?? 25)),
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data: period, error: periodError } = await client
    .from("periods")
    .select("sort_order_start, sort_order_end, end_temporal_data")
    .eq("id", periodId)
    .single();
  assertNoError(periodError, "getEventsInPeriod(period)");

  const start = period.sort_order_start ?? 0;
  // Open-ended when there is no end era: the generated `sort_order_end` is 0
  // (not NULL) in that case, so key off `end_temporal_data`, not the sort value.
  const endEra = (period.end_temporal_data as { era?: string } | null)?.era;
  const end =
    typeof endEra === "string" ? (period.sort_order_end ?? start) : start;

  if (options.timelineScoped !== true) {
    const { data, error, count } = await client
      .from("events")
      .select("*", { count: "exact" })
      .gte("sort_order_years", start)
      .lte("sort_order_years", end)
      .order("sort_order_years", { ascending: true })
      .range(from, to);
    assertNoError(error, "getEventsInPeriod");
    return { rows: data ?? [], total: count ?? 0 };
  }

  // Scoped: the union of events on any timeline this period overlays, as home
  // timeline (events.timeline_id) or guest appearance (timeline_events).
  const { data: overlays, error: overlaysError } = await client
    .from("period_timelines")
    .select("timeline_id")
    .eq("period_id", periodId);
  assertNoError(overlaysError, "getEventsInPeriod(overlays)");

  const timelineIds = (overlays ?? []).map((r) => r.timeline_id);
  if (timelineIds.length === 0) {
    return { rows: [], total: 0 };
  }

  const { data: homeEvents, error: homeError } = await client
    .from("events")
    .select("*")
    .in("timeline_id", timelineIds)
    .gte("sort_order_years", start)
    .lte("sort_order_years", end);
  assertNoError(homeError, "getEventsInPeriod(home)");

  const { data: guestRows, error: guestError } = await client
    .from("timeline_events")
    .select("event_id")
    .in("timeline_id", timelineIds);
  assertNoError(guestError, "getEventsInPeriod(guestRows)");

  const guestIds = (guestRows ?? []).map((r) => r.event_id);
  let guestEvents: EventRow[] = [];
  if (guestIds.length > 0) {
    const { data, error } = await client
      .from("events")
      .select("*")
      .in("id", guestIds)
      .gte("sort_order_years", start)
      .lte("sort_order_years", end);
    assertNoError(error, "getEventsInPeriod(guest)");
    guestEvents = data ?? [];
  }

  // Merge home + guest, de-duplicate by id, and re-sort (each source was
  // fetched independently, so the union needs a final ordering pass).
  const byId = new Map<string, EventRow>();
  for (const ev of [...(homeEvents ?? []), ...guestEvents]) {
    byId.set(ev.id, ev);
  }
  const merged = [...byId.values()].sort(
    (a, b) => (a.sort_order_years ?? 0) - (b.sort_order_years ?? 0),
  );
  return {
    rows: merged.slice(from, from + safePageSize),
    total: merged.length,
  };
}
