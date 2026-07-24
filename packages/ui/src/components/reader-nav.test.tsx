import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderNav, type ReaderNavItem } from "./reader-nav";

const SearchIcon = ({ className }: { className?: string }) => (
  <svg data-testid="search-icon" className={className} />
);

const ITEMS: ReaderNavItem[] = [
  { label: "Explore", href: "/explore" },
  { label: "Stories", href: "/stories" },
  { label: "Search", href: "/search", icon: SearchIcon },
];

const renderNav = (currentPath = "/explore") =>
  render(
    <ReaderNav
      items={ITEMS}
      currentPath={currentPath}
      signInHref="https://admin.example/auth/login"
    />,
  );

describe("ReaderNav", () => {
  it("exposes banner + primary navigation landmarks", () => {
    renderNav();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /primary/i }),
    ).toBeInTheDocument();
  });

  it("renders exactly the three reader destinations", () => {
    renderNav();
    const nav = screen.getByRole("navigation", { name: /primary/i });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual([
      "Explore",
      "Stories",
      "Search",
    ]);
  });

  it("marks the active route with aria-current=page", () => {
    renderNav("/stories");
    expect(screen.getByRole("link", { name: "Stories" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Explore" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("treats nested routes as active for their section", () => {
    renderNav("/explore/some-timeline");
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks the brand current only on the home route", () => {
    renderNav("/");
    expect(
      screen.getByRole("link", { name: /time traveler — home/i }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("renders Sign in as a deep-link out to the provided href", () => {
    renderNav();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "https://admin.example/auth/login",
    );
  });

  it("marks the sign-in arrow decorative so the accessible name stays clean", () => {
    renderNav();
    const signIn = screen.getByRole("link", { name: "Sign in" });
    const arrow = signIn.querySelector("span[aria-hidden]");
    expect(arrow).toHaveTextContent("→");
  });

  it("renders an item's leading icon when provided", () => {
    renderNav();
    const search = screen.getByRole("link", { name: "Search" });
    expect(within(search).getByTestId("search-icon")).toBeInTheDocument();
    const explore = screen.getByRole("link", { name: "Explore" });
    expect(explore.querySelector("svg")).toBeNull();
  });

  it("hides the live dot by default", () => {
    const { container } = renderNav();
    expect(container.querySelector("span[data-state]")).toHaveAttribute(
      "data-state",
      "hidden",
    );
  });
});
