"use client";

import { usePathname } from "next/navigation";
import { startTransition, useEffect, type ReactNode } from "react";
import { Shell, type ShellUser } from "@repo/ui/components/shell";
import { useUiStore } from "@repo/ui/stores";
import { ShellLink } from "../../../components/shell-link";
import { NAV_ITEMS, QUICK_CREATE_ITEMS } from "../../../lib/nav";
import { signOutAction } from "../../auth/_actions";

interface ProtectedShellProps {
  user: ShellUser;
  children: ReactNode;
}

/**
 * Client wrapper that reads the current pathname (only available in
 * client land via `usePathname()`) and mounts the Shell. The Server
 * Component layout fetches the authenticated user and passes it in;
 * this component owns the Next-specific link adapter + pathname + the
 * sign-out Server Action handoff.
 */
export const ProtectedShell = ({ user, children }: ProtectedShellProps) => {
  const pathname = usePathname() ?? "/dashboard";

  // Auto-collapse the sidebar on first mount when the viewport is below
  // Tailwind's `lg` breakpoint (1024px). Runs only on mount; the user can
  // still toggle freely within the session afterwards. The toggle preference
  // persists via the Zustand store's localStorage middleware, so subsequent
  // loads on a wide viewport will reflect whatever state was last left in.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1023.98px)").matches) {
      useUiStore.setState({ sidebarOpen: false });
    }
  }, []);

  const handleSignOut = () => {
    startTransition(() => {
      void signOutAction();
    });
  };

  return (
    <Shell
      nav={NAV_ITEMS}
      currentPath={pathname}
      user={user}
      quickCreateItems={QUICK_CREATE_ITEMS}
      LinkComponent={ShellLink}
      onSignOut={handleSignOut}
    >
      {children}
    </Shell>
  );
};
