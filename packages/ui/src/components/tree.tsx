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
  /**
   * Id of the currently-selected node (e.g. the row the route is showing).
   * Distinct from roving-tabindex focus: it persists a visible selection and
   * sets `aria-selected` on the matching treeitem.
   */
  selectedId?: string;
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

/**
 * The ancestor id path from the forest down to (but excluding) `targetId`, or
 * null if the id isn't present. Used to reveal a selected node by expanding its
 * ancestors. An empty array means the target is a root (no ancestors).
 */
function findAncestorPath(
  nodes: TreeNode[],
  targetId: string,
): string[] | null {
  for (const node of nodes) {
    if (node.id === targetId) return [];
    if (node.children) {
      const sub = findAncestorPath(node.children, targetId);
      if (sub) return [node.id, ...sub];
    }
  }
  return null;
}

export const Tree = React.forwardRef<HTMLUListElement, TreeProps>(
  ({ nodes, className, selectedId, ...props }, ref) => {
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
      const acc = new Set<string>();
      collectDefaultExpanded(nodes, acc);
      return acc;
    });
    const [focusedId, setFocusedId] = React.useState<string | null>(null);
    // Map from node id → <li> DOM element for imperative focus after arrow-key nav.
    const rowElementsRef = React.useRef(
      new Map<string, HTMLLIElement | null>(),
    );

    // Reveal the selected node: expand its ancestor chain for this render so a
    // deep or newly-created node isn't hidden in a collapsed subtree. A leaf
    // only becomes expandable once it gains its first child, so its parent is
    // never in the default-expanded set — this is what surfaces such a child.
    // Derived, not stored: the render stays pure (no state writes), and
    // `expandedIds` remains purely the user's own toggle state. Recomputing
    // from `nodes` each render also means a just-created node reveals itself as
    // soon as it appears in the tree.
    const effectiveExpanded = React.useMemo(() => {
      if (selectedId === undefined) return expandedIds;
      const ancestors = findAncestorPath(nodes, selectedId);
      if (!ancestors || ancestors.length === 0) return expandedIds;
      const merged = new Set(expandedIds);
      for (const id of ancestors) merged.add(id);
      return merged;
    }, [selectedId, nodes, expandedIds]);

    const rows: FlatRow[] = [];
    flatten(nodes, effectiveExpanded, 1, rows);

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
      if (!row) return;
      setFocusedId(row.node.id);
      // Move DOM focus so subsequent keyboard events fire on the new row.
      rowElementsRef.current.get(row.node.id)?.focus({ preventScroll: false });
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
          if (row.expandable && row.expanded) {
            // Collapse the open node.
            toggle(row.node.id, false);
          } else if (row.level > 1) {
            // Ascend to the nearest ancestor (last row before this with level - 1).
            for (let i = index - 1; i >= 0; i--) {
              if (rows[i]!.level === row.level - 1) {
                focusAt(i);
                break;
              }
            }
          }
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
          const isSelected = node.id === selectedId;
          return (
            <li
              key={node.id}
              ref={(el) => {
                if (el) rowElementsRef.current.set(node.id, el);
                else rowElementsRef.current.delete(node.id);
              }}
              role="treeitem"
              aria-level={level}
              aria-expanded={expandable ? expanded : undefined}
              aria-selected={selectedId !== undefined ? isSelected : undefined}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, row, index)}
              onFocus={() => setFocusedId(node.id)}
              className={cn(
                "flex cursor-default items-center gap-1.5 rounded-md py-1 pr-2 outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-surface-2 text-foreground"
                  : "text-foreground-muted",
                isSelected && "bg-primary/10 font-medium text-foreground",
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
