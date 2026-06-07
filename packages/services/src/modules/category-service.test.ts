import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} from "./category-service";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return builder;
}

function makeClient(overrides: {
  fromResult?: { data: unknown; error: unknown };
  authUser?: { data: { user: unknown }; error: unknown };
}) {
  const { fromResult = { data: null, error: null }, authUser } = overrides;
  return {
    from: vi.fn().mockReturnValue(makeBuilder(fromResult)),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue(
          authUser ?? { data: { user: { id: "user-123" } }, error: null },
        ),
    },
  } as unknown as SupabaseClient<Database>;
}

// createCategory: call 1 = slug fetch, call 2 = insert
function makeCreateClient(insertResult: { data: unknown; error: unknown }) {
  const slugBuilder = makeBuilder({ data: [], error: null });
  const insertBuilder = makeBuilder(insertResult);
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation(() => {
      callCount++;
      return callCount === 1 ? slugBuilder : insertBuilder;
    }),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
  } as unknown as SupabaseClient<Database>;
}

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const sampleCategory = {
  id: "cat-1",
  user_id: "user-123",
  slug: "ancient-history",
  title: "Ancient History",
  description: "The ancient world",
  color: "#a1b2c3",
  icon: "globe",
  parent_category_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// getCategories
// ---------------------------------------------------------------------------

describe("getCategories", () => {
  it("returns an array of categories", async () => {
    const client = makeClient({
      fromResult: { data: [sampleCategory], error: null },
    });
    const result = await getCategories(client);
    expect(result).toEqual([sampleCategory]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getCategories(client)).toEqual([]);
  });

  it("applies userId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCategories(client, { userId: "user-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-abc");
  });

  it("applies parentCategoryId filter with a UUID", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCategories(client, { parentCategoryId: "cat-parent" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("parent_category_id", "cat-parent");
  });

  it("applies IS NULL filter when parentCategoryId is null", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCategories(client, { parentCategoryId: null });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.is).toHaveBeenCalledWith("parent_category_id", null);
  });

  it("throws on query error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(getCategories(client)).rejects.toThrow(
      "CategoryService.getCategories: db error",
    );
  });
});

// ---------------------------------------------------------------------------
// getCategoryById
// ---------------------------------------------------------------------------

describe("getCategoryById", () => {
  it("returns the matching category", async () => {
    const client = makeClient({
      fromResult: { data: sampleCategory, error: null },
    });
    expect(await getCategoryById(client, "cat-1")).toEqual(sampleCategory);
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getCategoryById(client, "cat-1")).rejects.toThrow(
      "CategoryService.getCategoryById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// getCategoryBySlug
// ---------------------------------------------------------------------------

describe("getCategoryBySlug", () => {
  it("returns the matching category", async () => {
    const client = makeClient({
      fromResult: { data: sampleCategory, error: null },
    });
    const result = await getCategoryBySlug(
      client,
      "user-123",
      "ancient-history",
    );
    expect(result).toEqual(sampleCategory);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(builder.eq).toHaveBeenCalledWith("slug", "ancient-history");
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(
      getCategoryBySlug(client, "user-123", "missing"),
    ).rejects.toThrow("CategoryService.getCategoryBySlug: not found");
  });
});

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------

describe("createCategory", () => {
  it("creates and returns a new category", async () => {
    const client = makeCreateClient({ data: sampleCategory, error: null });
    const result = await createCategory(client, {
      title: "Ancient History",
      color: "#a1b2c3",
    });
    expect(result).toEqual(sampleCategory);
  });

  it("rejects an invalid hex color", async () => {
    const client = makeCreateClient({ data: null, error: null });
    await expect(
      createCategory(client, { title: "Test", color: "red" }),
    ).rejects.toThrow();
  });

  it("accepts a category without optional fields", async () => {
    const client = makeCreateClient({ data: sampleCategory, error: null });
    const result = await createCategory(client, { title: "No Color" });
    expect(result).toEqual(sampleCategory);
  });

  it("throws when auth fails", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "auth error" },
    });
    await expect(createCategory(client, { title: "Test" })).rejects.toThrow(
      "CategoryService.createCategory.getUser: auth error",
    );
  });

  it("throws when there is no authenticated user", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    await expect(createCategory(client, { title: "Test" })).rejects.toThrow(
      "CategoryService.createCategory: no authenticated user",
    );
  });

  it("retries on a 23505 unique violation and succeeds", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        // Call 1: slug fetch
        if (callCount === 1) return makeBuilder({ data: [], error: null });
        // Call 2: first insert collides
        if (callCount === 2) {
          return makeBuilder({
            data: null,
            error: { code: "23505", message: "unique violation" },
          });
        }
        // Call 3: retried insert succeeds
        return makeBuilder({ data: sampleCategory, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createCategory(client, { title: "Ancient History" });
    expect(result).toEqual(sampleCategory);
    expect(callCount).toBe(3);
  });

  it("propagates a non-collision insert error", async () => {
    const client = makeCreateClient({
      data: null,
      error: { message: "insert failed" },
    });
    await expect(
      createCategory(client, { title: "Ancient History" }),
    ).rejects.toThrow("CategoryService.createCategory: insert failed");
  });
});

// ---------------------------------------------------------------------------
// updateCategory
// ---------------------------------------------------------------------------

describe("updateCategory", () => {
  it("returns the updated category", async () => {
    const client = makeClient({
      fromResult: { data: sampleCategory, error: null },
    });
    const result = await updateCategory(client, "cat-1", { title: "Updated" });
    expect(result).toEqual(sampleCategory);
  });

  it("rejects an invalid hex color in update", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      updateCategory(client, "cat-1", { color: "not-a-hex" }),
    ).rejects.toThrow();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      updateCategory(client, "cat-1", { title: "X" }),
    ).rejects.toThrow("CategoryService.updateCategory: update failed");
  });
});

// ---------------------------------------------------------------------------
// deleteCategory
// ---------------------------------------------------------------------------

describe("deleteCategory", () => {
  it("resolves without error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(deleteCategory(client, "cat-1")).resolves.toBeUndefined();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(deleteCategory(client, "cat-1")).rejects.toThrow(
      "CategoryService.deleteCategory: delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getCategoryTree
// ---------------------------------------------------------------------------

describe("getCategoryTree", () => {
  it("returns an empty array when there are no categories", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    expect(await getCategoryTree(client, "user-123")).toEqual([]);
  });

  it("returns root nodes when all categories have no parent", async () => {
    const cats = [
      { ...sampleCategory, id: "cat-1", parent_category_id: null },
      {
        ...sampleCategory,
        id: "cat-2",
        title: "Medieval",
        slug: "medieval",
        parent_category_id: null,
      },
    ];
    const client = makeClient({ fromResult: { data: cats, error: null } });
    const tree = await getCategoryTree(client, "user-123");
    expect(tree).toHaveLength(2);
    expect(tree[0]?.children).toEqual([]);
    expect(tree[1]?.children).toEqual([]);
  });

  it("nests children under their parent", async () => {
    const parent = {
      ...sampleCategory,
      id: "cat-parent",
      parent_category_id: null,
    };
    const child = {
      ...sampleCategory,
      id: "cat-child",
      slug: "child",
      title: "Child",
      parent_category_id: "cat-parent",
    };
    const client = makeClient({
      fromResult: { data: [parent, child], error: null },
    });
    const tree = await getCategoryTree(client, "user-123");
    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("cat-parent");
    expect(tree[0]?.children).toHaveLength(1);
    expect(tree[0]?.children?.[0]?.id).toBe("cat-child");
  });

  it("supports multiple levels of nesting", async () => {
    const grandparent = {
      ...sampleCategory,
      id: "gp",
      parent_category_id: null,
    };
    const parent = {
      ...sampleCategory,
      id: "p",
      slug: "p",
      title: "Parent",
      parent_category_id: "gp",
    };
    const child = {
      ...sampleCategory,
      id: "c",
      slug: "c",
      title: "Child",
      parent_category_id: "p",
    };
    const client = makeClient({
      fromResult: { data: [grandparent, parent, child], error: null },
    });
    const tree = await getCategoryTree(client, "user-123");
    expect(tree).toHaveLength(1);
    expect(tree[0]?.children?.[0]?.children?.[0]?.id).toBe("c");
  });

  it("treats orphaned children (unknown parent) as root nodes", async () => {
    const orphan = {
      ...sampleCategory,
      id: "orphan",
      parent_category_id: "nonexistent-id",
    };
    const client = makeClient({ fromResult: { data: [orphan], error: null } });
    const tree = await getCategoryTree(client, "user-123");
    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("orphan");
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(getCategoryTree(client, "user-123")).rejects.toThrow(
      "CategoryService.getCategoryTree: db error",
    );
  });
});
