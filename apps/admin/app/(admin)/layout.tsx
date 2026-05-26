import type { ReactNode } from "react";

/**
 * Admin route group. Real gate lives in `proxy.ts` (Batch C / #36),
 * which checks `profiles.is_admin = true` server-side. This layout is a
 * structural placeholder so the route group resolves and Batch C has
 * something to wire — `(admin)/*` pages reuse `(protected)/*`'s Shell
 * by living inside it via parallel route mounting in a later batch.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
