/**
 * TanStack Query hooks for the Timeline entity.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getTimelines,
  getTimelineById,
  getTimelineBySlug,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  publishTimeline,
  unpublishTimeline,
  getCollaborators,
} from "@repo/services/timeline-service.js";
import type {
  TimelineFilters,
  TimelineWithRelations,
  CreateTimelineInput,
} from "@repo/services/timeline-service.js";

type ServiceClient = Parameters<typeof getTimelines>[0];
type TimelineUpdateData = Parameters<typeof updateTimeline>[2];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const timelineKeys = {
  all: ["timelines"] as const,
  lists: () => [...timelineKeys.all, "list"] as const,
  list: (filters: TimelineFilters) =>
    [...timelineKeys.lists(), filters] as const,
  details: () => [...timelineKeys.all, "detail"] as const,
  detail: (id: string) => [...timelineKeys.details(), id] as const,
  bySlug: (userId: string, slug: string) =>
    [...timelineKeys.all, "slug", userId, slug] as const,
  collaborators: (id: string) =>
    [...timelineKeys.all, "collaborators", id] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated, optionally filtered list of timelines. */
export function useTimelines(
  client: ServiceClient,
  filters: TimelineFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getTimelines>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: timelineKeys.list(filters),
    queryFn: () => getTimelines(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single timeline by UUID with related data. */
export function useTimeline(
  client: ServiceClient,
  id: string,
  options?: Omit<
    UseQueryOptions<TimelineWithRelations>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: timelineKeys.detail(id),
    queryFn: () => getTimelineById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a single timeline by owner user ID and slug. */
export function useTimelineBySlug(
  client: ServiceClient,
  userId: string,
  slug: string,
  options?: Omit<
    UseQueryOptions<TimelineWithRelations>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: timelineKeys.bySlug(userId, slug),
    queryFn: () => getTimelineBySlug(client, userId, slug),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch the collaborator list for a timeline. */
export function useTimelineCollaborators(
  client: ServiceClient,
  timelineId: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCollaborators>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: timelineKeys.collaborators(timelineId),
    queryFn: () => getCollaborators(client, timelineId),
    staleTime: 30_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new timeline and invalidate the timelines list cache. */
export function useCreateTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimelineInput) => createTimeline(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.lists() });
    },
  });
}

/** Update a timeline. Snapshots the current cache entry for rollback if the mutation fails. */
export function useUpdateTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimelineUpdateData }) =>
      updateTimeline(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: timelineKeys.detail(id) });
      const previous = queryClient.getQueryData(timelineKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(timelineKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: timelineKeys.lists() });
    },
  });
}

/** Delete a timeline and remove it from the cache. */
export function useDeleteTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeline(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: timelineKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: timelineKeys.lists() });
    },
  });
}

/** Publish a timeline (set visibility to public). */
export function usePublishTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishTimeline(client, id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: timelineKeys.lists() });
    },
  });
}

/** Unpublish a timeline (set visibility to private). */
export function useUnpublishTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unpublishTimeline(client, id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: timelineKeys.lists() });
    },
  });
}
