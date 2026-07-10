import { redirect } from "next/navigation";
import { getServerUser } from "../../../../auth/_lib/server-supabase";
import { CharacterFormClient } from "../../_components/character-form-client";

interface EditCharacterPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditCharacterPage({
  params,
}: EditCharacterPageProps) {
  const { slug } = await params;

  // Resolve the owner id server-side (session already validated by the
  // protected layout) so the client hook can build its (userId, slug) query
  // key on first render without an auth round-trip / loading flash.
  const user = await getServerUser();
  if (!user) redirect("/auth/login");

  return <CharacterFormClient mode="edit" userId={user.id} slug={slug} />;
}
