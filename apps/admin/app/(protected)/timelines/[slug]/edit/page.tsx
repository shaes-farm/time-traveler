import { redirect } from "next/navigation";
import { getUser } from "../../../../../lib/auth";
import { getServerSupabaseClient } from "../../../../auth/_lib/server-supabase";
import { TimelineFormClient } from "../../_components/timeline-form-client";

interface EditTimelinePageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditTimelinePage({
  params,
}: EditTimelinePageProps) {
  const { slug } = await params;

  // Resolve the owner id server-side (session already validated by the
  // protected layout) so the client hook can build its (userId, slug) query
  // key on first render without an auth round-trip / loading flash.
  const client = await getServerSupabaseClient();
  const user = await getUser(client);
  if (!user) redirect("/auth/login");

  return <TimelineFormClient mode="edit" userId={user.id} slug={slug} />;
}
