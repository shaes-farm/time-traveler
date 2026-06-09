import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { EventDetailClient } from "./_components/event-detail-client";

export const metadata = {
  title: "Event",
};

export default async function EventDetailPage({
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
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-48 w-full rounded-md" />
          </div>
        </div>
      }
    >
      <EventDetailClient slug={slug} />
    </Suspense>
  );
}
