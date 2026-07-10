import { redirect } from "next/navigation";
import { getServerUser } from "../../../auth/_lib/server-supabase";
import { CreateCategoryClient } from "../_components/create-category-client";

export const metadata = {
  title: "New category",
};

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  // Owner id resolved server-side (mirrors the layout) so the client hooks
  // build their (userId) query keys on first render. `?parent=<id>` seeds the
  // parent picker when creating a child from the tree. Request-memoized, so
  // this reuses the layout's lookup rather than repeating it.
  const user = await getServerUser();
  if (!user) redirect("/auth/login");

  const { parent } = await searchParams;

  return <CreateCategoryClient userId={user.id} parentId={parent ?? null} />;
}
