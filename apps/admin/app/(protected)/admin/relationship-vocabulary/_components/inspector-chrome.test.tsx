import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ActiveField,
  InspectorError,
  InspectorFooter,
  InspectorHeader,
  KeyField,
  SortOrderField,
} from "./inspector-chrome";

describe("InspectorHeader", () => {
  it("hides the overflow menu while creating", () => {
    render(
      <InspectorHeader
        title="New type"
        isEdit={false}
        isActive
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "More actions" }),
    ).not.toBeInTheDocument();
  });

  it("puts Deactivate before Delete, both reachable, in edit mode", async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    const onDelete = vi.fn();
    render(
      <InspectorHeader
        title="Edit type"
        isEdit
        isActive
        onDeactivate={onDeactivate}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual([
      "Deactivate",
      "Delete permanently…",
    ]);

    await user.click(items[0]!);
    expect(onDeactivate).toHaveBeenCalled();
  });

  it("offers Reactivate instead of Deactivate for an inactive entry", async () => {
    const user = userEvent.setup();
    render(
      <InspectorHeader
        title="Edit type"
        isEdit
        isActive={false}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.getByRole("menuitem", { name: "Reactivate" }),
    ).toBeInTheDocument();
  });
});

describe("InspectorError", () => {
  it("renders nothing without a message", () => {
    const { container } = render(<InspectorError message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("defaults the title to the save-path wording", () => {
    render(<InspectorError message="Something broke." />);
    expect(screen.getByText("Couldn’t save")).toBeInTheDocument();
    expect(screen.getByText("Something broke.")).toBeInTheDocument();
  });

  it("accepts an operation-specific title", () => {
    render(<InspectorError message="Still in use." title="Couldn’t delete" />);
    expect(screen.getByText("Couldn’t delete")).toBeInTheDocument();
    expect(screen.queryByText("Couldn’t save")).not.toBeInTheDocument();
  });
});

describe("InspectorFooter", () => {
  it("labels the submit button Create or Save by mode", () => {
    const { rerender } = render(
      <InspectorFooter pending={false} isEdit={false} onCancel={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();

    rerender(<InspectorFooter pending={false} isEdit onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("shows a pending label and disables both buttons while pending", () => {
    render(<InspectorFooter pending isEdit onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <InspectorFooter pending={false} isEdit={false} onCancel={onCancel} />,
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("KeyField", () => {
  it("is editable while creating", () => {
    render(
      <KeyField
        name="test-key"
        value=""
        onChange={vi.fn()}
        onBlur={vi.fn()}
        isEdit={false}
        placeholder="e.g. family"
      />,
    );
    expect(screen.getByLabelText("Key")).toBeEnabled();
  });

  it("is disabled and explains why once editing", () => {
    render(
      <KeyField
        name="test-key"
        value="family"
        onChange={vi.fn()}
        onBlur={vi.fn()}
        isEdit
        placeholder="e.g. family"
      />,
    );
    expect(screen.getByLabelText("Key")).toBeDisabled();
    expect(screen.getByText(/Keys are permanent/)).toBeInTheDocument();
  });

  it("shows a validation error", () => {
    render(
      <KeyField
        name="test-key"
        value=""
        onChange={vi.fn()}
        onBlur={vi.fn()}
        isEdit={false}
        placeholder="e.g. family"
        error="Required"
      />,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});

describe("SortOrderField", () => {
  it("renders the numeric value", () => {
    render(
      <SortOrderField
        name="test-sort"
        value={30}
        onChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Order")).toHaveValue(30);
  });

  it("blanks out NaN rather than rendering it literally", () => {
    render(
      <SortOrderField
        name="test-sort"
        value={Number.NaN}
        onChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Order")).toHaveValue(null);
  });
});

describe("ActiveField", () => {
  it("toggles and reflects checked state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ActiveField
        name="test-active"
        checked={false}
        onChange={onChange}
        description="desc"
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Active" });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("can be disabled independently of checked state", () => {
    render(
      <ActiveField
        name="test-active"
        checked
        onChange={vi.fn()}
        description="desc"
        disabled
      />,
    );
    expect(screen.getByRole("switch", { name: "Active" })).toBeDisabled();
  });
});
