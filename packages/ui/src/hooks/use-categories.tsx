/**
 * TanStack Query hooks for the Category entity.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} from "@repo/services/category-service.js";
import type {
  CategoryFilters,
  CategoryNode,
  CreateCategoryInput,
} from "@repo/services/category-service.js";

type ServiceClient = Parameters<typeof getCategories>[0];
type CategoryUpdateData = Parameters<typeof updateCategory>[2];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters: CategoryFilters) =>
    [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  bySlug: (userId: string, slug: string) =>
    [...categoryKeys.all, "slug", userId, slug] as const,
  tree: (userId: string) => [...categoryKeys.all, "tree", userId] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch a paginated flat list of categories. */
export function useCategories(
  client: ServiceClient,
  filters: CategoryFilters = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCategories>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => getCategories(client, filters),
    staleTime: 30_000,
    ...options,
  });
}

/** Fetch a single category by UUID. */
export function useCategory(
  client: ServiceClient,
  id: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCategoryById>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(client, id),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch a single category by owner user ID and slug. */
export function useCategoryBySlug(
  client: ServiceClient,
  userId: string,
  slug: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getCategoryBySlug>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: categoryKeys.bySlug(userId, slug),
    queryFn: () => getCategoryBySlug(client, userId, slug),
    staleTime: 60_000,
    ...options,
  });
}

/** Fetch the full nested category tree for a user. */
export function useCategoryTree(
  client: ServiceClient,
  userId: string,
  options?: Omit<UseQueryOptions<CategoryNode[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: categoryKeys.tree(userId),
    queryFn: () => getCategoryTree(client, userId),
    staleTime: 30_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/** Create a new category and invalidate the categories cache. */
export function useCreateCategory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory(client, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: [...categoryKeys.all, "tree"],
      });
    },
  });
}

/** Update a category with optimistic update and rollback on error. */
export function useUpdateCategory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdateData }) =>
      updateCategory(client, id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.detail(id) });
      const previous = queryClient.getQueryData(categoryKeys.detail(id));
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(categoryKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: [...categoryKeys.all, "tree"],
      });
    },
  });
}

/** Delete a category and remove it from the cache. */
export function useDeleteCategory(client: ServiceClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(client, id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: [...categoryKeys.all, "tree"],
      });
    },
  });
}
