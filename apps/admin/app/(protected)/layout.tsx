import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { ShellUser } from "@repo/ui/components/shell";
import { getUser, getProfile } from "../../lib/auth";
import { getServerSupabaseClient } from "../auth/_lib/server-supabase";
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
  const client = await getServerSupabaseClient();
  const user = await getUser(client);
  if (!user || !user.email) redirect("/auth/login");

  const profile = await getProfile(client, user.id);
  const shellUser: ShellUser = {
    name: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
    email: user.email,
  };

  return <ProtectedShell user={shellUser}>{children}</ProtectedShell>;
}
