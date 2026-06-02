import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TimelineListClient } from "./_components/timeline-list-client";

export const metadata = {
  title: "Timelines",
};

export default function TimelinesPage() {
  return (
    // Suspense is required because TimelineListClient calls useSearchParams(),
    // which opts the subtree into client rendering during the initial render.
    <Suspense
      fallback={
        <div className="p-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      }
    >
      <TimelineListClient />
    </Suspense>
  );
}
