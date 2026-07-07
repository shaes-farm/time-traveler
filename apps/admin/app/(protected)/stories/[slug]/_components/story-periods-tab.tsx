"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/services/supabase/types";
import type { TemporalData } from "@repo/services/schemas/temporal";
import type { StoryWithRelations } from "@repo/services/story-service";
import {
  useAddPeriodToStory,
  useRemovePeriodFromStory,
} from "@repo/ui/hooks/use-stories";
import { usePeriods } from "@repo/ui/hooks/use-periods";
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
type StoryPeriodRow = NonNullable<StoryWithRelations["story_periods"]>[number];
type PeriodInfo = {
  title: string;
  slug: string;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData | null;
};

export function StoryPeriodsTab({
  client,
  storyId,
  userId,
  canEdit,
  storyPeriods,
  onMutated,
}: {
  client: ServiceClient;
  storyId: string;
  userId: string;
  canEdit: boolean;
  storyPeriods: StoryPeriodRow[];
  onMutated: () => void;
}) {
  const router = useRouter();
  const { data: periods = [], isPending } = usePeriods(
    client,
    { userId, pageSize: 100 },
    { enabled: userId !== "" },
  );

  const infoMap = React.useMemo(() => {
    const map = new Map<string, PeriodInfo>();
    for (const p of periods) {
      map.set(p.id, {
        title: p.title,
        slug: p.slug,
        temporal_data: p.temporal_data as TemporalData,
        end_temporal_data: (p.end_temporal_data as TemporalData | null) ?? null,
      });
    }
    return map;
  }, [periods]);

  const addPeriod = useAddPeriodToStory(client);
  const removePeriod = useRemovePeriodFromStory(client);

  const linkedIds = React.useMemo(
    () => new Set(storyPeriods.map((sp) => sp.period_id)),
    [storyPeriods],
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const candidates = periods.filter((p) => !linkedIds.has(p.id));

  function handleAdd(periodId: string) {
    addPeriod.mutate(
      { storyId, periodId },
      {
        onSuccess: () => {
          toast.success("Period added to story.");
          onMutated();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Couldn't add period.",
          ),
      },
    );
  }

  function handleRemove(periodId: string) {
    removePeriod.mutate(
      { storyId, periodId },
      {
        onSuccess: () => {
          toast.success("Period removed from story.");
          onMutated();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Couldn't remove period.",
          ),
      },
    );
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus className="mr-1.5 h-4 w-4" />
                Add period
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search periods…" />
                <CommandList>
                  <CommandEmpty>
                    {isPending ? "Loading…" : "No periods found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {candidates.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={p.title}
                        onSelect={() => {
                          handleAdd(p.id);
                          setPickerOpen(false);
                        }}
                      >
                        {p.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {storyPeriods.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <p className="text-sm">No periods associated with this story.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {storyPeriods.map((sp) => {
            const info = infoMap.get(sp.period_id);
            return (
              <div
                key={sp.period_id}
                className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  {info ? (
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      onClick={() => router.push(`/periods/${info.slug}`)}
                    >
                      {info.title}
                    </button>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      {sp.period_id}
                    </span>
                  )}
                </div>
                {info && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <TemporalDisplay
                      value={info.temporal_data}
                      endValue={info.end_temporal_data ?? undefined}
                      format="compact"
                    />
                  </span>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemove(sp.period_id)}
                    aria-label="Remove period"
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
