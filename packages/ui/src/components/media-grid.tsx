"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import type { MediaLibraryRow } from "@repo/services/media-service";

import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import {
  MediaCard,
  type MediaPickerMode,
  type MediaView,
} from "@repo/ui/components/media-card";

/** Prev/Next cursor pager state — the #291 query layer is keyset, not offset. */
export interface MediaPager {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export interface MediaGridProps {
  items: MediaLibraryRow[];
  mode: MediaPickerMode;
  view: MediaView;
  onViewChange: (view: MediaView) => void;
  pager: MediaPager;
  /** Pick mode, or browse mode with `selectable` — the currently-selected ids. */
  selectedIds?: ReadonlySet<string>;
  onSelect?: (id: string) => void;
  /** Browse mode — open the detail drawer. */
  onOpen?: (id: string) => void;
  /** Browse-mode bulk select (orphan cleanup) — render a per-card checkbox. */
  selectable?: boolean;
}

/**
 * Responsive card grid (or list) with a grid/list toggle and an explicit
 * Prev/Next cursor pager — no infinite scroll (screen-17 large-libraries edge
 * case). Renders {@link MediaCard} per row.
 */
export function MediaGrid({
  items,
  mode,
  view,
  onViewChange,
  pager,
  selectedIds,
  onSelect,
  onOpen,
  selectable = false,
}: MediaGridProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <div
          className="inline-flex rounded-md border border-border"
          role="group"
          aria-label="View"
        >
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => onViewChange("grid")}
            className={cn(
              "grid h-8 w-8 place-content-center rounded-l-md transition-colors",
              view === "grid"
                ? "bg-surface-2 text-foreground"
                : "text-foreground-muted hover:bg-surface",
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => onViewChange("list")}
            className={cn(
              "grid h-8 w-8 place-content-center rounded-r-md transition-colors",
              view === "list"
                ? "bg-surface-2 text-foreground"
                : "text-foreground-muted hover:bg-surface",
            )}
          >
            <List className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <ul
        className={cn(
          "list-none",
          view === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-2",
        )}
      >
        {items.map((item) => (
          <li key={item.id}>
            <MediaCard
              item={item}
              mode={mode}
              view={view}
              selected={selectedIds?.has(item.id) ?? false}
              onSelect={onSelect}
              onOpen={onOpen}
              selectable={selectable}
            />
          </li>
        ))}
      </ul>

      <nav
        className="flex items-center justify-center gap-2 pt-2"
        aria-label="Pagination"
      >
        <Button
          variant="secondary"
          size="sm"
          disabled={!pager.hasPrev}
          onClick={pager.onPrev}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!pager.hasNext}
          onClick={pager.onNext}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </nav>
    </div>
  );
}
