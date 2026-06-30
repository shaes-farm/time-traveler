/**
 * TanStack Query hooks for the Media entity.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getMedia,
  getMediaById,
  uploadMedia,
  createExternalMedia,
  updateMedia,
  deleteMedia,
  getSignedUrl,
  getMediaLibraryPage,
  getMediaFacetCounts,
  getMediaAttachments,
  getMediaAttachmentsBulk,
} from "@repo/services/media-service";
import { removeMediaFromCharacter } from "@repo/services/character-service";
import { removeMediaFromEvent } from "@repo/services/event-service";
import { removeMediaFromTimeline } from "@repo/services/timeline-service";
import type {
  MediaFilters,
  UploadMediaInput,
  CreateExternalMediaInput,
} from "@repo/services/media-service";
import type {
  MediaAttachmentKind,
  MediaLibraryFilters,
} from "@repo/services/schemas/media";

type ServiceClient = Parameters<typeof getMedia>[0];
type MediaUpdateData = Parameters<typeof updateMedia>[2];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const mediaKeys = {
  all: ["media"] as const,
  lists: () => [...mediaKeys.all, "list"] as const,
  list: (filters: MediaFilters) => [...mediaKeys.lists(), filters] as const,
  details: () => [...mediaKeys.all, "detail"] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
  /** Cache key includes expiresInSeconds so different expiry windows never collide. */
  signedUrl: (id: string, expiresInSeconds: number) =>
    [...mediaKeys.all, "signedUrl", id, expiresInSeconds] as const,
  // Cross-entity media library (screen 17 / #292)
  library: (filters: MediaLibraryFilters) =>
    [...mediaKeys.all, "library", filters] as const,
  facets: (filters: MediaLibraryFilters) =>
    [...mediaKeys.all, "facets", filters] as const,
  attachments: (mediaId: string) =>
    [...mediaKeys.all, "attachments", mediaId] as const,
  /** Sort the ids so permutations of the same set share one cache entry —
   * bulk attachment results are order-independent. */
  attachmentsBulk: (mediaIds: string[]) =>
    [...mediaKeys.all, "attachments", "bulk", [...mediaIds].sort()] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated, optionally filtered list of media records. */
export function useMedia(
  client: ServiceClient,
  filters: MediaFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getMedia>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: () => getMedia(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single media record by UUID. */
export function useMediaItem(
  client: ServiceClient,
  id: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getMediaById>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => getMediaById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a short-lived signed URL for a private media file. */
export function useMediaSignedUrl(
  client: ServiceClient,
  mediaId: string,
  expiresInSeconds = 3600,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSignedUrl>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: mediaKeys.signedUrl(mediaId, expiresInSeconds),
    queryFn: () => getSignedUrl(client, mediaId, expiresInSeconds),
    // Signed URLs expire — stale after half the expiry window
    staleTime: (expiresInSeconds * 1000) / 2,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Cross-entity media library hooks (screen 17 / #292) — consume #291 query layer
// ---------------------------------------------------------------------------

/**
 * Fetch one keyset page of the cross-entity media library. Facets combine AND
 * across groups, OR within a group; pass `filters.cursor` from a previous
 * page's `nextCursor` to advance. Returns `{ rows, nextCursor, hasMore }`.
 */
export function useMediaLibrary(
  client: ServiceClient,
  filters: MediaLibraryFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getMediaLibraryPage>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: mediaKeys.library(filters),
    queryFn: () => getMediaLibraryPage(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch per-option facet counts for the library filter rail. */
export function useMediaFacetCounts(
  client: ServiceClient,
  filters: MediaLibraryFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getMediaFacetCounts>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: mediaKeys.facets(filters),
    queryFn: () => getMediaFacetCounts(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Resolve a single media row's attachments across all three junctions. */
export function useMediaAttachments(
  client: ServiceClient,
  mediaId: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getMediaAttachments>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: mediaKeys.attachments(mediaId),
    queryFn: () => getMediaAttachments(client, mediaId),
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Bulk-resolve attachments for a page of media ids — one map keyed by media id,
 * for the per-card `⛓ N` "Attached to" badges. Disabled when `mediaIds` is empty.
 */
export function useMediaAttachmentsBulk(
  client: ServiceClient,
  mediaIds: string[],
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getMediaAttachmentsBulk>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: mediaKeys.attachmentsBulk(mediaIds),
    queryFn: () => getMediaAttachmentsBulk(client, mediaIds),
    enabled: mediaIds.length > 0,
    staleTime: 30_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Upload a file to Supabase Storage and create a media record. */
export function useUploadMedia(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UploadMediaInput) => uploadMedia(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

/** Register an external (non-hosted) media URL as a media record. */
export function useCreateExternalMedia(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExternalMediaInput) =>
      createExternalMedia(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

/** Update a media record. Snapshots the current cache entry for rollback if the mutation fails. */
export function useUpdateMedia(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MediaUpdateData }) =>
      updateMedia(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: mediaKeys.detail(id) });
      const previous = queryClient.getQueryData(mediaKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(mediaKeys.detail(id), context.previous);
      }
    },
    onSuccess: () => {
      // A media edit (alt/caption/slug) propagates to every surface it appears
      // on, so refresh all media-derived caches — the library grid + facet
      // counts + attachment maps hang off mediaKeys.all, not mediaKeys.lists().
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

/** Delete a media record and its associated storage file. */
export function useDeleteMedia(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMedia(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: mediaKeys.detail(id) });
      // Broad invalidation: the library + facet + attachment queries hang off
      // mediaKeys.all but not mediaKeys.lists(), so the grid would otherwise
      // keep showing a now-deleted row.
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

/**
 * Delete several media rows in one action — the library's orphan bulk cleanup
 * (screen-17 edge case). Each delete reuses {@link deleteMedia} (which also
 * removes the Storage object for uploads); the cache is invalidated once after
 * all deletes settle rather than per row. Intended for orphans (`⛓ 0`), so
 * there is no per-item blast-radius confirm.
 */
export function useDeleteMediaBulk(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => deleteMedia(client, id))),
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: mediaKeys.detail(id) });
      }
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

/** Variables for {@link useDetachMedia}: which entity to remove the media from. */
export interface DetachMediaVariables {
  kind: MediaAttachmentKind;
  mediaId: string;
  /** UUID of the parent entity (character/event/timeline) to detach from. */
  entityId: string;
}

/**
 * Detach a media row from one entity by removing a single junction row — the
 * per-row "Detach" in the media detail drawer. Dispatches to the correct
 * `removeMediaFrom*` service by `kind`. Unlike the per-entity detach hooks
 * (which only invalidate that entity's detail), this invalidates `mediaKeys.all`
 * so the drawer's "Attached to" list and the grid's `⛓ N`/orphan badges refresh.
 */
export function useDetachMedia(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, mediaId, entityId }: DetachMediaVariables) => {
      switch (kind) {
        case "character":
          return removeMediaFromCharacter(client, entityId, mediaId);
        case "event":
          return removeMediaFromEvent(client, entityId, mediaId);
        case "timeline":
          return removeMediaFromTimeline(client, entityId, mediaId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}
