import { redirect } from "next/navigation";
import { getServerUser } from "../../../../auth/_lib/server-supabase";
import { StoryFormClient } from "../../_components/story-form-client";

interface EditStoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditStoryPage({ params }: EditStoryPageProps) {
  const { slug } = await params;

  // Resolve the owner id server-side (session already validated by the
  // protected layout) so the client hook can build its (userId, slug) query
  // key on first render without an auth round-trip / loading flash.
  const user = await getServerUser();
  if (!user) redirect("/auth/login");

  return <StoryFormClient mode="edit" userId={user.id} slug={slug} />;
}
