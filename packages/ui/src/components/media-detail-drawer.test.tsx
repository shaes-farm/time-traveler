import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type { MediaAttachment } from "@repo/services/schemas/media";

import { MediaDetailDrawer } from "./media-detail-drawer";

// Mock the leaf service calls; the real hooks (incl. the useDetachMedia switch)
// run against a real QueryClient so we exercise the dispatch + cache wiring.
const removeMediaFromCharacter = vi.fn().mockResolvedValue(undefined);
const removeMediaFromEvent = vi.fn().mockResolvedValue(undefined);
const removeMediaFromTimeline = vi.fn().mockResolvedValue(undefined);
const updateMedia = vi.fn().mockResolvedValue({});
const deleteMedia = vi.fn().mockResolvedValue(undefined);
const getMediaAttachments = vi.fn();

vi.mock("@repo/services/character-service", () => ({
  removeMediaFromCharacter: (...args: unknown[]) =>
    removeMediaFromCharacter(...args),
}));
vi.mock("@repo/services/event-service", () => ({
  removeMediaFromEvent: (...args: unknown[]) => removeMediaFromEvent(...args),
}));
vi.mock("@repo/services/timeline-service", () => ({
  removeMediaFromTimeline: (...args: unknown[]) =>
    removeMediaFromTimeline(...args),
}));
vi.mock("@repo/services/media-service", async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    updateMedia: (...args: unknown[]) => updateMedia(...args),
    deleteMedia: (...args: unknown[]) => deleteMedia(...args),
    getMediaAttachments: (...args: unknown[]) => getMediaAttachments(...args),
  };
});

const CLIENT = {} as never;

function makeRow(overrides: Partial<MediaLibraryRow> = {}): MediaLibraryRow {
  return {
    id: "m1",
    slug: "marie-curie-lab-1898",
    alt_text: "Marie Curie in her laboratory, 1898",
    caption: "Source: Curie Museum archive",
    url: "https://example.com/curie.jpg",
    storage_path: "media/curie.jpg",
    source: "upload",
    media_type: "image",
    mime_type: "image/jpeg",
    width: 1200,
    height: 800,
    file_size_bytes: 319_488,
    metadata: null,
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    attachmentCounts: { event: 1, character: 1, timeline: 1, total: 3 },
    ...overrides,
  };
}

const ALL_KINDS: MediaAttachment[] = [
  { kind: "character", id: "c1", label: "Marie Curie", is_primary: true },
  { kind: "event", id: "e1", label: "Discovery of polonium" },
  { kind: "timeline", id: "t1", label: "Radioactivity research" },
];

function renderDrawer(
  row: MediaLibraryRow | null = makeRow(),
  props: Partial<React.ComponentProps<typeof MediaDetailDrawer>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MediaDetailDrawer
        open
        onOpenChange={vi.fn()}
        client={CLIENT}
        media={row}
        {...props}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  getMediaAttachments.mockResolvedValue(ALL_KINDS);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("MediaDetailDrawer", () => {
  it("saves alt/caption/slug edits to the media row", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const save = screen.getByRole("button", { name: /save changes/i });
    // Pristine → Save is disabled.
    expect(save).toBeDisabled();

    const alt = screen.getByLabelText(/alt text/i);
    await user.type(alt, "!");
    expect(save).toBeEnabled();

    await user.click(save);
    expect(updateMedia).toHaveBeenCalledWith(CLIENT, "m1", {
      alt_text: "Marie Curie in her laboratory, 1898!",
      caption: "Source: Curie Museum archive",
      slug: "marie-curie-lab-1898",
    });
  });

  it("dispatches per-row Detach to the matching junction service", async () => {
    const user = userEvent.setup();
    renderDrawer();

    // Wait for the attachment list to resolve.
    const charRow = (await screen.findByText("Marie Curie")).closest("li")!;
    await user.click(within(charRow).getByRole("button", { name: /detach/i }));
    expect(removeMediaFromCharacter).toHaveBeenCalledWith(CLIENT, "c1", "m1");

    const eventRow = screen.getByText("Discovery of polonium").closest("li")!;
    await user.click(within(eventRow).getByRole("button", { name: /detach/i }));
    expect(removeMediaFromEvent).toHaveBeenCalledWith(CLIENT, "e1", "m1");

    const tlRow = screen.getByText("Radioactivity research").closest("li")!;
    await user.click(within(tlRow).getByRole("button", { name: /detach/i }));
    expect(removeMediaFromTimeline).toHaveBeenCalledWith(CLIENT, "t1", "m1");
  });

  it("shows the (primary) marker read-only — no set-primary control", async () => {
    renderDrawer();
    await screen.findByText("Marie Curie");
    expect(screen.getByText("primary")).toBeInTheDocument();
    // The marker is a label, never an actionable control.
    expect(
      screen.queryByRole("button", { name: /primary/i }),
    ).not.toBeInTheDocument();
  });

  it("computes the live blast radius from the attachment count", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await screen.findByText("Marie Curie");

    await user.click(screen.getByRole("button", { name: /delete original/i }));
    expect(
      await screen.findByText(/attached to 3 entities/i),
    ).toBeInTheDocument();
  });

  it("uses the singular/orphan copy when nothing is attached", async () => {
    const user = userEvent.setup();
    getMediaAttachments.mockResolvedValue([]);
    renderDrawer(
      makeRow({
        attachmentCounts: { event: 0, character: 0, timeline: 0, total: 0 },
      }),
    );
    await screen.findByText(/not attached to anything/i);

    await user.click(screen.getByRole("button", { name: /delete original/i }));
    expect(
      await screen.findByText(/isn’t attached to anything/i),
    ).toBeInTheDocument();
  });

  it("deletes only after an explicit confirm", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    const onOpenChange = vi.fn();
    renderDrawer(makeRow(), { onDeleted, onOpenChange });
    await screen.findByText("Marie Curie");

    // Opening the confirm does not delete.
    await user.click(screen.getByRole("button", { name: /delete original/i }));
    expect(deleteMedia).not.toHaveBeenCalled();

    // The confirm action inside the dialog does. (fireEvent, not userEvent:
    // userEvent's focus/pointer simulation trips a radix focus-scope recursion
    // in jsdom when the modal closes — the click semantics are what we assert.)
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /^delete original$/i }),
    );
    await screen.findByText("Marie Curie");
    expect(deleteMedia).toHaveBeenCalledWith(CLIENT, "m1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalledWith("m1");
  });

  it("dismisses an open delete confirm when the row changes", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MediaDetailDrawer
          open
          onOpenChange={vi.fn()}
          client={CLIENT}
          media={makeRow({ id: "m1" })}
        />
      </QueryClientProvider>,
    );
    await screen.findByText("Marie Curie");
    await user.click(screen.getByRole("button", { name: /delete original/i }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    // Switching the selected row must not leave the confirm open.
    rerender(
      <QueryClientProvider client={queryClient}>
        <MediaDetailDrawer
          open
          onOpenChange={vi.fn()}
          client={CLIENT}
          media={makeRow({ id: "m2", slug: "other" })}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows Open source only for external media", async () => {
    const { rerender } = renderDrawer(makeRow({ source: "upload" }));
    expect(
      screen.queryByRole("link", { name: /open source/i }),
    ).not.toBeInTheDocument();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <MediaDetailDrawer
          open
          onOpenChange={vi.fn()}
          client={CLIENT}
          media={makeRow({ source: "external", url: "https://ext.example/x" })}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("link", { name: /open source/i })).toHaveAttribute(
      "href",
      "https://ext.example/x",
    );
  });

  it("renders no body when no media is selected", () => {
    renderDrawer(null);
    expect(
      screen.queryByRole("button", { name: /save changes/i }),
    ).not.toBeInTheDocument();
  });
});
