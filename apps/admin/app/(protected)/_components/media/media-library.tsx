"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { MediaLibraryRow } from "@repo/services/media-service";
import {
  MediaPicker,
  MediaDetailDrawer,
  type MediaFacetSelection,
} from "@repo/ui/components/media-picker";
import { mediaKeys, useDeleteMediaBulk } from "@repo/ui/hooks/use-media";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import { AttachMediaDialog } from "./attach-media-dialog";
import { useMediaLibraryBrowser } from "./use-media-library-browser";

export interface MediaLibraryProps {
  /** Pre-selected facets from the URL (e.g. dashboard "orphaned" deep-link). */
  initialFacets?: MediaFacetSelection;
}

/**
 * The cross-entity Media Library route (screen 17): mounts `MediaPicker` in
 * browse mode + the `MediaDetailDrawer`, wires keyset pagination, the
 * upload-to-orphan entry points, and orphan bulk cleanup. The picker and drawer
 * are pure primitives — all interaction state and data wiring live here (the
 * shared query wiring lives in `useMediaLibraryBrowser`).
 */
export function MediaLibrary({ initialFacets }: MediaLibraryProps) {
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const queryClient = useQueryClient();

  const [selected, setSelected] = React.useState<MediaLibraryRow | null>(null);
  const [bulkIds, setBulkIds] = React.useState<Set<string>>(() => new Set());
  const [uploadKind, setUploadKind] = React.useState<
    null | "upload" | "external"
  >(null);

  const browser = useMediaLibraryBrowser(client, {
    initialFacets,
    // A filter/search change re-anchors the page, so drop the orphan selection.
    onFiltersReset: () => setBulkIds(new Set()),
  });

  const rows = browser.items;

  // Bulk select (Delete selected) is offered only when filtered to exactly
  // Orphaned — those rows are `⛓ 0`, so deletion is friction-free (edge case).
  const orphanOnly =
    browser.facets.attachedTo.length === 1 &&
    browser.facets.attachedTo[0] === "orphaned";

  const bulkDelete = useDeleteMediaBulk(client);

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
        facetCounts={browser.facetCounts}
        search={browser.search}
        onSearchChange={browser.setSearch}
        facets={browser.facets}
        onFacetsChange={browser.setFacets}
        onClearFilters={browser.clearFilters}
        view={browser.view}
        onViewChange={browser.setView}
        pager={browser.pager}
        isPending={browser.isPending}
        isError={browser.isError}
        onRetry={browser.refetch}
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
