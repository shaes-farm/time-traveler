import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MediaLibraryRow } from "@repo/services/media-service";

import { MediaGrid, type MediaPager } from "./media-grid";
import type { MediaView } from "./media-card";

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

const ROWS = [makeRow("a"), makeRow("b"), makeRow("c")];

function noopPager(overrides: Partial<MediaPager> = {}): MediaPager {
  return {
    hasPrev: false,
    hasNext: true,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    ...overrides,
  };
}

function Harness({ pager }: { pager?: MediaPager }) {
  const [view, setView] = React.useState<MediaView>("grid");
  return (
    <MediaGrid
      items={ROWS}
      mode="browse"
      view={view}
      onViewChange={setView}
      pager={pager ?? noopPager()}
      onOpen={vi.fn()}
    />
  );
}

describe("MediaGrid", () => {
  it("renders a card per item", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "c" })).toBeInTheDocument();
  });

  it("toggles between grid and list view", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const gridBtn = screen.getByRole("button", { name: "Grid view" });
    const listBtn = screen.getByRole("button", { name: "List view" });
    expect(gridBtn).toHaveAttribute("aria-pressed", "true");
    expect(listBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(listBtn);
    expect(listBtn).toHaveAttribute("aria-pressed", "true");
    expect(gridBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("disables Previous on the first page", () => {
    render(<Harness pager={noopPager({ hasPrev: false })} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("disables Next when there is no next page", () => {
    render(<Harness pager={noopPager({ hasNext: false })} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("invokes pager callbacks", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <Harness
        pager={noopPager({ hasPrev: true, hasNext: true, onNext, onPrev })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(onNext).toHaveBeenCalled();
    expect(onPrev).toHaveBeenCalled();
  });
});
