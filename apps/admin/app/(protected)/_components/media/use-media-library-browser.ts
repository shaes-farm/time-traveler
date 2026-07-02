"use client";

import * as React from "react";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type {
  MediaFacetCounts,
  MediaLibraryFilters,
} from "@repo/services/schemas/media";
import type {
  MediaFacetSelection,
  MediaView,
  MediaPager,
} from "@repo/ui/components/media-picker";
import { useMediaLibrary, useMediaFacetCounts } from "@repo/ui/hooks/use-media";

type ServiceClient = Parameters<typeof useMediaLibrary>[0];

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

export { EMPTY_FACETS, EMPTY_COUNTS };

/** Debounce a fast-changing value (the search box) before it drives a query. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export interface UseMediaLibraryBrowserOptions {
  /** Pre-selected facets (e.g. dashboard "orphaned" deep-link). */
  initialFacets?: MediaFacetSelection;
  /** Called during render whenever search/facets change (the result set is
   * re-anchored). Lets a consumer clear selection tied to the old page. */
  onFiltersReset?: () => void;
}

export interface MediaLibraryBrowser {
  search: string;
  setSearch: (search: string) => void;
  facets: MediaFacetSelection;
  setFacets: React.Dispatch<React.SetStateAction<MediaFacetSelection>>;
  clearFilters: () => void;
  view: MediaView;
  setView: React.Dispatch<React.SetStateAction<MediaView>>;
  items: MediaLibraryRow[];
  facetCounts: MediaFacetCounts;
  pager: MediaPager;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  /** Filters flattened for the query layer (sans cursor). */
  baseFilters: MediaLibraryFilters;
}

/**
 * Shared browse wiring for the cross-entity media library: debounced search,
 * faceted filter state, keyset cursor pagination, and the library + facet-count
 * queries. Consumed by both the `/media` route (browse mode) and the Attach
 * dialog's Existing tab (pick mode) so their grid, facets, and paging behave
 * identically. The bulk-select / drawer / upload chrome stays with each
 * consumer — only the query wiring is shared here.
 */
export function useMediaLibraryBrowser(
  client: ServiceClient,
  { initialFacets, onFiltersReset }: UseMediaLibraryBrowserOptions = {},
): MediaLibraryBrowser {
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

  // Any change to search or facets invalidates the keyset cursor (it anchors a
  // different result set). Reset it during render via the "adjust state when
  // inputs change" pattern, so the next query already uses the fresh cursor.
  // Initial render is a no-op because prevFilterKey starts equal to filterKey.
  const filterKey = JSON.stringify([debouncedSearch, facets]);
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCursorStack([undefined]);
    onFiltersReset?.();
  }

  function clearFilters() {
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

  return {
    search,
    setSearch,
    facets,
    setFacets,
    clearFilters,
    view,
    setView,
    items: page.data?.rows ?? [],
    facetCounts: counts.data ?? EMPTY_COUNTS,
    pager: {
      hasPrev: cursorStack.length > 1,
      hasNext: page.data?.hasMore ?? false,
      onPrev: handlePrev,
      onNext: handleNext,
    },
    isPending: page.isPending,
    isError: page.isError,
    refetch: () => void page.refetch(),
    baseFilters,
  };
}
