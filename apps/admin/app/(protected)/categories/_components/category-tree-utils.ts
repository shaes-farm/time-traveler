import type { CategoryNode } from "@repo/services/category-service";

/** A tree node flattened to a render/pick row, carrying its depth (root = 0). */
export interface FlatCategory {
  node: CategoryNode;
  depth: number;
}

/**
 * Pre-order flatten of the category forest — parents immediately before their
 * children — with each node's depth. The service already orders every level
 * deterministically (title, id), so this preserves that order.
 */
export function flattenTree(
  nodes: CategoryNode[],
  depth = 0,
  out: FlatCategory[] = [],
): FlatCategory[] {
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, depth + 1, out);
    }
  }
  return out;
}

/** Find a node anywhere in the forest by id, or `null`. */
export function findNode(
  nodes: CategoryNode[],
  id: string,
): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * The id set that a reparent must exclude as candidate parents: the node itself
 * and every descendant. Assigning any of these as the node's parent would form
 * a cycle (mirrors the service-layer `assertNoCategoryCycle` guard).
 */
export function collectSelfAndDescendantIds(node: CategoryNode): Set<string> {
  const ids = new Set<string>();
  const walk = (n: CategoryNode) => {
    ids.add(n.id);
    n.children?.forEach(walk);
  };
  walk(node);
  return ids;
}

/** Number of descendant categories below a node (excludes the node itself). */
export function countDescendants(node: CategoryNode): number {
  let count = 0;
  const walk = (children: CategoryNode[] | undefined) => {
    for (const child of children ?? []) {
      count += 1;
      walk(child.children);
    }
  };
  walk(node.children);
  return count;
}

/**
 * Sum of a usage-count map over a node's whole subtree (the node plus every
 * descendant). Powers the delete blast radius ("removes the tag from N events");
 * a tag on multiple categories in the subtree is counted once per category, so
 * this is the number of category→event links removed, not distinct events.
 */
export function sumSubtreeUsage(
  node: CategoryNode,
  usage: Record<string, number>,
): number {
  let total = usage[node.id] ?? 0;
  for (const child of node.children ?? []) {
    total += sumSubtreeUsage(child, usage);
  }
  return total;
}
