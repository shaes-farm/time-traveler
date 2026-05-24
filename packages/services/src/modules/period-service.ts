import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { periodSchema } from "../schemas/period.js";
import type { PeriodInput } from "../schemas/period.js";
import { generateSlug, resolveCollision } from "../utils/slug.js";
import { MAX_SLUG_LENGTH } from "../schemas/slug.js";
import type { Database } from "../supabase/types.js";

type PeriodRow = Database["public"]["Tables"]["periods"]["Row"];
type PeriodTimelineRow =
  Database["public"]["Tables"]["period_timelines"]["Row"];

export interface PeriodFilters {
  userId?: string;
  parentPeriodId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PeriodWithRelations extends PeriodRow {
  child_periods?: PeriodRow[];
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
 * Fetch a single period by its UUID.
 *
 * @param client - Supabase client instance
 * @param id - Period UUID
 * @returns The matching period row
 */
export async function getPeriodById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<PeriodRow> {
  const { data, error } = await client
    .from("periods")
    .select("*")
    .eq("id", id)
    .single();
  assertNoError(error, "getPeriodById");
  return data;
}

/**
 * Fetch a single period by its owner and slug.
 *
 * @param client - Supabase client instance
 * @param userId - Owner's user UUID
 * @param slug - Period slug
 * @returns The matching period row
 */
export async function getPeriodBySlug(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<PeriodRow> {
  const { data, error } = await client
    .from("periods")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();
  assertNoError(error, "getPeriodBySlug");
  return data;
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
 * Update an existing period.
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
  const validated = periodSchema.partial().parse(data);
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
 * @param client - Supabase client instance
 * @param periodId - Period UUID
 * @param timelineId - Timeline UUID
 * @returns The created junction row
 */
export async function addPeriodToTimeline(
  client: SupabaseClient<Database>,
  periodId: string,
  timelineId: string,
): Promise<PeriodTimelineRow> {
  const { data, error } = await client
    .from("period_timelines")
    .insert({ period_id: periodId, timeline_id: timelineId })
    .select()
    .single();
  assertNoError(error, "addPeriodToTimeline");
  return data;
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
