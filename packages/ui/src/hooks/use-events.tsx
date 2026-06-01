/**
 * TanStack Query hooks for the Event entity.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getEvents,
  getEventById,
  getEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  getEventParticipants,
  getEventsInTemporalRange,
  addCharacterToEvent,
  removeCharacterFromEvent,
  addCategoryToEvent,
  removeCategoryFromEvent,
  addMediaToEvent,
  removeMediaFromEvent,
} from "@repo/services/event-service.js";
import type {
  EventFilters,
  EventWithRelations,
  CreateEventInput,
  CharacterRole,
  CharacterSignificance,
} from "@repo/services/event-service.js";

type ServiceClient = Parameters<typeof getEvents>[0];
type EventUpdateData = Parameters<typeof updateEvent>[2];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (filters: EventFilters) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  bySlug: (userId: string, slug: string) =>
    [...eventKeys.all, "slug", userId, slug] as const,
  participants: (id: string) => [...eventKeys.all, "participants", id] as const,
  temporalRange: (start: number, end: number) =>
    [...eventKeys.all, "temporalRange", start, end] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated, optionally filtered list of events. */
export function useEvents(
  client: ServiceClient,
  filters: EventFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getEvents>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => getEvents(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single event by UUID with related data. */
export function useEvent(
  client: ServiceClient,
  id: string,
  options?: Omit<UseQueryOptions<EventWithRelations>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getEventById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a single event by owner user ID and slug. */
export function useEventBySlug(
  client: ServiceClient,
  userId: string,
  slug: string,
  options?: Omit<UseQueryOptions<EventWithRelations>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: eventKeys.bySlug(userId, slug),
    queryFn: () => getEventBySlug(client, userId, slug),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch the participant records for an event. */
export function useEventParticipants(
  client: ServiceClient,
  eventId: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getEventParticipants>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: eventKeys.participants(eventId),
    queryFn: () => getEventParticipants(client, eventId),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch events within a temporal sort-order range. */
export function useEventsInTemporalRange(
  client: ServiceClient,
  start: number,
  end: number,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getEventsInTemporalRange>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: eventKeys.temporalRange(start, end),
    queryFn: () => getEventsInTemporalRange(client, start, end),
    staleTime: 30_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new event and invalidate the events list cache. */
export function useCreateEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventInput) => createEvent(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

/** Update an event. Snapshots the current cache entry for rollback if the mutation fails. */
export function useUpdateEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventUpdateData }) =>
      updateEvent(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.detail(id) });
      const previous = queryClient.getQueryData(eventKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(eventKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

/** Delete an event and remove it from the cache. */
export function useDeleteEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

/** Publish an event (set published=true and published_at timestamp). */
export function usePublishEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishEvent(client, id),
    onSuccess: () => {
      // Invalidate by prefix so bySlug and temporalRange queries stay consistent
      // with RLS visibility changes — mirrors usePublishTimeline.
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/** Unpublish an event (set published=false and clear published_at). */
export function useUnpublishEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unpublishEvent(client, id),
    onSuccess: () => {
      // Invalidate by prefix so bySlug and temporalRange queries stay consistent
      // with RLS visibility changes — mirrors useUnpublishTimeline.
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/** Add a character participant to an event. */
export function useAddCharacterToEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      characterId,
      role,
      significance,
    }: {
      eventId: string;
      characterId: string;
      role?: CharacterRole;
      significance?: CharacterSignificance;
    }) => addCharacterToEvent(client, eventId, characterId, role, significance),
    onSuccess: (_data, { eventId }) => {
      void queryClient.invalidateQueries({
        queryKey: eventKeys.participants(eventId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventKeys.detail(eventId),
      });
    },
  });
}

/** Remove a character participant from an event. */
export function useRemoveCharacterFromEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      characterId,
    }: {
      eventId: string;
      characterId: string;
    }) => removeCharacterFromEvent(client, eventId, characterId),
    onSuccess: (_data, { eventId }) => {
      void queryClient.invalidateQueries({
        queryKey: eventKeys.participants(eventId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventKeys.detail(eventId),
      });
    },
  });
}

/** Add a category to an event. */
export function useAddCategoryToEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      categoryId,
    }: {
      eventId: string;
      categoryId: string;
    }) => addCategoryToEvent(client, eventId, categoryId),
    onSuccess: (_data, { eventId }) => {
      void queryClient.invalidateQueries({
        queryKey: eventKeys.detail(eventId),
      });
    },
  });
}

/** Remove a category from an event. */
export function useRemoveCategoryFromEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      categoryId,
    }: {
      eventId: string;
      categoryId: string;
    }) => removeCategoryFromEvent(client, eventId, categoryId),
    onSuccess: (_data, { eventId }) => {
      void queryClient.invalidateQueries({
        queryKey: eventKeys.detail(eventId),
      });
    },
  });
}

/** Add a media item to an event. */
export function useAddMediaToEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, mediaId }: { eventId: string; mediaId: string }) =>
      addMediaToEvent(client, eventId, mediaId),
    onSuccess: (_data, { eventId }) => {
      void queryClient.invalidateQueries({
        queryKey: eventKeys.detail(eventId),
      });
    },
  });
}

/** Remove a media item from an event. */
export function useRemoveMediaFromEvent(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, mediaId }: { eventId: string; mediaId: string }) =>
      removeMediaFromEvent(client, eventId, mediaId),
    onSuccess: (_data, { eventId }) => {
      void queryClient.invalidateQueries({
        queryKey: eventKeys.detail(eventId),
      });
    },
  });
}
