/**
 * TanStack Query hooks for the CharacterRelationship entity.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getRelationships,
  getRelationshipById,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getSharedEvents,
  getCharacterNetwork,
  getMutualRelationships,
} from "@repo/services/character-relationship-service.js";
import type {
  RelationshipFilters,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from "@repo/services/character-relationship-service.js";

type ServiceClient = Parameters<typeof getRelationships>[0];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const relationshipKeys = {
  all: ["relationships"] as const,
  lists: () => [...relationshipKeys.all, "list"] as const,
  list: (characterId: string, filters: RelationshipFilters) =>
    [...relationshipKeys.lists(), characterId, filters] as const,
  details: () => [...relationshipKeys.all, "detail"] as const,
  detail: (id: string) => [...relationshipKeys.details(), id] as const,
  sharedEvents: (characterIdA: string, characterIdB: string) =>
    [
      ...relationshipKeys.all,
      "sharedEvents",
      characterIdA,
      characterIdB,
    ] as const,
  network: (characterId: string, depth?: number) =>
    [...relationshipKeys.all, "network", characterId, depth] as const,
  mutual: (characterIdA: string, characterIdB: string) =>
    [...relationshipKeys.all, "mutual", characterIdA, characterIdB] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch relationships involving a character. */
export function useCharacterRelationships(
  client: ServiceClient,
  characterId: string,
  filters: RelationshipFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getRelationships>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.list(characterId, filters),
    queryFn: () => getRelationships(client, characterId, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single relationship by UUID. */
export function useRelationship(
  client: ServiceClient,
  id: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getRelationshipById>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.detail(id),
    queryFn: () => getRelationshipById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch events shared by two characters. */
export function useSharedEvents(
  client: ServiceClient,
  characterIdA: string,
  characterIdB: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSharedEvents>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.sharedEvents(characterIdA, characterIdB),
    queryFn: () => getSharedEvents(client, characterIdA, characterIdB),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch the relationship network graph for a character. */
export function useCharacterNetworkGraph(
  client: ServiceClient,
  characterId: string,
  depth?: number,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCharacterNetwork>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.network(characterId, depth),
    queryFn: () => getCharacterNetwork(client, characterId, depth),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch mutual relationships between two characters. */
export function useMutualRelationships(
  client: ServiceClient,
  characterIdA: string,
  characterIdB: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getMutualRelationships>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.mutual(characterIdA, characterIdB),
    queryFn: () => getMutualRelationships(client, characterIdA, characterIdB),
    staleTime: 30_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new relationship and invalidate the relationships list cache. */
export function useCreateRelationship(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRelationshipInput) =>
      createRelationship(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: relationshipKeys.lists(),
      });
    },
  });
}

/** Update a relationship with optimistic update and rollback on error. */
export function useUpdateRelationship(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRelationshipInput }) =>
      updateRelationship(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: relationshipKeys.detail(id),
      });
      const previous = queryClient.getQueryData(relationshipKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(relationshipKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: relationshipKeys.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: relationshipKeys.lists(),
      });
    },
  });
}

/** Delete a relationship and remove it from the cache. */
export function useDeleteRelationship(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRelationship(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: relationshipKeys.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: relationshipKeys.lists(),
      });
    },
  });
}
