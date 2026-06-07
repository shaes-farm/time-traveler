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
  getTimelinesPage,
  getTimelineById,
  getTimelineBySlug,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  publishTimeline,
  unpublishTimeline,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  addEventToTimeline,
  removeEventFromTimeline,
  setTimelineEventSortOrder,
} from "@repo/services/timeline-service";
import type {
  TimelineFilters,
  TimelinesPage,
  TimelineWithRelations,
  CreateTimelineInput,
  CollaboratorRole,
} from "@repo/services/timeline-service";

type ServiceClient = Parameters<typeof getTimelines>[0];
type TimelineUpdateData = Parameters<typeof updateTimeline>[2];
type CollaboratorRow = Awaited<ReturnType<typeof getCollaborators>>[number];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const timelineKeys = {
  all: ["timelines"] as const,
  lists: () => [...timelineKeys.all, "list"] as const,
  list: (filters: TimelineFilters) =>
    [...timelineKeys.lists(), filters] as const,
  /** Distinct key for paginated queries that return { rows, total }. */
  pages: () => [...timelineKeys.all, "page"] as const,
  page: (filters: TimelineFilters) =>
    [...timelineKeys.pages(), filters] as const,
  details: () => [...timelineKeys.all, "detail"] as const,
  detail: (id: string) => [...timelineKeys.details(), id] as const,
  bySlug: (slug: string) => [...timelineKeys.all, "slug", slug] as const,
  collaborators: (id: string) =>
    [...timelineKeys.all, "collaborators", id] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated, optionally filtered list of timelines (rows only). */
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

/**
 * Fetch a paginated, optionally filtered list of timelines together with
 * the total filtered count (for pagination controls).
 */
export function useTimelinesPage(
  client: ServiceClient,
  filters: TimelineFilters = {},
  options?: Omit<UseQueryOptions<TimelinesPage>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: timelineKeys.page(filters),
    queryFn: () => getTimelinesPage(client, filters),
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

/** Fetch a single timeline by slug. Access is governed by RLS. */
export function useTimelineBySlug(
  client: ServiceClient,
  slug: string,
  options?: Omit<
    UseQueryOptions<TimelineWithRelations>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: timelineKeys.bySlug(slug),
    queryFn: () => getTimelineBySlug(client, slug),
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

/** Update a timeline. Optimistically merges the update into the cache and rolls back if the mutation fails. */
export function useUpdateTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimelineUpdateData }) =>
      updateTimeline(client, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: timelineKeys.detail(id) });
      const previous = queryClient.getQueryData(timelineKeys.detail(id));
      // Optimistically merge the update into the cached detail entry.
      if (previous !== undefined) {
        queryClient.setQueryData(timelineKeys.detail(id), (old: unknown) => ({
          ...(old as object),
          ...data,
        }));
      }
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(timelineKeys.detail(id), context.previous);
      }
    },
    onSuccess: () => {
      // Invalidate by prefix to keep bySlug and collaborator queries consistent.
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
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
      // Invalidate by prefix to keep lists, bySlug, and collaborator queries consistent.
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
  });
}

/** Publish a timeline (set visibility to public). */
export function usePublishTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishTimeline(client, id),
    onSuccess: () => {
      // Invalidate by prefix to keep lists, bySlug, and collaborator queries consistent.
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
  });
}

/** Unpublish a timeline (set visibility to private). */
export function useUnpublishTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unpublishTimeline(client, id),
    onSuccess: () => {
      // Invalidate by prefix to keep lists, bySlug, and collaborator queries consistent.
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
  });
}

/** Add a collaborator to a timeline. */
export function useAddCollaborator(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      timelineId,
      userId,
      role,
    }: {
      timelineId: string;
      userId: string;
      role: CollaboratorRole;
    }) => addCollaborator(client, timelineId, userId, role),
    onSuccess: (_data, { timelineId }) => {
      void queryClient.invalidateQueries({
        queryKey: timelineKeys.collaborators(timelineId),
      });
    },
  });
}

/**
 * Remove a collaborator from a timeline. Optimistically drops the row from the
 * cached collaborator list and rolls back if the mutation fails (wireframe 14:
 * removal "takes effect immediately").
 */
export function useRemoveCollaborator(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      timelineId,
      userId,
    }: {
      timelineId: string;
      userId: string;
    }) => removeCollaborator(client, timelineId, userId),
    onMutate: async ({ timelineId, userId }) => {
      const key = timelineKeys.collaborators(timelineId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CollaboratorRow[]>(key);
      if (previous !== undefined) {
        queryClient.setQueryData<CollaboratorRow[]>(
          key,
          previous.filter((c) => c.user_id !== userId),
        );
      }
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _err, { timelineId }) => {
      void queryClient.invalidateQueries({
        queryKey: timelineKeys.collaborators(timelineId),
      });
    },
  });
}

/**
 * Update a collaborator's role on a timeline. Optimistically rewrites the row's
 * role in the cached list and rolls back on failure (wireframe 14 annotation #4:
 * role changes apply immediately, optimistic with rollback).
 */
export function useUpdateCollaboratorRole(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      timelineId,
      userId,
      role,
    }: {
      timelineId: string;
      userId: string;
      role: CollaboratorRole;
    }) => updateCollaboratorRole(client, timelineId, userId, role),
    onMutate: async ({ timelineId, userId, role }) => {
      const key = timelineKeys.collaborators(timelineId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CollaboratorRow[]>(key);
      if (previous !== undefined) {
        queryClient.setQueryData<CollaboratorRow[]>(
          key,
          previous.map((c) => (c.user_id === userId ? { ...c, role } : c)),
        );
      }
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _err, { timelineId }) => {
      void queryClient.invalidateQueries({
        queryKey: timelineKeys.collaborators(timelineId),
      });
    },
  });
}

/** Link an event to a timeline via the junction table. */
export function useAddEventToTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      timelineId,
      eventId,
      sortOrder,
    }: {
      timelineId: string;
      eventId: string;
      sortOrder?: number;
    }) => addEventToTimeline(client, timelineId, eventId, sortOrder),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
  });
}

/** Unlink an event from a timeline (removes the junction row). */
export function useRemoveEventFromTimeline(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      timelineId,
      eventId,
    }: {
      timelineId: string;
      eventId: string;
    }) => removeEventFromTimeline(client, timelineId, eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
  });
}

/** Set the editorial sort_order for an event on a timeline. */
export function useSetTimelineEventSortOrder(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      timelineId,
      eventId,
      sortOrder,
    }: {
      timelineId: string;
      eventId: string;
      sortOrder: number;
    }) => setTimelineEventSortOrder(client, timelineId, eventId, sortOrder),
    onSuccess: (_data, { timelineId }) => {
      void queryClient.invalidateQueries({
        queryKey: timelineKeys.detail(timelineId),
      });
    },
  });
}
