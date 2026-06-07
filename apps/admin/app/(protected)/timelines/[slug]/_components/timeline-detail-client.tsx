"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  CornerRightDown,
  Globe,
  GripVertical,
  Link2,
  Lock,
  MoreHorizontal,
  Plus,
  Users,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TemporalData } from "@repo/services/schemas/temporal";
import {
  getTimelineBySlug,
  getTimelineEventsUnion,
  TimelinePublishError,
  type TimelineEventWithMembership,
} from "@repo/services/timeline-service";
import { getCharacterById } from "@repo/services/character-service";
import { getEventsDetailedBy, getEvents } from "@repo/services/event-service";
import { Badge } from "@repo/ui/components/badge";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { CollaboratorList } from "@repo/ui/components/collaborator-list";
import type {
  Collaborator,
  CollaboratorOwner,
  CollaboratorRole,
} from "@repo/ui/components/collaborator-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { PublishControl } from "@repo/ui/components/publish-control";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import {
  timelineKeys,
  useTimelineCollaborators,
  usePublishTimeline,
  useUnpublishTimeline,
  useDeleteTimeline,
  useAddEventToTimeline,
  useRemoveEventFromTimeline,
  useSetTimelineEventSortOrder,
  useAddCollaborator,
  useRemoveCollaborator,
  useUpdateCollaboratorRole,
} from "@repo/ui/hooks/use-timelines";
import { useUpdateEvent } from "@repo/ui/hooks/use-events";
import { useProfilesByIds } from "@repo/ui/hooks/use-profiles";
import { getProfileByUsername } from "@repo/services/profile-service";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewerRole = "owner" | "editor" | "viewer";

interface TimelineRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  timeline_type: string | null;
  visibility: string | null;
  scale: string | null;
  published: boolean | null;
  user_id: string;
  subject_character_id: string | null;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData | null;
  timeline_collaborators: Array<{
    user_id: string;
    role: string;
  }>;
  timeline_media: Array<{
    media_id: string;
    sort_order: number | null;
  }>;
}

interface MediaItem {
  id: string;
  alt_text: string | null;
  caption: string | null;
  media_type: string | null;
  url: string | null;
  storage_path: string | null;
  sort_order: number;
}

// Stable empty-array sentinels. Using `[]` inline as a useQuery default creates a
// new reference every render, which makes the derived-state `!==` comparison
// always true and triggers an infinite re-render loop.
const EMPTY_EVENTS: TimelineEventWithMembership[] = [];
const EMPTY_MEDIA_ROWS: Array<{
  id: string;
  alt_text: string | null;
  caption: string | null;
  media_type: string | null;
  url: string | null;
  storage_path: string | null;
}> = [];

// ---------------------------------------------------------------------------
// Visibility display
// ---------------------------------------------------------------------------

const VISIBILITY_META = {
  private: { icon: Lock, label: "Private" },
  public: { icon: Globe, label: "Public" },
  shared: { icon: Users, label: "Shared" },
} as const;

function VisibilityChip({ v }: { v: string }) {
  const meta = VISIBILITY_META[v as keyof typeof VISIBILITY_META];
  if (!meta)
    return (
      <Badge variant="secondary" className="capitalize text-xs">
        {v}
      </Badge>
    );
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveRole(timeline: TimelineRow, userId: string): ViewerRole {
  if (timeline.user_id === userId) return "owner";
  const collab = timeline.timeline_collaborators.find(
    (c) => c.user_id === userId,
  );
  // "owner" is strictly timelines.user_id (see isOwner). A collaborator "admin"
  // is a privileged editor — it grants edit access (canEdit) but never the
  // owner-only controls (publish, delete, manage collaborators). See #235.
  if (collab?.role === "admin" || collab?.role === "editor") return "editor";
  return "viewer";
}

/** A profile row, minimally typed for name/avatar display. */
interface ProfileLike {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

/** Build a display name from a profile, falling back to username then a stub. */
function displayNameFor(profile: ProfileLike): string {
  const full = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || profile.username || "Unknown user";
}

function formatEventType(type: string | null): string {
  if (!type) return "Event";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function importanceStars(importance: number | null): string {
  const n = Math.min(10, Math.max(0, importance ?? 0));
  return "★".repeat(n) + "☆".repeat(10 - n);
}

// ---------------------------------------------------------------------------
// EventRow — single row in the Events tab
// ---------------------------------------------------------------------------

interface EventRowProps {
  event: TimelineEventWithMembership;
  index: number;
  total: number;
  canEdit: boolean;
  onMoveUp: (eventId: string) => void;
  onMoveDown: (eventId: string) => void;
  onUnlink: (event: TimelineEventWithMembership) => void;
}

function EventRowItem({
  event,
  index,
  total,
  canEdit,
  onMoveUp,
  onMoveDown,
  onUnlink,
}: EventRowProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border border-border rounded-md bg-background hover:bg-muted/30 transition-colors">
      {canEdit && (
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(event.id)}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMoveDown(event.id)}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}
      {canEdit && (
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      )}

      <div className="shrink-0 w-32 text-xs text-muted-foreground">
        <TemporalDisplay
          value={event.temporal_data as TemporalData}
          format="compact"
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">
          {event.title}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant="outline" className="text-xs capitalize">
          {formatEventType(event.event_type)}
        </Badge>

        <span
          className="text-xs text-yellow-500 font-mono tracking-tighter"
          title={`Importance: ${event.importance ?? 0}/10`}
        >
          {importanceStars(event.importance).slice(0, 5)}
        </span>

        <Badge
          variant={event.membership === "home" ? "default" : "secondary"}
          className="text-xs"
        >
          {event.membership}
        </Badge>

        {event.detail_timeline_id !== null && (
          <span
            title="This event has a detailed sub-timeline"
            className="text-muted-foreground"
          >
            <CornerRightDown className="h-3.5 w-3.5" />
          </span>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => onUnlink(event)}
            className="ml-1 p-1 rounded text-muted-foreground hover:text-destructive"
            aria-label="Unlink event"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventsTab
// ---------------------------------------------------------------------------

interface EventsTabProps {
  timelineId: string;
  canEdit: boolean;
  events: TimelineEventWithMembership[];
  isLoading: boolean;
  onReorder: (events: TimelineEventWithMembership[]) => void;
  onUnlink: (event: TimelineEventWithMembership) => void;
  onLinkEvent: () => void;
}

function EventsTab({
  timelineId,
  canEdit,
  events,
  isLoading,
  onUnlink,
  onLinkEvent,
  onReorder,
}: EventsTabProps) {
  const hasEditorialOrder = events.some((e) => e.junction_sort_order !== 0);

  function handleMoveUp(eventId: string) {
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx <= 0) return;
    const next = [...events];
    const [item] = next.splice(idx, 1);
    next.splice(idx - 1, 0, item!);
    onReorder(next);
  }

  function handleMoveDown(eventId: string) {
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx < 0 || idx >= events.length - 1) return;
    const next = [...events];
    const [item] = next.splice(idx, 1);
    next.splice(idx + 1, 0, item!);
    onReorder(next);
  }

  if (isLoading) {
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
          <Button size="sm" variant="secondary" onClick={onLinkEvent}>
            <Link2 className="h-4 w-4 mr-1.5" />
            Link event
          </Button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <p className="text-sm">
            No events linked yet. Link existing events, or create one in this
            timeline.
          </p>
          {canEdit && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={onLinkEvent}>
                <Link2 className="h-4 w-4 mr-1.5" />
                Link existing event
              </Button>
              {/* DECISION NEEDED: enable once the event editor supports
                  ?timeline_id= pre-fill to land the new event as "home". */}
              <Link
                href={`/events/new?timeline_id=${timelineId}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create new event in this timeline
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {events.map((event, idx) => (
            <EventRowItem
              key={event.id}
              event={event}
              index={idx}
              total={events.length}
              canEdit={canEdit}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onUnlink={onUnlink}
            />
          ))}
        </div>
      )}

      {events.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {events.length} event{events.length !== 1 ? "s" : ""} ·{" "}
          {hasEditorialOrder ? "editorial order" : "chronological order"}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PeriodsTab — empty state (period linking lands in Phase 6; see #44)
// ---------------------------------------------------------------------------

function PeriodsTab({ canEdit }: { canEdit: boolean }) {
  // No periods are associated with timelines yet, so this is always empty for
  // now. Mirrors MediaTab: show the real empty state and surface the not-yet-
  // built management affordance as a disabled button, not as headline copy.
  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            disabled
            title="Period management coming in a later release"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Link period
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
        <p className="text-sm">No periods associated with this timeline.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MediaTab — basic listing + detach
// ---------------------------------------------------------------------------

interface MediaTabProps {
  mediaItems: MediaItem[];
  isLoading: boolean;
  canEdit: boolean;
  /** Undefined until media detach is implemented (issue #49). Button is disabled when absent. */
  onDetach?: () => void;
  onMoveUp: (mediaId: string) => void;
  onMoveDown: (mediaId: string) => void;
}

function MediaTab({
  mediaItems,
  isLoading,
  canEdit,
  onDetach,
  onMoveUp,
  onMoveDown,
}: MediaTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        {[1, 2].map((step) => (
          <Skeleton key={step} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            disabled
            title="Full media manager coming in a later release"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Attach media
          </Button>
        </div>
      )}

      {mediaItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <p className="text-sm">No media attached.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {mediaItems.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 border border-border rounded-md bg-background"
            >
              {canEdit && (
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveUp(item.id)}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === mediaItems.length - 1}
                    onClick={() => onMoveDown(item.id)}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              )}

              <Badge
                variant="secondary"
                className="text-xs capitalize shrink-0"
              >
                {item.media_type ?? "media"}
              </Badge>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.alt_text ?? item.caption ?? item.id}
                </p>
                {item.caption && item.alt_text && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.caption}
                  </p>
                )}
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={onDetach}
                  disabled={!onDetach}
                  title={
                    !onDetach ? "Media detach coming in issue #49" : undefined
                  }
                  className="p-1 rounded text-muted-foreground hover:text-destructive disabled:opacity-30 shrink-0"
                  aria-label="Detach media"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Link Event Dialog
// ---------------------------------------------------------------------------

interface LinkEventDialogProps {
  open: boolean;
  onClose: () => void;
  onLinked: () => void;
  timelineId: string;
  existingEventIds: Set<string>;
}

function LinkEventDialog({
  open,
  onClose,
  onLinked,
  timelineId,
  existingEventIds,
}: LinkEventDialogProps) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const addEvent = useAddEventToTimeline(client);

  // Reset search fields when dialog closes (derived state pattern — avoids useEffect).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), 300);
  }

  // Clear any pending debounce timer on unmount so it can't fire afterwards.
  React.useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["event-search-link", debouncedSearch],
    queryFn: () =>
      getEvents(client, {
        search: debouncedSearch.length > 1 ? debouncedSearch : undefined,
        pageSize: 20,
      }),
    enabled: open,
    staleTime: 10_000,
  });

  const available = results.filter((e) => !existingEventIds.has(e.id));

  function handleLink(eventId: string) {
    addEvent.mutate(
      { timelineId, eventId },
      {
        onSuccess: () => {
          onLinked();
          onClose();
        },
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
          <DialogTitle>Link an event</DialogTitle>
          <DialogDescription>
            Search for an existing event to link to this timeline.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search events…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoFocus
        />

        <div className="max-h-72 overflow-y-auto space-y-1 mt-2">
          {isFetching && (
            <div className="space-y-1">
              {[1, 2, 3].map((step) => (
                <Skeleton key={step} className="h-10 w-full rounded" />
              ))}
            </div>
          )}
          {!isFetching && available.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {debouncedSearch.length > 1
                ? "No matching events found."
                : "Type to search events."}
            </p>
          )}
          {available.map((event) => (
            <button
              key={event.id}
              type="button"
              disabled={addEvent.isPending}
              onClick={() => handleLink(event.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left hover:bg-muted disabled:opacity-50"
            >
              <span className="flex-1 text-sm truncate">{event.title}</span>
              <Badge variant="outline" className="text-xs capitalize shrink-0">
                {formatEventType(event.event_type)}
              </Badge>
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

// ---------------------------------------------------------------------------
// Unlink Confirmation Dialog (home events only)
// ---------------------------------------------------------------------------

interface UnlinkHomeEventDialogProps {
  event: TimelineEventWithMembership | null;
  onConfirm: (event: TimelineEventWithMembership) => void;
  onClose: () => void;
}

function UnlinkHomeEventDialog({
  event,
  onConfirm,
  onClose,
}: UnlinkHomeEventDialogProps) {
  return (
    <Dialog
      open={event !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Unlink home event?</DialogTitle>
          <DialogDescription>
            <strong>{event?.title}</strong> is this timeline&apos;s primary
            event. Unlinking it will clear the event&apos;s primary timeline —
            the event will still exist but won&apos;t belong to any timeline
            until reassigned. This cannot be undone automatically.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (event) onConfirm(event);
            }}
          >
            Unlink
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog
// ---------------------------------------------------------------------------

interface DeleteTimelineDialogProps {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteTimelineDialog({
  open,
  title,
  onConfirm,
  onClose,
}: DeleteTimelineDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete timeline?</DialogTitle>
          <DialogDescription>
            <strong>{title}</strong> and all its junction data (collaborators,
            linked events, media) will be permanently deleted. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TimelineDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  // --- Auth + timeline ---
  const {
    data: authAndTimeline,
    isPending: timelinePending,
    isError: timelineError,
  } = useQuery({
    // Key under the timelines namespace so timeline mutations (publish/unpublish,
    // collaborator changes) that invalidate `timelineKeys.all` also refresh this
    // page. The trailing "detail-auth" distinguishes its { timeline, userId }
    // shape from the shared useTimelineBySlug cache entry.
    queryKey: [...timelineKeys.bySlug(slug), "detail-auth"],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");
      const timeline = await getTimelineBySlug(client, slug);
      return { timeline, userId: user.id };
    },
    staleTime: 60_000,
  });

  const timeline = authAndTimeline?.timeline as TimelineRow | undefined;
  const userId = authAndTimeline?.userId ?? "";

  // --- Events union ---
  const {
    data: eventsRaw = EMPTY_EVENTS,
    isPending: eventsPending,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["timeline-events-union", timeline?.id],
    queryFn: () => getTimelineEventsUnion(client, timeline!.id),
    enabled: !!timeline?.id,
    staleTime: 30_000,
  });

  // Local event order for optimistic reorder UI. Reset when the query data
  // changes using React's "storing information from previous renders" pattern
  // (conditional set during render) — intentionally not useEffect, which would
  // add an extra render/flash. See react.dev/reference/react/useState.
  const [prevEventsRaw, setPrevEventsRaw] =
    React.useState<TimelineEventWithMembership[]>(eventsRaw);
  const [localEvents, setLocalEvents] =
    React.useState<TimelineEventWithMembership[]>(eventsRaw);
  if (eventsRaw !== prevEventsRaw) {
    setPrevEventsRaw(eventsRaw);
    setLocalEvents(eventsRaw);
  }

  // --- Fractal context: does any event drill into this timeline? ---
  const { data: detailsEvents = [] } = useQuery({
    queryKey: ["timeline-details-event", timeline?.id],
    queryFn: () => getEventsDetailedBy(client, timeline!.id),
    enabled: !!timeline?.id,
    staleTime: 60_000,
  });

  // --- Biographical subject character ---
  const { data: subjectCharacter } = useQuery({
    queryKey: ["character-detail", timeline?.subject_character_id],
    queryFn: () => getCharacterById(client, timeline!.subject_character_id!),
    enabled:
      !!timeline?.subject_character_id &&
      timeline.timeline_type === "biographical",
    staleTime: 60_000,
  });

  // --- Collaborators ---
  const { data: collaboratorRows = [] } = useTimelineCollaborators(
    client,
    timeline?.id ?? "",
    { enabled: !!timeline?.id },
  );

  // --- Media details ---
  const mediaJunctionRows = timeline?.timeline_media ?? [];
  const mediaIds = mediaJunctionRows.map((m) => m.media_id);
  const { data: rawMediaItems = EMPTY_MEDIA_ROWS, isPending: mediaPending } =
    useQuery({
      queryKey: ["timeline-media-details", timeline?.id],
      queryFn: async () => {
        if (mediaIds.length === 0) return [];
        const { data, error } = await client
          .from("media")
          .select("id, alt_text, caption, media_type, url, storage_path")
          .in("id", mediaIds);
        if (error) throw error;
        return data ?? [];
      },
      enabled: !!timeline?.id,
      staleTime: 30_000,
    });

  const mediaItems: MediaItem[] = rawMediaItems.map((m) => {
    const junction = mediaJunctionRows.find((j) => j.media_id === m.id);
    return { ...m, sort_order: junction?.sort_order ?? 0 };
  });
  // Keeps local reorder optimistic; reset on query-data change via the same
  // conditional-set-during-render pattern as localEvents above (not useEffect).
  const [prevRawMedia, setPrevRawMedia] = React.useState(rawMediaItems);
  const [localMedia, setLocalMedia] = React.useState<MediaItem[]>(mediaItems);
  if (rawMediaItems !== prevRawMedia) {
    setPrevRawMedia(rawMediaItems);
    setLocalMedia(mediaItems);
  }

  // --- Derived state ---
  const role = timeline ? deriveRole(timeline, userId) : "viewer";
  // Owner-only controls (publish, delete, manage collaborators) gate on actual
  // ownership, not the derived role — a collaborator "admin" must not inherit them.
  const isOwner = !!timeline && timeline.user_id === userId;
  const canEdit = role === "owner" || role === "editor";

  // Enrich collaborators + owner with profile data (timeline_collaborators has no
  // FK to profiles, so we join client-side via a batch fetch by user_id).
  const profileIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (timeline?.user_id) ids.add(timeline.user_id);
    for (const c of collaboratorRows) ids.add(c.user_id);
    return [...ids];
  }, [timeline, collaboratorRows]);

  const { data: profileRows = [] } = useProfilesByIds(client, profileIds, {
    enabled: profileIds.length > 0,
  });

  const profilesById = React.useMemo(() => {
    const map = new Map<string, (typeof profileRows)[number]>();
    for (const p of profileRows) map.set(p.id, p);
    return map;
  }, [profileRows]);

  const collaborators: Collaborator[] = collaboratorRows.map((c) => {
    const profile = profilesById.get(c.user_id);
    return {
      id: c.user_id,
      username: profile?.username ?? c.user_id,
      displayName: profile ? displayNameFor(profile) : c.user_id,
      role: c.role as CollaboratorRole,
      avatarUrl: profile?.avatar_url ?? undefined,
      addedAt: c.created_at ?? undefined,
    };
  });

  const ownerProfile = timeline
    ? profilesById.get(timeline.user_id)
    : undefined;
  const owner: CollaboratorOwner = {
    displayName: ownerProfile
      ? displayNameFor(ownerProfile)
      : (timeline?.user_id ?? "Owner"),
    username: ownerProfile?.username ?? null,
    avatarUrl: ownerProfile?.avatar_url ?? undefined,
  };

  // Resolve a typed @username to a profile for the add dialog.
  const resolveUsername = React.useCallback(
    async (username: string) => {
      const profile = await getProfileByUsername(client, username);
      if (!profile) return null;
      return {
        id: profile.id,
        username: profile.username ?? username,
        displayName: displayNameFor(profile),
        avatarUrl: profile.avatar_url ?? undefined,
      };
    },
    [client],
  );

  // --- Dialog / disclosure state ---
  const [showLinkEvent, setShowLinkEvent] = React.useState(false);
  const [unlinkHomeEvent, setUnlinkHomeEvent] =
    React.useState<TimelineEventWithMembership | null>(null);
  const [showDelete, setShowDelete] = React.useState(false);
  const [showDangerZone, setShowDangerZone] = React.useState(false);

  const existingEventIds = React.useMemo(
    () => new Set(localEvents.map((e) => e.id)),
    [localEvents],
  );

  // --- Mutations ---
  const publish = usePublishTimeline(client);
  const unpublish = useUnpublishTimeline(client);
  const deleteTimeline = useDeleteTimeline(client);
  const updateEvent = useUpdateEvent(client);
  const removeEvent = useRemoveEventFromTimeline(client);
  const setEventOrder = useSetTimelineEventSortOrder(client);
  const addCollaborator = useAddCollaborator(client);
  const removeCollaborator = useRemoveCollaborator(client);
  const updateRole = useUpdateCollaboratorRole(client);

  // --- Handlers ---
  function handleReorder(reordered: TimelineEventWithMembership[]) {
    if (!timeline) return;
    setLocalEvents(reordered);
    // Persist editorial order: assign 1-based sort_order to all events.
    reordered.forEach((event, idx) => {
      setEventOrder.mutate({
        timelineId: timeline.id,
        eventId: event.id,
        sortOrder: idx + 1,
      });
    });
  }

  function handleUnlink(event: TimelineEventWithMembership) {
    if (event.membership === "home") {
      setUnlinkHomeEvent(event);
    } else {
      if (!timeline) return;
      removeEvent.mutate(
        { timelineId: timeline.id, eventId: event.id },
        { onSuccess: () => void refetchEvents() },
      );
    }
  }

  function confirmUnlinkHome() {
    if (!unlinkHomeEvent || !timeline) return;
    const eventId = unlinkHomeEvent.id;
    const timelineId = timeline.id;
    // Clear the event's primary timeline membership (the real source of truth for home events).
    updateEvent.mutate(
      { id: eventId, data: { timeline_id: null } },
      {
        onSuccess: () => {
          // Also remove any junction row so the event doesn't ghost as "linked".
          removeEvent.mutate(
            { timelineId, eventId },
            {
              onSettled: () => {
                setUnlinkHomeEvent(null);
                void refetchEvents();
              },
            },
          );
        },
      },
    );
  }

  // Media detach is intentionally not wired yet: passing `onDetach` keeps the
  // button enabled, so it stays undefined (MediaTab disables the control) until
  // removeMediaFromTimeline lands with media management (issue #49).

  function handleMediaMoveUp(mediaId: string) {
    const idx = localMedia.findIndex((m) => m.id === mediaId);
    if (idx <= 0) return;
    const next = [...localMedia];
    const [item] = next.splice(idx, 1);
    next.splice(idx - 1, 0, item!);
    setLocalMedia(next);
  }

  function handleMediaMoveDown(mediaId: string) {
    const idx = localMedia.findIndex((m) => m.id === mediaId);
    if (idx < 0 || idx >= localMedia.length - 1) return;
    const next = [...localMedia];
    const [item] = next.splice(idx, 1);
    next.splice(idx + 1, 0, item!);
    setLocalMedia(next);
  }

  function handleDelete() {
    if (!timeline) return;
    deleteTimeline.mutate(timeline.id, {
      onSuccess: () => router.replace("/timelines"),
    });
  }

  // --- Loading / error states ---
  if (timelinePending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <div className="mt-6 space-y-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <Skeleton key={step} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (timelineError || !timeline) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">Timeline not found.</p>
        <Link
          href="/timelines"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Back to timelines
        </Link>
      </div>
    );
  }

  const detailsEvent = detailsEvents[0] ?? null;
  const collabCount = collaboratorRows.length;
  const mediaCount = localMedia.length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {timeline.title}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {timeline.timeline_type && (
                <Badge variant="secondary" className="capitalize text-xs">
                  {timeline.timeline_type}
                </Badge>
              )}
              {subjectCharacter && (
                <span className="text-xs text-muted-foreground">
                  about{" "}
                  <span className="font-medium">{subjectCharacter.name}</span>
                </span>
              )}
              {timeline.visibility && (
                <VisibilityChip v={timeline.visibility} />
              )}
              {timeline.scale && (
                <span className="text-xs">{timeline.scale}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TemporalDisplay
                value={timeline.temporal_data}
                endValue={timeline.end_temporal_data ?? undefined}
                format="inline"
              />
            </div>
            {detailsEvent && (
              <p className="text-xs text-muted-foreground">
                {/* BLOCKED: #177 — should be a jump link to the parent event/timeline
                    once the event detail route is live. */}
                Details the event:{" "}
                <span className="font-medium">{detailsEvent.title}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PublishControl
              published={timeline.published ?? false}
              entityLabel="timeline"
              canPublish={isOwner}
              publishDisabledReason={
                localEvents.length === 0
                  ? "Link at least one event to publish"
                  : undefined
              }
              onPublish={() =>
                publish.mutate(timeline.id, {
                  onError: (err) => {
                    if (
                      err instanceof TimelinePublishError &&
                      err.code === "no_events"
                    ) {
                      // BLOCKED: no toast infrastructure yet — button is already disabled by publishDisabledReason
                      console.error("Publish blocked: no linked events");
                    }
                  },
                })
              }
              onUnpublish={() => unpublish.mutate(timeline.id)}
            />
            {canEdit && (
              <Link
                href={`/timelines/${slug}/edit`}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Edit
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    void navigator.clipboard.writeText(timeline.id)
                  }
                >
                  Copy ID
                </DropdownMenuItem>
                {/* View raw JSON — coming soon (issue #221) */}
                {/* Duplicate — coming soon (issue #221) */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {timeline.summary && (
          <p className="text-sm text-muted-foreground">{timeline.summary}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">
            Events ({localEvents.length})
          </TabsTrigger>
          <TabsTrigger value="periods">Periods (0)</TabsTrigger>
          <TabsTrigger value="collaborators">
            Collaborators ({collabCount})
          </TabsTrigger>
          <TabsTrigger value="media">Media ({mediaCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="pt-4">
          <EventsTab
            timelineId={timeline.id}
            canEdit={canEdit}
            events={localEvents}
            isLoading={eventsPending}
            onReorder={handleReorder}
            onUnlink={handleUnlink}
            onLinkEvent={() => setShowLinkEvent(true)}
          />
        </TabsContent>

        <TabsContent value="periods" className="pt-4">
          <PeriodsTab canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="collaborators" className="pt-4">
          <CollaboratorList
            collaborators={collaborators}
            owner={owner}
            ownerUserId={timeline.user_id}
            // Owner-only: current RLS (write_collaborators) permits collaborator
            // writes only for the owner or a global admin, so collaborator-admins
            // cannot manage here. Granting that needs an RLS migration — see #237.
            canManage={isOwner}
            resolveUsername={resolveUsername}
            onAdd={(userId, role) => {
              addCollaborator.mutate({
                timelineId: timeline.id,
                userId,
                role,
              });
            }}
            onRemove={(id) => {
              removeCollaborator.mutate({
                timelineId: timeline.id,
                userId: id,
              });
            }}
            onRoleChange={(id, role) => {
              updateRole.mutate({
                timelineId: timeline.id,
                userId: id,
                role,
              });
            }}
          />
        </TabsContent>

        <TabsContent value="media" className="pt-4">
          <MediaTab
            mediaItems={localMedia}
            isLoading={mediaPending}
            canEdit={canEdit}
            onMoveUp={handleMediaMoveUp}
            onMoveDown={handleMediaMoveDown}
          />
        </TabsContent>
      </Tabs>

      {/* Danger zone */}
      {isOwner && (
        <div className="border border-destructive/30 rounded-md">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            onClick={() => setShowDangerZone((v) => !v)}
          >
            {showDangerZone ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Danger zone
          </button>
          {showDangerZone && (
            <div className="px-4 pb-4 pt-1 border-t border-destructive/20">
              <p className="text-xs text-muted-foreground mb-3">
                Deleting a timeline is permanent and cannot be undone. All event
                associations will be removed.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                Delete timeline
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <LinkEventDialog
        open={showLinkEvent}
        onClose={() => setShowLinkEvent(false)}
        onLinked={() => void refetchEvents()}
        timelineId={timeline.id}
        existingEventIds={existingEventIds}
      />

      <UnlinkHomeEventDialog
        event={unlinkHomeEvent}
        onConfirm={confirmUnlinkHome}
        onClose={() => setUnlinkHomeEvent(null)}
      />

      <DeleteTimelineDialog
        open={showDelete}
        title={timeline.title}
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
      />
    </div>
  );
}
