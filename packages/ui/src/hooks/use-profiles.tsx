/**
 * TanStack Query hooks for the Profile entity.
 *
 * Profiles are globally readable (`read_profiles` RLS is `USING (true)`), so
 * these power collaborator features: resolving a `@username` in the add dialog
 * and enriching collaborator/owner rows with display name and avatar.
 */
"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getProfileByUsername,
  getProfilesByIds,
} from "@repo/services/profile-service";

type ServiceClient = Parameters<typeof getProfileByUsername>[0];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const profileKeys = {
  all: ["profiles"] as const,
  byUsername: (username: string) =>
    [...profileKeys.all, "username", username] as const,
  byIds: (ids: string[]) =>
    [...profileKeys.all, "ids", [...ids].sort()] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Resolve a `@username` to a profile (or `null` when none matches). Disabled for
 * an empty username so the add dialog can mount the hook before the user types.
 */
export function useProfileByUsername(
  client: ServiceClient,
  username: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getProfileByUsername>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: profileKeys.byUsername(username),
    queryFn: () => getProfileByUsername(client, username),
    enabled: username.length > 0,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Batch-fetch profiles by id, for enriching collaborator lists and the timeline
 * owner. Disabled for an empty id list (the service also short-circuits).
 */
export function useProfilesByIds(
  client: ServiceClient,
  ids: string[],
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getProfilesByIds>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: profileKeys.byIds(ids),
    queryFn: () => getProfilesByIds(client, ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
    ...options,
  });
}
