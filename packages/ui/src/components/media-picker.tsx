"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type { MediaFacetCounts } from "@repo/services/schemas/media";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  MediaFilterRail,
  type MediaFacetSelection,
} from "@repo/ui/components/media-filter-rail";
import { MediaGrid, type MediaPager } from "@repo/ui/components/media-grid";
import type {
  MediaPickerMode,
  MediaView,
} from "@repo/ui/components/media-card";

// Re-export the parts so consumers can import everything from one entry point.
export { MediaCard } from "@repo/ui/components/media-card";
export type {
  MediaCardProps,
  MediaPickerMode,
  MediaView,
} from "@repo/ui/components/media-card";
export { MediaGrid } from "@repo/ui/components/media-grid";
export type {
  MediaGridProps,
  MediaPager,
} from "@repo/ui/components/media-grid";
export { MediaFilterRail } from "@repo/ui/components/media-filter-rail";
export type {
  MediaFilterRailProps,
  MediaFacetSelection,
} from "@repo/ui/components/media-filter-rail";

export interface MediaPickerProps {
  /** `browse` = full library (open drawer + upload entry points, no delete here);
   * `pick` = multi-select returning ids (no delete, no drawer). */
  mode: MediaPickerMode;
  items: MediaLibraryRow[];
  facetCounts: MediaFacetCounts;

  // Search + facet state (controlled by the connected wrapper / consumer).
  search: string;
  onSearchChange: (search: string) => void;
  facets: MediaFacetSelection;
  onFacetsChange: (next: MediaFacetSelection) => void;
  onClearFilters: () => void;

  // Grid presentation + keyset pager.
  view: MediaView;
  onViewChange: (view: MediaView) => void;
  pager: MediaPager;

  // Query status.
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;

  // Browse-mode affordances (dialogs live in consuming issues).
  onOpen?: (id: string) => void;
  onUpload?: () => void;
  onAddExternal?: () => void;

  // Pick-mode contract — returns selected `media_id`s; the caller writes the
  // junction (association-agnostic, screen-17 annotation #9).
  onConfirm?: (mediaIds: string[]) => void;
  onCancel?: () => void;
}

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

function hasActiveFilters(
  search: string,
  facets: MediaFacetSelection,
): boolean {
  return (
    search.trim().length > 0 ||
    facets.mediaTypes.length > 0 ||
    facets.sources.length > 0 ||
    facets.attachedTo.length > 0
  );
}

/**
 * The shared library/picker primitive — one component, two modes. Everything
 * below the mode switch (filter rail + search + grid + card rendering) is
 * identical; only the chrome differs: browse adds upload entry points and opens
 * the detail drawer, pick adds multi-select checkboxes and an "Attach N items"
 * action and never deletes. Screen-17 annotation #1.
 */
export function MediaPicker({
  mode,
  items,
  facetCounts,
  search,
  onSearchChange,
  facets,
  onFacetsChange,
  onClearFilters,
  view,
  onViewChange,
  pager,
  isPending = false,
  isError = false,
  onRetry,
  onOpen,
  onUpload,
  onAddExternal,
  onConfirm,
  onCancel,
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const filtersActive = hasActiveFilters(search, facets);
  const selectedCount = selectedIds.size;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {mode === "browse" && (
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="font-display text-xl text-foreground">
            Media library
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onUpload}>
              <Plus className="h-4 w-4" aria-hidden />
              Upload
            </Button>
            <Button variant="secondary" size="sm" onClick={onAddExternal}>
              <Plus className="h-4 w-4" aria-hidden />
              External URL
            </Button>
          </div>
        </header>
      )}

      <div className="flex min-h-0 flex-1">
        <MediaFilterRail
          counts={facetCounts}
          selected={facets}
          onChange={onFacetsChange}
          onClearAll={onClearFilters}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-auto p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search alt text, caption, filename…"
              aria-label="Search media"
              className="pl-9"
            />
          </div>

          {isError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 py-16"
            >
              <p className="text-sm text-destructive">Failed to load media.</p>
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          ) : isPending ? (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              data-testid="media-grid-skeleton"
            >
              {SKELETON_KEYS.map((key) => (
                <Skeleton
                  key={key}
                  className="aspect-[4/3] w-full rounded-lg"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              mode={mode}
              filtersActive={filtersActive}
              onClearFilters={onClearFilters}
              onUpload={onUpload}
              onAddExternal={onAddExternal}
            />
          ) : (
            <MediaGrid
              items={items}
              mode={mode}
              view={view}
              onViewChange={onViewChange}
              pager={pager}
              selectedIds={selectedIds}
              onSelect={toggleSelected}
              onOpen={onOpen}
            />
          )}
        </main>
      </div>

      {mode === "pick" && (
        <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span className="text-sm text-foreground-muted" aria-live="polite">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={selectedCount === 0}
              onClick={() => onConfirm?.([...selectedIds])}
            >
              {`Attach ${selectedCount} ${
                selectedCount === 1 ? "item" : "items"
              }`}
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

function EmptyState({
  mode,
  filtersActive,
  onClearFilters,
  onUpload,
  onAddExternal,
}: {
  mode: MediaPickerMode;
  filtersActive: boolean;
  onClearFilters: () => void;
  onUpload?: () => void;
  onAddExternal?: () => void;
}) {
  if (filtersActive) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <p className="text-sm text-foreground-muted">
          No media match these filters.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm text-foreground underline underline-offset-2 hover:text-foreground-muted"
        >
          Clear filters
        </button>
      </div>
    );
  }

  if (mode === "pick") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <p className="text-sm text-foreground-muted">
          Nothing to choose from yet — upload from an entity first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <p className="max-w-sm text-center text-sm text-foreground-muted">
        No media yet. Upload a file or register an external URL to start your
        library.
      </p>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onUpload}>
          <Plus className="h-4 w-4" aria-hidden />
          Upload
        </Button>
        <Button variant="secondary" size="sm" onClick={onAddExternal}>
          <Plus className="h-4 w-4" aria-hidden />
          External URL
        </Button>
      </div>
    </div>
  );
}
