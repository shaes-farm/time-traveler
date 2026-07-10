"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@repo/ui/components/input";
import { Tree, type TreeNode } from "@repo/ui/components/tree";
import type { CategoryNode } from "@repo/services/category-service";

import { CategoryIcon } from "./category-icon";

/** Leading glyph for a tree row: the icon tinted by the node color, or a color dot. */
function NodeGlyph({ node }: { node: CategoryNode }) {
  const color = node.color ?? undefined;
  if (node.icon && node.icon.trim() !== "") {
    return (
      <span className="inline-flex" style={color ? { color } : undefined}>
        <CategoryIcon name={node.icon} className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 rounded-full border border-border"
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

/**
 * Keep only nodes whose title matches `query`, plus their ancestors (so a deep
 * match stays reachable). Returns a new pruned forest; the original is untouched.
 */
function filterForest(nodes: CategoryNode[], query: string): CategoryNode[] {
  const q = query.trim().toLowerCase();
  if (q === "") return nodes;
  const prune = (list: CategoryNode[]): CategoryNode[] => {
    const kept: CategoryNode[] = [];
    for (const node of list) {
      const children = node.children ? prune(node.children) : [];
      const selfMatches = node.title.toLowerCase().includes(q);
      if (selfMatches || children.length > 0) {
        kept.push({ ...node, children });
      }
    }
    return kept;
  };
  return prune(nodes);
}

function toTreeNodes(
  nodes: CategoryNode[],
  usage: Record<string, number> | undefined,
  onSelect: (id: string) => void,
  expandAll: boolean,
  depth = 0,
): TreeNode[] {
  return nodes.map((node) => {
    // Once the usage map has loaded, show a count for every node (including 0).
    // While it's still loading (`usage` undefined) render no meta rather than
    // a misleading "0 events".
    const count = usage === undefined ? undefined : (usage[node.id] ?? 0);
    return {
      id: node.id,
      label: (
        <span className="flex items-center gap-1.5">
          <NodeGlyph node={node} />
          <span className="truncate">{node.title}</span>
        </span>
      ),
      meta: count === undefined ? undefined : `${count} events`,
      // Expand roots by default; expand everything while a filter is active so
      // matches deep in the tree are visible.
      defaultExpanded: expandAll || depth === 0,
      onActivate: () => onSelect(node.id),
      children:
        node.children && node.children.length > 0
          ? toTreeNodes(node.children, usage, onSelect, expandAll, depth + 1)
          : undefined,
    };
  });
}

/**
 * The category hierarchy pane: a filterable, keyboard-navigable disclosure tree.
 * Selecting a row (click / Enter) calls `onSelect` with its id, which the
 * manager routes to the inspector.
 */
export function CategoryTree({
  tree,
  usage,
  selectedId,
  onSelect,
}: {
  tree: CategoryNode[];
  usage: Record<string, number> | undefined;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = React.useState("");
  const filtered = React.useMemo(
    () => filterForest(tree, filter),
    [tree, filter],
  );
  const expandAll = filter.trim() !== "";
  const nodes = React.useMemo(
    () => toTreeNodes(filtered, usage, onSelect, expandAll),
    [filtered, usage, onSelect, expandAll],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative border-b border-border p-2">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
          aria-hidden
        />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter categories…"
          aria-label="Filter categories"
          className="pl-8"
        />
      </div>
      <div className="flex-1 overflow-auto p-2">
        {nodes.length === 0 ? (
          <p className="px-2 py-6 text-sm text-foreground-muted">
            No categories match “{filter}”.
          </p>
        ) : (
          // Remount on every filter change (not just empty↔non-empty) so the
          // Tree recomputes default-expansion and newly-matched nodes aren't
          // hidden by stale internal expand state. The filter input lives
          // outside this subtree, so it keeps focus across remounts.
          <Tree
            key={expandAll ? `filtered:${filter.trim()}` : "all"}
            nodes={nodes}
            selectedId={selectedId}
            aria-label="Category hierarchy"
          />
        )}
      </div>
    </div>
  );
}
