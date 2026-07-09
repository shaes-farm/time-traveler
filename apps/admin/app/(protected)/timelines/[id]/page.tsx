import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TimelineDetailClient } from "./_components/timeline-detail-client";

export const metadata = {
  title: "Timeline",
};

export default async function TimelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="mt-6 space-y-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <Skeleton key={step} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>
      }
    >
      <TimelineDetailClient id={id} />
    </Suspense>
  );
}
