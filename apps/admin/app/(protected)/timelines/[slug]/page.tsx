import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TimelineDetailClient } from "./_components/timeline-detail-client";

export const metadata = {
  title: "Timeline",
};

export default async function TimelineDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>
      }
    >
      <TimelineDetailClient slug={slug} />
    </Suspense>
  );
}
