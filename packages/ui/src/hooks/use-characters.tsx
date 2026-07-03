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
  addMediaToCharacter,
  removeMediaFromCharacter,
  setPrimaryCharacterMedia,
} from "@repo/services/character-service";
import type {
  CharacterFilters,
  CharacterWithRelations,
  CreateCharacterInput,
} from "@repo/services/character-service";

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
// Mutation keys
// ---------------------------------------------------------------------------

/**
 * Mutation keys distinguishing the deliberate "Save" action from the
 * character editor's (#56) 30s dirty-interval auto-save. Distinct keys let
 * the editor track each mutation's pending state independently via
 * `useIsMutating({ mutationKey: characterMutationKeys.autosave })` — without
 * this split, an in-flight auto-save and a user-initiated Save would share
 * one pending flag, so an auto-save completing in the background would reset
 * the Save button's own pending/success state.
 *
 * DECISION: deferred per #54 — a Zustand slice for editor dirty/autosave-timer
 * state was considered here but is out of scope this milestone; `ui-store`
 * continues to own only global panel/drawer state. The editor should track
 * its own dirty flag and timer locally and read mutation status via these
 * keys with `useIsMutating`/`useMutationState`.
 */
export const characterMutationKeys = {
  update: [...characterKeys.all, "update"] as const,
  autosave: [...characterKeys.all, "autosave"] as const,
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

/** Update a character. Snapshots the current cache entry for rollback if the mutation fails. */
export function useUpdateCharacter(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: characterMutationKeys.update,
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

/**
 * Auto-save variant of `useUpdateCharacter` for the editor's periodic
 * dirty-save (#56). Same request and snapshot/rollback shape, but keyed
 * separately (`characterMutationKeys.autosave`) so it never shares pending
 * state with the deliberate Save mutation, and invalidates only the detail
 * query — not the lists — since auto-save never toggles `published` (the
 * editor's Save button is still required to transition Draft → Published)
 * and re-fetching the whole list on every 30s tick would be wasteful.
 */
export function useAutosaveCharacter(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: characterMutationKeys.autosave,
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

/** Attach a media item to a character, optionally marking it primary. */
export function useAddMediaToCharacter(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      characterId,
      mediaId,
      isPrimary,
    }: {
      characterId: string;
      mediaId: string;
      isPrimary?: boolean;
    }) => addMediaToCharacter(client, characterId, mediaId, isPrimary),
    onSuccess: (_data, { characterId }) => {
      void queryClient.invalidateQueries({
        queryKey: characterKeys.detail(characterId),
      });
    },
  });
}

/** Detach a media item from a character (junction only; media survives). */
export function useRemoveMediaFromCharacter(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      characterId,
      mediaId,
    }: {
      characterId: string;
      mediaId: string;
    }) => removeMediaFromCharacter(client, characterId, mediaId),
    onSuccess: (_data, { characterId }) => {
      void queryClient.invalidateQueries({
        queryKey: characterKeys.detail(characterId),
      });
    },
  });
}

/**
 * Set a media item as the character's primary image. Optimistically flips
 * `is_primary` across the cached character's `character_media` array before
 * the server responds (the server call itself remains a sequential two-step
 * swap, not transactional — see `setPrimaryCharacterMedia` in
 * character-service.ts), rolling back to the snapshot on error.
 */
export function useSetPrimaryCharacterMedia(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      characterId,
      mediaId,
    }: {
      characterId: string;
      mediaId: string;
    }) => setPrimaryCharacterMedia(client, characterId, mediaId),
    onMutate: async ({ characterId, mediaId }) => {
      await queryClient.cancelQueries({
        queryKey: characterKeys.detail(characterId),
      });
      const previous = queryClient.getQueryData<CharacterWithRelations>(
        characterKeys.detail(characterId),
      );
      if (previous !== undefined) {
        queryClient.setQueryData<CharacterWithRelations>(
          characterKeys.detail(characterId),
          {
            ...previous,
            character_media: previous.character_media.map((media) => ({
              ...media,
              is_primary: media.media_id === mediaId,
            })),
          },
        );
      }
      return { previous, characterId };
    },
    onError: (_err, { characterId }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          characterKeys.detail(characterId),
          context.previous,
        );
      }
    },
    onSuccess: (_data, { characterId }) => {
      void queryClient.invalidateQueries({
        queryKey: characterKeys.detail(characterId),
      });
    },
  });
}
