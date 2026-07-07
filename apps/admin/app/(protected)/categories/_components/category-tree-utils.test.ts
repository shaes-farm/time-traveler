import { describe, it, expect } from "vitest";

import type { CategoryNode } from "@repo/services/category-service";

import {
  flattenTree,
  findNode,
  collectSelfAndDescendantIds,
  countDescendants,
  sumSubtreeUsage,
} from "./category-tree-utils";

function node(
  id: string,
  children: CategoryNode[] = [],
  overrides: Partial<CategoryNode> = {},
): CategoryNode {
  return {
    id,
    user_id: "user-1",
    slug: id,
    title: id.toUpperCase(),
    description: null,
    color: null,
    icon: null,
    parent_category_id: null,
    created_at: null,
    updated_at: null,
    children,
    ...overrides,
  };
}

// science → (physics → (quantum, relativity)), chemistry
// war
const tree: CategoryNode[] = [
  node("science", [
    node("physics", [node("quantum"), node("relativity")]),
    node("chemistry"),
  ]),
  node("war"),
];

describe("flattenTree", () => {
  it("pre-orders parents before children with depth", () => {
    const flat = flattenTree(tree);
    expect(flat.map((f) => `${f.node.id}@${f.depth}`)).toEqual([
      "science@0",
      "physics@1",
      "quantum@2",
      "relativity@2",
      "chemistry@1",
      "war@0",
    ]);
  });

  it("returns an empty array for an empty forest", () => {
    expect(flattenTree([])).toEqual([]);
  });
});

describe("findNode", () => {
  it("finds a deeply nested node", () => {
    expect(findNode(tree, "quantum")?.id).toBe("quantum");
  });

  it("finds a root node", () => {
    expect(findNode(tree, "war")?.id).toBe("war");
  });

  it("returns null when absent", () => {
    expect(findNode(tree, "missing")).toBeNull();
  });
});

describe("collectSelfAndDescendantIds", () => {
  it("includes the node and every descendant", () => {
    const physics = findNode(tree, "physics")!;
    expect([...collectSelfAndDescendantIds(physics)].sort()).toEqual([
      "physics",
      "quantum",
      "relativity",
    ]);
  });

  it("is just the node itself for a leaf", () => {
    const leaf = findNode(tree, "war")!;
    expect([...collectSelfAndDescendantIds(leaf)]).toEqual(["war"]);
  });
});

describe("countDescendants", () => {
  it("counts the whole subtree below a node", () => {
    expect(countDescendants(findNode(tree, "science")!)).toBe(4);
    expect(countDescendants(findNode(tree, "physics")!)).toBe(2);
  });

  it("is zero for a leaf", () => {
    expect(countDescendants(findNode(tree, "war")!)).toBe(0);
  });
});

describe("sumSubtreeUsage", () => {
  const usage = { science: 1, physics: 5, quantum: 9, relativity: 6, war: 3 };

  it("sums the node plus all descendants", () => {
    // science(1) + physics(5) + quantum(9) + relativity(6) + chemistry(0) = 21
    expect(sumSubtreeUsage(findNode(tree, "science")!, usage)).toBe(21);
    // physics(5) + quantum(9) + relativity(6) = 20
    expect(sumSubtreeUsage(findNode(tree, "physics")!, usage)).toBe(20);
  });

  it("treats a missing usage entry as zero", () => {
    expect(sumSubtreeUsage(findNode(tree, "chemistry")!, usage)).toBe(0);
    expect(sumSubtreeUsage(findNode(tree, "war")!, {})).toBe(0);
  });
});
