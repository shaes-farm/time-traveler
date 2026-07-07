import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@repo/ui/components/skeleton";
import { getUser } from "../../../../lib/auth";
import { getServerSupabaseClient } from "../../../auth/_lib/server-supabase";
import { StoryDetailClient } from "./_components/story-detail-client";

export const metadata = {
  title: "Story",
};

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Resolve the owner id server-side (session already validated by the
  // protected layout) so the client hook can build its (userId, slug) query
  // key on first render without an auth round-trip / loading flash.
  const client = await getServerSupabaseClient();
  const user = await getUser(client);
  if (!user) redirect("/auth/login");

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="mt-6 space-y-2">
            {[1, 2, 3, 4].map((step) => (
              <Skeleton key={step} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>
      }
    >
      <StoryDetailClient userId={user.id} slug={slug} />
    </Suspense>
  );
}
