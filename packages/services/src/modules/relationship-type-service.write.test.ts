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
 * A client with `.rpc()` only — what the type and role write paths call
 * directly (00031/ADR-0042, 00032/ADR-0043), no preceding read.
 */
function makeRpcClient(result: Result) {
  const rpc = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  });
  const client = { rpc };
  return { client: client as unknown as SupabaseClient<Database>, rpc };
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
    const { client, from, builder } = makeClient({ data: [{ key: "family" }] });
    await deleteRelationshipCategory(client, "family");
    expect(from).toHaveBeenCalledWith("relationship_categories");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("key", "family");
  });

  it("fails rather than reporting success when the delete matched no rows", async () => {
    // PostgREST reports a zero-row delete as a success. The inspector toasts
    // `Deleted "X"` and navigates away on resolve, so without this the user is
    // told something happened that did not — two admins on the same row, or a
    // row the is_admin() DELETE policy filtered out.
    const { client } = makeClient({ data: [] });
    await expect(deleteRelationshipCategory(client, "family")).rejects.toThrow(
      /group no longer exists, or you no longer have permission/,
    );
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
  it("creates a symmetric type with its defaults via the pairing RPC", async () => {
    // 00032/ADR-0043: create_relationship_type inserts and pairs the named
    // inverse in one transaction, rather than a plain insert that would leave a
    // fresh pairing one-sided until something else touched the partner.
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });

    await createRelationshipType(client, {
      key: "friendship",
      label: "Friendship",
      category_key: "social",
      symmetric_noun: "friends",
    });

    expect(rpc).toHaveBeenCalledWith("create_relationship_type", {
      p_key: "friendship",
      p_label: "Friendship",
      p_category_key: "social",
      p_sort_order: 0,
      p_is_symmetric: true,
      p_inverse_key: null,
      p_direction_verb: null,
      p_symmetric_noun: "friends",
      p_description: null,
      p_is_active: true,
    });
  });

  it("rejects a symmetric type carrying an inverse before it reaches the DB", async () => {
    // Mirrors `relationship_types_symmetric_has_no_inverse`; catching it here
    // turns a bare 23514 into a field-level message.
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });
    await expect(
      createRelationshipType(client, {
        key: "friendship",
        label: "Friendship",
        category_key: "social",
        is_symmetric: true,
        inverse_key: "enmity",
      }),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("accepts a directed type with an inverse", async () => {
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });
    await expect(
      createRelationshipType(client, {
        key: "mentor_student",
        label: "Mentor",
        category_key: "professional",
        is_symmetric: false,
        inverse_key: "student_mentor",
      }),
    ).resolves.toEqual(TYPE_ROW);
    expect(rpc).toHaveBeenCalledWith(
      "create_relationship_type",
      expect.objectContaining({ p_inverse_key: "student_mentor" }),
    );
  });

  it("accepts a directed type with no reciprocal at all", async () => {
    // The CHECK is one-directional: only symmetric+inverse is illegal.
    const { client } = makeRpcClient({ data: TYPE_ROW });
    await expect(
      createRelationshipType(client, {
        key: "influenced",
        label: "Influenced",
        category_key: "causal",
        is_symmetric: false,
      }),
    ).resolves.toEqual(TYPE_ROW);
  });

  it("explains an inverse naming a symmetric type", async () => {
    // pair_relationship_type_inverse refuses before writing back to it, rather
    // than letting the CHECK fire on a row the admin never edited.
    const { client } = makeRpcClient({
      error: { code: "22023", message: "is symmetric and cannot be used" },
    });
    await expect(
      createRelationshipType(client, {
        key: "mentor_student",
        label: "Mentor",
        category_key: "professional",
        is_symmetric: false,
        inverse_key: "friendship",
      }),
    ).rejects.toThrow(/can't be used as an inverse. Pick a directed type/);
  });
});

describe("updateRelationshipType", () => {
  it("sends only the fields the patch actually names", async () => {
    // The ▲▼ reorder patch. set_relationship_type merges under its own lock now
    // (00032/ADR-0043), so the service must not read the row and merge
    // client-side — two concurrent partial patches would each merge a stale
    // snapshot and the later write would silently revert the earlier one.
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });

    await updateRelationshipType(client, "mentor_student", { sort_order: 20 });

    expect(rpc).toHaveBeenCalledWith("set_relationship_type", {
      p_key: "mentor_student",
      p_sort_order: 20,
    });
  });

  it("sends nothing beyond the key when the patch is empty", async () => {
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });

    await updateRelationshipType(client, "mentor_student", {});

    expect(rpc).toHaveBeenCalledWith("set_relationship_type", {
      p_key: "mentor_student",
    });
  });

  it("sends the whole symmetry quad with its set-flag, and only together", async () => {
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });

    await updateRelationshipType(client, "mentor_student", {
      is_symmetric: false,
      inverse_key: "student_mentor",
      direction_verb: "mentors",
      symmetric_noun: null,
    });

    expect(rpc).toHaveBeenCalledWith("set_relationship_type", {
      p_key: "mentor_student",
      p_is_symmetric: false,
      p_inverse_key: "student_mentor",
      p_direction_verb: "mentors",
      p_symmetric_noun: null,
      p_set_symmetry: true,
    });
  });

  it("refuses a patch that states part of the symmetry quad", async () => {
    // The four columns are mutually constrained, and the RPC writes them as a
    // unit — a partial patch could only clear the ones it left out. The admin
    // form already groups them (`symmetryFields`); this makes that binding.
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });

    await expect(
      updateRelationshipType(client, "mentor_student", { is_symmetric: true }),
    ).rejects.toThrow(/must state all of .* together/);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("clears a pairing with an explicit null across the whole quad", async () => {
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });

    await updateRelationshipType(client, "mentor_student", {
      is_symmetric: true,
      inverse_key: null,
      direction_verb: null,
      symmetric_noun: "peers",
    });

    expect(rpc).toHaveBeenCalledWith(
      "set_relationship_type",
      expect.objectContaining({ p_inverse_key: null, p_set_symmetry: true }),
    );
  });

  it("sends description with its own set-flag, distinct from not mentioning it", async () => {
    const { client, rpc } = makeRpcClient({ data: TYPE_ROW });

    await updateRelationshipType(client, "mentor_student", {
      description: null,
    });

    expect(rpc).toHaveBeenCalledWith("set_relationship_type", {
      p_key: "mentor_student",
      p_description: null,
      p_set_description: true,
    });
  });

  it("maps an unresolved update target to a friendly message", async () => {
    // set_relationship_type raises no_data_found (P0002) when the row it was
    // told to update doesn't resolve — deleted, or invisible under RLS.
    const { client } = makeRpcClient({
      error: { code: "P0002", message: "no_data_found" },
    });
    await expect(
      updateRelationshipType(client, "ghost", { label: "X" }),
    ).rejects.toThrow(/Couldn.t find that type/);
  });

  it("explains an attempt to make a type its own inverse", async () => {
    const { client } = makeRpcClient({
      error: {
        code: "23514",
        message:
          'violates check constraint "relationship_types_inverse_key_not_self"',
      },
    });
    await expect(
      updateRelationshipType(client, "mentor_student", {
        is_symmetric: false,
        inverse_key: "mentor_student",
        direction_verb: "mentors",
        symmetric_noun: null,
      }),
    ).rejects.toThrow(/cannot be its own inverse. Mark it symmetric instead/);
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
    const { client, builder } = makeClient({ data: [{ key: "typo_type" }] });
    await expect(
      deleteRelationshipType(client, "typo_type"),
    ).resolves.toBeUndefined();
    expect(builder.eq).toHaveBeenCalledWith("key", "typo_type");
  });

  it("fails rather than reporting success when the delete matched no rows", async () => {
    const { client } = makeClient({ data: [] });
    await expect(deleteRelationshipType(client, "typo_type")).rejects.toThrow(
      /type no longer exists, or you no longer have permission/,
    );
  });
});

// ---- roles ---------------------------------------------------------------

describe("relationship roles", () => {
  describe("createRelationshipRole", () => {
    it("creates a role with its defaults via the pairing RPC", async () => {
      // 00031/ADR-0042: create_relationship_role inserts and pairs the named
      // inverse in one transaction, rather than a plain insert that would
      // leave a fresh pairing one-sided until something else touched it.
      const { client, rpc } = makeRpcClient({ data: ROLE_ROW });

      await createRelationshipRole(client, {
        type_key: "family",
        key: "parent",
        label: "Parent",
        inverse_key: "child",
      });

      expect(rpc).toHaveBeenCalledWith("create_relationship_role", {
        p_type_key: "family",
        p_key: "parent",
        p_label: "Parent",
        p_inverse_key: "child",
        p_sort_order: 0,
        p_is_active: true,
      });
    });

    it("passes null through for a role with no inverse", async () => {
      const { client, rpc } = makeRpcClient({ data: ROLE_ROW });

      await createRelationshipRole(client, {
        type_key: "family",
        key: "only_child",
        label: "Only child",
      });

      expect(rpc).toHaveBeenCalledWith(
        "create_relationship_role",
        expect.objectContaining({ p_inverse_key: null }),
      );
    });

    it("explains a duplicate sub-role key within a type", async () => {
      const { client } = makeRpcClient({
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

    it("explains an unknown inverse role", async () => {
      const { client } = makeRpcClient({
        error: {
          code: "23503",
          message:
            'insert or update on table "relationship_roles" violates foreign key constraint "relationship_roles_inverse_key_fkey"',
        },
      });
      await expect(
        createRelationshipRole(client, {
          type_key: "family",
          key: "parent",
          label: "Parent",
          inverse_key: "ghost",
        }),
      ).rejects.toThrow(/The inverse sub-role doesn.t exist/);
    });
  });

  describe("updateRelationshipRole", () => {
    it("sends only the fields the patch actually names", async () => {
      // toggleActive sends only `{ is_active }`. set_relationship_role
      // (00031/ADR-0042, revised) merges under its own row lock now — the
      // service must not read the row itself and merge client-side, or two
      // concurrent partial patches could each merge a stale snapshot and the
      // later write would silently revert the earlier one. Sending only the
      // named field is what lets the DB side tell "not mentioned" from
      // "explicitly set".
      const { client, rpc } = makeRpcClient({
        data: { ...ROLE_ROW, is_active: false },
      });

      await updateRelationshipRole(client, "family", "parent", {
        is_active: false,
      });

      expect(rpc).toHaveBeenCalledWith("set_relationship_role", {
        p_type_key: "family",
        p_key: "parent",
        p_is_active: false,
      });
    });

    it("sends nothing beyond the key when the patch is empty", async () => {
      const { client, rpc } = makeRpcClient({ data: ROLE_ROW });

      await updateRelationshipRole(client, "family", "parent", {});

      expect(rpc).toHaveBeenCalledWith("set_relationship_role", {
        p_type_key: "family",
        p_key: "parent",
      });
    });

    it("addresses a role by both halves of its composite key", async () => {
      const { client, rpc } = makeRpcClient({ data: ROLE_ROW });

      await updateRelationshipRole(client, "family", "parent", {
        label: "Parent or guardian",
      });

      expect(rpc).toHaveBeenCalledWith(
        "set_relationship_role",
        expect.objectContaining({ p_type_key: "family", p_key: "parent" }),
      );
    });

    it("sends inverse_key and the set-flag together, and only together", async () => {
      // The flag is what tells the RPC "I am writing inverse_key" — sending
      // the value without it would be silently ignored.
      const { client, rpc } = makeRpcClient({ data: ROLE_ROW });

      await updateRelationshipRole(client, "family", "parent", {
        inverse_key: "child",
      });

      expect(rpc).toHaveBeenCalledWith("set_relationship_role", {
        p_type_key: "family",
        p_key: "parent",
        p_inverse_key: "child",
        p_set_inverse_key: true,
      });
    });

    it("clears the pairing with an explicit null, distinct from not mentioning it", async () => {
      const { client, rpc } = makeRpcClient({ data: ROLE_ROW });

      await updateRelationshipRole(client, "family", "parent", {
        inverse_key: null,
      });

      expect(rpc).toHaveBeenCalledWith("set_relationship_role", {
        p_type_key: "family",
        p_key: "parent",
        p_inverse_key: null,
        p_set_inverse_key: true,
      });
    });

    it("maps an unresolved update target to a friendly message", async () => {
      // set_relationship_role raises no_data_found (P0002) when the row it
      // was told to update doesn't resolve — deleted, or invisible under RLS.
      const { client } = makeRpcClient({
        error: { code: "P0002", message: "no_data_found" },
      });
      await expect(
        updateRelationshipRole(client, "family", "parent", { label: "X" }),
      ).rejects.toThrow(/Couldn.t find that sub-role/);
    });
  });

  describe("deleteRelationshipRole", () => {
    it("deletes by the composite key", async () => {
      const { client, builder } = makeClient({
        data: [{ type_key: "family", key: "parent" }],
      });
      await deleteRelationshipRole(client, "family", "parent");
      expect(builder.eq).toHaveBeenCalledWith("type_key", "family");
      expect(builder.eq).toHaveBeenCalledWith("key", "parent");
    });

    it("fails rather than reporting success when the delete matched no rows", async () => {
      const { client } = makeClient({ data: [] });
      await expect(
        deleteRelationshipRole(client, "family", "parent"),
      ).rejects.toThrow(
        /sub-role no longer exists, or you no longer have permission/,
      );
    });
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
