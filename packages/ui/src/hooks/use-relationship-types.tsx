/**
 * TanStack Query hooks for the relationship vocabulary (issue #419).
 *
 * The vocabulary is reference data — the three-level ontology of categories →
 * types → sub-roles that replaced the hard-coded `relationship_type` CHECK. It
 * changes rarely (an admin adding a type), so it is cached aggressively; the
 * admin CRUD surface (#428) is responsible for invalidating `relationshipTypeKeys`
 * after a mutation, otherwise editors hold a stale vocabulary and cannot select
 * a newly added type until a reload.
 */
"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  countRelationshipRoleUsage,
  countRelationshipTypeUsage,
  createRelationshipCategory,
  createRelationshipRole,
  createRelationshipType,
  deleteRelationshipCategory,
  deleteRelationshipRole,
  deleteRelationshipType,
  listRelationshipCategories,
  fetchRelationshipVocabulary,
  updateRelationshipCategory,
  updateRelationshipRole,
  updateRelationshipType,
} from "@repo/services/relationship-type-service";
import {
  toVocabulary,
  type RelationshipCategoryCreateInput,
  type RelationshipCategoryMeta,
  type RelationshipCategoryUpdateInput,
  type RelationshipRoleCreateInput,
  type RelationshipRoleUpdateInput,
  type RelationshipTypeCreateInput,
  type RelationshipTypeUpdateInput,
  type RelationshipVocabulary,
} from "@repo/services/schemas/relationship-vocabulary";

type ServiceClient = Parameters<typeof listRelationshipCategories>[0];

export const relationshipTypeKeys = {
  all: ["relationship-vocabulary"] as const,
  list: (activeOnly: boolean) =>
    [...relationshipTypeKeys.all, "list", activeOnly] as const,
  usage: (typeKey: string, roleKey?: string) =>
    [...relationshipTypeKeys.all, "usage", typeKey, roleKey ?? null] as const,
};

/**
 * Fetch the vocabulary as an ordered category tree — what the type picker
 * renders. Groups are ordered by `relationship_categories.sort_order` and types
 * within a group by `relationship_types.sort_order`, so no consumer hard-codes
 * an ordering.
 */
export function useRelationshipCategories(
  client: ServiceClient,
  options?: {
    activeOnly?: boolean;
  } & Omit<UseQueryOptions<RelationshipCategoryMeta[]>, "queryKey" | "queryFn">,
) {
  const { activeOnly = true, ...queryOptions } = options ?? {};
  return useQuery({
    queryKey: relationshipTypeKeys.list(activeOnly),
    queryFn: () => listRelationshipCategories(client, { activeOnly }),
    // Vocabulary is near-static; refetching it on every mount is wasted work.
    staleTime: 5 * 60_000,
    ...queryOptions,
  });
}

/**
 * The same fetch, exposed as a key → metadata lookup for consumers that need
 * semantics (symmetry, inverse, sub-roles) rather than display ordering.
 *
 * Derived from the cached category tree so both hooks share one query.
 */
export function useRelationshipVocabulary(
  client: ServiceClient,
  options?: { activeOnly?: boolean },
): {
  vocabulary: RelationshipVocabulary;
  categories: RelationshipCategoryMeta[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} {
  const query = useRelationshipCategories(client, options);
  const categories = useMemo(() => query.data ?? [], [query.data]);
  const vocabulary = useMemo(() => toVocabulary(categories), [categories]);

  return {
    vocabulary,
    categories,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    // Exposed so a consumer showing an error state can offer Retry for the
    // vocabulary itself, not just for whatever entity query sits alongside it.
    refetch: () => void query.refetch(),
  };
}

/* ---------------------------------------------------------------- *
 * Usage counts
 * ---------------------------------------------------------------- */

/**
 * How many relationships use a type (or one of its sub-roles) — the blast
 * radius the delete and deactivate dialogs show.
 *
 * `enabled` is exposed so a dialog only pays for the count once it opens.
 * Counting every row in the tree eagerly would be dozens of COUNT queries for
 * a number almost none of them display.
 */
export function useRelationshipTypeUsage(
  client: ServiceClient,
  typeKey: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: relationshipTypeKeys.usage(typeKey),
    queryFn: () => countRelationshipTypeUsage(client, typeKey),
    enabled: options?.enabled ?? true,
    // Usage is a live figure the admin is about to act on; don't serve a
    // cached count from a dialog they opened ten minutes ago.
    staleTime: 0,
  });
}

/** As {@link useRelationshipTypeUsage}, for one sub-role of a type. */
export function useRelationshipRoleUsage(
  client: ServiceClient,
  typeKey: string,
  roleKey: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: relationshipTypeKeys.usage(typeKey, roleKey),
    queryFn: () => countRelationshipRoleUsage(client, typeKey, roleKey),
    enabled: options?.enabled ?? true,
    staleTime: 0,
  });
}

/* ---------------------------------------------------------------- *
 * Mutation hooks
 *
 * Every one of these invalidates `relationshipTypeKeys.all`, and that is the
 * point of the whole surface (ADR-0040 IMP-003). The vocabulary is cached with
 * a 5-minute staleTime and read by the relationship editor; without
 * invalidation an admin adds a type and then cannot select it until a hard
 * reload — reproducing at runtime the exact staleness the reference-data
 * refactor set out to remove.
 *
 * `all` rather than a narrower key on purpose: the tree is read twice, once
 * with `activeOnly: true` (editors) and once with `false` (this surface), and
 * both entries must move together. The key factory has no `lists()` aggregator,
 * so `all` is the only key that covers both.
 * ---------------------------------------------------------------- */

/** Invalidate every cached view of the vocabulary. */
function useInvalidateVocabulary() {
  const queryClient = useQueryClient();
  return () =>
    void queryClient.invalidateQueries({ queryKey: relationshipTypeKeys.all });
}

export function useCreateRelationshipCategory(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: (input: RelationshipCategoryCreateInput) =>
      createRelationshipCategory(client, input),
    onSuccess: invalidate,
  });
}

export function useUpdateRelationshipCategory(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: ({
      key,
      patch,
    }: {
      key: string;
      patch: RelationshipCategoryUpdateInput;
    }) => updateRelationshipCategory(client, key, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteRelationshipCategory(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: (key: string) => deleteRelationshipCategory(client, key),
    onSuccess: invalidate,
  });
}

export function useCreateRelationshipType(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: (input: RelationshipTypeCreateInput) =>
      createRelationshipType(client, input),
    onSuccess: invalidate,
  });
}

export function useUpdateRelationshipType(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: ({
      key,
      patch,
    }: {
      key: string;
      patch: RelationshipTypeUpdateInput;
    }) => updateRelationshipType(client, key, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteRelationshipType(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: (key: string) => deleteRelationshipType(client, key),
    onSuccess: invalidate,
  });
}

export function useCreateRelationshipRole(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: (input: RelationshipRoleCreateInput) =>
      createRelationshipRole(client, input),
    onSuccess: invalidate,
  });
}

export function useUpdateRelationshipRole(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: ({
      typeKey,
      key,
      patch,
    }: {
      typeKey: string;
      key: string;
      patch: RelationshipRoleUpdateInput;
    }) => updateRelationshipRole(client, typeKey, key, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteRelationshipRole(client: ServiceClient) {
  const invalidate = useInvalidateVocabulary();
  return useMutation({
    mutationFn: ({ typeKey, key }: { typeKey: string; key: string }) =>
      deleteRelationshipRole(client, typeKey, key),
    onSuccess: invalidate,
  });
}

export { fetchRelationshipVocabulary };
