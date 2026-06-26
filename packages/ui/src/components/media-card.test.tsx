import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MediaLibraryRow } from "@repo/services/media-service";

import { MediaCard } from "./media-card";

function makeRow(overrides: Partial<MediaLibraryRow> = {}): MediaLibraryRow {
  return {
    id: "m1",
    slug: "marie-curie",
    alt_text: "Marie Curie",
    caption: null,
    url: "https://example.com/curie.jpg",
    storage_path: "media/curie.jpg",
    source: "upload",
    media_type: "image",
    mime_type: "image/jpeg",
    width: 1200,
    height: 800,
    file_size_bytes: 312_000,
    metadata: null,
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    attachmentCounts: { event: 1, character: 1, timeline: 1, total: 3 },
    ...overrides,
  };
}

describe("MediaCard", () => {
  it("shows the type badge and attachment count", () => {
    render(<MediaCard item={makeRow()} mode="browse" />);
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByTitle(/attached to 3 entities/i)).toBeInTheDocument();
  });

  it("renders the orphan marker only when nothing is attached", () => {
    const { rerender } = render(<MediaCard item={makeRow()} mode="browse" />);
    expect(screen.queryByTestId("orphan-marker")).not.toBeInTheDocument();

    rerender(
      <MediaCard
        item={makeRow({
          attachmentCounts: { event: 0, character: 0, timeline: 0, total: 0 },
        })}
        mode="browse"
      />,
    );
    expect(screen.getByTestId("orphan-marker")).toBeInTheDocument();
    expect(screen.getByTitle(/attached to 0 entities/i)).toBeInTheDocument();
  });

  it("degrades the preview by type", () => {
    const { rerender } = render(
      <MediaCard item={makeRow({ media_type: "image" })} mode="browse" />,
    );
    expect(
      screen.getByRole("img", { name: "Marie Curie" }),
    ).toBeInTheDocument();

    rerender(
      <MediaCard item={makeRow({ media_type: "video" })} mode="browse" />,
    );
    expect(screen.getByTestId("preview-video")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(
      <MediaCard item={makeRow({ media_type: "audio" })} mode="browse" />,
    );
    expect(screen.getByTestId("preview-audio")).toBeInTheDocument();

    rerender(
      <MediaCard item={makeRow({ media_type: "document" })} mode="browse" />,
    );
    expect(screen.getByTestId("preview-document")).toBeInTheDocument();
  });

  it("falls back to a document preview for an unknown type", () => {
    render(<MediaCard item={makeRow({ media_type: null })} mode="browse" />);
    expect(screen.getByTestId("preview-document")).toBeInTheDocument();
    // The type badge also reflects the document fallback.
    expect(screen.getByText("Document")).toBeInTheDocument();
  });

  it("opens the detail drawer in browse mode", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<MediaCard item={makeRow()} mode="browse" onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: "Marie Curie" }));
    expect(onOpen).toHaveBeenCalledWith("m1");
  });

  it("exposes a checkbox role and toggles selection in pick mode", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <MediaCard
        item={makeRow()}
        mode="pick"
        selected={false}
        onSelect={onSelect}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Marie Curie" });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(onSelect).toHaveBeenCalledWith("m1");
  });

  it("reflects the selected state via aria-checked", () => {
    render(
      <MediaCard item={makeRow()} mode="pick" selected onSelect={vi.fn()} />,
    );
    expect(screen.getByRole("checkbox", { name: "Marie Curie" })).toBeChecked();
  });
});
