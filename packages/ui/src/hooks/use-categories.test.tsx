import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useCategories,
  useCategory,
  useCategoryTree,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  categoryKeys,
} from "./use-categories.js";

vi.mock("@repo/services/category-service.js", () => ({
  getCategories: vi.fn(),
  getCategoryById: vi.fn(),
  getCategoryBySlug: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getCategoryTree: vi.fn(),
}));

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} from "@repo/services/category-service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockClient = {} as any;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const mockCategory = {
  id: "cat-1",
  slug: "battles",
  user_id: "user-1",
  parent_category_id: null,
};
const mockCategories = [mockCategory];

describe("useCategories", () => {
  beforeEach(() => {
    vi.mocked(getCategories).mockResolvedValue(mockCategories as never);
  });

  it("calls getCategories with client and filters", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategories(mockClient, {}), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCategories).toHaveBeenCalledWith(mockClient, {});
    expect(result.current.data).toEqual(mockCategories);
  });
});

describe("useCategory", () => {
  it("calls getCategoryById with client and id", async () => {
    vi.mocked(getCategoryById).mockResolvedValue(mockCategory as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategory(mockClient, "cat-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCategoryById).toHaveBeenCalledWith(mockClient, "cat-1");
  });
});

describe("useCategoryTree", () => {
  it("calls getCategoryTree with client and userId", async () => {
    const mockTree = [{ ...mockCategory, children: [] }];
    vi.mocked(getCategoryTree).mockResolvedValue(mockTree as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategoryTree(mockClient, "user-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCategoryTree).toHaveBeenCalledWith(mockClient, "user-1");
    expect(result.current.data).toEqual(mockTree);
  });

  it("uses queryKey that includes userId", async () => {
    vi.mocked(getCategoryTree).mockResolvedValue([] as never);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useCategoryTree(mockClient, "user-99"), { wrapper });

    await waitFor(
      () =>
        queryClient.getQueryState(categoryKeys.tree("user-99"))?.status ===
        "success",
    );

    expect(queryClient.getQueryData(categoryKeys.tree("user-99"))).toEqual([]);
  });
});

describe("useCreateCategory", () => {
  it("calls createCategory and invalidates list and tree caches", async () => {
    vi.mocked(createCategory).mockResolvedValue(mockCategory as never);
    vi.mocked(getCategories).mockResolvedValue(mockCategories as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateCategory(mockClient), {
      wrapper,
    });

    result.current.mutate({ title: "Battles", user_id: "user-1" } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createCategory).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: categoryKeys.lists() }),
    );
    // Also invalidates all tree queries by prefix
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["categories", "tree"]),
      }),
    );
  });
});

describe("useUpdateCategory", () => {
  it("rolls back optimistic update on error", async () => {
    vi.mocked(updateCategory).mockRejectedValue(new Error("fail"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(categoryKeys.detail("cat-1"), mockCategory);

    const { result } = renderHook(() => useUpdateCategory(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "cat-1", data: { title: "Bad" } as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(categoryKeys.detail("cat-1"))).toEqual(
      mockCategory,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updateCategory).mockRejectedValue(new Error("fail"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCategory(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "cat-1", data: { title: "Bad" } as never });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeleteCategory", () => {
  it("calls deleteCategory and removes from cache", async () => {
    vi.mocked(deleteCategory).mockResolvedValue(undefined as never);
    vi.mocked(getCategories).mockResolvedValue(mockCategories as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(categoryKeys.detail("cat-1"), mockCategory);
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteCategory(mockClient), {
      wrapper,
    });
    result.current.mutate("cat-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteCategory).toHaveBeenCalledWith(mockClient, "cat-1");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: categoryKeys.detail("cat-1") }),
    );
  });
});

describe("categoryKeys", () => {
  it("produces stable, unique keys", () => {
    expect(categoryKeys.all).toEqual(["categories"]);
    expect(categoryKeys.lists()).toEqual(["categories", "list"]);
    expect(categoryKeys.tree("user-1")).toEqual([
      "categories",
      "tree",
      "user-1",
    ]);
  });
});
