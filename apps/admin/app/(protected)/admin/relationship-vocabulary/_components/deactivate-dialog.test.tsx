import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeactivateDialog } from "./deactivate-dialog";

function renderDialog(
  props: Partial<React.ComponentProps<typeof DeactivateDialog>> = {},
) {
  return render(
    <DeactivateDialog
      open
      onOpenChange={vi.fn()}
      onConfirm={vi.fn()}
      pending={false}
      entryLabel="Family"
      level="category"
      {...props}
    />,
  );
}

describe("DeactivateDialog", () => {
  it("warns that existing relationships keep working", () => {
    renderDialog();
    expect(
      screen.getByText(/Existing relationships keep working/),
    ).toBeInTheDocument();
  });

  it("confirms deactivation", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onConfirm });

    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("switches to reactivate copy without the warning", () => {
    renderDialog({ reactivating: true });
    expect(
      screen.getByRole("heading", { name: /Reactivate “Family”\?/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Existing relationships keep working/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reactivate" }),
    ).toBeInTheDocument();
  });

  it("says an empty category has no affected types", () => {
    renderDialog({ affectedTypeCount: 0 });
    expect(
      screen.getByText(/This group is empty, so no types are affected/),
    ).toBeInTheDocument();
  });

  it("names the affected types, not just the count", () => {
    renderDialog({
      affectedTypeCount: 2,
      affectedTypeLabels: ["Parent / Child", "Sibling"],
    });
    expect(
      screen.getByText(/All 2 types in this group will disappear/),
    ).toBeInTheDocument();
    expect(screen.getByText("Parent / Child, Sibling")).toBeInTheDocument();
  });

  it("truncates a long list of affected types", () => {
    const labels = Array.from({ length: 10 }, (_, i) => `Type ${i + 1}`);
    renderDialog({ affectedTypeCount: 10, affectedTypeLabels: labels });
    expect(screen.getByText(/, and 2 more/)).toBeInTheDocument();
  });

  it("singularises the affected type count", () => {
    renderDialog({ affectedTypeCount: 1, affectedTypeLabels: ["Sibling"] });
    expect(
      screen.getByText(/All 1 type in this group will disappear/),
    ).toBeInTheDocument();
  });

  it("shows the type-level usage count instead, for a type", () => {
    renderDialog({ level: "type", usageCount: 5 });
    expect(
      screen.getByText(/5 existing relationships use this type/),
    ).toBeInTheDocument();
  });

  it("says nothing currently uses a type with a zero usage count", () => {
    renderDialog({ level: "type", usageCount: 0 });
    expect(
      screen.getByText(/No relationships currently use this type/),
    ).toBeInTheDocument();
  });

  it("disables both actions while pending", () => {
    renderDialog({ pending: true });
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
