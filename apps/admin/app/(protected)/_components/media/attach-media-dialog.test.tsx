import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttachMediaDialog, MAX_UPLOAD_BYTES } from "./attach-media-dialog";

const h = vi.hoisted(() => ({
  uploadMutate: vi.fn(),
  externalMutate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  pending: false,
}));

vi.mock("@repo/ui/hooks/use-media", () => ({
  useUploadMedia: () => ({ mutateAsync: h.uploadMutate, isPending: h.pending }),
  useCreateExternalMedia: () => ({
    mutateAsync: h.externalMutate,
    isPending: h.pending,
  }),
  // Unused by the dialog but imported by sibling module graph:
  useUpdateMedia: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteMedia: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@repo/ui/components/sonner", () => ({
  toast: { success: h.toastSuccess, error: h.toastError },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = {} as any;

/** Build a File with a controlled `size` without allocating real bytes. */
function fileOfSize(name: string, type: string, size: number): File {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

beforeEach(() => {
  h.uploadMutate.mockReset().mockResolvedValue({ id: "new-media-id" });
  h.externalMutate.mockReset().mockResolvedValue({ id: "new-external-id" });
  h.toastSuccess.mockReset();
  h.toastError.mockReset();
  h.pending = false;
});

describe("AttachMediaDialog — upload tab", () => {
  it("rejects a file larger than the 5 MB cap and does not upload", async () => {
    const onAttached = vi.fn();
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={onAttached}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText("File") as HTMLInputElement;
    await userEvent.upload(
      input,
      fileOfSize("big.png", "image/png", MAX_UPLOAD_BYTES + 1),
    );

    expect(
      within(dialog).getByText(/exceeds the 5 MB limit/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /Upload & attach/ }),
    ).toBeDisabled();
    expect(h.uploadMutate).not.toHaveBeenCalled();
  });

  it("uploads a valid file with inferred image type, then calls onAttached", async () => {
    const onAttached = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AttachMediaDialog
        open
        onOpenChange={onOpenChange}
        client={client}
        onAttached={onAttached}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText("File") as HTMLInputElement;
    await userEvent.upload(input, fileOfSize("photo.png", "image/png", 1024));
    await userEvent.type(within(dialog).getByLabelText("Alt text"), "alt");
    await userEvent.type(within(dialog).getByLabelText("Caption"), "cap");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Upload & attach/ }),
    );

    await waitFor(() => expect(h.uploadMutate).toHaveBeenCalledOnce());
    const arg = h.uploadMutate.mock.calls[0]![0];
    expect(arg).toMatchObject({
      mediaType: "image",
      altText: "alt",
      caption: "cap",
      fileSizeBytes: 1024,
    });
    expect(arg.fileName).toMatch(/photo\.png$/);
    await waitFor(() =>
      expect(onAttached).toHaveBeenCalledWith("new-media-id"),
    );
  });
});

describe("AttachMediaDialog — external URL tab", () => {
  it("creates external media with inferred type and calls onAttached", async () => {
    const onAttached = vi.fn();
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={onAttached}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    );
    await userEvent.type(
      within(dialog).getByLabelText("URL"),
      "https://archive.org/clip.mp4",
    );
    await userEvent.type(within(dialog).getByLabelText("Alt text"), "ext alt");
    await userEvent.type(within(dialog).getByLabelText("Caption"), "ext cap");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Attach$/ }),
    );

    await waitFor(() => expect(h.externalMutate).toHaveBeenCalledOnce());
    expect(h.externalMutate.mock.calls[0]![0]).toMatchObject({
      url: "https://archive.org/clip.mp4",
      mediaType: "video",
      altText: "ext alt",
      caption: "ext cap",
    });
    await waitFor(() =>
      expect(onAttached).toHaveBeenCalledWith("new-external-id"),
    );
  });

  it("keeps Attach disabled until a URL is entered", async () => {
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    );
    expect(
      within(dialog).getByRole("button", { name: /^Attach$/ }),
    ).toBeDisabled();
  });

  it("infers audio for an .mp3 URL and document for an extensionless URL", async () => {
    const { rerender } = render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    let dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    );
    await userEvent.type(
      within(dialog).getByLabelText("URL"),
      "https://x.org/a.mp3",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Attach$/ }),
    );
    await waitFor(() =>
      expect(h.externalMutate.mock.calls[0]![0]).toMatchObject({
        mediaType: "audio",
      }),
    );

    h.externalMutate.mockClear();
    rerender(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    );
    await userEvent.type(
      within(dialog).getByLabelText("URL"),
      "https://x.org/resource",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Attach$/ }),
    );
    await waitFor(() =>
      expect(h.externalMutate.mock.calls[0]![0]).toMatchObject({
        mediaType: "document",
      }),
    );
  });
});

describe("AttachMediaDialog — library variant", () => {
  it("uses library copy, opens the requested tab, and toasts 'to library' on upload", async () => {
    const onAttached = vi.fn();
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={onAttached}
        variant="library"
        defaultTab="upload"
      />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Add to library")).toBeInTheDocument();

    const input = within(dialog).getByLabelText("File") as HTMLInputElement;
    await userEvent.upload(input, fileOfSize("photo.png", "image/png", 1024));
    // CTA drops "attach" in the library variant.
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Upload$/ }),
    );

    await waitFor(() => expect(h.uploadMutate).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(h.toastSuccess).toHaveBeenCalledWith("Uploaded to library"),
    );
    expect(onAttached).toHaveBeenCalledWith("new-media-id");
  });

  it("opens on the external tab when defaultTab='external'", async () => {
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
        variant="library"
        defaultTab="external"
      />,
    );
    const dialog = await screen.findByRole("dialog");
    // The External URL field is visible without clicking a tab first.
    expect(within(dialog).getByLabelText("URL")).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: /^Add$/ }),
    ).toBeInTheDocument();
  });
});

describe("AttachMediaDialog — error handling & cancel", () => {
  it("shows an error toast when the upload fails", async () => {
    h.uploadMutate.mockRejectedValueOnce(new Error("upload boom"));
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText("File") as HTMLInputElement;
    await userEvent.upload(input, fileOfSize("photo.png", "image/png", 1024));
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Upload & attach/ }),
    );
    await waitFor(() => expect(h.toastError).toHaveBeenCalled());
  });

  it("Cancel closes the dialog via onOpenChange(false)", async () => {
    const onOpenChange = vi.fn();
    render(
      <AttachMediaDialog
        open
        onOpenChange={onOpenChange}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Cancel/ }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows a fallback error toast when external attach rejects with a non-Error", async () => {
    h.externalMutate.mockRejectedValueOnce("string failure");
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    );
    await userEvent.type(
      within(dialog).getByLabelText("URL"),
      "https://x.org/a.jpg",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Attach$/ }),
    );
    await waitFor(() =>
      expect(h.toastError).toHaveBeenCalledWith(
        "Failed to attach external media",
      ),
    );
  });

  it("shows pending labels and disables actions while a mutation is in flight", async () => {
    h.pending = true;
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: /Uploading…/ }),
    ).toBeDisabled();
    await userEvent.click(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    );
    expect(
      within(dialog).getByRole("button", { name: /Attaching…/ }),
    ).toBeDisabled();
  });

  it("clicking the Choose-file button triggers the hidden file input", async () => {
    render(
      <AttachMediaDialog
        open
        onOpenChange={vi.fn()}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    const chooseBtn = within(dialog).getByRole("button", {
      name: /Choose file/i,
    });
    // click() on the hidden input would open OS picker — here we just verify
    // the button is present, enabled, and doesn't throw when clicked.
    expect(chooseBtn).not.toBeDisabled();
    await userEvent.click(chooseBtn);
  });

  it("Cancel on the external tab closes via onOpenChange(false)", async () => {
    const onOpenChange = vi.fn();
    render(
      <AttachMediaDialog
        open
        onOpenChange={onOpenChange}
        client={client}
        onAttached={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("tab", { name: /External URL/ }),
    );
    await userEvent.click(
      within(dialog)
        .getAllByRole("button", { name: /Cancel/ })
        .at(-1)!,
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
