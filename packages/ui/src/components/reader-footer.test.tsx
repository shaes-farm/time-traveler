import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderFooter, type ReaderFooterLink } from "./reader-footer";

const LINKS: ReaderFooterLink[] = [
  { label: "About", href: "/about" },
  {
    label: "Sign in",
    href: "https://admin.example/auth/login",
    external: true,
  },
  { label: "Legal", href: "/legal" },
];

describe("ReaderFooter", () => {
  it("renders a contentinfo landmark with the brand + tagline", () => {
    render(<ReaderFooter links={LINKS} />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    expect(
      within(footer).getByText(/an immersive temporal reader/i),
    ).toBeInTheDocument();
  });

  it("renders every footer link", () => {
    render(<ReaderFooter links={LINKS} />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getAllByRole("link")).toHaveLength(3);
    expect(within(footer).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("renders external links as plain anchors with their href", () => {
    render(<ReaderFooter links={LINKS} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "https://admin.example/auth/login",
    );
  });
});
