import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderLiveDot } from "./reader-live-dot";

describe("ReaderLiveDot", () => {
  it("defaults to hidden: transparent, aria-hidden, no announcement", () => {
    const { container } = render(<ReaderLiveDot />);
    const dot = container.querySelector("span[data-state]");
    expect(dot).toHaveAttribute("data-state", "hidden");
    expect(dot).toHaveAttribute("aria-hidden", "true");
    expect(dot).toHaveClass("opacity-0");
    expect(screen.queryByText(/updates/i)).not.toBeInTheDocument();
  });

  it("always uses the opacity-only ambient-presence class (never pulse/blink)", () => {
    const { container } = render(<ReaderLiveDot state="subscribed" />);
    expect(container.querySelector("span[data-state]")).toHaveClass(
      "ambient-presence",
    );
  });

  it.each([
    [
      "subscribed",
      "opacity-100",
      "text-foreground-subtle",
      /live updates active/i,
    ],
    [
      "update",
      "opacity-100",
      "text-foreground-muted",
      /new updates available/i,
    ],
    ["paused", "opacity-100", "text-foreground-subtle", /live updates paused/i],
  ] as const)(
    "renders the %s state with its color + screen-reader label",
    (state, opacity, color, label) => {
      const { container } = render(<ReaderLiveDot state={state} />);
      const dot = container.querySelector("span[data-state]");
      expect(dot).toHaveAttribute("data-state", state);
      expect(dot).not.toHaveAttribute("aria-hidden");
      expect(dot).toHaveClass(opacity, color);
      expect(screen.getByText(label)).toHaveClass("sr-only");
    },
  );
});
