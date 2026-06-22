import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaSection, type AttachedMedia } from "./media-section";

// ---------------------------------------------------------------------------
// Mock the media hooks (MediaSection uses update/delete; the embedded
// AttachMediaDialog uses upload/createExternal — mock all four so no real
// TanStack Query client is needed).
// ---------------------------------------------------------------------------
const h = vi.hoisted(() => ({
  updateMutate: vi.fn(),
  deleteMutate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  pending: false,
}));

vi.mock("@repo/ui/hooks/use-media", () => ({
  useUpdateMedia: () => ({ mutateAsync: h.updateMutate, isPending: h.pending }),
  useDeleteMedia: () => ({ mutateAsync: h.deleteMutate, isPending: h.pending }),
  useUploadMedia: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateExternalMedia: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@repo/ui/components/sonner", () => ({
  toast: { success: h.toastSuccess, error: h.toastError },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = {} as any;

function makeItems(): AttachedMedia[] {
  return [
    {
      id: "m1",
      alt_text: "Alt one",
      caption: "Caption one",
      media_type: "image",
      url: "https://example.com/1.png",
      source: "upload",
      sort_order: 0,
    },
    {
      id: "m2",
      alt_text: "Alt two",
      caption: "Caption two",
      media_type: "video",
      url: "https://example.com/2.mp4",
      source: "external",
      sort_order: 1,
    },
  ];
}

function baseProps(
  overrides: Partial<React.ComponentProps<typeof MediaSection>> = {},
) {
  return {
    client,
    items: makeItems(),
    isLoading: false,
    canEdit: true,
    ordering: "sort" as const,
    onAttach: vi.fn(),
    onDetach: vi.fn(),
    onReorder: vi.fn(),
    onChanged: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  h.updateMutate.mockReset().mockResolvedValue({});
  h.deleteMutate.mockReset().mockResolvedValue({});
  h.toastSuccess.mockReset();
  h.toastError.mockReset();
  h.pending = false;
});

describe("MediaSection — states", () => {
  it("renders the empty state when there are no items", () => {
    render(<MediaSection {...baseProps({ items: [] })} />);
    expect(screen.getByText("No media attached.")).toBeInTheDocument();
  });

  it("renders the error state and Retry calls onRetry", async () => {
    const onRetry = vi.fn();
    render(
      <MediaSection {...baseProps({ items: [], isError: true, onRetry })} />,
    );
    expect(screen.getByText("Failed to load media.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not show the empty state while loading", () => {
    render(<MediaSection {...baseProps({ items: [], isLoading: true })} />);
    expect(screen.queryByText("No media attached.")).not.toBeInTheDocument();
  });

  it("renders each item with its caption and source label", () => {
    render(<MediaSection {...baseProps()} />);
    expect(screen.getByText("Caption one")).toBeInTheDocument();
    expect(screen.getByText("Caption two")).toBeInTheDocument();
    expect(screen.getByText("uploaded")).toBeInTheDocument();
    expect(screen.getByText("external")).toBeInTheDocument();
  });

  it("hides per-item actions when canEdit is false", () => {
    render(<MediaSection {...baseProps({ canEdit: false })} />);
    expect(
      screen.queryByRole("button", { name: "Media actions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Attach media/ }),
    ).not.toBeInTheDocument();
  });
});

describe("MediaSection — reorder (ordering=sort)", () => {
  it("moves an item down and persists renumbered sort_order", async () => {
    const onReorder = vi.fn();
    render(<MediaSection {...baseProps({ onReorder })} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!); // first item's menu
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Move down/ }),
    );
    // New order [m2, m1] → both indices change: m2→0, m1→1.
    await waitFor(() => expect(onReorder).toHaveBeenCalledWith("m2", 0));
    expect(onReorder).toHaveBeenCalledWith("m1", 1);
  });

  it("disables Move up on the first item", async () => {
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    const moveUp = await screen.findByRole("menuitem", { name: /Move up/ });
    expect(moveUp).toHaveAttribute("aria-disabled", "true");
  });
});

describe("MediaSection — primary (ordering=primary)", () => {
  it("offers Set as primary and hides reorder", async () => {
    const onSetPrimary = vi.fn();
    const items = makeItems().map((m) => ({ ...m, sort_order: null }));
    render(
      <MediaSection
        {...baseProps({
          ordering: "primary",
          items,
          onSetPrimary,
          onReorder: undefined,
        })}
      />,
    );
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    expect(
      screen.queryByRole("menuitem", { name: /Move up/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Set as primary/ }),
    );
    expect(onSetPrimary).toHaveBeenCalledWith("m1");
  });
});

describe("MediaSection — detach vs delete-original", () => {
  it("Detach calls onDetach with no confirmation", async () => {
    const onDetach = vi.fn();
    render(<MediaSection {...baseProps({ onDetach })} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /^Detach$/ }),
    );
    expect(onDetach).toHaveBeenCalledWith("m1");
    expect(h.deleteMutate).not.toHaveBeenCalled();
  });

  it("Delete original shows a blast-radius confirm, then deletes + refreshes", async () => {
    const onChanged = vi.fn();
    render(<MediaSection {...baseProps({ onChanged })} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Delete original/ }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/everywhere/i)).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Delete original/ }),
    );

    await waitFor(() => expect(h.deleteMutate).toHaveBeenCalledWith("m1"));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});

describe("MediaSection — edit caption/alt", () => {
  it("saves trimmed alt/caption via useUpdateMedia and refreshes", async () => {
    const onChanged = vi.fn();
    render(<MediaSection {...baseProps({ onChanged })} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Edit caption/ }),
    );

    const dialog = await screen.findByRole("dialog");
    const caption = within(dialog).getByLabelText("Caption");
    await userEvent.clear(caption);
    await userEvent.type(caption, "  New caption  ");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Save$/ }),
    );

    await waitFor(() =>
      expect(h.updateMutate).toHaveBeenCalledWith({
        id: "m1",
        data: { alt_text: "Alt one", caption: "New caption" },
      }),
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});

describe("MediaSection — thumbnails & primary badge", () => {
  it("renders audio/document icon thumbnails and the Primary badge", async () => {
    const items: AttachedMedia[] = [
      {
        id: "p1",
        alt_text: "song",
        caption: "Song",
        media_type: "audio",
        url: null,
        source: "upload",
        sort_order: null,
        is_primary: true,
      },
      {
        id: "p2",
        alt_text: "doc",
        caption: "Doc",
        media_type: "document",
        url: null,
        source: "upload",
        sort_order: null,
        is_primary: false,
      },
    ];
    render(
      <MediaSection
        {...baseProps({
          ordering: "primary",
          items,
          onReorder: undefined,
          onSetPrimary: vi.fn(),
        })}
      />,
    );
    expect(screen.getByText("Primary")).toBeInTheDocument();
    // The primary item offers no "Set as primary"; the non-primary one does.
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    expect(
      screen.queryByRole("menuitem", { name: /Set as primary/ }),
    ).not.toBeInTheDocument();
  });

  it("falls back to FileText icon when an image fails to load", async () => {
    const items: AttachedMedia[] = [
      {
        id: "img1",
        alt_text: "broken",
        caption: null,
        media_type: "image",
        url: "https://broken.example/img.png",
        source: "external",
        sort_order: 0,
      },
    ];
    render(<MediaSection {...baseProps({ items })} />);
    const img = screen.getByRole("img", { name: "broken" });
    img.dispatchEvent(new Event("error", { bubbles: false }));
    await waitFor(() =>
      expect(screen.queryByRole("img")).not.toBeInTheDocument(),
    );
  });
});

describe("MediaSection — error handling", () => {
  it("surfaces a toast when delete fails", async () => {
    h.deleteMutate.mockRejectedValueOnce(new Error("boom"));
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Delete original/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Delete original/ }),
    );
    await waitFor(() => expect(h.toastError).toHaveBeenCalled());
  });

  it("surfaces a toast when edit fails", async () => {
    h.updateMutate.mockRejectedValueOnce(new Error("nope"));
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Edit caption/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Save$/ }),
    );
    await waitFor(() => expect(h.toastError).toHaveBeenCalled());
  });
});

describe("MediaSection — dialog cancel paths", () => {
  it("Edit dialog Cancel closes without saving", async () => {
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Edit caption/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Cancel/ }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(h.updateMutate).not.toHaveBeenCalled();
  });

  it("Delete dialog for an external item omits the stored-file wording and Cancel aborts", async () => {
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    // second item (m2) is source: "external"
    await userEvent.click(triggers[1]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Delete original/ }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/everywhere/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/stored file/i)).not.toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Cancel/ }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(h.deleteMutate).not.toHaveBeenCalled();
  });
});

describe("MediaSection — label fallbacks & misc branches", () => {
  it("falls back to alt text, then 'Untitled media', for the title", () => {
    const items: AttachedMedia[] = [
      {
        id: "a",
        alt_text: "Only alt",
        caption: null,
        media_type: "image",
        url: null,
        source: "upload",
        sort_order: 0,
      },
      {
        id: "b",
        alt_text: null,
        caption: null,
        media_type: "image",
        url: null,
        source: "upload",
        sort_order: 1,
      },
    ];
    render(<MediaSection {...baseProps({ items })} />);
    expect(screen.getByText("Only alt")).toBeInTheDocument();
    expect(screen.getByText("Untitled media")).toBeInTheDocument();
  });

  it("renders the error state without a Retry button when onRetry is omitted", () => {
    render(
      <MediaSection
        {...baseProps({ items: [], isError: true, onRetry: undefined })}
      />,
    );
    expect(screen.getByText("Failed to load media.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
  });

  it("moves a non-first item up", async () => {
    const onReorder = vi.fn();
    render(<MediaSection {...baseProps({ onReorder })} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[1]!); // second item
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Move up/ }),
    );
    await waitFor(() => expect(onReorder).toHaveBeenCalledWith("m2", 0));
    expect(onReorder).toHaveBeenCalledWith("m1", 1);
  });

  it("saves an edit with the alt field changed and an emptied caption", async () => {
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Edit caption/ }),
    );
    const dialog = await screen.findByRole("dialog");
    const alt = within(dialog).getByLabelText("Alt text");
    await userEvent.clear(alt);
    await userEvent.type(alt, "New alt");
    await userEvent.clear(within(dialog).getByLabelText("Caption"));
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Save$/ }),
    );
    await waitFor(() =>
      expect(h.updateMutate).toHaveBeenCalledWith({
        id: "m1",
        data: { alt_text: "New alt", caption: undefined },
      }),
    );
  });
});

describe("MediaSection — pending states", () => {
  it("shows 'Saving…' (disabled) in the edit dialog while a mutation is in flight", async () => {
    h.pending = true;
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Edit caption/ }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: /Saving…/ }),
    ).toBeDisabled();
  });

  it("shows 'Deleting…' (disabled) in the delete dialog while a mutation is in flight", async () => {
    h.pending = true;
    render(<MediaSection {...baseProps()} />);
    const triggers = screen.getAllByRole("button", { name: "Media actions" });
    await userEvent.click(triggers[0]!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Delete original/ }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: /Deleting…/ }),
    ).toBeDisabled();
  });
});

describe("MediaSection — attach", () => {
  it("opens the attach dialog from the header button", async () => {
    render(<MediaSection {...baseProps({ items: [] })} />);
    await userEvent.click(screen.getByRole("button", { name: /Attach media/ }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "Upload a file or embed media from an external URL.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    ).toBeInTheDocument();
  });
});
