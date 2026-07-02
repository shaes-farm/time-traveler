"use client";

import * as React from "react";
import { MediaPicker } from "@repo/ui/components/media-picker";
import { useMediaLibraryBrowser } from "./use-media-library-browser";

type ServiceClient = Parameters<typeof useMediaLibraryBrowser>[0];

export interface ExistingMediaPickerProps {
  client: ServiceClient;
  /** Selected `media_id`s to attach. The host writes the junctions. */
  onConfirm: (mediaIds: string[]) => void | Promise<void>;
  onCancel: () => void;
  /** True while the host is writing junctions — disables the confirm action. */
  busy?: boolean;
}

/**
 * Connected `MediaPicker mode="pick"` — the "choose from existing" surface for
 * the Attach dialog's Existing tab (and future editor media sections). Owns the
 * shared library query wiring (search / facets / keyset paging) via
 * {@link useMediaLibraryBrowser}; the picker itself owns the multi-select set
 * and hands the chosen ids back through `onConfirm`. It writes no junction —
 * that is the host's job (screen-17 annotation #9).
 */
export function ExistingMediaPicker({
  client,
  onConfirm,
  onCancel,
  busy = false,
}: ExistingMediaPickerProps) {
  const browser = useMediaLibraryBrowser(client);

  return (
    <div className="flex max-h-[60vh] min-h-[24rem] flex-col overflow-hidden rounded-md border border-border">
      <MediaPicker
        mode="pick"
        items={browser.items}
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
        onConfirm={busy ? undefined : onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
}
