import { describe, expect, it } from "vitest";

import {
  allTypes,
  categoryNodeId,
  findCategory,
  findRole,
  findType,
  isAtBoundary,
  nextSortOrder,
  parseNodeId,
  roleNodeId,
  swapSortOrder,
  typeNodeId,
} from "./vocabulary-tree-utils";
import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";

const CATEGORIES: RelationshipCategoryMeta[] = [
  {
    key: "family",
    label: "Family",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [
      {
        key: "parent_child",
        label: "Parent / Child",
        category_key: "family",
        sort_order: 10,
        is_symmetric: false,
        inverse_key: null,
        direction_verb: "is the parent of",
        symmetric_noun: null,
        description: null,
        is_active: true,
        roles: [
          {
            type_key: "parent_child",
            key: "parent",
            label: "Parent",
            inverse_key: "child",
            sort_order: 10,
            is_active: true,
          },
          {
            type_key: "parent_child",
            key: "child",
            label: "Child",
            inverse_key: "parent",
            sort_order: 20,
            is_active: true,
          },
        ],
      },
      {
        key: "sibling",
        label: "Sibling",
        category_key: "family",
        sort_order: 20,
        is_symmetric: true,
        inverse_key: null,
        direction_verb: null,
        symmetric_noun: "siblings",
        description: null,
        is_active: true,
        roles: [],
      },
    ],
  },
  {
    key: "professional",
    label: "Professional",
    description: null,
    sort_order: 20,
    is_active: true,
    types: [],
  },
];

describe("node ids", () => {
  it("round-trips a category", () => {
    expect(parseNodeId(categoryNodeId("family"))).toEqual({
      level: "category",
      key: "family",
    });
  });

  it("round-trips a type", () => {
    expect(parseNodeId(typeNodeId("parent_child"))).toEqual({
      level: "type",
      key: "parent_child",
    });
  });

  it("round-trips a role, keeping both halves of its composite key", () => {
    expect(parseNodeId(roleNodeId("parent_child", "parent"))).toEqual({
      level: "role",
      key: "parent",
      parentKey: "parent_child",
    });
  });

  it("returns null for anything that isn't one of ours", () => {
    expect(parseNodeId("nonsense")).toBeNull();
    expect(parseNodeId("")).toBeNull();
    // A role id missing its type half is not addressable.
    expect(parseNodeId("role:parent_child")).toBeNull();
  });
});

describe("lookup", () => {
  it("finds a category, a type in any category, and a role under its type", () => {
    expect(findCategory(CATEGORIES, "professional")?.label).toBe(
      "Professional",
    );
    expect(findType(CATEGORIES, "sibling")?.label).toBe("Sibling");
    expect(findRole(CATEGORIES, "parent_child", "child")?.label).toBe("Child");
  });

  it("returns undefined for misses", () => {
    expect(findCategory(CATEGORIES, "ghost")).toBeUndefined();
    expect(findType(CATEGORIES, "ghost")).toBeUndefined();
    expect(findRole(CATEGORIES, "parent_child", "ghost")).toBeUndefined();
    // A role key that exists under a *different* type must not match.
    expect(findRole(CATEGORIES, "sibling", "parent")).toBeUndefined();
  });

  it("flattens every type across categories", () => {
    expect(allTypes(CATEGORIES).map((t) => t.key)).toEqual([
      "parent_child",
      "sibling",
    ]);
  });
});

describe("swapSortOrder", () => {
  const siblings = [
    { key: "a", sort_order: 10 },
    { key: "b", sort_order: 20 },
    { key: "c", sort_order: 30 },
  ];

  it("swaps the two rows' sort_order values", () => {
    expect(swapSortOrder(siblings, "b", "up")).toEqual([
      { key: "b", sort_order: 10 },
      { key: "a", sort_order: 20 },
    ]);
    expect(swapSortOrder(siblings, "b", "down")).toEqual([
      { key: "b", sort_order: 30 },
      { key: "c", sort_order: 20 },
    ]);
  });

  it("preserves the gaps rather than renumbering", () => {
    // The seed spaces siblings by 10 so a group can be inserted between two
    // others; a renumbering reorder would flatten that away on the first click.
    const patches = swapSortOrder(siblings, "c", "up");
    expect(patches?.map((p) => p.sort_order).sort((x, y) => x - y)).toEqual([
      20, 30,
    ]);
  });

  it("returns null at the boundaries", () => {
    expect(swapSortOrder(siblings, "a", "up")).toBeNull();
    expect(swapSortOrder(siblings, "c", "down")).toBeNull();
  });

  it("returns null for a key that isn't in the list", () => {
    expect(swapSortOrder(siblings, "ghost", "up")).toBeNull();
  });

  it("orders by sort_order, not array position", () => {
    const unsorted = [
      { key: "c", sort_order: 30 },
      { key: "a", sort_order: 10 },
      { key: "b", sort_order: 20 },
    ];
    expect(swapSortOrder(unsorted, "a", "up")).toBeNull();
    expect(swapSortOrder(unsorted, "a", "down")).toEqual([
      { key: "a", sort_order: 20 },
      { key: "b", sort_order: 10 },
    ]);
  });

  it("nudges past a tied neighbour instead of swapping identical values", () => {
    // Nothing enforces sort_order uniqueness, and swapping two equal values
    // would be a no-op the user reads as "the button is broken".
    const tied = [
      { key: "a", sort_order: 10 },
      { key: "b", sort_order: 10 },
    ];
    expect(swapSortOrder(tied, "b", "up")).toEqual([
      { key: "b", sort_order: 9 },
      { key: "a", sort_order: 10 },
    ]);
    expect(swapSortOrder(tied, "a", "down")).toEqual([
      { key: "a", sort_order: 11 },
      { key: "b", sort_order: 10 },
    ]);
  });

  it("handles a single-item and an empty list", () => {
    expect(swapSortOrder([{ key: "a", sort_order: 10 }], "a", "up")).toBeNull();
    expect(swapSortOrder([], "a", "up")).toBeNull();
  });
});

describe("isAtBoundary", () => {
  const siblings = [
    { key: "a", sort_order: 10 },
    { key: "b", sort_order: 20 },
  ];

  it("reports the ends", () => {
    expect(isAtBoundary(siblings, "a", "up")).toBe(true);
    expect(isAtBoundary(siblings, "a", "down")).toBe(false);
    expect(isAtBoundary(siblings, "b", "up")).toBe(false);
    expect(isAtBoundary(siblings, "b", "down")).toBe(true);
  });
});

describe("nextSortOrder", () => {
  it("starts at the gap for an empty list", () => {
    expect(nextSortOrder([])).toBe(10);
  });

  it("puts a new row one gap past the current maximum", () => {
    expect(
      nextSortOrder([
        { key: "a", sort_order: 10 },
        { key: "b", sort_order: 40 },
      ]),
    ).toBe(50);
  });

  it("uses the maximum, not the last array element", () => {
    expect(
      nextSortOrder([
        { key: "b", sort_order: 40 },
        { key: "a", sort_order: 10 },
      ]),
    ).toBe(50);
  });
});
