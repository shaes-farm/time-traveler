"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@repo/ui/components/button";

/**
 * ▲▼ reordering for one row within its sibling list.
 *
 * Buttons rather than drag-and-drop: no sortable primitive exists in the design
 * system and no DnD dependency is in the tree, so drag would mean a new
 * dependency plus a keyboard-accessible fallback anyway. Buttons are that
 * fallback, and they are the whole feature — reachable by keyboard and screen
 * reader by construction, with an unambiguous accessible name per row.
 *
 * Each click swaps `sort_order` with the adjacent sibling (see `swapSortOrder`),
 * preserving the gaps-of-10 spacing the #419 seed uses so a row can still be
 * inserted between two others later.
 */
export function ReorderButtons({
  label,
  canMoveUp,
  canMoveDown,
  onMove,
  disabled = false,
}: {
  /** Row label, used to build the accessible name. */
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: "up" | "down") => void;
  disabled?: boolean;
}) {
  return (
    <span className="flex items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        aria-label={`Move ${label} up`}
        disabled={disabled || !canMoveUp}
        onClick={(event) => {
          // The row is a treeitem whose click handler selects it; reordering
          // should not also change the selection.
          event.stopPropagation();
          onMove("up");
        }}
      >
        <ChevronUp className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        aria-label={`Move ${label} down`}
        disabled={disabled || !canMoveDown}
        onClick={(event) => {
          event.stopPropagation();
          onMove("down");
        }}
      >
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </span>
  );
}
