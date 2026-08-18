import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReorderButtons } from "./reorder-buttons";

describe("ReorderButtons", () => {
  it("names each button by the row's label", () => {
    render(
      <ReorderButtons label="Family" canMoveUp canMoveDown onMove={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Move Family up" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Move Family down" }),
    ).toBeInTheDocument();
  });

  it("disables up/down independently at the boundaries", () => {
    render(
      <ReorderButtons
        label="Family"
        canMoveUp={false}
        canMoveDown
        onMove={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Move Family up" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move Family down" }),
    ).toBeEnabled();
  });

  it("disables both when a reorder is already in flight", () => {
    render(
      <ReorderButtons
        label="Family"
        canMoveUp
        canMoveDown
        onMove={vi.fn()}
        disabled
      />,
    );
    expect(
      screen.getByRole("button", { name: "Move Family up" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move Family down" }),
    ).toBeDisabled();
  });

  it("reports the direction clicked", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <ReorderButtons label="Family" canMoveUp canMoveDown onMove={onMove} />,
    );

    await user.click(screen.getByRole("button", { name: "Move Family up" }));
    expect(onMove).toHaveBeenCalledWith("up");

    await user.click(screen.getByRole("button", { name: "Move Family down" }));
    expect(onMove).toHaveBeenCalledWith("down");
  });

  it("stops the click from bubbling to the row's own selection handler", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      // Test-only wrapper standing in for the tree row's click handler.
      <div onClick={onRowClick}>
        <ReorderButtons label="Family" canMoveUp canMoveDown onMove={vi.fn()} />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Move Family up" }));
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
