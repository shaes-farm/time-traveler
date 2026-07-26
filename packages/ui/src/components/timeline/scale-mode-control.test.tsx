import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ScaleModeControl } from "./scale-mode-control";

describe("ScaleModeControl", () => {
  it("renders a radio group with both scale options", () => {
    render(<ScaleModeControl value="logarithmic" onValueChange={() => {}} />);
    expect(
      screen.getByRole("radiogroup", { name: "Time scale" }),
    ).toBeVisible();
    expect(screen.getByRole("radio", { name: "Logarithmic" })).toBeVisible();
    expect(screen.getByRole("radio", { name: "Linear" })).toBeVisible();
  });

  it("marks the active option with aria-checked (not aria-pressed)", () => {
    render(<ScaleModeControl value="linear" onValueChange={() => {}} />);
    const linear = screen.getByRole("radio", { name: "Linear" });
    const log = screen.getByRole("radio", { name: "Logarithmic" });
    expect(linear).toHaveAttribute("aria-checked", "true");
    expect(log).toHaveAttribute("aria-checked", "false");
    expect(linear).not.toHaveAttribute("aria-pressed");
  });

  it("exposes the plain-language helper text as each option's description", () => {
    render(<ScaleModeControl value="logarithmic" onValueChange={() => {}} />);
    expect(
      screen.getByRole("radio", { name: "Logarithmic" }),
    ).toHaveAccessibleDescription("Compressed for deep time");
    expect(
      screen.getByRole("radio", { name: "Linear" }),
    ).toHaveAccessibleDescription("Even spacing");
  });

  it("fires onValueChange with the long-form mode on selection", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ScaleModeControl value="logarithmic" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("radio", { name: "Linear" }));
    expect(onValueChange).toHaveBeenCalledWith("linear");
  });

  it("is keyboard-reachable, landing focus on the checked option", async () => {
    const user = userEvent.setup();
    render(<ScaleModeControl value="linear" onValueChange={() => {}} />);

    // A single Tab enters the roving-focus group at the checked option; arrow
    // traversal between options is Radix's own (well-tested) behavior.
    await user.tab();
    expect(screen.getByRole("radio", { name: "Linear" })).toHaveFocus();
  });

  it("announces the active mode in a polite live region", () => {
    const { rerender } = render(
      <ScaleModeControl value="logarithmic" onValueChange={() => {}} />,
    );
    // The live region text tracks the current mode for immediate SR feedback.
    expect(screen.getByText("Logarithmic scale")).toBeInTheDocument();

    rerender(<ScaleModeControl value="linear" onValueChange={() => {}} />);
    expect(screen.getByText("Linear scale")).toBeInTheDocument();
  });

  it("accepts a custom accessible group name", () => {
    render(
      <ScaleModeControl
        value="logarithmic"
        onValueChange={() => {}}
        ariaLabel="Axis scale"
      />,
    );
    expect(
      screen.getByRole("radiogroup", { name: "Axis scale" }),
    ).toBeVisible();
  });
});
