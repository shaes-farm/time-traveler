import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SaveDropdown } from "./save-dropdown";

describe("SaveDropdown", () => {
  it("invokes the primary save action", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SaveDropdown onSave={onSave} onSaveAndAddAnother={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("shows the split-button menu actions", async () => {
    const onSaveAndAddAnother = vi.fn();
    const onSaveAsDraft = vi.fn();
    const onSaveAndPublish = vi.fn();
    const user = userEvent.setup();

    render(
      <SaveDropdown
        onSave={() => {}}
        onSaveAndAddAnother={onSaveAndAddAnother}
        onSaveAsDraft={onSaveAsDraft}
        onSaveAndPublish={onSaveAndPublish}
      />,
    );

    await user.click(screen.getByRole("button", { name: "More save actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Save and add another" }),
    );
    expect(onSaveAndAddAnother).toHaveBeenCalledOnce();
  });

  it("invokes save as draft and save and publish actions", async () => {
    const onSaveAsDraft = vi.fn();
    const onSaveAndPublish = vi.fn();
    const user = userEvent.setup();

    render(
      <SaveDropdown
        onSave={() => {}}
        onSaveAsDraft={onSaveAsDraft}
        onSaveAndPublish={onSaveAndPublish}
      />,
    );

    await user.click(screen.getByRole("button", { name: "More save actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Save as draft" }));
    expect(onSaveAsDraft).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "More save actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Save and publish" }),
    );
    expect(onSaveAndPublish).toHaveBeenCalledOnce();
  });

  it("renders only the primary button when no secondary actions are provided", () => {
    render(
      <SaveDropdown
        onSave={() => {}}
        saveLabel="Commit"
        className="test-class"
      />,
    );

    expect(screen.getByRole("button", { name: "Commit" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "More save actions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Commit" }).parentElement,
    ).toHaveClass("test-class");
  });

  it("disables both split buttons and prevents primary save", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<SaveDropdown onSave={onSave} onSaveAsDraft={() => {}} disabled />);

    const saveButton = screen.getByRole("button", { name: "Save" });
    const moreActionsButton = screen.getByRole("button", {
      name: "More save actions",
    });

    expect(saveButton).toBeDisabled();
    expect(moreActionsButton).toBeDisabled();

    await user.click(saveButton);
    expect(onSave).not.toHaveBeenCalled();
  });
});
