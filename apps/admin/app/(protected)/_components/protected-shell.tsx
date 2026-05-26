"use client";

import { usePathname } from "next/navigation";
import { startTransition, type ReactNode } from "react";
import { Shell, type ShellUser } from "@repo/ui/components/shell";
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
