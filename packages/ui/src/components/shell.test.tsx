import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { useUiStore } from "@repo/ui/stores";

import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";

const NAV: ShellNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: ({ className }) => <svg className={className} />,
  },
  {
    label: "Characters",
    href: "/characters",
    icon: ({ className }) => <svg className={className} />,
  },
  {
    label: "Events",
    href: "/events",
    icon: ({ className }) => <svg className={className} />,
  },
];

const QUICK_CREATE: ShellQuickCreateItem[] = [
  { label: "Character", href: "/characters/new" },
  { label: "Event", href: "/events/new" },
];

const USER = { name: "Admin User", email: "admin@example.com" };

function renderShell(
  overrides: Partial<React.ComponentProps<typeof Shell>> = {},
) {
  return render(
    <Shell
      nav={NAV}
      currentPath="/characters/marie-curie"
      user={USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Characters", href: "/characters" },
        { label: "Marie Curie" },
      ]}
      {...overrides}
    >
      <div>Content</div>
    </Shell>,
  );
}

describe("Shell", () => {
  beforeEach(() => {
    useUiStore.setState({
      sidebarOpen: true,
      sidebarWidth: 280,
      activeModal: null,
      modalData: {},
      toasts: [],
    });
  });

  it("renders breadcrumbs and marks the active nav item", () => {
    renderShell();

    expect(screen.getAllByRole("link", { name: "Characters" })[0]).toHaveClass(
      "bg-surface-2",
    );
    expect(screen.getByText("Marie Curie")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("collapses and expands the sidebar from the footer action", async () => {
    const user = userEvent.setup();
    renderShell();

    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });
    await user.click(toggle);

    expect(useUiStore.getState().sidebarOpen).toBe(false);
    expect(
      screen.getByRole("button", { name: /expand sidebar/i }),
    ).toBeInTheDocument();
  });

  it("opens the user menu and calls sign-out", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    renderShell({ onSignOut });

    await user.click(screen.getByRole("button", { name: /open user menu/i }));
    await user.click(
      await screen.findByRole("menuitem", { name: /sign out/i }),
    );

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("opens the quick create menu and exposes entity links", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: /quick create/i }));

    expect(
      await screen.findByRole("menuitem", { name: /character/i }),
    ).toHaveAttribute("href", "/characters/new");
  });
});
