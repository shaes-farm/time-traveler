import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("targets the main landmark by default and is sr-only until focused", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to content/i });
    expect(link).toHaveAttribute("href", "#main-content");
    expect(link).toHaveClass("sr-only");
    expect(link).toHaveClass("focus-visible:not-sr-only");
  });

  it("honors a custom target id and label", () => {
    render(<SkipLink targetId="reader-main">Jump to reader</SkipLink>);
    expect(
      screen.getByRole("link", { name: /jump to reader/i }),
    ).toHaveAttribute("href", "#reader-main");
  });
});
