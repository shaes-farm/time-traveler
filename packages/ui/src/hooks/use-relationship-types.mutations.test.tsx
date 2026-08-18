import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRelationshipCategory = vi.fn();
const updateRelationshipCategory = vi.fn();
const deleteRelationshipCategory = vi.fn();
const createRelationshipType = vi.fn();
const updateRelationshipType = vi.fn();
const deleteRelationshipType = vi.fn();
const createRelationshipRole = vi.fn();
const updateRelationshipRole = vi.fn();
const deleteRelationshipRole = vi.fn();
const countRelationshipTypeUsage = vi.fn();
const countRelationshipRoleUsage = vi.fn();
const countRelationshipTypeInverseReferences = vi.fn();
const countRelationshipRoleInverseReferences = vi.fn();

vi.mock("@repo/services/relationship-type-service", () => ({
  listRelationshipCategories: vi.fn().mockResolvedValue([]),
  fetchRelationshipVocabulary: vi.fn().mockResolvedValue(new Map()),
  createRelationshipCategory: (...a: unknown[]) =>
    createRelationshipCategory(...a),
  updateRelationshipCategory: (...a: unknown[]) =>
    updateRelationshipCategory(...a),
  deleteRelationshipCategory: (...a: unknown[]) =>
    deleteRelationshipCategory(...a),
  createRelationshipType: (...a: unknown[]) => createRelationshipType(...a),
  updateRelationshipType: (...a: unknown[]) => updateRelationshipType(...a),
  deleteRelationshipType: (...a: unknown[]) => deleteRelationshipType(...a),
  createRelationshipRole: (...a: unknown[]) => createRelationshipRole(...a),
  updateRelationshipRole: (...a: unknown[]) => updateRelationshipRole(...a),
  deleteRelationshipRole: (...a: unknown[]) => deleteRelationshipRole(...a),
  countRelationshipTypeUsage: (...a: unknown[]) =>
    countRelationshipTypeUsage(...a),
  countRelationshipRoleUsage: (...a: unknown[]) =>
    countRelationshipRoleUsage(...a),
  countRelationshipTypeInverseReferences: (...a: unknown[]) =>
    countRelationshipTypeInverseReferences(...a),
  countRelationshipRoleInverseReferences: (...a: unknown[]) =>
    countRelationshipRoleInverseReferences(...a),
}));

const {
  relationshipTypeKeys,
  useCreateRelationshipCategory,
  useCreateRelationshipRole,
  useCreateRelationshipType,
  useDeleteRelationshipCategory,
  useDeleteRelationshipRole,
  useDeleteRelationshipType,
  useRelationshipRoleInverseReferences,
  useRelationshipRoleUsage,
  useRelationshipTypeInverseReferences,
  useRelationshipTypeUsage,
  useUpdateRelationshipCategory,
  useUpdateRelationshipRole,
  useUpdateRelationshipType,
} = await import("./use-relationship-types");

const client = {} as never;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  return {
    queryClient,
    invalidateSpy,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * The invalidation contract (ADR-0040 IMP-003).
 *
 * The vocabulary is cached with a 5-minute staleTime and read by every
 * relationship editor. If a mutation here fails to invalidate, an admin adds a
 * type and then cannot select it until a hard reload — which reproduces at
 * runtime the exact staleness the reference-data refactor removed. So each
 * mutation is asserted to invalidate, and to invalidate `all` specifically:
 * the tree is cached twice, under `activeOnly: true` and `false`, and both must
 * move together.
 */
describe("vocabulary mutations invalidate the vocabulary cache", () => {
  const cases: Array<{
    name: string;
    hook: (c: never) => { mutateAsync: (v: never) => Promise<unknown> };
    service: ReturnType<typeof vi.fn>;
    variables: unknown;
  }> = [
    {
      name: "create category",
      hook: useCreateRelationshipCategory,
      service: createRelationshipCategory,
      variables: { key: "family", label: "Family" },
    },
    {
      name: "update category",
      hook: useUpdateRelationshipCategory,
      service: updateRelationshipCategory,
      variables: { key: "family", patch: { label: "Kin" } },
    },
    {
      name: "delete category",
      hook: useDeleteRelationshipCategory,
      service: deleteRelationshipCategory,
      variables: "family",
    },
    {
      name: "create type",
      hook: useCreateRelationshipType,
      service: createRelationshipType,
      variables: { key: "friendship", label: "F", category_key: "social" },
    },
    {
      name: "update type",
      hook: useUpdateRelationshipType,
      service: updateRelationshipType,
      variables: { key: "friendship", patch: { sort_order: 20 } },
    },
    {
      name: "delete type",
      hook: useDeleteRelationshipType,
      service: deleteRelationshipType,
      variables: "friendship",
    },
    {
      name: "create role",
      hook: useCreateRelationshipRole,
      service: createRelationshipRole,
      variables: { type_key: "family", key: "parent", label: "Parent" },
    },
    {
      name: "update role",
      hook: useUpdateRelationshipRole,
      service: updateRelationshipRole,
      variables: { typeKey: "family", key: "parent", patch: { label: "P" } },
    },
    {
      name: "delete role",
      hook: useDeleteRelationshipRole,
      service: deleteRelationshipRole,
      variables: { typeKey: "family", key: "parent" },
    },
  ];

  it.each(cases)(
    "$name invalidates relationshipTypeKeys.all",
    async ({ hook, service, variables }) => {
      service.mockResolvedValue({ key: "x", label: "X" });
      const { wrapper, invalidateSpy } = createWrapper();
      const { result } = renderHook(() => hook(client), { wrapper });

      await result.current.mutateAsync(variables as never);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: relationshipTypeKeys.all,
        });
      });
    },
  );

  it("does not invalidate when the mutation fails", async () => {
    createRelationshipType.mockRejectedValue(new Error("permission denied"));
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCreateRelationshipType(client), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({
        key: "x",
        label: "X",
        category_key: "social",
      } as never),
    ).rejects.toThrow("permission denied");

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("mutation hooks pass the right arguments through", () => {
  it("forwards the client and patch for an update", async () => {
    updateRelationshipType.mockResolvedValue({ key: "friendship" });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateRelationshipType(client), {
      wrapper,
    });

    await result.current.mutateAsync({
      key: "friendship",
      patch: { sort_order: 30 },
    } as never);

    expect(updateRelationshipType).toHaveBeenCalledWith(client, "friendship", {
      sort_order: 30,
    });
  });

  it("forwards both halves of a role's composite key", async () => {
    deleteRelationshipRole.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteRelationshipRole(client), {
      wrapper,
    });

    await result.current.mutateAsync({
      typeKey: "family",
      key: "parent",
    } as never);

    expect(deleteRelationshipRole).toHaveBeenCalledWith(
      client,
      "family",
      "parent",
    );
  });
});

describe("usage-count hooks", () => {
  it("does not fetch until enabled", () => {
    const { wrapper } = createWrapper();
    renderHook(
      () =>
        useRelationshipTypeUsage(client, "parent_child", { enabled: false }),
      { wrapper },
    );
    // The dialog that displays this count has not opened, so paying for the
    // COUNT would be wasted work on every row in the tree.
    expect(countRelationshipTypeUsage).not.toHaveBeenCalled();
  });

  it("fetches the type count once enabled", async () => {
    countRelationshipTypeUsage.mockResolvedValue(14);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRelationshipTypeUsage(client, "parent_child"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBe(14));
    expect(countRelationshipTypeUsage).toHaveBeenCalledWith(
      client,
      "parent_child",
    );
  });

  it("keys role usage separately from type usage", async () => {
    countRelationshipRoleUsage.mockResolvedValue(3);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRelationshipRoleUsage(client, "family", "parent"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBe(3));
    expect(relationshipTypeKeys.usage("family", "parent")).not.toEqual(
      relationshipTypeKeys.usage("family"),
    );
  });
});

describe("inverse-reference hooks", () => {
  it("does not fetch until enabled", () => {
    const { wrapper } = createWrapper();
    renderHook(
      () =>
        useRelationshipTypeInverseReferences(client, "parent_child", {
          enabled: false,
        }),
      { wrapper },
    );
    expect(countRelationshipTypeInverseReferences).not.toHaveBeenCalled();
  });

  it("fetches how many other types name this one as their inverse", async () => {
    countRelationshipTypeInverseReferences.mockResolvedValue(2);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRelationshipTypeInverseReferences(client, "parent_child"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBe(2));
    expect(countRelationshipTypeInverseReferences).toHaveBeenCalledWith(
      client,
      "parent_child",
    );
  });

  it("keys role inverse references separately, scoped to the type", async () => {
    countRelationshipRoleInverseReferences.mockResolvedValue(1);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRelationshipRoleInverseReferences(client, "family", "parent"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBe(1));
    expect(countRelationshipRoleInverseReferences).toHaveBeenCalledWith(
      client,
      "family",
      "parent",
    );
    expect(
      relationshipTypeKeys.inverseReferences("family", "parent"),
    ).not.toEqual(relationshipTypeKeys.inverseReferences("family"));
  });
});
