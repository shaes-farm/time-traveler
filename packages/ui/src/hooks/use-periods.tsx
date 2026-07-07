/**
 * TanStack Query hooks for the Period entity.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getPeriods,
  getPeriodById,
  getPeriodBySlug,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getChildPeriods,
  addPeriodToTimeline,
  removePeriodFromTimeline,
  getPeriodTimelines,
  getEventsInPeriod,
  publishPeriod,
  unpublishPeriod,
} from "@repo/services/period-service";
import type {
  PeriodFilters,
  PeriodWithRelations,
  CreatePeriodInput,
  EventsInPeriodOptions,
} from "@repo/services/period-service";

type ServiceClient = Parameters<typeof getPeriods>[0];
type PeriodUpdateData = Parameters<typeof updatePeriod>[2];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const periodKeys = {
  all: ["periods"] as const,
  lists: () => [...periodKeys.all, "list"] as const,
  list: (filters: PeriodFilters) => [...periodKeys.lists(), filters] as const,
  details: () => [...periodKeys.all, "detail"] as const,
  detail: (id: string) => [...periodKeys.details(), id] as const,
  slugs: () => [...periodKeys.all, "slug"] as const,
  bySlug: (userId: string, slug: string) =>
    [...periodKeys.slugs(), userId, slug] as const,
  children: (id: string) => [...periodKeys.all, "children", id] as const,
  timelines: (id: string) => [...periodKeys.detail(id), "timelines"] as const,
  events: (id: string, options: EventsInPeriodOptions = {}) =>
    [...periodKeys.detail(id), "events", options] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated, optionally filtered list of periods. */
export function usePeriods(
  client: ServiceClient,
  filters: PeriodFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getPeriods>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: periodKeys.list(filters),
    queryFn: () => getPeriods(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single period by UUID with its relations. */
export function usePeriod(
  client: ServiceClient,
  id: string,
  options?: Omit<UseQueryOptions<PeriodWithRelations>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: periodKeys.detail(id),
    queryFn: () => getPeriodById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a single period by owner user ID and slug. */
export function usePeriodBySlug(
  client: ServiceClient,
  userId: string,
  slug: string,
  options?: Omit<UseQueryOptions<PeriodWithRelations>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: periodKeys.bySlug(userId, slug),
    queryFn: () => getPeriodBySlug(client, userId, slug),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch direct child periods of a given period. */
export function useChildPeriods(
  client: ServiceClient,
  parentPeriodId: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getChildPeriods>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: periodKeys.children(parentPeriodId),
    queryFn: () => getChildPeriods(client, parentPeriodId),
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Fetch the events falling within a period's temporal span (span-overlay model —
 * there is no `period_events` junction). Pass `{ timelineScoped: true }` to limit
 * results to the timelines the period overlays. The query key nests under
 * `detail(periodId)`, so any invalidation of the period detail (span edits,
 * timeline association changes) refreshes this query automatically.
 */
export function useEventsInPeriod(
  client: ServiceClient,
  periodId: string,
  serviceOptions: EventsInPeriodOptions = {},
  queryOptions?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getEventsInPeriod>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: periodKeys.events(periodId, serviceOptions),
    queryFn: () => getEventsInPeriod(client, periodId, serviceOptions),
    staleTime: 30_000,
    ...queryOptions,
  });
}

/** Fetch the `period_timelines` junction rows (overlaid timeline ids) for a period. */
export function usePeriodTimelines(
  client: ServiceClient,
  periodId: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getPeriodTimelines>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: periodKeys.timelines(periodId),
    queryFn: () => getPeriodTimelines(client, periodId),
    staleTime: 30_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new period and invalidate the periods list cache. */
export function useCreatePeriod(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePeriodInput) => createPeriod(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: periodKeys.lists() });
    },
  });
}

/** Update a period. Snapshots the current cache entry for rollback if the mutation fails. */
export function useUpdatePeriod(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PeriodUpdateData }) =>
      updatePeriod(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: periodKeys.detail(id) });
      const previous = queryClient.getQueryData(periodKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(periodKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: periodKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: periodKeys.lists() });
      // The detail page reads via bySlug (not detail(id)); invalidate the whole
      // slug namespace so an edit is reflected immediately after the redirect,
      // rather than showing a stale row until staleTime elapses.
      void queryClient.invalidateQueries({ queryKey: periodKeys.slugs() });
    },
  });
}

/** Delete a period and remove it from the cache. */
export function useDeletePeriod(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePeriod(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: periodKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: periodKeys.lists() });
    },
  });
}

/** Publish a period (set published=true and record published_at). */
export function usePublishPeriod(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishPeriod(client, id),
    onSuccess: () => {
      // Invalidate by prefix so lists, detail, and bySlug queries stay
      // consistent with the RLS visibility change.
      void queryClient.invalidateQueries({ queryKey: periodKeys.all });
    },
  });
}

/** Unpublish a period (set published=false and clear published_at). */
export function useUnpublishPeriod(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unpublishPeriod(client, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: periodKeys.all });
    },
  });
}

/** Add a period to a timeline. */
export function useAddPeriodToTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      periodId,
      timelineId,
    }: {
      periodId: string;
      timelineId: string;
    }) => addPeriodToTimeline(client, periodId, timelineId),
    onSuccess: (_data, { periodId }) => {
      void queryClient.invalidateQueries({
        queryKey: periodKeys.detail(periodId),
      });
    },
  });
}

/** Remove a period from a timeline. */
export function useRemovePeriodFromTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      periodId,
      timelineId,
    }: {
      periodId: string;
      timelineId: string;
    }) => removePeriodFromTimeline(client, periodId, timelineId),
    onSuccess: (_data, { periodId }) => {
      void queryClient.invalidateQueries({
        queryKey: periodKeys.detail(periodId),
      });
    },
  });
}
