"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@repo/ui/lib/utils";

/**
 * Tree — the one bespoke primitive in the design system (per the aesthetic
 * notes: "no shadcn primitive for this; custom build"). It renders the fractal
 * timeline hierarchy — `timeline → events → (event expands into) sub-timeline
 * → events`, recursing on the timeline — as an accessible, keyboard-navigable
 * disclosure tree.
 *
 * Forward-only fractal model (ADR-0006): drill-down nodes are surfaced via an
 * event's `detail_timeline_id`. Those nodes depend on the column landing
 * (#177); callers omit `children` / `hasChildren` until then and the affected
 * rows simply render as leaves.
 *
 * Keyboard: Up/Down move between visible rows, Right expands (or descends),
 * Left collapses (or ascends), Enter/Space activate.
 */
export interface TreeNode {
  id: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Right-aligned metadata (era code, child count, drill-down marker). */
  meta?: React.ReactNode;
  children?: TreeNode[];
  /** Marks a node as expandable before its children are loaded (lazy). */
  hasChildren?: boolean;
  defaultExpanded?: boolean;
  /** Invoked on Enter/Space or row click (e.g. navigate to the entity). */
  onActivate?: () => void;
}

export interface TreeProps extends React.HTMLAttributes<HTMLUListElement> {
  nodes: TreeNode[];
  "aria-label": string;
}

interface FlatRow {
  node: TreeNode;
  level: number;
  expanded: boolean;
  expandable: boolean;
}

const isExpandable = (node: TreeNode): boolean =>
  node.hasChildren === true ||
  (node.children !== undefined && node.children.length > 0);

function flatten(
  nodes: TreeNode[],
  expandedIds: Set<string>,
  level: number,
  out: FlatRow[],
): void {
  for (const node of nodes) {
    const expandable = isExpandable(node);
    const expanded = expandable && expandedIds.has(node.id);
    out.push({ node, level, expanded, expandable });
    if (expanded && node.children) {
      flatten(node.children, expandedIds, level + 1, out);
    }
  }
}

function collectDefaultExpanded(nodes: TreeNode[], acc: Set<string>): void {
  for (const node of nodes) {
    if (node.defaultExpanded && isExpandable(node)) acc.add(node.id);
    if (node.children) collectDefaultExpanded(node.children, acc);
  }
}

export const Tree = React.forwardRef<HTMLUListElement, TreeProps>(
  ({ nodes, className, ...props }, ref) => {
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
      const acc = new Set<string>();
      collectDefaultExpanded(nodes, acc);
      return acc;
    });
    const [focusedId, setFocusedId] = React.useState<string | null>(null);

    const rows: FlatRow[] = [];
    flatten(nodes, expandedIds, 1, rows);

    const activeId = focusedId ?? rows[0]?.node.id ?? null;

    const toggle = (id: string, next?: boolean) => {
      setExpandedIds((prev) => {
        const copy = new Set(prev);
        const shouldExpand = next ?? !copy.has(id);
        if (shouldExpand) copy.add(id);
        else copy.delete(id);
        return copy;
      });
    };

    const focusAt = (index: number) => {
      const row = rows[index];
      if (row) setFocusedId(row.node.id);
    };

    const onKeyDown = (
      event: React.KeyboardEvent<HTMLLIElement>,
      row: FlatRow,
      index: number,
    ) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusAt(Math.min(index + 1, rows.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          focusAt(Math.max(index - 1, 0));
          break;
        case "ArrowRight":
          event.preventDefault();
          if (row.expandable && !row.expanded) toggle(row.node.id, true);
          else if (row.expandable) focusAt(index + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (row.expandable && row.expanded) toggle(row.node.id, false);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (row.node.onActivate) row.node.onActivate();
          else if (row.expandable) toggle(row.node.id);
          break;
        default:
          break;
      }
    };

    return (
      <ul
        ref={ref}
        role="tree"
        className={cn("select-none text-sm", className)}
        {...props}
      >
        {rows.map((row, index) => {
          const { node, level, expanded, expandable } = row;
          const Icon = node.icon;
          const isActive = node.id === activeId;
          return (
            <li
              key={node.id}
              role="treeitem"
              aria-level={level}
              aria-expanded={expandable ? expanded : undefined}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, row, index)}
              onFocus={() => setFocusedId(node.id)}
              className={cn(
                "flex cursor-default items-center gap-1.5 rounded-md py-1 pr-2 outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-surface-2 text-foreground"
                  : "text-foreground-muted",
                "hover:bg-surface-2/60 hover:text-foreground",
              )}
              style={{ paddingLeft: `${(level - 1) * 16 + 4}px` }}
              onClick={() => {
                setFocusedId(node.id);
                if (node.onActivate) node.onActivate();
              }}
            >
              {expandable ? (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={expanded ? "Collapse" : "Expand"}
                  className="grid h-4 w-4 shrink-0 place-content-center text-foreground-subtle hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(node.id);
                  }}
                >
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      expanded && "rotate-90",
                    )}
                    aria-hidden
                  />
                </button>
              ) : (
                <span className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              <span className="flex-1 truncate">{node.label}</span>
              {node.meta != null && (
                <span className="shrink-0 text-xs text-foreground-subtle">
                  {node.meta}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  },
);
Tree.displayName = "Tree";
