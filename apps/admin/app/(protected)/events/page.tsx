import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { EventListClient } from "./_components/event-list-client";

export const metadata = {
  title: "Events",
};

const loadingRowIds = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];

export default function EventsPage() {
  return (
    // Suspense is required because EventListClient calls useSearchParams(),
    // which opts the subtree into client rendering during the initial render.
    <Suspense
      fallback={
        <div className="p-6 space-y-2">
          {loadingRowIds.map((rowId) => (
            <Skeleton key={rowId} className="h-16 w-full rounded-md" />
          ))}
        </div>
      }
    >
      <EventListClient />
    </Suspense>
  );
}
