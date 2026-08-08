import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import {
  listRelationshipCategories,
  fetchRelationshipVocabulary,
} from "./relationship-type-service";

function makeClient(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  const client = { from: vi.fn().mockReturnValue(builder) };
  return {
    client: client as unknown as SupabaseClient<Database>,
    from: client.from,
    builder,
  };
}

/** Two categories, deliberately returned out of order to exercise sorting. */
const RAW = [
  {
    key: "asymmetric",
    label: "Asymmetric",
    description: null,
    sort_order: 20,
    is_active: true,
    types: [
      {
        key: "mentor_student",
        label: "Mentor",
        category_key: "asymmetric",
        sort_order: 10,
        is_symmetric: false,
        inverse_key: null,
        direction_verb: "mentors",
        symmetric_noun: null,
        description: null,
        is_active: true,
        roles: [],
      },
    ],
  },
  {
    key: "social",
    label: "Social",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [
      {
        key: "friendship",
        label: "Friendship",
        category_key: "social",
        sort_order: 20,
        is_symmetric: true,
        inverse_key: null,
        direction_verb: null,
        symmetric_noun: "friends",
        description: null,
        is_active: true,
        roles: [],
      },
      {
        key: "family",
        label: "Family",
        category_key: "social",
        sort_order: 10,
        is_symmetric: true,
        inverse_key: null,
        direction_verb: null,
        symmetric_noun: "relatives",
        description: null,
        is_active: true,
        roles: [
          {
            type_key: "family",
            key: "child",
            label: "Child",
            inverse_key: "parent",
            sort_order: 20,
            is_active: true,
          },
          {
            type_key: "family",
            key: "parent",
            label: "Parent",
            inverse_key: "child",
            sort_order: 10,
            is_active: true,
          },
          {
            type_key: "family",
            key: "retired_role",
            label: "Retired",
            inverse_key: null,
            sort_order: 30,
            is_active: false,
          },
        ],
      },
    ],
  },
  {
    key: "retired_category",
    label: "Retired",
    description: null,
    sort_order: 99,
    is_active: false,
    types: [],
  },
];

describe("listRelationshipCategories", () => {
  it("reads from relationship_categories with the nested embed", async () => {
    const { client, from, builder } = makeClient({ data: RAW, error: null });
    await listRelationshipCategories(client);
    expect(from).toHaveBeenCalledWith("relationship_categories");
    // One round trip returns the whole three-level tree.
    const selectArg = builder.select.mock.calls[0]?.[0] as string;
    expect(selectArg).toContain("relationship_types");
    expect(selectArg).toContain("relationship_roles");
  });

  it("orders categories, then types, then roles by sort_order", async () => {
    const { client } = makeClient({ data: RAW, error: null });
    const result = await listRelationshipCategories(client);

    expect(result.map((c) => c.key)).toEqual(["social", "asymmetric"]);
    expect(result[0]?.types.map((t) => t.key)).toEqual([
      "family",
      "friendship",
    ]);
    expect(result[0]?.types[0]?.roles.map((r) => r.key)).toEqual([
      "parent",
      "child",
    ]);
  });

  it("drops inactive categories, types and roles by default", async () => {
    const { client } = makeClient({ data: RAW, error: null });
    const result = await listRelationshipCategories(client);

    expect(result.map((c) => c.key)).not.toContain("retired_category");
    expect(result[0]?.types[0]?.roles.map((r) => r.key)).not.toContain(
      "retired_role",
    );
  });

  it("keeps inactive entries when activeOnly is false (admin management)", async () => {
    const { client } = makeClient({ data: RAW, error: null });
    const result = await listRelationshipCategories(client, {
      activeOnly: false,
    });

    // Ordering is unchanged by activeOnly: social (10) still sorts first.
    expect(result.map((c) => c.key)).toEqual([
      "social",
      "asymmetric",
      "retired_category",
    ]);
    expect(result[0]?.types[0]?.roles.map((r) => r.key)).toContain(
      "retired_role",
    );
  });

  it("returns an empty list for a database with no vocabulary seeded", async () => {
    const { client } = makeClient({ data: [], error: null });
    await expect(listRelationshipCategories(client)).resolves.toEqual([]);
  });

  it("throws a contextualised error when the query fails", async () => {
    const { client } = makeClient({
      data: null,
      error: { message: "permission denied" },
    });
    await expect(listRelationshipCategories(client)).rejects.toThrow(
      "RelationshipTypeService.listRelationshipCategories: permission denied",
    );
  });
});

describe("fetchRelationshipVocabulary", () => {
  it("flattens the tree into a key → metadata lookup", async () => {
    const { client } = makeClient({ data: RAW, error: null });
    const vocabulary = await fetchRelationshipVocabulary(client);

    expect(vocabulary.size).toBe(3);
    expect(vocabulary.get("family")?.symmetric_noun).toBe("relatives");
    expect(vocabulary.get("mentor_student")?.is_symmetric).toBe(false);
    expect(vocabulary.get("mentor_student")?.direction_verb).toBe("mentors");
    expect(vocabulary.get("nonexistent")).toBeUndefined();
  });

  it("is empty when nothing is seeded", async () => {
    const { client } = makeClient({ data: [], error: null });
    const vocabulary = await fetchRelationshipVocabulary(client);
    expect(vocabulary.size).toBe(0);
  });
});
