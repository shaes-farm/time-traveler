"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, type ReactNode } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
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
  const router = useRouter();

  // Global unsaved-changes guard for shell navigation. `ShellLink` cancels the
  // client-side navigation and stashes the target here when any editor is dirty;
  // this dialog resolves it. See lib/use-register-unsaved-changes.ts.
  const pendingNavigation = useUiStore((s) => s.pendingNavigation);
  const cancelShellNavigate = useUiStore((s) => s.cancelShellNavigate);
  const confirmShellNavigate = useUiStore((s) => s.confirmShellNavigate);

  const handleDiscard = () => {
    const href = pendingNavigation;
    // Clear dirty flags + pending href first, then push in this handler — never
    // inside a state updater, which would navigate mid-render.
    confirmShellNavigate();
    if (href) router.push(href);
  };

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
    <>
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

      {/* Global discard-changes confirmation for app-shell navigation. */}
      <Dialog
        open={pendingNavigation !== null}
        onOpenChange={(open) => {
          if (!open) cancelShellNavigate();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Leaving now will lose them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={cancelShellNavigate}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
