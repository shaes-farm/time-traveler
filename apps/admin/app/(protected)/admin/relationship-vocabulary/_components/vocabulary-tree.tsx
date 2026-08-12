"use client";

import * as React from "react";
import { FolderTree, Tag, Waypoints } from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Tree, type TreeNode } from "@repo/ui/components/tree";
import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";

import { ReorderButtons } from "./reorder-buttons";
import {
  categoryNodeId,
  isAtBoundary,
  roleNodeId,
  typeNodeId,
  type VocabularySelection,
} from "./vocabulary-tree-utils";

/**
 * The vocabulary as a three-level tree: categories → types → sub-roles.
 *
 * Built on the shared `Tree` primitive, which already provides the ARIA tree
 * semantics, roving tabindex, and arrow-key navigation. This component supplies
 * the node mapping and the per-row `meta` slot — an inactive badge and the
 * reorder controls.
 *
 * Roles have no `sort_order` reordering exposed here: they are a flat list under
 * one type and the picker groups by category and type only, so their order has
 * no user-visible effect beyond the role dropdown, which the inspector's numeric
 * field covers.
 */
export function VocabularyTree({
  categories,
  selection,
  onSelect,
  onReorder,
  reorderPending,
}: {
  categories: RelationshipCategoryMeta[];
  selection: VocabularySelection | null;
  onSelect: (selection: VocabularySelection) => void;
  onReorder: (
    level: "category" | "type",
    key: string,
    direction: "up" | "down",
  ) => void;
  reorderPending: boolean;
}) {
  const nodes = React.useMemo<TreeNode[]>(
    () =>
      categories.map((category) => ({
        id: categoryNodeId(category.key),
        label: (
          <RowLabel label={category.label} isActive={category.is_active} />
        ),
        icon: FolderTree,
        defaultExpanded: false,
        meta: (
          <ReorderButtons
            label={category.label}
            canMoveUp={!isAtBoundary(categories, category.key, "up")}
            canMoveDown={!isAtBoundary(categories, category.key, "down")}
            disabled={reorderPending}
            onMove={(direction) =>
              onReorder("category", category.key, direction)
            }
          />
        ),
        onActivate: () => onSelect({ level: "category", key: category.key }),
        children: category.types.map((type) => ({
          id: typeNodeId(type.key),
          label: <RowLabel label={type.label} isActive={type.is_active} />,
          icon: Waypoints,
          meta: (
            <ReorderButtons
              label={type.label}
              canMoveUp={!isAtBoundary(category.types, type.key, "up")}
              canMoveDown={!isAtBoundary(category.types, type.key, "down")}
              disabled={reorderPending}
              onMove={(direction) => onReorder("type", type.key, direction)}
            />
          ),
          onActivate: () => onSelect({ level: "type", key: type.key }),
          children: type.roles.map((role) => ({
            id: roleNodeId(type.key, role.key),
            label: <RowLabel label={role.label} isActive={role.is_active} />,
            icon: Tag,
            onActivate: () =>
              onSelect({
                level: "role",
                key: role.key,
                parentKey: type.key,
              }),
          })),
        })),
      })),
    [categories, onSelect, onReorder, reorderPending],
  );

  return (
    <Tree
      aria-label="Relationship vocabulary"
      nodes={nodes}
      selectedId={selectedNodeId(selection)}
      className="p-2"
    />
  );
}

/** The tree id matching the current selection, or undefined while creating. */
function selectedNodeId(
  selection: VocabularySelection | null,
): string | undefined {
  if (!selection?.key) return undefined;
  switch (selection.level) {
    case "category":
      return categoryNodeId(selection.key);
    case "type":
      return typeNodeId(selection.key);
    case "role":
      return selection.parentKey
        ? roleNodeId(selection.parentKey, selection.key)
        : undefined;
  }
}

/**
 * A row's label, with retired entries marked.
 *
 * The badge carries the meaning in text rather than as a colour or an opacity
 * shift alone — this tree is the one place an admin can tell an inactive entry
 * from an active one, and the whole surface reads `activeOnly: false`.
 */
function RowLabel({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={isActive ? undefined : "text-foreground-subtle"}>
        {label}
      </span>
      {!isActive && (
        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
          Inactive
        </Badge>
      )}
    </span>
  );
}
