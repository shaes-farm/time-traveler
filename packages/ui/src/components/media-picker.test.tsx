import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type { MediaFacetCounts } from "@repo/services/schemas/media";

import { MediaPicker, type MediaFacetSelection } from "./media-picker";
import type { MediaPickerMode, MediaView } from "./media-card";

const COUNTS: MediaFacetCounts = {
  type: { image: 2, video: 0, audio: 0, document: 0 },
  source: { upload: 2, external: 0 },
  attachedTo: { events: 0, characters: 0, timelines: 0, orphaned: 0 },
};

const NO_FACETS: MediaFacetSelection = {
  mediaTypes: [],
  sources: [],
  attachedTo: [],
};

function makeRow(id: string): MediaLibraryRow {
  return {
    id,
    slug: id,
    alt_text: id,
    caption: null,
    url: `https://example.com/${id}.jpg`,
    storage_path: `media/${id}.jpg`,
    source: "upload",
    media_type: "image",
    mime_type: "image/jpeg",
    width: 100,
    height: 100,
    file_size_bytes: 100,
    metadata: null,
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    attachmentCounts: { event: 0, character: 0, timeline: 0, total: 1 },
  };
}

function Harness(props: {
  mode: MediaPickerMode;
  items?: MediaLibraryRow[];
  facets?: MediaFacetSelection;
  search?: string;
  isPending?: boolean;
  isError?: boolean;
  onConfirm?: (ids: string[]) => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
  onUpload?: () => void;
  onOpen?: (id: string) => void;
  bulkSelectable?: boolean;
  onDeleteSelected?: () => void;
}) {
  const [view, setView] = React.useState<MediaView>("grid");
  const [bulkSelectedIds, setBulkSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  return (
    <MediaPicker
      mode={props.mode}
      items={props.items ?? [makeRow("a"), makeRow("b")]}
      facetCounts={COUNTS}
      search={props.search ?? ""}
      onSearchChange={() => {}}
      facets={props.facets ?? NO_FACETS}
      onFacetsChange={() => {}}
      onClearFilters={props.onClearFilters ?? (() => {})}
      view={view}
      onViewChange={setView}
      pager={{
        hasPrev: false,
        hasNext: false,
        onPrev: () => {},
        onNext: () => {},
      }}
      isPending={props.isPending}
      isError={props.isError}
      onRetry={props.onRetry}
      onConfirm={props.onConfirm}
      onUpload={props.onUpload}
      onOpen={props.onOpen}
      bulkSelectable={props.bulkSelectable}
      bulkSelectedIds={bulkSelectedIds}
      onBulkSelectedChange={setBulkSelectedIds}
      onDeleteSelected={props.onDeleteSelected}
    />
  );
}

describe("MediaPicker", () => {
  it("renders cards as openable buttons (not checkboxes) in browse mode", () => {
    render(<Harness mode="browse" />);
    expect(screen.getByRole("button", { name: "a" })).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "a" }),
    ).not.toBeInTheDocument();
  });

  it("shows upload entry points in browse mode but not pick mode", () => {
    const { rerender } = render(<Harness mode="browse" />);
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();

    rerender(<Harness mode="pick" />);
    expect(
      screen.queryByRole("button", { name: /upload/i }),
    ).not.toBeInTheDocument();
  });

  it("disables the upload entry points when no handler is provided", () => {
    render(<Harness mode="browse" />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "External URL" })).toBeDisabled();
  });

  it("keeps Attach disabled without an onConfirm handler even when selected", async () => {
    const user = userEvent.setup();
    render(<Harness mode="pick" />);
    await user.click(screen.getByRole("checkbox", { name: "a" }));
    expect(
      screen.getByRole("button", { name: /attach 1 item/i }),
    ).toBeDisabled();
  });

  it("renders cards as checkboxes and an Attach action in pick mode", () => {
    render(<Harness mode="pick" />);
    expect(screen.getByRole("checkbox", { name: "a" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /attach 0 items/i }),
    ).toBeInTheDocument();
  });

  it("returns the selected media ids and reflects the count in the action label", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness mode="pick" onConfirm={onConfirm} />);

    const attach = screen.getByRole("button", { name: /attach 0 items/i });
    expect(attach).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "a" }));
    await user.click(screen.getByRole("checkbox", { name: "b" }));

    const attach2 = screen.getByRole("button", { name: /attach 2 items/i });
    expect(attach2).toBeEnabled();
    await user.click(attach2);
    expect(onConfirm).toHaveBeenCalledWith(["a", "b"]);
  });

  it("uses a singular label for a single selection", async () => {
    const user = userEvent.setup();
    render(<Harness mode="pick" />);
    await user.click(screen.getByRole("checkbox", { name: "a" }));
    expect(
      screen.getByRole("button", { name: /attach 1 item$/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty-library state with upload CTAs and no filters", () => {
    render(<Harness mode="browse" items={[]} />);
    expect(screen.getByText(/no media yet/i)).toBeInTheDocument();
  });

  it("shows the empty-after-filter state with a clear action", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(
      <Harness
        mode="browse"
        items={[]}
        facets={{ ...NO_FACETS, mediaTypes: ["video"] }}
        onClearFilters={onClearFilters}
      />,
    );
    expect(
      screen.getByText(/no media match these filters/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("renders a loading skeleton while pending", () => {
    render(<Harness mode="browse" items={[]} isPending />);
    expect(screen.getByTestId("media-grid-skeleton")).toBeInTheDocument();
  });

  it("renders an error state with retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Harness mode="browse" items={[]} isError onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load/i);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  describe("browse-mode bulk select (orphan cleanup)", () => {
    it("renders per-card checkboxes while still opening the drawer from the body", async () => {
      const user = userEvent.setup();
      const onOpen = vi.fn();
      render(<Harness mode="browse" bulkSelectable onOpen={onOpen} />);
      // Each card now has a "Select …" checkbox alongside the open button
      // (scoped by name to exclude the filter-rail facet checkboxes).
      expect(
        screen.getAllByRole("checkbox", { name: /^select/i }),
      ).toHaveLength(2);
      await user.click(screen.getAllByRole("button", { name: "a" })[0]!);
      expect(onOpen).toHaveBeenCalledWith("a");
    });

    it("reveals 'Delete selected' once a card is selected and fires the handler", async () => {
      const user = userEvent.setup();
      const onDeleteSelected = vi.fn();
      render(
        <Harness
          mode="browse"
          bulkSelectable
          onDeleteSelected={onDeleteSelected}
        />,
      );
      // No action bar until something is selected.
      expect(
        screen.queryByRole("button", { name: /delete selected/i }),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getAllByRole("checkbox", { name: /select/i })[0]!,
      );
      expect(screen.getByText("1 selected")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: /delete selected/i }),
      );
      expect(onDeleteSelected).toHaveBeenCalled();
    });

    it("does not render card checkboxes in browse mode without bulkSelectable", () => {
      render(<Harness mode="browse" />);
      expect(
        screen.queryByRole("checkbox", { name: /^select/i }),
      ).not.toBeInTheDocument();
    });
  });
});
