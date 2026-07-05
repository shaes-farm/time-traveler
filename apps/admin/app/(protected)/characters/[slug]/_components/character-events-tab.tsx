"use client";

import * as React from "react";
import { ArrowDownUp, CornerRightDown, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { getEvents } from "@repo/services/event-service";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/sonner";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import {
  useCharacterTimeline,
  characterKeys,
} from "@repo/ui/hooks/use-characters";
import { useAddCharacterToEvent } from "@repo/ui/hooks/use-events";

type ServiceClient = Parameters<typeof useCharacterTimeline>[0];

interface CharacterEventsTabProps {
  client: ServiceClient;
  characterId: string;
  canEdit: boolean;
  /** Birth/death temporal markers that bookend the participation list. */
  birthTemporal: TemporalData | null;
  deathTemporal: TemporalData | null;
}

function humanize(value: string | null): string {
  return value ? value.replace(/_/g, " ") : "";
}

// A non-clickable birth/death context marker framing the lifespan.
function GhostMarker({ label, value }: { label: string; value: TemporalData }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground italic">
      <CornerRightDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="w-32 shrink-0">
        <TemporalDisplay value={value} format="compact" />
      </span>
      <span>{label} (referenced)</span>
    </div>
  );
}

export function CharacterEventsTab({
  client,
  characterId,
  canEdit,
  birthTemporal,
  deathTemporal,
}: CharacterEventsTabProps) {
  const {
    data: rows = [],
    isPending,
    isError,
    refetch,
  } = useCharacterTimeline(client, characterId, {
    enabled: !!characterId,
  });

  const [reverse, setReverse] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);

  // The view is already sorted chronologically (sort_order_years asc); reverse
  // just flips it. Copy before reversing to avoid mutating the query cache.
  const ordered = reverse ? [...rows].reverse() : rows;
  const existingEventIds = React.useMemo(
    () =>
      new Set(rows.map((r) => r.event_id).filter((id): id is string => !!id)),
    [rows],
  );

  if (isPending) {
    return (
      <div className="space-y-2 p-1">
        {[1, 2, 3].map((step) => (
          <Skeleton key={step} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-8 text-center"
      >
        <p className="text-sm text-destructive">
          Failed to load event participation.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Participating events ({rows.length})
        </p>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReverse((v) => !v)}
            >
              <ArrowDownUp className="mr-1.5 h-4 w-4" />
              {reverse ? "Reverse" : "Chronological"}
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add to event
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <p className="text-sm">
            This character doesn&apos;t participate in any events yet.
          </p>
          {canEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add to event
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {/* Birth marker bookends the top when chronological. */}
          {!reverse && birthTemporal && (
            <GhostMarker label="Birth" value={birthTemporal} />
          )}
          {reverse && deathTemporal && (
            <GhostMarker label="Death" value={deathTemporal} />
          )}

          {ordered.map((row) => (
            <div
              key={row.event_id ?? `${row.event_title}`}
              className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3"
            >
              <div className="w-32 shrink-0 text-xs text-muted-foreground">
                {row.temporal_data ? (
                  <TemporalDisplay
                    value={row.temporal_data as TemporalData}
                    format="compact"
                  />
                ) : (
                  "—"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {row.event_title ?? "Untitled event"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {row.role && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {humanize(row.role)}
                  </Badge>
                )}
                {row.significance && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {humanize(row.significance)}
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {!reverse && deathTemporal && (
            <GhostMarker label="Death" value={deathTemporal} />
          )}
          {reverse && birthTemporal && (
            <GhostMarker label="Birth" value={birthTemporal} />
          )}
        </div>
      )}

      <AddToEventDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        client={client}
        characterId={characterId}
        existingEventIds={existingEventIds}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add-to-event dialog — search an event and link this character to it.
// Role/significance are set from the event editor; this just creates the
// participation. Mirrors the timeline detail's LinkEventDialog.
// ---------------------------------------------------------------------------

interface AddToEventDialogProps {
  open: boolean;
  onClose: () => void;
  client: ServiceClient;
  characterId: string;
  existingEventIds: Set<string>;
}

function AddToEventDialog({
  open,
  onClose,
  client,
  characterId,
  existingEventIds,
}: AddToEventDialogProps) {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const addCharacter = useAddCharacterToEvent(client);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setSearch("");
      setDebounced("");
    }
  }

  React.useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function handleSearchChange(v: string) {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(v), 300);
  }

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["event-search-character-add", debounced],
    queryFn: () =>
      getEvents(client, {
        search: debounced.length > 1 ? debounced : undefined,
        pageSize: 20,
      }),
    enabled: open,
    staleTime: 10_000,
  });

  const available = results.filter((e) => !existingEventIds.has(e.id));

  function handleAdd(eventId: string) {
    addCharacter.mutate(
      { eventId, characterId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: characterKeys.timeline(characterId),
          });
          toast.success("Added to event.");
          onClose();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to add to event",
          ),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to an event</DialogTitle>
          <DialogDescription>
            Search for an event to add this character to as a participant. Set
            the role and significance from the event editor.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search events…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoFocus
        />

        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
          {isFetching && (
            <div className="space-y-1">
              {[1, 2, 3].map((step) => (
                <Skeleton key={step} className="h-10 w-full rounded" />
              ))}
            </div>
          )}
          {!isFetching && available.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {debounced.length > 1
                ? "No matching events found."
                : "Type to search events."}
            </p>
          )}
          {available.map((event) => (
            <button
              key={event.id}
              type="button"
              disabled={addCharacter.isPending}
              onClick={() => handleAdd(event.id)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted disabled:opacity-50"
            >
              <span className="flex-1 truncate text-sm">{event.title}</span>
              {event.event_type && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs capitalize"
                >
                  {event.event_type}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
