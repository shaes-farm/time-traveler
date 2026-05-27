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
});
