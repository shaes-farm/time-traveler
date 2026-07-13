import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { ShellUser } from "@repo/ui/components/shell";
import { getProfile } from "../../lib/auth";
import {
  getServerSupabaseClient,
  getServerUser,
} from "../auth/_lib/server-supabase";
import { ProtectedShell } from "./_components/protected-shell";

/**
 * Protected-route layout (Server Component). Validates the session and
 * loads the profile so the Shell can render the real user. The proxy
 * already redirects unauthenticated requests to /auth/login; the
 * redundant guard here protects against proxy mis-configuration.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();
  if (!user || !user.email) redirect("/auth/login");

  const client = await getServerSupabaseClient();
  const profile = await getProfile(client, user.id);
  const shellUser: ShellUser = {
    name: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
    email: user.email,
  };

  return <ProtectedShell user={shellUser}>{children}</ProtectedShell>;
}
