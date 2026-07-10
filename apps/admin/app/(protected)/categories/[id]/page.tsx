import { redirect } from "next/navigation";
import { getUser } from "../../../../lib/auth";
import { getServerSupabaseClient } from "../../../auth/_lib/server-supabase";
import { EditCategoryClient } from "../_components/edit-category-client";

export const metadata = {
  title: "Edit category",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Owner id resolved server-side (mirrors the layout) so the client hooks
  // build their (userId) query keys on first render without an auth round-trip.
  const client = await getServerSupabaseClient();
  const user = await getUser(client);
  if (!user) redirect("/auth/login");

  const { id } = await params;

  return <EditCategoryClient userId={user.id} id={id} />;
}
