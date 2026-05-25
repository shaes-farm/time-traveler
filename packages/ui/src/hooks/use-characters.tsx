/**
 * TanStack Query hooks for the Character entity.
 *
 * All hooks accept a Supabase browser client as their first argument.
 * The client type is derived from the service function signatures to avoid
 * a direct dependency on the generated Database type in this package.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getCharacters,
  getCharacterById,
  getCharacterBySlug,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharacterTimeline,
  getCharacterNetwork,
} from "@repo/services/character-service.js";
import type {
  CharacterFilters,
  CharacterWithRelations,
  CreateCharacterInput,
} from "@repo/services/character-service.js";

/** Derived from `updateCharacter`'s third parameter — avoids importing nested schema types. */
type CharacterUpdateData = Parameters<typeof updateCharacter>[2];

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

type ServiceClient = Parameters<typeof getCharacters>[0];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const characterKeys = {
  all: ["characters"] as const,
  lists: () => [...characterKeys.all, "list"] as const,
  list: (filters: CharacterFilters) =>
    [...characterKeys.lists(), filters] as const,
  details: () => [...characterKeys.all, "detail"] as const,
  detail: (id: string) => [...characterKeys.details(), id] as const,
  bySlug: (userId: string, slug: string) =>
    [...characterKeys.all, "slug", userId, slug] as const,
  timeline: (id: string) => [...characterKeys.all, "timeline", id] as const,
  network: (id: string, depth?: number) =>
    [...characterKeys.all, "network", id, depth] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated, optionally filtered list of characters. */
export function useCharacters(
  client: ServiceClient,
  filters: CharacterFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCharacters>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: characterKeys.list(filters),
    queryFn: () => getCharacters(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single character by UUID. */
export function useCharacter(
  client: ServiceClient,
  id: string,
  options?: Omit<
    UseQueryOptions<CharacterWithRelations>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: characterKeys.detail(id),
    queryFn: () => getCharacterById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a single character by owner user ID and slug. */
export function useCharacterBySlug(
  client: ServiceClient,
  userId: string,
  slug: string,
  options?: Omit<
    UseQueryOptions<CharacterWithRelations>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: characterKeys.bySlug(userId, slug),
    queryFn: () => getCharacterBySlug(client, userId, slug),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a character's event timeline (chronological order). */
export function useCharacterTimeline(
  client: ServiceClient,
  characterId: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCharacterTimeline>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: characterKeys.timeline(characterId),
    queryFn: () => getCharacterTimeline(client, characterId),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch the relationship network for a character to a given depth. */
export function useCharacterNetwork(
  client: ServiceClient,
  characterId: string,
  depth?: number,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCharacterNetwork>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: characterKeys.network(characterId, depth),
    queryFn: () => getCharacterNetwork(client, characterId, depth),
    staleTime: 30_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new character and invalidate the characters list cache. */
export function useCreateCharacter(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCharacterInput) => createCharacter(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/** Update a character with optimistic update and rollback on error. */
export function useUpdateCharacter(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CharacterUpdateData }) =>
      updateCharacter(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: characterKeys.detail(id) });
      const previous = queryClient.getQueryData(characterKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(characterKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: characterKeys.detail(id),
      });
      void queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/** Delete a character and remove it from the cache. */
export function useDeleteCharacter(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCharacter(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: characterKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}
