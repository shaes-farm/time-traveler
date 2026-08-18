import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteVocabularyDialog } from "./delete-vocabulary-dialog";

function renderDialog(
  props: Partial<React.ComponentProps<typeof DeleteVocabularyDialog>> = {},
) {
  return render(
    <DeleteVocabularyDialog
      open
      onOpenChange={vi.fn()}
      onConfirm={vi.fn()}
      onDeactivateInstead={vi.fn()}
      pending={false}
      entryLabel="Parent / Child"
      level="type"
      blockingCount={0}
      blockingNoun="relationship"
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      {...props}
    />,
  );
}

describe("DeleteVocabularyDialog", () => {
  it("offers deletion when nothing uses the entry", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onConfirm });

    expect(screen.getByText(/Nothing uses this type/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Delete permanently" });
    expect(button).toBeEnabled();

    await user.click(button);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("blocks deletion and names the blast radius when the entry is in use", () => {
    // Both vocabulary FKs are ON DELETE RESTRICT, so this would fail with a
    // bare 23503. The dialog says so up front instead.
    renderDialog({ blockingCount: 14 });

    expect(
      screen.getByText(
        /14 relationships use this type, so it can’t be deleted/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete permanently" }),
    ).not.toBeInTheDocument();
  });

  it("singularises the blocking count", () => {
    renderDialog({ blockingCount: 1 });
    expect(
      screen.getByText(/1 relationship uses this type/),
    ).toBeInTheDocument();
  });

  it("routes a blocked delete to deactivation", async () => {
    const onDeactivateInstead = vi.fn();
    const user = userEvent.setup();
    renderDialog({ blockingCount: 3, onDeactivateInstead });

    await user.click(
      screen.getByRole("button", { name: "Deactivate instead" }),
    );
    expect(onDeactivateInstead).toHaveBeenCalled();
  });

  it("disables the action while the count is still loading", () => {
    // Enabling delete before the count lands would let an impatient click
    // race straight into the 23503 this dialog exists to prevent.
    renderDialog({ isLoading: true, blockingCount: undefined });

    expect(
      screen.getByText(/Checking what uses this type/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeDisabled();
  });

  it("disables the action while a cached count is being refreshed in the background", () => {
    // `blockingCount` alone can't distinguish "no data yet" from "stale data,
    // refetching" — a cached 0 must not enable deletion mid-refetch.
    renderDialog({ isLoading: true, blockingCount: 0 });

    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeDisabled();
    expect(
      screen.queryByText(/Nothing uses this type/),
    ).not.toBeInTheDocument();
  });

  it("shows an error state with a retry action when the count request fails", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderDialog({ isError: true, blockingCount: undefined, onRetry });

    expect(
      screen.getByText(/Couldn’t check what uses this type/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("prefers the loading state over a stale error while retrying", () => {
    renderDialog({ isLoading: true, isError: true, blockingCount: undefined });

    expect(
      screen.getByText(/Checking what uses this type/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Couldn’t check what uses this type/),
    ).not.toBeInTheDocument();
  });

  it("surfaces other types that name this one as their inverse", () => {
    renderDialog({
      blockingCount: 0,
      inverseReferenceCount: 2,
      inverseReferenceNoun: "type",
    });

    expect(
      screen.getByText(/2 other types name this as their inverse/),
    ).toBeInTheDocument();
  });

  it("does not show inverse-reference copy when nothing references this entry", () => {
    renderDialog({
      blockingCount: 0,
      inverseReferenceCount: 0,
      inverseReferenceNoun: "type",
    });

    expect(
      screen.queryByText(/name this as their inverse/),
    ).not.toBeInTheDocument();
  });

  it("disables both actions while a mutation is in flight", () => {
    renderDialog({ pending: true });
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("names the level in the copy", () => {
    renderDialog({ level: "category", blockingNoun: "relationship type" });
    expect(screen.getByText(/Nothing uses this group/)).toBeInTheDocument();
  });

  it("is an alertdialog with the entry in its accessible name", () => {
    renderDialog();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Delete “Parent \/ Child” permanently\?/,
      }),
    ).toBeInTheDocument();
  });
});
