import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type { MediaFacetCounts } from "@repo/services/schemas/media";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { MediaPicker, type MediaFacetSelection } from "./media-picker";
import type { MediaView } from "./media-card";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function row(
  id: string,
  overrides: Partial<MediaLibraryRow> & {
    media_type: string;
    source: string;
    attachmentCounts: MediaLibraryRow["attachmentCounts"];
  },
): MediaLibraryRow {
  return {
    id,
    slug: id,
    alt_text: null,
    caption: null,
    url: "https://picsum.photos/seed/" + id + "/400/300",
    storage_path: null,
    mime_type: null,
    width: null,
    height: null,
    file_size_bytes: null,
    metadata: null,
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const counts = (
  e: number,
  c: number,
  t: number,
  total: number,
): MediaLibraryRow["attachmentCounts"] => ({
  event: e,
  character: c,
  timeline: t,
  total,
});

const FIXTURE_ROWS: MediaLibraryRow[] = [
  row("curie-lab-1898", {
    alt_text: "Marie Curie in her laboratory, 1898",
    media_type: "image",
    source: "upload",
    storage_path: "media/curie.jpg",
    attachmentCounts: counts(1, 1, 1, 3),
  }),
  row("newsreel-1911", {
    alt_text: "Newsreel footage, 1911",
    media_type: "video",
    source: "external",
    url: "https://example.com/newsreel.mp4",
    attachmentCounts: counts(1, 0, 0, 1),
  }),
  row("polonium-paper", {
    alt_text: "Polonium discovery paper",
    media_type: "document",
    source: "upload",
    storage_path: "media/polonium.pdf",
    attachmentCounts: counts(0, 0, 0, 0),
  }),
  row("lab-recording", {
    alt_text: "Lab dictation recording",
    media_type: "audio",
    source: "upload",
    storage_path: "media/lab.mp3",
    attachmentCounts: counts(0, 1, 0, 1),
  }),
  row("radium-1903", {
    alt_text: "Radium glow, 1903",
    media_type: "image",
    source: "external",
    url: "https://example.com/radium.jpg",
    attachmentCounts: counts(2, 0, 1, 3),
  }),
  row("orphan-sketch", {
    alt_text: "Unattached sketch",
    media_type: "image",
    source: "upload",
    storage_path: "media/sketch.jpg",
    attachmentCounts: counts(0, 0, 0, 0),
  }),
];

const FIXTURE_COUNTS: MediaFacetCounts = {
  type: { image: 3, video: 1, audio: 1, document: 1 },
  source: { upload: 4, external: 2 },
  attachedTo: { events: 3, characters: 2, timelines: 2, orphaned: 2 },
};

const EMPTY_FACETS: MediaFacetSelection = {
  mediaTypes: [],
  sources: [],
  attachedTo: [],
};

// ─── Harness — wires the presentational picker with light client-side facets ──

function filterRows(
  rows: MediaLibraryRow[],
  search: string,
  facets: MediaFacetSelection,
): MediaLibraryRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const hay =
        `${r.alt_text ?? ""} ${r.caption ?? ""} ${r.slug}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (
      facets.mediaTypes.length > 0 &&
      !facets.mediaTypes.includes(r.media_type ?? "")
    ) {
      return false;
    }
    if (facets.sources.length > 0 && !facets.sources.includes(r.source)) {
      return false;
    }
    if (facets.attachedTo.length > 0) {
      const matches = facets.attachedTo.some((f) => {
        if (f === "orphaned") return r.attachmentCounts.total === 0;
        if (f === "events") return r.attachmentCounts.event > 0;
        if (f === "characters") return r.attachmentCounts.character > 0;
        if (f === "timelines") return r.attachmentCounts.timeline > 0;
        return false;
      });
      if (!matches) return false;
    }
    return true;
  });
}

/** Small page size so the fixture set spans multiple keyset pages. */
const STORY_PAGE_SIZE = 3;

function Harness({
  mode,
  rows = FIXTURE_ROWS,
  initialFacets = EMPTY_FACETS,
  bulkSelectable = false,
}: {
  mode: "browse" | "pick";
  rows?: MediaLibraryRow[];
  initialFacets?: MediaFacetSelection;
  bulkSelectable?: boolean;
}) {
  const [search, setSearch] = React.useState("");
  const [facets, setFacets] =
    React.useState<MediaFacetSelection>(initialFacets);
  const [view, setView] = React.useState<MediaView>("grid");
  const [page, setPage] = React.useState(0);
  const [confirmed, setConfirmed] = React.useState<string[] | null>(null);
  const [bulkIds, setBulkIds] = React.useState<Set<string>>(() => new Set());

  const all = filterRows(rows, search, facets);
  const start = page * STORY_PAGE_SIZE;
  const items = all.slice(start, start + STORY_PAGE_SIZE);

  // Reset to the first page whenever the filter set changes (mirrors how a real
  // consumer drops the cursor when filters/search change).
  function changeSearch(next: string) {
    setSearch(next);
    setPage(0);
  }
  function changeFacets(next: MediaFacetSelection) {
    setFacets(next);
    setPage(0);
  }

  return (
    <div className="flex h-[640px] flex-col">
      <MediaPicker
        mode={mode}
        items={items}
        facetCounts={FIXTURE_COUNTS}
        search={search}
        onSearchChange={changeSearch}
        facets={facets}
        onFacetsChange={changeFacets}
        onClearFilters={() => {
          setSearch("");
          setFacets(EMPTY_FACETS);
          setPage(0);
        }}
        view={view}
        onViewChange={setView}
        pager={{
          hasPrev: page > 0,
          hasNext: start + STORY_PAGE_SIZE < all.length,
          onPrev: () => setPage((p) => Math.max(0, p - 1)),
          onNext: () => setPage((p) => p + 1),
        }}
        onOpen={(id) => window.alert(`Open detail drawer for ${id}`)}
        onUpload={() => window.alert("Open the upload dialog")}
        onAddExternal={() => window.alert("Open the external-URL dialog")}
        onConfirm={setConfirmed}
        onCancel={() => setConfirmed(null)}
        bulkSelectable={bulkSelectable}
        bulkSelectedIds={bulkIds}
        onBulkSelectedChange={setBulkIds}
        onDeleteSelected={() => {
          window.alert(`Delete ${bulkIds.size} orphan(s)`);
          setBulkIds(new Set());
        }}
      />
      {confirmed && (
        <p className="px-4 py-2 font-mono text-xs text-foreground-muted">
          Confirmed: {confirmed.join(", ") || "(none)"}
        </p>
      )}
    </div>
  );
}

const meta: Meta = {
  title: "Pages/Media Library",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Browse: Story = {
  render: () => <Harness mode="browse" />,
};

/** Filtered to Orphaned, the browser offers multi-select "Delete selected" —
 * the one bulk action this pass (screen-17 orphan-cleanup edge case). */
export const OrphanCleanup: Story = {
  render: () => (
    <Harness
      mode="browse"
      bulkSelectable
      initialFacets={{ mediaTypes: [], sources: [], attachedTo: ["orphaned"] }}
    />
  ),
};

export const PickDialog: Story = {
  render: () => (
    <div className="p-8">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Choose existing media…</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose existing media</DialogTitle>
          </DialogHeader>
          <div className="h-[560px]">
            <Harness mode="pick" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

export const EmptyLibrary: Story = {
  render: () => <Harness mode="browse" rows={[]} />,
};

/** A non-interactive picker for static states (loading / error / empty-filter). */
function StaticPicker({
  search = "",
  facets = EMPTY_FACETS,
  isPending = false,
  isError = false,
}: {
  search?: string;
  facets?: MediaFacetSelection;
  isPending?: boolean;
  isError?: boolean;
}) {
  const [view, setView] = React.useState<MediaView>("grid");
  return (
    <div className="h-[640px]">
      <MediaPicker
        mode="browse"
        items={[]}
        facetCounts={FIXTURE_COUNTS}
        search={search}
        onSearchChange={() => {}}
        facets={facets}
        onFacetsChange={() => {}}
        onClearFilters={() => {}}
        view={view}
        onViewChange={setView}
        pager={{
          hasPrev: false,
          hasNext: false,
          onPrev: () => {},
          onNext: () => {},
        }}
        isPending={isPending}
        isError={isError}
        onRetry={() => window.alert("Retry fetching the media library")}
      />
    </div>
  );
}

export const EmptyAfterFilter: Story = {
  render: () => (
    <StaticPicker
      search="nonexistent"
      facets={{ ...EMPTY_FACETS, mediaTypes: ["video"] }}
    />
  ),
};

export const Loading: Story = {
  render: () => <StaticPicker isPending />,
};

export const Error: Story = {
  render: () => <StaticPicker isError />,
};
