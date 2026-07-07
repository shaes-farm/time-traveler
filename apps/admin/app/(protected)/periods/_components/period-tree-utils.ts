/**
 * Pure helpers over a flat list of periods (each carrying `parent_period_id`).
 * Periods are stored flat, not as a nested tree, so these reconstruct the
 * hierarchy the parent picker and breadcrumbs need — kept pure for unit testing.
 */

export interface PeriodLite {
  id: string;
  title: string;
  parent_period_id: string | null;
}

/**
 * The id set that a period may **not** be parented under: itself plus every
 * descendant. Used by the parent picker to prevent cycles client-side
 * (the service `assertNoPeriodCycle` is the backstop for any raced write).
 */
export function collectSelfAndDescendantIds<T extends PeriodLite>(
  periods: T[],
  rootId: string,
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const p of periods) {
    if (p.parent_period_id !== null) {
      const list = childrenByParent.get(p.parent_period_id) ?? [];
      list.push(p.id);
      childrenByParent.set(p.parent_period_id, list);
    }
  }

  const excluded = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (excluded.has(id)) continue; // guard against a pre-existing cycle
    excluded.add(id);
    for (const childId of childrenByParent.get(id) ?? []) {
      stack.push(childId);
    }
  }
  return excluded;
}

export interface OrderedPeriod<T> {
  node: T;
  depth: number;
}

/**
 * Depth-first ordering of the flat period list into hierarchical reading order,
 * annotating each with its nesting depth (for indentation in the picker). Roots
 * (null parent, or a parent not present in the list) are ordered first, each
 * followed by its subtree. Ordering within a level preserves input order.
 */
export function orderedForPicker<T extends PeriodLite>(
  periods: T[],
): OrderedPeriod<T>[] {
  const byId = new Map(periods.map((p) => [p.id, p]));
  const childrenByParent = new Map<string, T[]>();
  const roots: T[] = [];
  for (const p of periods) {
    const parent = p.parent_period_id;
    if (parent !== null && byId.has(parent)) {
      const list = childrenByParent.get(parent) ?? [];
      list.push(p);
      childrenByParent.set(parent, list);
    } else {
      roots.push(p);
    }
  }

  const out: OrderedPeriod<T>[] = [];
  const visited = new Set<string>();
  const walk = (node: T, depth: number): void => {
    if (visited.has(node.id)) return; // guard against a pre-existing cycle
    visited.add(node.id);
    out.push({ node, depth });
    for (const child of childrenByParent.get(node.id) ?? []) {
      walk(child, depth + 1);
    }
  };
  for (const root of roots) walk(root, 0);
  // Any nodes left unvisited (part of a stored cycle) are appended flat so the
  // picker never silently drops an option.
  for (const p of periods) {
    if (!visited.has(p.id)) out.push({ node: p, depth: 0 });
  }
  return out;
}
