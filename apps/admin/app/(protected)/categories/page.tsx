import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@repo/ui/components/skeleton";
import { getUser } from "../../../lib/auth";
import { getServerSupabaseClient } from "../../auth/_lib/server-supabase";
import { CategoryManagerClient } from "./_components/category-manager-client";

export const metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  // Resolve the owner id server-side (session already validated by the
  // protected layout) so the tree/usage hooks can build their (userId) query
  // keys on first render without an auth round-trip / loading flash.
  const client = await getServerSupabaseClient();
  const user = await getUser(client);
  if (!user) redirect("/auth/login");

  return (
    // Suspense: CategoryManagerClient calls useSearchParams() (the ?new=1
    // quick-create deep link), which opts the subtree into client rendering.
    <Suspense
      fallback={
        <div className="space-y-2 p-6">
          {["s1", "s2", "s3", "s4", "s5"].map((id) => (
            <Skeleton key={id} className="h-8 w-full rounded-md" />
          ))}
        </div>
      }
    >
      <CategoryManagerClient userId={user.id} />
    </Suspense>
  );
}
