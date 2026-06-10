import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StaleContentBanner } from "./stale-content-banner";

describe("StaleContentBanner", () => {
  it("is a polite, atomic live region (never assertive)", () => {
    render(<StaleContentBanner state="stale" onRefresh={() => {}} />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("renders nothing visible when hidden but keeps the live region mounted", () => {
    render(<StaleContentBanner state="hidden" />);
    const region = screen.getByRole("status");
    expect(region).toHaveClass("sr-only");
    expect(region).toBeEmptyDOMElement();
  });

  it("uses the opacity-only ambient-presence class", () => {
    render(<StaleContentBanner state="stale" onRefresh={() => {}} />);
    expect(screen.getByRole("status")).toHaveClass("ambient-presence");
  });

  it("pins below the sticky nav when visible so it survives scroll", () => {
    render(<StaleContentBanner state="stale" onRefresh={() => {}} />);
    const region = screen.getByRole("status");
    expect(region).toHaveClass("sticky", "top-14");
  });

  it("shows default stale copy with a redundant text label (never color-only)", () => {
    render(<StaleContentBanner state="stale" onRefresh={() => {}} />);
    expect(screen.getByText(/live updates paused/i)).toBeInTheDocument();
  });

  it("exposes a keyboard-reachable Refresh button in tab order while stale", async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();
    render(<StaleContentBanner state="stale" onRefresh={onRefresh} />);

    const button = screen.getByRole("button", { name: /refresh/i });
    // Reachable by keyboard (not removed from tab order) and activatable.
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("does not steal focus on appearance", () => {
    render(<StaleContentBanner state="stale" onRefresh={() => {}} />);
    // Appearance must not auto-focus anything — focus stays on <body>.
    expect(document.body).toHaveFocus();
  });

  it("omits the Refresh button while reconnecting", () => {
    render(<StaleContentBanner state="reconnecting" onRefresh={() => {}} />);
    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /refresh/i }),
    ).not.toBeInTheDocument();
  });

  it("allows overriding the message copy", () => {
    render(
      <StaleContentBanner
        state="stale"
        message="Custom stale copy"
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText("Custom stale copy")).toBeInTheDocument();
  });
});
