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
  deleteCategoryReparentingChildren,
  assertNoCategoryCycle,
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
    maybeSingle: terminal,
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

// Returns a client whose successive `from()` calls yield successive builders,
// so a multi-query flow (e.g. an ancestor walk) can script each step's result.
// Extra calls beyond the list reuse the last builder.
function makeSequenceClient(results: { data: unknown; error: unknown }[]) {
  if (results.length === 0) {
    throw new Error("makeSequenceClient requires at least one result");
  }
  const builders = results.map(makeBuilder);
  let callCount = 0;
  const client = {
    from: vi.fn().mockImplementation(() => {
      const builder = builders[Math.min(callCount, builders.length - 1)];
      callCount++;
      return builder;
    }),
  } as unknown as SupabaseClient<Database>;
  return { client, builders };
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
// assertNoCategoryCycle
// ---------------------------------------------------------------------------

describe("assertNoCategoryCycle", () => {
  it("rejects making a category its own parent (no DB call needed)", async () => {
    const { client } = makeSequenceClient([{ data: null, error: null }]);
    await expect(
      assertNoCategoryCycle(client, "cat-1", "cat-1"),
    ).rejects.toThrow(
      "CategoryService.assertNoCategoryCycle: a category cannot be its own ancestor",
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects assigning a descendant as the new parent", async () => {
    // Reparent cat-1 under cat-3, whose ancestor chain is cat-3 → cat-2 → cat-1.
    const { client } = makeSequenceClient([
      { data: { parent_category_id: "cat-2" }, error: null },
      { data: { parent_category_id: "cat-1" }, error: null },
    ]);
    await expect(
      assertNoCategoryCycle(client, "cat-1", "cat-3"),
    ).rejects.toThrow("circular hierarchy");
  });

  it("allows a valid non-descendant parent (chain reaches root)", async () => {
    const { client } = makeSequenceClient([
      { data: { parent_category_id: null }, error: null },
    ]);
    await expect(
      assertNoCategoryCycle(client, "cat-1", "cat-5"),
    ).resolves.toBeUndefined();
  });

  it("terminates on a pre-existing cycle not involving the moved node", async () => {
    // Stored chain cat-3 → cat-4 → cat-3 loops but never reaches cat-1.
    const { client } = makeSequenceClient([
      { data: { parent_category_id: "cat-4" }, error: null },
      { data: { parent_category_id: "cat-3" }, error: null },
    ]);
    await expect(
      assertNoCategoryCycle(client, "cat-1", "cat-3"),
    ).resolves.toBeUndefined();
    // cat-3 and cat-4 each fetched once; the loop stops when cat-3 repeats.
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("throws on a DB error while walking the chain", async () => {
    const { client } = makeSequenceClient([
      { data: null, error: { message: "walk failed" } },
    ]);
    await expect(
      assertNoCategoryCycle(client, "cat-1", "cat-9"),
    ).rejects.toThrow("CategoryService.assertNoCategoryCycle: walk failed");
  });
});

// ---------------------------------------------------------------------------
// updateCategory — reparent / cycle behavior
// ---------------------------------------------------------------------------

describe("updateCategory reparenting", () => {
  // parent_category_id is validated as a UUID by the Zod schema, so update
  // inputs must use real UUIDs (mock DB return values are unvalidated).
  const NEW_PARENT_UUID = "11111111-1111-4111-8111-111111111111";

  it("rejects a reparent that would create a cycle", async () => {
    // Reparent cat-1 under NEW_PARENT, whose parent is cat-1 → cycle.
    const { client } = makeSequenceClient([
      { data: { parent_category_id: "cat-1" }, error: null },
    ]);
    await expect(
      updateCategory(client, "cat-1", { parent_category_id: NEW_PARENT_UUID }),
    ).rejects.toThrow("circular hierarchy");
    // The guard ran (1 call) but the UPDATE never did (still 1 call).
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("allows a safe reparent under a non-descendant", async () => {
    const { client } = makeSequenceClient([
      { data: { parent_category_id: null }, error: null },
      { data: sampleCategory, error: null },
    ]);
    const result = await updateCategory(client, "cat-1", {
      parent_category_id: NEW_PARENT_UUID,
    });
    expect(result).toEqual(sampleCategory);
  });

  it("allows reparenting to root (null) without a cycle check", async () => {
    const { client, builders } = makeSequenceClient([
      { data: sampleCategory, error: null },
    ]);
    const result = await updateCategory(client, "cat-1", {
      parent_category_id: null,
    });
    expect(result).toEqual(sampleCategory);
    // Only the UPDATE ran — no ancestor walk for a move to root.
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(builders[0]?.update).toHaveBeenCalledWith({
      parent_category_id: null,
    });
  });
});

// ---------------------------------------------------------------------------
// deleteCategoryReparentingChildren
// ---------------------------------------------------------------------------

describe("deleteCategoryReparentingChildren", () => {
  function makeRpcClient(result: { data: unknown; error: unknown }) {
    return {
      rpc: vi.fn().mockResolvedValue(result),
    } as unknown as SupabaseClient<Database>;
  }

  it("invokes the atomic reparent-then-delete RPC with the category id", async () => {
    const client = makeRpcClient({ data: null, error: null });
    await expect(
      deleteCategoryReparentingChildren(client, "cat-1"),
    ).resolves.toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith(
      "delete_category_reparenting_children",
      { p_category_id: "cat-1" },
    );
  });

  it("throws when the RPC returns an error", async () => {
    const client = makeRpcClient({
      data: null,
      error: { message: "category not found" },
    });
    await expect(
      deleteCategoryReparentingChildren(client, "cat-1"),
    ).rejects.toThrow(
      "CategoryService.deleteCategoryReparentingChildren: category not found",
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

  it("orders equal-title siblings deterministically by id", async () => {
    // Two roots share a title; the id tie-break must place "aaa" before "zzz"
    // regardless of the order the rows arrive in.
    const cats = [
      { ...sampleCategory, id: "zzz", title: "Same", parent_category_id: null },
      { ...sampleCategory, id: "aaa", title: "Same", parent_category_id: null },
    ];
    const client = makeClient({ fromResult: { data: cats, error: null } });
    const tree = await getCategoryTree(client, "user-123");
    expect(tree.map((n) => n.id)).toEqual(["aaa", "zzz"]);
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
