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

  it("accepts a custom tagline", () => {
    render(
      <ReaderFooter
        links={LINKS}
        tagline="Everything has a history, and every history deserves to be explored."
      />,
    );
    expect(
      screen.getByText(/every history deserves to be explored/i),
    ).toBeInTheDocument();
  });

  it("keeps the live dot hidden by default and shows it when driven", () => {
    const { container, rerender } = render(<ReaderFooter links={LINKS} />);
    expect(container.querySelector("span[data-state]")).toHaveAttribute(
      "data-state",
      "hidden",
    );
    rerender(<ReaderFooter links={LINKS} liveState="subscribed" />);
    expect(container.querySelector("span[data-state]")).toHaveAttribute(
      "data-state",
      "subscribed",
    );
  });
});
