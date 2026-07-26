import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompressionHint } from "./compression-hint";

const LONG_SPAN: [number, number] = [-13.8e9, 2026];
const SHORT_SPAN: [number, number] = [1900, 2026];
const HINT_TEXT = "Events compressed — switch to logarithmic?";

describe("CompressionHint", () => {
  it("shows in linear mode on a long span", () => {
    render(
      <CompressionHint
        mode="linear"
        domain={LONG_SPAN}
        onSwitchToLogarithmic={() => {}}
      />,
    );
    expect(screen.getByText(HINT_TEXT)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Switch to logarithmic" }),
    ).toBeVisible();
  });

  it("stays hidden in logarithmic mode even on a long span", () => {
    render(
      <CompressionHint
        mode="logarithmic"
        domain={LONG_SPAN}
        onSwitchToLogarithmic={() => {}}
      />,
    );
    expect(screen.queryByText(HINT_TEXT)).not.toBeInTheDocument();
  });

  it("stays hidden in linear mode on a short span", () => {
    render(
      <CompressionHint
        mode="linear"
        domain={SHORT_SPAN}
        onSwitchToLogarithmic={() => {}}
      />,
    );
    expect(screen.queryByText(HINT_TEXT)).not.toBeInTheDocument();
  });

  it("invokes the switch handler when the suggestion is accepted", async () => {
    const onSwitchToLogarithmic = vi.fn();
    const user = userEvent.setup();
    render(
      <CompressionHint
        mode="linear"
        domain={LONG_SPAN}
        onSwitchToLogarithmic={onSwitchToLogarithmic}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to logarithmic" }),
    );
    expect(onSwitchToLogarithmic).toHaveBeenCalledTimes(1);
  });

  it("dismisses without switching, and re-arms on a fresh toggle to linear", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CompressionHint
        mode="linear"
        domain={LONG_SPAN}
        onSwitchToLogarithmic={() => {}}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Dismiss compression hint" }),
    );
    expect(screen.queryByText(HINT_TEXT)).not.toBeInTheDocument();

    // Toggling away and back to linear re-arms the hint.
    rerender(
      <CompressionHint
        mode="logarithmic"
        domain={LONG_SPAN}
        onSwitchToLogarithmic={() => {}}
      />,
    );
    rerender(
      <CompressionHint
        mode="linear"
        domain={LONG_SPAN}
        onSwitchToLogarithmic={() => {}}
      />,
    );
    expect(screen.getByText(HINT_TEXT)).toBeVisible();
  });
});
