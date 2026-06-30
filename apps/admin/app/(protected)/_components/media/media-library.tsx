"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type {
  MediaFacetCounts,
  MediaLibraryFilters,
} from "@repo/services/schemas/media";
import {
  MediaPicker,
  MediaDetailDrawer,
  type MediaFacetSelection,
  type MediaView,
} from "@repo/ui/components/media-picker";
import {
  mediaKeys,
  useMediaLibrary,
  useMediaFacetCounts,
  useDeleteMediaBulk,
} from "@repo/ui/hooks/use-media";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import { AttachMediaDialog } from "./attach-media-dialog";

const EMPTY_FACETS: MediaFacetSelection = {
  mediaTypes: [],
  sources: [],
  attachedTo: [],
};

const EMPTY_COUNTS: MediaFacetCounts = {
  type: { image: 0, video: 0, audio: 0, document: 0 },
  source: { upload: 0, external: 0 },
  attachedTo: { events: 0, characters: 0, timelines: 0, orphaned: 0 },
};

/** Debounce a fast-changing value (the search box) before it drives a query. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export interface MediaLibraryProps {
  /** Pre-selected facets from the URL (e.g. dashboard "orphaned" deep-link). */
  initialFacets?: MediaFacetSelection;
}

/**
 * The cross-entity Media Library route (screen 17): mounts `MediaPicker` in
 * browse mode + the `MediaDetailDrawer`, wires keyset pagination, the
 * upload-to-orphan entry points, and orphan bulk cleanup. The picker and drawer
 * are pure primitives — all interaction state and data wiring live here.
 */
export function MediaLibrary({ initialFacets }: MediaLibraryProps) {
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [facets, setFacets] = React.useState<MediaFacetSelection>(
    initialFacets ?? EMPTY_FACETS,
  );
  const [view, setView] = React.useState<MediaView>("grid");

  // Keyset pager: the cursor for the current page sits on top of the stack
  // (undefined = first page). Next pushes the page's nextCursor; Prev pops.
  const [cursorStack, setCursorStack] = React.useState<(string | undefined)[]>([
    undefined,
  ]);

  const [selected, setSelected] = React.useState<MediaLibraryRow | null>(null);
  const [bulkIds, setBulkIds] = React.useState<Set<string>>(() => new Set());
  const [uploadKind, setUploadKind] = React.useState<
    null | "upload" | "external"
  >(null);

  // Bulk select (Delete selected) is offered only when filtered to exactly
  // Orphaned — those rows are `⛓ 0`, so deletion is friction-free (edge case).
  const orphanOnly =
    facets.attachedTo.length === 1 && facets.attachedTo[0] === "orphaned";

  const baseFilters: MediaLibraryFilters = {
    search: debouncedSearch || undefined,
    mediaTypes: facets.mediaTypes as MediaLibraryFilters["mediaTypes"],
    sources: facets.sources as MediaLibraryFilters["sources"],
    attachedTo: facets.attachedTo as MediaLibraryFilters["attachedTo"],
  };

  const page = useMediaLibrary(client, {
    ...baseFilters,
    cursor: cursorStack[cursorStack.length - 1],
  });
  const counts = useMediaFacetCounts(client, baseFilters);
  const bulkDelete = useDeleteMediaBulk(client);

  const rows = page.data?.rows ?? [];

  // Any change to search or facets invalidates the keyset cursor (it anchors a
  // different result set) and the orphan selection. Reset both during render via
  // the "adjust state when inputs change" pattern (mirrors the list pages), so
  // the next query already uses the fresh cursor. Initial render is a no-op
  // because prevFilterKey starts equal to filterKey.
  const filterKey = JSON.stringify([debouncedSearch, facets]);
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCursorStack([undefined]);
    setBulkIds(new Set());
  }

  function handleClearFilters() {
    setSearch("");
    setFacets(EMPTY_FACETS);
  }

  function handleNext() {
    const nextCursor = page.data?.nextCursor;
    if (nextCursor) {
      setCursorStack((stack) => [...stack, nextCursor]);
    }
  }

  function handlePrev() {
    setCursorStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }

  function handleDeleteSelected() {
    bulkDelete.mutate([...bulkIds], {
      onSuccess: () => setBulkIds(new Set()),
    });
  }

  // Library upload-to-orphan: create the media row but write NO junction, so it
  // lands in Orphaned. Refresh every media-derived cache (the library grid +
  // facet counts hang off mediaKeys.all, which the upload hooks don't touch).
  async function handleUploaded() {
    await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MediaPicker
        mode="browse"
        items={rows}
        facetCounts={counts.data ?? EMPTY_COUNTS}
        search={search}
        onSearchChange={setSearch}
        facets={facets}
        onFacetsChange={setFacets}
        onClearFilters={handleClearFilters}
        view={view}
        onViewChange={setView}
        pager={{
          hasPrev: cursorStack.length > 1,
          hasNext: page.data?.hasMore ?? false,
          onPrev: handlePrev,
          onNext: handleNext,
        }}
        isPending={page.isPending}
        isError={page.isError}
        onRetry={() => void page.refetch()}
        onOpen={(id) => setSelected(rows.find((r) => r.id === id) ?? null)}
        onUpload={() => setUploadKind("upload")}
        onAddExternal={() => setUploadKind("external")}
        bulkSelectable={orphanOnly}
        bulkSelectedIds={bulkIds}
        onBulkSelectedChange={setBulkIds}
        onDeleteSelected={handleDeleteSelected}
      />

      <MediaDetailDrawer
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        client={client}
        media={selected}
        onDeleted={() => setSelected(null)}
      />

      <AttachMediaDialog
        open={uploadKind !== null}
        onOpenChange={(open) => {
          if (!open) setUploadKind(null);
        }}
        client={client}
        variant="library"
        defaultTab={uploadKind ?? "upload"}
        onAttached={handleUploaded}
      />
    </div>
  );
}
