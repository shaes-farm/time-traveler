import { redirect } from "next/navigation";
import { getServerUser } from "../../auth/_lib/server-supabase";
import { CategoryManagerShell } from "./_components/category-manager-shell";

export const metadata = {
  title: "Categories",
};

export default async function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve the owner id server-side (session already validated by the
  // protected layout) so the tree/usage hooks can build their (userId) query
  // keys on first render without an auth round-trip / loading flash. The shell
  // is the persistent left pane; `children` is the inspector for the active
  // nested route (empty / create / edit). `getServerUser` is request-memoized,
  // so the nested page's own lookup reuses this one.
  const user = await getServerUser();
  if (!user) redirect("/auth/login");

  return (
    <CategoryManagerShell userId={user.id}>{children}</CategoryManagerShell>
  );
}
