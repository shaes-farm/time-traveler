import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getProfile } from "../../lib/auth";
import {
  getServerSupabaseClient,
  getServerUser,
} from "../auth/_lib/server-supabase";

/**
 * Admin route group gate. Belt-and-suspenders with `proxy.ts`'s edge-
 * level role check — the proxy stops most requests, but this layout
 * runs in the Node runtime where the same `role = 'admin'` check is a
 * defence against the proxy being misconfigured or skipped.
 *
 * Schema note: #36's text says `is_admin = true`. The profiles table
 * uses `role VARCHAR(20)` with values `'editor' | 'admin'`; this gate
 * follows the schema. Closing PR will flag the issue-vs-code mismatch.
 *
 * Admin pages are intentionally not shipped in Batch C — this is the
 * gate only. Product surface gets designed in a later batch.
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
