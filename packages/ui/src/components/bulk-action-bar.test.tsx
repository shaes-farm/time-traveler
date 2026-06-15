import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BulkActionBar } from "./bulk-action-bar";

describe("BulkActionBar", () => {
  it("renders nothing when there is nothing to act on", () => {
    const { container } = render(<BulkActionBar count={0} onClear={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the selected count and pluralizes the entity noun", async () => {
    const onPublish = vi.fn();
    const user = userEvent.setup();
    render(
      <BulkActionBar
        count={4}
        entityLabel="event"
        onPublish={onPublish}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText("4 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Publish 4 events?")).toBeInTheDocument();
  });

  it("uses the singular noun for a single row", async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        count={1}
        entityLabel="timeline"
        onUnpublish={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Unpublish" }));
    expect(
      within(screen.getByRole("dialog")).getByText("Unpublish 1 timeline?"),
    ).toBeInTheDocument();
  });

  it("batches publish into a single confirm before firing the callback", async () => {
    const onPublish = vi.fn();
    const user = userEvent.setup();
    render(
      <BulkActionBar
        count={3}
        entityLabel="event"
        onPublish={onPublish}
        onClear={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(onPublish).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Publish" }));
    expect(onPublish).toHaveBeenCalledOnce();
  });

  it("fires onUnpublish from the unpublish confirm", async () => {
    const onUnpublish = vi.fn();
    const user = userEvent.setup();
    render(
      <BulkActionBar
        count={2}
        entityLabel="event"
        onUnpublish={onUnpublish}
        onClear={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Unpublish" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Unpublish",
      }),
    );
    expect(onUnpublish).toHaveBeenCalledOnce();
  });

  it("notes skipped rows the user does not own", () => {
    render(<BulkActionBar count={3} skippedCount={2} onClear={vi.fn()} />);
    expect(screen.getByText(/2 not yours/)).toBeInTheDocument();
  });

  it("clears the selection via Cancel", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<BulkActionBar count={2} onClear={onClear} />);

    // The toolbar Cancel (not the dialog one).
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("disables the action buttons while busy", () => {
    render(
      <BulkActionBar
        count={2}
        busy
        onPublish={vi.fn()}
        onUnpublish={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Unpublish" })).toBeDisabled();
  });

  it("disables an action whose callback is not provided", () => {
    render(<BulkActionBar count={2} onPublish={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Unpublish" })).toBeDisabled();
  });

  it("does not re-fire the callback when confirming while busy", async () => {
    const onPublish = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <BulkActionBar count={3} onPublish={onPublish} onClear={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));
    // A transition kicks off (busy) before the user can confirm again.
    rerender(
      <BulkActionBar count={3} busy onPublish={onPublish} onClear={vi.fn()} />,
    );
    const confirmButton = within(screen.getByRole("dialog")).getByRole(
      "button",
      { name: "Publish" },
    );
    expect(confirmButton).toBeDisabled();
    await user.click(confirmButton);
    expect(onPublish).not.toHaveBeenCalled();
  });
});
