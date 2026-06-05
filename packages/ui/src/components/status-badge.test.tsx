import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("defaults to Draft when no status is provided", () => {
    render(<StatusBadge data-testid="badge" />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("Draft");
    expect(badge.className).toContain("bg-surface-2");
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("renders the published variant", () => {
    render(<StatusBadge status="published" data-testid="badge" />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("Published");
    expect(badge.className).toContain("bg-emerald-500/10");
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("renders the shared variant", () => {
    render(<StatusBadge status="shared" data-testid="badge" />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("Shared");
    expect(badge.className).toContain("bg-sky-500/10");
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("uses a custom label when provided", () => {
    render(
      <StatusBadge status="published" label="Live now" data-testid="badge" />,
    );

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("Live now");
    expect(badge).not.toHaveTextContent("Published");
  });
});
