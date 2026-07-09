"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/services/supabase/types";
import type { TemporalData } from "@repo/services/schemas/temporal";

import { useTimelines } from "@repo/ui/hooks/use-timelines";
import {
  useAddPeriodToTimeline,
  useRemovePeriodFromTimeline,
} from "@repo/ui/hooks/use-periods";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";

type ServiceClient = SupabaseClient<Database>;

/**
 * The `period_timelines` junction surface — the timelines a period overlays
 * (wireframe 23 #3). Titles/spans are resolved against the user's timelines
 * list; add/remove write the junction directly.
 */
export function PeriodTimelinesTab({
  client,
  periodId,
  userId,
  canEdit,
  overlaidTimelineIds,
  onMutated,
}: {
  client: ServiceClient;
  periodId: string;
  userId: string;
  canEdit: boolean;
  overlaidTimelineIds: string[];
  onMutated: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const { data: timelines = [], isPending } = useTimelines(
    client,
    { userId, pageSize: 100 },
    { enabled: userId !== "" },
  );

  const addTimeline = useAddPeriodToTimeline(client);
  const removeTimeline = useRemovePeriodFromTimeline(client);

  const overlaidSet = React.useMemo(
    () => new Set(overlaidTimelineIds),
    [overlaidTimelineIds],
  );
  const overlaid = React.useMemo(
    () => timelines.filter((t) => overlaidSet.has(t.id)),
    [timelines, overlaidSet],
  );
  const addable = React.useMemo(
    () => timelines.filter((t) => !overlaidSet.has(t.id)),
    [timelines, overlaidSet],
  );

  function handleAdd(timelineId: string) {
    setOpen(false);
    addTimeline.mutate(
      { periodId, timelineId },
      {
        onSuccess: () => {
          toast.success("Timeline overlaid.");
          onMutated();
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to add."),
      },
    );
  }

  function handleRemove(timelineId: string) {
    removeTimeline.mutate(
      { periodId, timelineId },
      {
        onSuccess: () => {
          toast.success("Timeline removed.");
          onMutated();
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to remove."),
      },
    );
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Overlay a timeline
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search timelines…" />
              <CommandList>
                <CommandEmpty>
                  {isPending ? "Loading…" : "No timelines available."}
                </CommandEmpty>
                <CommandGroup>
                  {addable.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`${t.title} ${t.id}`}
                      onSelect={() => handleAdd(t.id)}
                    >
                      {t.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {overlaid.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground-muted">
          This period overlays no timelines yet. Overlay one to place this span
          onto its canvas.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {overlaid.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left hover:opacity-80"
                onClick={() => router.push(`/timelines/${t.id}`)}
              >
                <span className="block truncate text-sm text-foreground">
                  {t.title}
                </span>
                {t.temporal_data && (
                  <span className="text-xs text-foreground-muted">
                    <TemporalDisplay
                      value={t.temporal_data as TemporalData}
                      endValue={
                        (t.end_temporal_data as TemporalData | null) ??
                        undefined
                      }
                      format="compact"
                    />
                  </span>
                )}
              </button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 shrink-0 p-0"
                  aria-label={`Remove ${t.title}`}
                  onClick={() => handleRemove(t.id)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
