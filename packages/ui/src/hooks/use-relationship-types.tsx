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
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listRelationshipCategories,
  fetchRelationshipVocabulary,
} from "@repo/services/relationship-type-service";
import {
  toVocabulary,
  type RelationshipCategoryMeta,
  type RelationshipVocabulary,
} from "@repo/services/schemas/relationship-vocabulary";

type ServiceClient = Parameters<typeof listRelationshipCategories>[0];

export const relationshipTypeKeys = {
  all: ["relationship-vocabulary"] as const,
  list: (activeOnly: boolean) =>
    [...relationshipTypeKeys.all, "list", activeOnly] as const,
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

export { fetchRelationshipVocabulary };
