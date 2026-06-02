/**
 * TanStack Query hooks for the Story entity.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getStories,
  getStoryById,
  getStoryBySlug,
  createStory,
  updateStory,
  deleteStory,
  addCharacterToStory,
  removeCharacterFromStory,
  addEventToStory,
  removeEventFromStory,
  addPeriodToStory,
  removePeriodFromStory,
} from "@repo/services/story-service";
import type {
  StoryFilters,
  StoryWithRelations,
  CreateStoryInput,
  StoryCharacterRole,
} from "@repo/services/story-service";

type ServiceClient = Parameters<typeof getStories>[0];
type StoryUpdateData = Parameters<typeof updateStory>[2];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const storyKeys = {
  all: ["stories"] as const,
  lists: () => [...storyKeys.all, "list"] as const,
  list: (filters: StoryFilters) => [...storyKeys.lists(), filters] as const,
  details: () => [...storyKeys.all, "detail"] as const,
  detail: (id: string) => [...storyKeys.details(), id] as const,
  bySlug: (userId: string, slug: string) =>
    [...storyKeys.all, "slug", userId, slug] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated, optionally filtered list of stories. */
export function useStories(
  client: ServiceClient,
  filters: StoryFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getStories>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: storyKeys.list(filters),
    queryFn: () => getStories(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single story by UUID with related data. */
export function useStory(
  client: ServiceClient,
  id: string,
  options?: Omit<UseQueryOptions<StoryWithRelations>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: () => getStoryById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a single story by owner user ID and slug. */
export function useStoryBySlug(
  client: ServiceClient,
  userId: string,
  slug: string,
  options?: Omit<UseQueryOptions<StoryWithRelations>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: storyKeys.bySlug(userId, slug),
    queryFn: () => getStoryBySlug(client, userId, slug),
    staleTime: 60_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new story and invalidate the stories list cache. */
export function useCreateStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStoryInput) => createStory(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
    },
  });
}

/** Update a story. Snapshots the current cache entry for rollback if the mutation fails. */
export function useUpdateStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoryUpdateData }) =>
      updateStory(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: storyKeys.detail(id) });
      const previous = queryClient.getQueryData(storyKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(storyKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: storyKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
    },
  });
}

/** Delete a story and remove it from the cache. */
export function useDeleteStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStory(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: storyKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
    },
  });
}

/** Add a character to a story. */
export function useAddCharacterToStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storyId,
      characterId,
      role,
    }: {
      storyId: string;
      characterId: string;
      role?: StoryCharacterRole;
    }) => addCharacterToStory(client, storyId, characterId, role),
    onSuccess: (_data, { storyId }) => {
      void queryClient.invalidateQueries({
        queryKey: storyKeys.detail(storyId),
      });
    },
  });
}

/** Remove a character from a story. */
export function useRemoveCharacterFromStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storyId,
      characterId,
    }: {
      storyId: string;
      characterId: string;
    }) => removeCharacterFromStory(client, storyId, characterId),
    onSuccess: (_data, { storyId }) => {
      void queryClient.invalidateQueries({
        queryKey: storyKeys.detail(storyId),
      });
    },
  });
}

/** Add an event to a story. */
export function useAddEventToStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, eventId }: { storyId: string; eventId: string }) =>
      addEventToStory(client, storyId, eventId),
    onSuccess: (_data, { storyId }) => {
      void queryClient.invalidateQueries({
        queryKey: storyKeys.detail(storyId),
      });
    },
  });
}

/** Remove an event from a story. */
export function useRemoveEventFromStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, eventId }: { storyId: string; eventId: string }) =>
      removeEventFromStory(client, storyId, eventId),
    onSuccess: (_data, { storyId }) => {
      void queryClient.invalidateQueries({
        queryKey: storyKeys.detail(storyId),
      });
    },
  });
}

/** Add a period to a story. */
export function useAddPeriodToStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storyId,
      periodId,
    }: {
      storyId: string;
      periodId: string;
    }) => addPeriodToStory(client, storyId, periodId),
    onSuccess: (_data, { storyId }) => {
      void queryClient.invalidateQueries({
        queryKey: storyKeys.detail(storyId),
      });
    },
  });
}

/** Remove a period from a story. */
export function useRemovePeriodFromStory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storyId,
      periodId,
    }: {
      storyId: string;
      periodId: string;
    }) => removePeriodFromStory(client, storyId, periodId),
    onSuccess: (_data, { storyId }) => {
      void queryClient.invalidateQueries({
        queryKey: storyKeys.detail(storyId),
      });
    },
  });
}
