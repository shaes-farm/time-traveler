import type {
  RelationshipCategoryMeta,
  RelationshipRoleMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";

/**
 * Pure helpers behind the vocabulary tree — selection addressing, sibling
 * lookup, and the sort_order arithmetic the ▲▼ buttons apply.
 *
 * Kept free of React so the fiddly parts (composite role keys, reordering at
 * list boundaries, gap-preserving swaps) are unit-testable without rendering.
 * Same split as `category-tree-utils.ts`.
 */

export type VocabularyLevel = "category" | "type" | "role";

/**
 * What the inspector is currently editing.
 *
 * Roles need both halves of their composite primary key, so `typeKey` is
 * populated for roles and undefined elsewhere. `key` is undefined when creating
 * — the selection names a level and a parent but not yet a row.
 */
export interface VocabularySelection {
  level: VocabularyLevel;
  /** Absent when creating a new row at this level. */
  key?: string;
  /** Parent type for a role; parent category for a type being created. */
  parentKey?: string;
}

/* ---------------------------------------------------------------- *
 * Tree node ids
 *
 * The Tree primitive addresses rows by a single string id, but this tree mixes
 * three row kinds and roles need a composite key. Encode the level into the id
 * and parse it back on selection. `:` is safe as a separator — vocabulary keys
 * are `^[a-z][a-z0-9_]*$`, so they can never contain one.
 * ---------------------------------------------------------------- */

export function categoryNodeId(key: string): string {
  return `category:${key}`;
}

export function typeNodeId(key: string): string {
  return `type:${key}`;
}

export function roleNodeId(typeKey: string, key: string): string {
  return `role:${typeKey}:${key}`;
}

/** Parse a node id back into a selection, or null if it is not one of ours. */
export function parseNodeId(nodeId: string): VocabularySelection | null {
  const [level, first, second] = nodeId.split(":");

  if (level === "category" && first !== undefined) {
    return { level: "category", key: first };
  }
  if (level === "type" && first !== undefined) {
    return { level: "type", key: first };
  }
  if (level === "role" && first !== undefined && second !== undefined) {
    return { level: "role", key: second, parentKey: first };
  }
  return null;
}

/* ---------------------------------------------------------------- *
 * Lookup
 * ---------------------------------------------------------------- */

export function findCategory(
  categories: readonly RelationshipCategoryMeta[],
  key: string,
): RelationshipCategoryMeta | undefined {
  return categories.find((category) => category.key === key);
}

export function findType(
  categories: readonly RelationshipCategoryMeta[],
  key: string,
): RelationshipTypeMeta | undefined {
  for (const category of categories) {
    const match = category.types.find((type) => type.key === key);
    if (match) return match;
  }
  return undefined;
}

export function findRole(
  categories: readonly RelationshipCategoryMeta[],
  typeKey: string,
  key: string,
): RelationshipRoleMeta | undefined {
  return findType(categories, typeKey)?.roles.find((role) => role.key === key);
}

/** Flat list of every type across every category. */
export function allTypes(
  categories: readonly RelationshipCategoryMeta[],
): RelationshipTypeMeta[] {
  return categories.flatMap((category) => category.types);
}

/* ---------------------------------------------------------------- *
 * Reordering
 * ---------------------------------------------------------------- */

/** One row's new sort_order, as the ▲▼ handler applies it. */
export interface SortOrderPatch {
  key: string;
  sort_order: number;
}

interface Sortable {
  key: string;
  sort_order: number;
}

/**
 * The two patches that move `key` one place within its sibling list.
 *
 * Returns null at the boundaries (already first when moving up, already last
 * when moving down) so the caller can disable the button rather than issue a
 * no-op write.
 *
 * Swaps the two rows' `sort_order` values rather than renumbering the list.
 * The #419 seed spaces siblings by 10 specifically so a group can be inserted
 * without touching its neighbours; a renumbering reorder would flatten those
 * gaps away on the first click.
 *
 * When the two neighbours happen to share a `sort_order` — legal, since nothing
 * enforces uniqueness — swapping identical values would be a no-op, so the
 * moved row is nudged one past its neighbour instead.
 */
export function swapSortOrder(
  siblings: readonly Sortable[],
  key: string,
  direction: "up" | "down",
): [SortOrderPatch, SortOrderPatch] | null {
  const ordered = [...siblings].sort(
    (a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key),
  );
  const index = ordered.findIndex((item) => item.key === key);
  if (index === -1) return null;

  const neighbourIndex = direction === "up" ? index - 1 : index + 1;
  const current = ordered[index];
  const neighbour = ordered[neighbourIndex];
  if (!current || !neighbour) return null;

  if (current.sort_order === neighbour.sort_order) {
    return [
      {
        key: current.key,
        sort_order:
          direction === "up"
            ? neighbour.sort_order - 1
            : neighbour.sort_order + 1,
      },
      { key: neighbour.key, sort_order: neighbour.sort_order },
    ];
  }

  return [
    { key: current.key, sort_order: neighbour.sort_order },
    { key: neighbour.key, sort_order: current.sort_order },
  ];
}

/** True when `key` is already at the given end of its sibling list. */
export function isAtBoundary(
  siblings: readonly Sortable[],
  key: string,
  direction: "up" | "down",
): boolean {
  return swapSortOrder(siblings, key, direction) === null;
}

/**
 * The `sort_order` a newly created sibling should take: one gap past the
 * current last. Matches the seed's spacing so inserted rows stay insertable
 * between.
 */
export const SORT_ORDER_GAP = 10;

export function nextSortOrder(siblings: readonly Sortable[]): number {
  if (siblings.length === 0) return SORT_ORDER_GAP;
  const max = Math.max(...siblings.map((item) => item.sort_order));
  return max + SORT_ORDER_GAP;
}
