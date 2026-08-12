import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import {
  countRelationshipRoleUsage,
  countRelationshipTypeUsage,
  createRelationshipCategory,
  createRelationshipRole,
  createRelationshipType,
  deleteRelationshipCategory,
  deleteRelationshipRole,
  deleteRelationshipType,
  updateRelationshipCategory,
  updateRelationshipRole,
  updateRelationshipType,
} from "./relationship-type-service";

/**
 * Write-path coverage for the admin CRUD surface (#428). The read path is
 * covered in `relationship-type-service.test.ts`; kept separate so the builder
 * mock here (which needs `insert`/`update`/`delete`/`single`) doesn't complicate
 * the read tests' simpler one.
 */

type Result = { data?: unknown; error?: unknown; count?: number | null };

/**
 * Chainable PostgREST builder mock. Every filter/verb returns `this`, and the
 * terminal `single()` resolves the configured result; `then` makes the builder
 * itself awaitable for the delete path, which has no `.single()`.
 */
function makeClient(result: Result) {
  const resolved = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  };
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(resolved).then(resolve),
  };
  const client = { from: vi.fn().mockReturnValue(builder) };
  return {
    client: client as unknown as SupabaseClient<Database>,
    from: client.from,
    builder,
  };
}

/**
 * A client whose first `single()` resolves `first` and whose subsequent ones
 * resolve `second` — the read-then-write shape `updateRelationshipType` uses
 * to check the symmetry invariant against the merged row.
 */
function makeReadThenWriteClient(first: Result, second: Result) {
  const shape = (r: Result) => ({
    data: r.data ?? null,
    error: r.error ?? null,
    count: r.count ?? null,
  });
  const single = vi
    .fn()
    .mockResolvedValueOnce(shape(first))
    .mockResolvedValue(shape(second));
  const builder = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single,
  };
  const client = { from: vi.fn().mockReturnValue(builder) };
  return {
    client: client as unknown as SupabaseClient<Database>,
    builder,
  };
}

const CATEGORY_ROW = {
  key: "family",
  label: "Family",
  description: null,
  sort_order: 10,
  is_active: true,
  created_at: null,
  updated_at: null,
};

const TYPE_ROW = {
  key: "mentor_student",
  label: "Mentor / Student",
  category_key: "professional",
  sort_order: 10,
  is_symmetric: false,
  inverse_key: null,
  direction_verb: "mentors",
  symmetric_noun: null,
  description: null,
  is_active: true,
  created_at: null,
  updated_at: null,
};

const ROLE_ROW = {
  type_key: "family",
  key: "parent",
  label: "Parent",
  inverse_key: "child",
  sort_order: 10,
  is_active: true,
};

// ---- categories ----------------------------------------------------------

describe("createRelationshipCategory", () => {
  it("inserts the parsed row and returns it", async () => {
    const { client, from, builder } = makeClient({ data: CATEGORY_ROW });

    await expect(
      createRelationshipCategory(client, { key: "family", label: "Family" }),
    ).resolves.toEqual(CATEGORY_ROW);

    expect(from).toHaveBeenCalledWith("relationship_categories");
    // Defaults are applied on create — the DB columns are NOT NULL.
    expect(builder.insert).toHaveBeenCalledWith({
      key: "family",
      label: "Family",
      description: null,
      sort_order: 0,
      is_active: true,
    });
  });

  it("rejects a key that is not a snake_case slug", async () => {
    const { client } = makeClient({ data: CATEGORY_ROW });
    await expect(
      createRelationshipCategory(client, { key: "Not Valid", label: "x" }),
    ).rejects.toThrow();
  });

  it("rejects a category key longer than the column's 50 chars", async () => {
    const { client } = makeClient({ data: CATEGORY_ROW });
    await expect(
      createRelationshipCategory(client, { key: "a".repeat(51), label: "x" }),
    ).rejects.toThrow();
  });

  it("maps a duplicate key to a readable message", async () => {
    const { client } = makeClient({
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "…_pkey"',
      },
    });
    await expect(
      createRelationshipCategory(client, { key: "family", label: "Family" }),
    ).rejects.toThrow(
      "RelationshipTypeService.createRelationshipCategory: A group with that key already exists.",
    );
  });
});

describe("updateRelationshipCategory", () => {
  it("sends only the fields the caller named", async () => {
    const { client, builder } = makeClient({ data: CATEGORY_ROW });

    await updateRelationshipCategory(client, "family", { label: "Kin" });

    // The critical assertion: a patch must not carry defaults for columns the
    // caller never mentioned, or every edit silently resets them.
    expect(builder.update).toHaveBeenCalledWith({ label: "Kin" });
    expect(builder.eq).toHaveBeenCalledWith("key", "family");
  });

  it("can deactivate without touching anything else", async () => {
    const { client, builder } = makeClient({ data: CATEGORY_ROW });
    await updateRelationshipCategory(client, "family", { is_active: false });
    expect(builder.update).toHaveBeenCalledWith({ is_active: false });
  });
});

describe("deleteRelationshipCategory", () => {
  it("deletes by key", async () => {
    const { client, from, builder } = makeClient({});
    await deleteRelationshipCategory(client, "family");
    expect(from).toHaveBeenCalledWith("relationship_categories");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("key", "family");
  });

  it("explains a RESTRICT failure instead of leaking the constraint name", async () => {
    const { client } = makeClient({
      error: {
        code: "23503",
        message:
          'update or delete on table "relationship_categories" violates foreign key constraint "relationship_types_category_key_fkey" on table "relationship_types"',
      },
    });
    await expect(deleteRelationshipCategory(client, "family")).rejects.toThrow(
      /This group still has relationship types in it/,
    );
  });
});

// ---- types ---------------------------------------------------------------

describe("createRelationshipType", () => {
  it("inserts a symmetric type with its defaults", async () => {
    const { client, from, builder } = makeClient({ data: TYPE_ROW });

    await createRelationshipType(client, {
      key: "friendship",
      label: "Friendship",
      category_key: "social",
      symmetric_noun: "friends",
    });

    expect(from).toHaveBeenCalledWith("relationship_types");
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "friendship",
        is_symmetric: true,
        inverse_key: null,
        symmetric_noun: "friends",
      }),
    );
  });

  it("rejects a symmetric type carrying an inverse before it reaches the DB", async () => {
    // Mirrors `relationship_types_symmetric_has_no_inverse`; catching it here
    // turns a bare 23514 into a field-level message.
    const { client, from } = makeClient({ data: TYPE_ROW });
    await expect(
      createRelationshipType(client, {
        key: "friendship",
        label: "Friendship",
        category_key: "social",
        is_symmetric: true,
        inverse_key: "enmity",
      }),
    ).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  });

  it("accepts a directed type with an inverse", async () => {
    const { client } = makeClient({ data: TYPE_ROW });
    await expect(
      createRelationshipType(client, {
        key: "mentor_student",
        label: "Mentor",
        category_key: "professional",
        is_symmetric: false,
        inverse_key: "student_mentor",
      }),
    ).resolves.toEqual(TYPE_ROW);
  });

  it("accepts a directed type with no reciprocal at all", async () => {
    // The CHECK is one-directional: only symmetric+inverse is illegal.
    const { client } = makeClient({ data: TYPE_ROW });
    await expect(
      createRelationshipType(client, {
        key: "influenced",
        label: "Influenced",
        category_key: "causal",
        is_symmetric: false,
      }),
    ).resolves.toEqual(TYPE_ROW);
  });
});

describe("updateRelationshipType", () => {
  it("sends only the named fields and skips the invariant read", async () => {
    const { client, builder } = makeClient({ data: TYPE_ROW });

    await updateRelationshipType(client, "mentor_student", { sort_order: 20 });

    expect(builder.update).toHaveBeenCalledWith({ sort_order: 20 });
    // No symmetry column touched → no reason to pay for the invariant read.
    // The write itself ends in one `.single()`; a preceding read would be two.
    expect(builder.single).toHaveBeenCalledTimes(1);
  });

  it("rejects making a type symmetric while it still carries an inverse", async () => {
    // The patch alone looks harmless; only the merged row is illegal, which is
    // why the check cannot live in the schema refinement.
    const { client, builder } = makeReadThenWriteClient(
      { data: { is_symmetric: false, inverse_key: "student_mentor" } },
      { data: TYPE_ROW },
    );

    await expect(
      updateRelationshipType(client, "mentor_student", { is_symmetric: true }),
    ).rejects.toThrow(/symmetric type cannot have an inverse/);
    expect(builder.update).not.toHaveBeenCalled();
  });

  it("allows making a type symmetric when the inverse is cleared in the same patch", async () => {
    const { client, builder } = makeReadThenWriteClient(
      { data: { is_symmetric: false, inverse_key: "student_mentor" } },
      { data: TYPE_ROW },
    );

    await updateRelationshipType(client, "mentor_student", {
      is_symmetric: true,
      inverse_key: null,
    });

    expect(builder.update).toHaveBeenCalledWith({
      is_symmetric: true,
      inverse_key: null,
    });
  });

  it("allows adding an inverse to an already-asymmetric type", async () => {
    const { client, builder } = makeReadThenWriteClient(
      { data: { is_symmetric: false, inverse_key: null } },
      { data: TYPE_ROW },
    );

    await updateRelationshipType(client, "mentor_student", {
      inverse_key: "student_mentor",
    });

    expect(builder.update).toHaveBeenCalledWith({
      inverse_key: "student_mentor",
    });
  });

  it("contextualises a failure reading the current row", async () => {
    const { client } = makeReadThenWriteClient(
      { error: { message: "row not found" } },
      { data: TYPE_ROW },
    );
    await expect(
      updateRelationshipType(client, "ghost", { is_symmetric: true }),
    ).rejects.toThrow(
      "RelationshipTypeService.updateRelationshipType: row not found",
    );
  });
});

describe("deleteRelationshipType", () => {
  it("steers an in-use type toward deactivation", async () => {
    const { client } = makeClient({
      error: {
        code: "23503",
        message:
          'violates foreign key constraint "character_relationships_relationship_type_fkey"',
      },
    });
    await expect(
      deleteRelationshipType(client, "parent_child"),
    ).rejects.toThrow(/Deactivate it instead/);
  });

  it("deletes an unused type", async () => {
    const { client, builder } = makeClient({});
    await expect(
      deleteRelationshipType(client, "typo_type"),
    ).resolves.toBeUndefined();
    expect(builder.eq).toHaveBeenCalledWith("key", "typo_type");
  });
});

// ---- roles ---------------------------------------------------------------

describe("relationship roles", () => {
  it("creates a role with its defaults", async () => {
    const { client, from, builder } = makeClient({ data: ROLE_ROW });

    await createRelationshipRole(client, {
      type_key: "family",
      key: "parent",
      label: "Parent",
      inverse_key: "child",
    });

    expect(from).toHaveBeenCalledWith("relationship_roles");
    expect(builder.insert).toHaveBeenCalledWith({
      type_key: "family",
      key: "parent",
      label: "Parent",
      inverse_key: "child",
      sort_order: 0,
      is_active: true,
    });
  });

  it("addresses a role by both halves of its composite key", async () => {
    const { client, builder } = makeClient({ data: ROLE_ROW });

    await updateRelationshipRole(client, "family", "parent", {
      label: "Parent or guardian",
    });

    expect(builder.eq).toHaveBeenCalledWith("type_key", "family");
    expect(builder.eq).toHaveBeenCalledWith("key", "parent");
    expect(builder.update).toHaveBeenCalledWith({
      label: "Parent or guardian",
    });
  });

  it("deletes by the composite key", async () => {
    const { client, builder } = makeClient({});
    await deleteRelationshipRole(client, "family", "parent");
    expect(builder.eq).toHaveBeenCalledWith("type_key", "family");
    expect(builder.eq).toHaveBeenCalledWith("key", "parent");
  });

  it("explains a duplicate sub-role key within a type", async () => {
    const { client } = makeClient({
      error: { code: "23505", message: "duplicate key value" },
    });
    await expect(
      createRelationshipRole(client, {
        type_key: "family",
        key: "parent",
        label: "Parent",
      }),
    ).rejects.toThrow(/Sub-role keys must be unique within a type/);
  });
});

// ---- usage counts --------------------------------------------------------

describe("usage counts", () => {
  it("counts relationships using a type with an exact head query", async () => {
    const { client, from, builder } = makeClient({ count: 14 });

    await expect(
      countRelationshipTypeUsage(client, "parent_child"),
    ).resolves.toBe(14);

    expect(from).toHaveBeenCalledWith("character_relationships");
    expect(builder.select).toHaveBeenCalledWith("*", {
      count: "exact",
      head: true,
    });
    expect(builder.eq).toHaveBeenCalledWith(
      "relationship_type",
      "parent_child",
    );
  });

  it("treats a null count as zero", async () => {
    const { client } = makeClient({ count: null });
    await expect(countRelationshipTypeUsage(client, "unused")).resolves.toBe(0);
  });

  it("filters on both columns for a sub-role count", async () => {
    const { client, builder } = makeClient({ count: 3 });

    await expect(
      countRelationshipRoleUsage(client, "family", "parent"),
    ).resolves.toBe(3);

    expect(builder.eq).toHaveBeenCalledWith("relationship_type", "family");
    expect(builder.eq).toHaveBeenCalledWith("relationship_role", "parent");
  });

  it("contextualises a count failure", async () => {
    const { client } = makeClient({ error: { message: "permission denied" } });
    await expect(countRelationshipTypeUsage(client, "x")).rejects.toThrow(
      "RelationshipTypeService.countRelationshipTypeUsage: permission denied",
    );
  });
});
