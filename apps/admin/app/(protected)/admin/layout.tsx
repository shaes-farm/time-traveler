import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getProfile } from "../../../lib/auth";
import {
  getServerSupabaseClient,
  getServerUser,
} from "../../auth/_lib/server-supabase";

/**
 * Gate for admin-only surfaces (`profiles.role = 'admin'`).
 *
 * ## Why this lives under `(protected)/admin/` and not a route group
 *
 * `proxy.ts` gates on the **URL prefix** `/admin`. Next route groups do not
 * appear in URLs, so a page under a bare `(admin)` group resolves to a path
 * with no `/admin` segment and the edge role check never fires — the gate
 * silently does nothing. Nesting a real `admin/` segment inside `(protected)`
 * gives all three at once:
 *
 *   1. `proxy.ts` matches the URL prefix and checks the role at the edge;
 *   2. this layout re-checks in the Node runtime, so a misconfigured or
 *      skipped proxy is not a bypass;
 *   3. the page inherits `ProtectedShell`, so admin surfaces keep the sidebar.
 *
 * This supersedes the former `app/(admin)/layout.tsx`, which guarded a route
 * group that never held a page. See ADR-0041.
 *
 * `getServerUser` / `getServerSupabaseClient` are React-`cache()`d and the
 * parent `(protected)` layout has already called both, so the redundant checks
 * here cost no extra round trip.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();
  if (!user) redirect("/auth/login");

  const client = await getServerSupabaseClient();
  const profile = await getProfile(client, user.id);
  if (profile?.role !== "admin") {
    redirect("/dashboard?error=forbidden");
  }

  return <>{children}</>;
}
