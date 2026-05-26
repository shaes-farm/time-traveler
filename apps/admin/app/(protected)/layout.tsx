"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "@repo/ui/components/shell";
import { ShellLink } from "../../components/shell-link";
import { NAV_ITEMS, QUICK_CREATE_ITEMS } from "../../lib/nav";

/**
 * Protected-route layout. Mounts the Shell chrome around every page in
 * the `(protected)` route group.
 *
 * Batch B ships chrome only — placeholder user, inert sign-out, no real
 * session check. The session gate + real user lands in Batch C (Supabase
 * Auth + `proxy.ts`) and Batch D (auth UI). The placeholder is the
 * "visible affordance" the wireframes call for, not a security boundary.
 */
const PLACEHOLDER_USER = {
  name: "Marie Curie",
  email: "marie@example.com",
};

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/dashboard";
  return (
    <Shell
      nav={NAV_ITEMS}
      currentPath={pathname}
      user={PLACEHOLDER_USER}
      quickCreateItems={QUICK_CREATE_ITEMS}
      LinkComponent={ShellLink}
    >
      {children}
    </Shell>
  );
}
