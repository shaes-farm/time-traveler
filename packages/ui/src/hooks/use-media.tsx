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
} from "@repo/services/media-service.js";
import type {
  MediaFilters,
  UploadMediaInput,
  CreateExternalMediaInput,
} from "@repo/services/media-service.js";

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
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}
