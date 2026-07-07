"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/services/supabase/types";
import type { TemporalData } from "@repo/services/schemas/temporal";
import {
  useStoryEvents,
  useAddEventToStory,
  useRemoveEventFromStory,
  useReorderStoryEvent,
} from "@repo/ui/hooks/use-stories";
import { useEvents } from "@repo/ui/hooks/use-events";
import { toast } from "@repo/ui/components/sonner";
import { Badge } from "@repo/ui/components/badge";
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
import { Skeleton } from "@repo/ui/components/skeleton";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import type { StoryEventWithOrder } from "@repo/services/story-service";

type ServiceClient = SupabaseClient<Database>;

function EventRow({
  event,
  index,
  total,
  canEdit,
  onMoveUp,
  onMoveDown,
  onRemove,
  onOpen,
}: {
  event: StoryEventWithOrder;
  index: number;
  total: number;
  canEdit: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen: (slug: string) => void;
}) {
  const importance = event.importance ?? 0;
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/30">
      {/* Narrative order index */}
      <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {index + 1}
      </span>

      {canEdit && (
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(event.id)}
            aria-label="Move up"
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMoveDown(event.id)}
            aria-label="Move down"
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Chronological date, shown alongside the narrative index so flashbacks
          stay legible. */}
      <div className="w-28 shrink-0 text-xs text-muted-foreground">
        <TemporalDisplay
          value={event.temporal_data as TemporalData}
          format="compact"
        />
      </div>

      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline"
        onClick={() => onOpen(event.slug)}
        title={event.title}
      >
        {event.title}
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        {event.event_type && (
          <Badge variant="outline" className="text-xs capitalize">
            {event.event_type}
          </Badge>
        )}
        {importance > 0 && (
          <span
            className="font-mono text-xs tracking-tighter text-yellow-500"
            title={`Importance: ${importance}/10`}
          >
            ★{importance}
          </span>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => onRemove(event.id)}
            aria-label="Remove from story"
            className="ml-1 rounded p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddEventPicker({
  client,
  userId,
  linkedIds,
  onAdd,
}: {
  client: ServiceClient;
  userId: string;
  linkedIds: Set<string>;
  onAdd: (eventId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const { data: events = [], isPending } = useEvents(
    client,
    { userId, pageSize: 100 },
    { enabled: userId !== "" && open },
  );
  const candidates = events.filter((e) => !linkedIds.has(e.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="secondary">
          <Plus className="mr-1.5 h-4 w-4" />
          Add event
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search events…" />
          <CommandList>
            <CommandEmpty>
              {isPending ? "Loading…" : "No events found."}
            </CommandEmpty>
            <CommandGroup>
              {candidates.map((event) => (
                <CommandItem
                  key={event.id}
                  value={event.title}
                  onSelect={() => {
                    onAdd(event.id);
                    setOpen(false);
                  }}
                >
                  {event.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function StoryEventsTab({
  client,
  storyId,
  userId,
  canEdit,
  onMutated,
}: {
  client: ServiceClient;
  storyId: string;
  userId: string;
  canEdit: boolean;
  /** Refresh the parent's bySlug story so the tab's "(N)" count stays in sync. */
  onMutated: () => void;
}) {
  const router = useRouter();
  const { data: events = [], isPending } = useStoryEvents(client, storyId);

  const addEvent = useAddEventToStory(client);
  const removeEvent = useRemoveEventFromStory(client);
  const reorderEvent = useReorderStoryEvent(client);

  // Local order for a snappy reorder UI; re-synced whenever the query data
  // changes (e.g. after add/remove or a background refetch).
  const [localEvents, setLocalEvents] = React.useState<StoryEventWithOrder[]>(
    [],
  );
  const [prevKey, setPrevKey] = React.useState<string>("");
  const dataKey = events.map((e) => e.id).join(",");
  if (dataKey !== prevKey) {
    setPrevKey(dataKey);
    setLocalEvents(events);
  }

  const linkedIds = React.useMemo(
    () => new Set(localEvents.map((e) => e.id)),
    [localEvents],
  );

  function persistOrder(next: StoryEventWithOrder[]) {
    setLocalEvents(next);
    // Assign a 1-based editorial sort_order to every event (mirrors the
    // timeline detail's reorder). Narrative order is the whole point here.
    next.forEach((event, idx) => {
      reorderEvent.mutate({ storyId, eventId: event.id, sortOrder: idx + 1 });
    });
  }

  function handleMoveUp(eventId: string) {
    const idx = localEvents.findIndex((e) => e.id === eventId);
    if (idx <= 0) return;
    const next = [...localEvents];
    const [item] = next.splice(idx, 1);
    next.splice(idx - 1, 0, item!);
    persistOrder(next);
  }

  function handleMoveDown(eventId: string) {
    const idx = localEvents.findIndex((e) => e.id === eventId);
    if (idx < 0 || idx >= localEvents.length - 1) return;
    const next = [...localEvents];
    const [item] = next.splice(idx, 1);
    next.splice(idx + 1, 0, item!);
    persistOrder(next);
  }

  function handleAdd(eventId: string) {
    // Append at the end of the current narrative order.
    const nextOrder =
      localEvents.reduce((max, e) => Math.max(max, e.junction_sort_order), 0) +
      1;
    addEvent.mutate(
      { storyId, eventId, sortOrder: nextOrder },
      {
        onSuccess: () => {
          toast.success("Event added to story.");
          onMutated();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Couldn't add event.",
          ),
      },
    );
  }

  function handleRemove(eventId: string) {
    removeEvent.mutate(
      { storyId, eventId },
      {
        onSuccess: () => {
          toast.success("Event removed from story.");
          onMutated();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Couldn't remove event.",
          ),
      },
    );
  }

  if (isPending) {
    return (
      <div className="space-y-2 p-1">
        {[1, 2, 3].map((step) => (
          <Skeleton key={step} className="h-14 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <AddEventPicker
            client={client}
            userId={userId}
            linkedIds={linkedIds}
            onAdd={handleAdd}
          />
        </div>
      )}

      {localEvents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <p className="text-sm">
            No events in this story yet. A story is the order you tell them in.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {localEvents.map((event, idx) => (
            <EventRow
              key={event.id}
              event={event}
              index={idx}
              total={localEvents.length}
              canEdit={canEdit}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onRemove={handleRemove}
              onOpen={(slug) => router.push(`/events/${slug}`)}
            />
          ))}
        </div>
      )}

      {localEvents.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          {localEvents.length} event{localEvents.length !== 1 ? "s" : ""} ·
          narrative order
        </p>
      )}
    </div>
  );
}
