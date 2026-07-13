import { redirect } from "next/navigation";
import { getServerUser } from "../../../../auth/_lib/server-supabase";
import { PeriodFormClient } from "../../_components/period-form-client";

interface EditPeriodPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPeriodPage({ params }: EditPeriodPageProps) {
  const { slug } = await params;

  // Resolve the owner id server-side (session already validated by the
  // protected layout) so the client hook can build its (userId, slug) query
  // key on first render without an auth round-trip / loading flash.
  const user = await getServerUser();
  if (!user) redirect("/auth/login");

  return <PeriodFormClient mode="edit" userId={user.id} slug={slug} />;
}
