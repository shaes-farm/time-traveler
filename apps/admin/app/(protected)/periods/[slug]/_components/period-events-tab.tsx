"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/services/supabase/types";
import type { TemporalData } from "@repo/services/schemas/temporal";

import { useEventsInPeriod } from "@repo/ui/hooks/use-periods";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";

type ServiceClient = SupabaseClient<Database>;

const PAGE_SIZE = 25;

/**
 * Events-in-range: the events whose date falls within this period's span
 * (span-overlay model — computed by date, not linked). Read-only. A scope
 * toggle limits results to the overlaid timelines vs. all events in range
 * (wireframe 23 #4). The list is paginated because a wide (e.g. BYA) span can
 * return many rows.
 */
export function PeriodEventsTab({
  client,
  periodId,
  hasOverlays,
}: {
  client: ServiceClient;
  periodId: string;
  hasOverlays: boolean;
}) {
  const router = useRouter();
  // Default to timeline-scoped when the period overlays something (it is
  // contextualising those canvases); otherwise all-in-range.
  const [scoped, setScoped] = React.useState(hasOverlays);
  const [page, setPage] = React.useState(0);

  // Reset paging whenever the scope changes.
  const [prevScoped, setPrevScoped] = React.useState(scoped);
  if (scoped !== prevScoped) {
    setPrevScoped(scoped);
    setPage(0);
  }

  const { data: events = [], isPending } = useEventsInPeriod(client, periodId, {
    timelineScoped: scoped,
  });

  const total = events.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageEvents = events.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted">
          Computed by date — events are not linked to periods (span-overlay
          model).
        </p>
        <div
          role="radiogroup"
          aria-label="Event scope"
          className="flex items-center gap-1 rounded-md border border-border p-0.5 text-xs"
        >
          <button
            type="button"
            role="radio"
            aria-checked={scoped}
            disabled={!hasOverlays}
            onClick={() => setScoped(true)}
            className={
              scoped
                ? "rounded bg-surface-2 px-2 py-1 text-foreground"
                : "rounded px-2 py-1 text-foreground-muted hover:text-foreground disabled:opacity-40"
            }
          >
            On overlaid timelines
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!scoped}
            onClick={() => setScoped(false)}
            className={
              !scoped
                ? "rounded bg-surface-2 px-2 py-1 text-foreground"
                : "rounded px-2 py-1 text-foreground-muted hover:text-foreground"
            }
          >
            All in range
          </button>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {["a", "b", "c"].map((k) => (
            <Skeleton key={k} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="py-6 text-center text-sm text-foreground-muted">
          {scoped && hasOverlays
            ? "No events on the overlaid timelines fall within this span."
            : "No events fall within this span yet."}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-md border border-border">
            {pageEvents.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2/50"
                  onClick={() => router.push(`/events/${ev.slug}`)}
                >
                  <span className="w-28 shrink-0 text-xs text-foreground-muted">
                    {ev.temporal_data && (
                      <TemporalDisplay
                        value={ev.temporal_data as TemporalData}
                        format="compact"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {ev.title}
                  </span>
                  {ev.event_type && (
                    <span className="shrink-0 text-xs text-foreground-muted">
                      {ev.event_type}
                    </span>
                  )}
                  {ev.importance !== null && (
                    <span
                      className="shrink-0 text-xs tabular-nums text-foreground-muted"
                      title={`Importance ${ev.importance}`}
                    >
                      ★{ev.importance}
                    </span>
                  )}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-foreground-muted"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}{" "}
                of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded px-2 py-1 hover:text-foreground disabled:opacity-40"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span>
                  {page + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  className="rounded px-2 py-1 hover:text-foreground disabled:opacity-40"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
