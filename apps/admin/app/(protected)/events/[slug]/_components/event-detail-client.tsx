"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CornerRightDown,
  MapPin,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/sonner";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { TemporalService } from "@repo/services/modules/temporal-service";
import { getEventBySlug } from "@repo/services/event-service";
import {
  getTimelineById,
  getEventTimelineLinks,
} from "@repo/services/timeline-service";
import { Badge } from "@repo/ui/components/badge";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
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
  eventKeys,
  usePublishEvent,
  useUnpublishEvent,
  useDeleteEvent,
  useAddMediaToEvent,
  useRemoveMediaFromEvent,
  useReorderEventMedia,
} from "@repo/ui/hooks/use-events";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";
import { MediaSection } from "../../../_components/media/media-section";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineRef {
  id: string;
  title: string;
  slug: string;
}

interface ExpandsInto {
  timeline: TimelineRef;
  eventCount: number;
}

interface NeighborEvent {
  id: string;
  title: string;
  slug: string;
  temporal_data: TemporalData;
}

interface ParticipantRow {
  characterId: string;
  name: string;
  characterType: string | null;
  role: string;
  significance: string;
}

interface CategoryChip {
  id: string;
  title: string;
  color: string | null;
}

interface MediaItem {
  id: string;
  alt_text: string | null;
  caption: string | null;
  media_type: string | null;
  url: string | null;
  storage_path: string | null;
  source: string;
  sort_order: number;
}

interface StoryRef {
  id: string;
  title: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEventType(type: string | null): string {
  if (!type) return "Event";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Reads a numeric coordinate out of the stored `spatial_data` JSONB. Mirrors
 * the `{ lat, lng }` shape written by the event editor's `toSpatialData`
 * (apps/admin/.../events/_components/event-form-client.tsx). Inlined here to
 * keep the read view independent of the form module's bundle.
 */
function readCoordinate(spatial: unknown, key: "lat" | "lng"): number | null {
  if (spatial && typeof spatial === "object" && !Array.isArray(spatial)) {
    const value = (spatial as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  return null;
}

/** "48.86° N · 2.35° E" style coordinate pair, or null when absent. */
function formatCoordinates(spatial: unknown): string | null {
  const lat = readCoordinate(spatial, "lat");
  const lng = readCoordinate(spatial, "lng");
  if (lat == null || lng == null) return null;
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Timelines panel — the forward-fractal navigation surface
// ---------------------------------------------------------------------------

interface TimelinesPanelProps {
  home: TimelineRef | null;
  guests: TimelineRef[];
  expandsInto: ExpandsInto | null;
  earlier: NeighborEvent | null;
  later: NeighborEvent | null;
}

function TimelinesPanel({
  home,
  guests,
  expandsInto,
  earlier,
  later,
}: TimelinesPanelProps) {
  return (
    <div className="space-y-4">
      <SectionHeading>Timelines</SectionHeading>

      {/* Contained in */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Contained in
        </p>
        {home === null && guests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not in any timeline.{" "}
            {/* Edit the event to assign a home timeline (read-only here). */}
            <span className="italic">Assign one from the editor.</span>
          </p>
        ) : (
          <ul className="space-y-1">
            {home && (
              <li className="flex items-center gap-2 text-sm">
                <Link
                  href={`/timelines/${home.slug}`}
                  className="truncate hover:underline"
                >
                  {home.title}
                </Link>
                <Badge variant="default" className="text-[10px]">
                  home
                </Badge>
              </li>
            )}
            {guests.map((g) => (
              <li key={g.id} className="flex items-center gap-2 text-sm">
                <Link
                  href={`/timelines/${g.slug}`}
                  className="truncate hover:underline"
                >
                  {g.title}
                </Link>
                <Badge variant="secondary" className="text-[10px]">
                  guest
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expands into (forward drill-down) — omitted for leaf events */}
      {expandsInto && (
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            Expands into
            <CornerRightDown className="h-3.5 w-3.5" aria-hidden />
          </p>
          <Link
            href={`/timelines/${expandsInto.timeline.slug}`}
            className="block text-sm font-medium hover:underline"
          >
            {expandsInto.timeline.title}
          </Link>
          <p className="text-xs text-muted-foreground">
            sub-timeline · {expandsInto.eventCount}{" "}
            {expandsInto.eventCount === 1 ? "event" : "events"}
          </p>
        </div>
      )}

      {/* Nearby in timeline — only when there is a home timeline */}
      {home && (earlier || later) && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Nearby in {home.title}
          </p>
          {earlier && (
            <Link
              href={`/events/${earlier.slug}`}
              className="flex items-center gap-1.5 text-sm hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{earlier.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                <TemporalDisplay
                  value={earlier.temporal_data}
                  format="compact"
                />
              </span>
            </Link>
          )}
          {later && (
            <Link
              href={`/events/${later.slug}`}
              className="flex items-center gap-1.5 text-sm hover:underline"
            >
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{later.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                <TemporalDisplay value={later.temporal_data} format="compact" />
              </span>
            </Link>
          )}
          <Link
            href={`/timelines/${home.slug}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            See all
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participants tab
// ---------------------------------------------------------------------------

function ParticipantsTab({
  participants,
  isLoading,
  canEdit,
}: {
  participants: ParticipantRow[];
  isLoading: boolean;
  canEdit: boolean;
}) {
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
            title="Participant editor coming in a later release"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add participant
          </Button>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <p className="text-sm">No participants yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {participants.map((p) => (
            <div
              key={p.characterId}
              className="flex items-center gap-3 px-4 py-3 border border-border rounded-md bg-background"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                {p.characterType && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.characterType}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {p.role} · {p.significance}
              </span>
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  title="Participant editor coming in a later release"
                >
                  Edit
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Categories tab
// ---------------------------------------------------------------------------

function CategoriesTab({
  categories,
  isLoading,
  canEdit,
}: {
  categories: CategoryChip[];
  isLoading: boolean;
  canEdit: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        <Skeleton className="h-8 w-48 rounded-md" />
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
            title="Category management coming in a later release"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add category
          </Button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <p className="text-sm">No categories.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant="outline"
              className="text-xs"
              style={
                c.color ? { borderColor: c.color, color: c.color } : undefined
              }
            >
              {c.title}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

function DeleteEventDialog({
  open,
  title,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete event?</DialogTitle>
          <DialogDescription>
            <strong>{title}</strong> and all its junction data (participants,
            categories, media links) will be permanently deleted. This cannot be
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

export function EventDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  // --- Auth + event ---
  const {
    data: authAndEvent,
    isPending: eventPending,
    isError: eventError,
  } = useQuery({
    // Key under the events namespace so publish/unpublish (which invalidate
    // eventKeys.all by prefix) also refresh this view's published state.
    queryKey: [...eventKeys.all, "detail-auth", slug],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");
      const event = await getEventBySlug(client, user.id, slug);
      return { event, userId: user.id };
    },
    staleTime: 60_000,
  });

  const event = authAndEvent?.event;
  const userId = authAndEvent?.userId ?? "";

  // --- Home timeline ---
  const { data: home = null } = useQuery({
    queryKey: ["event-home-timeline", event?.timeline_id],
    queryFn: async (): Promise<TimelineRef | null> => {
      const tl = await getTimelineById(client, event!.timeline_id!);
      return tl ? { id: tl.id, title: tl.title, slug: tl.slug } : null;
    },
    enabled: !!event?.timeline_id,
    staleTime: 60_000,
  });

  // --- Guest timelines (timeline_events junction) ---
  const { data: guests = [] } = useQuery({
    queryKey: ["event-guest-timelines", event?.id],
    queryFn: async (): Promise<TimelineRef[]> => {
      const ids = await getEventTimelineLinks(client, event!.id);
      if (ids.length === 0) return [];
      const { data, error } = await client
        .from("timelines")
        .select("id, title, slug")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!event?.id,
    staleTime: 60_000,
  });

  // --- Expands into (forward fractal drill-down) ---
  const { data: expandsInto = null } = useQuery({
    queryKey: ["event-expands-into", event?.detail_timeline_id],
    queryFn: async (): Promise<ExpandsInto | null> => {
      const tl = await getTimelineById(client, event!.detail_timeline_id!);
      if (!tl) return null;
      // Exact head count so the displayed total stays correct past 100 events.
      const { count, error } = await client
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("timeline_id", tl.id);
      if (error) throw error;
      return {
        timeline: { id: tl.id, title: tl.title, slug: tl.slug },
        eventCount: count ?? 0,
      };
    },
    enabled: !!event?.detail_timeline_id,
    staleTime: 60_000,
  });

  // --- Nearby in (home) timeline: nearest earlier + later by proximity ---
  const { data: neighbors = { earlier: null, later: null } } = useQuery({
    queryKey: ["event-nearby", event?.id, event?.timeline_id],
    queryFn: async (): Promise<{
      earlier: NeighborEvent | null;
      later: NeighborEvent | null;
    }> => {
      // Two targeted limit(1) queries: nearest earlier (≤ self, desc) and
      // nearest later (> self, asc) within the home timeline. O(1) regardless
      // of timeline size, where a single fetched page would undercount past 100.
      const self = event!.sort_order_years ?? 0;
      const cols = "id, title, slug, temporal_data";
      const base = () =>
        client
          .from("events")
          .select(cols)
          .eq("timeline_id", event!.timeline_id!)
          .neq("id", event!.id);
      const [earlierRes, laterRes] = await Promise.all([
        base()
          .lte("sort_order_years", self)
          .order("sort_order_years", { ascending: false })
          .limit(1)
          .maybeSingle(),
        base()
          .gt("sort_order_years", self)
          .order("sort_order_years", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      if (earlierRes.error) throw earlierRes.error;
      if (laterRes.error) throw laterRes.error;
      const toRef = (
        r: {
          id: string;
          title: string;
          slug: string;
          temporal_data: unknown;
        } | null,
      ): NeighborEvent | null =>
        r
          ? {
              id: r.id,
              title: r.title,
              slug: r.slug,
              temporal_data: r.temporal_data as TemporalData,
            }
          : null;
      return { earlier: toRef(earlierRes.data), later: toRef(laterRes.data) };
    },
    enabled: !!event?.id && !!event?.timeline_id,
    staleTime: 30_000,
  });

  // --- Participants (event_characters joined to characters) ---
  const { data: participants = [], isPending: participantsPending } = useQuery({
    queryKey: ["event-participants", event?.id],
    queryFn: async (): Promise<ParticipantRow[]> => {
      const junctions = event!.event_characters;
      if (junctions.length === 0) return [];
      const ids = junctions.map((j) => j.character_id);
      const { data, error } = await client
        .from("characters")
        .select("id, name, character_type")
        .in("id", ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((c) => [c.id, c]));
      return junctions.map((j) => {
        const c = byId.get(j.character_id);
        return {
          characterId: j.character_id,
          name: c?.name ?? "Unknown character",
          characterType: c?.character_type ?? null,
          role: j.role ?? "participant",
          significance: j.significance ?? "secondary",
        };
      });
    },
    enabled: !!event?.id,
    staleTime: 30_000,
  });

  // --- Categories ---
  const { data: categories = [], isPending: categoriesPending } = useQuery({
    queryKey: ["event-categories", event?.id],
    queryFn: async (): Promise<CategoryChip[]> => {
      const ids = event!.event_categories.map((c) => c.category_id);
      if (ids.length === 0) return [];
      const { data, error } = await client
        .from("categories")
        .select("id, title, color")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!event?.id,
    staleTime: 30_000,
  });

  // Declared early so the media query and refreshMedia share the same reference.
  const eventId = event?.id;

  // --- Media ---
  // Fetch junctions directly so this query is self-contained and can be
  // invalidated without waiting for the event detail to refetch first.
  const { data: mediaItems = [], isPending: mediaPending } = useQuery({
    queryKey: ["event-media", eventId],
    queryFn: async (): Promise<MediaItem[]> => {
      const { data: junctions, error: jError } = await client
        .from("event_media")
        .select("media_id, sort_order")
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true, nullsFirst: false });
      if (jError) throw jError;
      if (!junctions?.length) return [];
      const ids = junctions.map((j) => j.media_id);
      const { data, error } = await client
        .from("media")
        .select("id, alt_text, caption, media_type, url, storage_path, source")
        .in("id", ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((m) => [m.id, m]));
      return junctions
        .map((j) => {
          const m = byId.get(j.media_id);
          if (!m) return null;
          return { ...m, sort_order: j.sort_order ?? 0 };
        })
        .filter((m): m is MediaItem => m !== null);
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });

  // --- Related stories (story_events junction) ---
  const { data: stories = [] } = useQuery({
    queryKey: ["event-stories", event?.id],
    queryFn: async (): Promise<StoryRef[]> => {
      const { data, error } = await client
        .from("story_events")
        .select("stories(id, title, slug)")
        .eq("event_id", event!.id);
      if (error) throw error;
      // PostgREST types the embedded `stories` relation as an array; each
      // story_events row references exactly one story, so normalize to a flat
      // list of story refs.
      return (data ?? []).flatMap((r) => {
        const s = r.stories as unknown as StoryRef | StoryRef[] | null;
        if (s == null) return [];
        return Array.isArray(s) ? s : [s];
      });
    },
    enabled: !!event?.id,
    staleTime: 60_000,
  });

  // --- Mutations ---
  const publish = usePublishEvent(client);
  const unpublish = useUnpublishEvent(client);
  const deleteEvent = useDeleteEvent(client);
  const addMedia = useAddMediaToEvent(client);
  const removeMedia = useRemoveMediaFromEvent(client);
  const reorderMedia = useReorderEventMedia(client);

  // --- Media association handlers ---
  const queryClient = useQueryClient();

  const refreshMedia = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["event-media", eventId] });
  }, [queryClient, eventId]);

  const handleAttachMedia = React.useCallback(
    async (mediaId: string) => {
      if (!eventId) return;
      const nextSort = mediaItems.length;
      await addMedia.mutateAsync({ eventId, mediaId, sortOrder: nextSort });
      await refreshMedia();
    },
    [addMedia, eventId, mediaItems.length, refreshMedia],
  );

  const handleDetachMedia = React.useCallback(
    async (mediaId: string) => {
      if (!eventId) return;
      await removeMedia.mutateAsync({ eventId, mediaId });
      await refreshMedia();
    },
    [removeMedia, eventId, refreshMedia],
  );

  const handleReorderMedia = React.useCallback(
    async (mediaId: string, sortOrder: number) => {
      if (!eventId) return;
      await reorderMedia.mutateAsync({ eventId, mediaId, sortOrder });
      await refreshMedia();
    },
    [reorderMedia, eventId, refreshMedia],
  );

  // --- Disclosure state ---
  const [showDelete, setShowDelete] = React.useState(false);
  const [showDangerZone, setShowDangerZone] = React.useState(false);

  // --- Loading / error states ---
  if (eventPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">Event not found.</p>
        <Link
          href="/events"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Back to events
        </Link>
      </div>
    );
  }

  // Ownership/edit access. For this read-only pass, edit derives from direct
  // ownership only.
  // DECISION NEEDED: collaborator-editor access for events should derive from
  // the parent timeline's collaborators per system-design §9.2.1 RLS — see #127.
  const isOwner = event.user_id === userId;
  const canEdit = isOwner;

  const hasEnd = event.end_temporal_data != null;
  const startTemporal = event.temporal_data as TemporalData;
  const endTemporal = hasEnd
    ? (event.end_temporal_data as TemporalData)
    : undefined;
  const duration = endTemporal
    ? TemporalService.formatDuration(startTemporal, endTemporal)
    : null;
  const coordinates = formatCoordinates(event.spatial_data);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Breadcrumb — timeline-rooted (falls back to Events when no home) */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {home ? (
          <Link href={`/timelines/${home.slug}`} className="hover:underline">
            {home.title}
          </Link>
        ) : (
          <Link href="/events" className="hover:underline">
            Events
          </Link>
        )}
        <span aria-hidden>▸</span>
        <span className="text-foreground truncate">{event.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Badge variant="secondary" className="capitalize text-xs">
                {formatEventType(event.event_type)}
              </Badge>
              <span className="text-xs">
                Importance {event.importance ?? 0} / 10
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PublishControl
              published={event.published ?? false}
              entityLabel="event"
              canPublish={isOwner}
              onPublish={() =>
                publish.mutate(event.id, {
                  onSuccess: () => toast.success("Event published."),
                })
              }
              onUnpublish={() =>
                unpublish.mutate(event.id, {
                  onSuccess: () => toast.success("Event unpublished."),
                })
              }
            />
            {canEdit && (
              <Link
                href={`/events/${slug}/edit`}
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
                  onClick={() => void navigator.clipboard.writeText(event.id)}
                >
                  Copy ID
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Two-column overview */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_18rem] gap-6">
        {/* Left: narrative */}
        <div className="space-y-6 min-w-0">
          <div className="space-y-2">
            <SectionHeading>Summary</SectionHeading>
            {event.summary ? (
              <p className="text-sm whitespace-pre-wrap">{event.summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No summary.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <SectionHeading>Detail</SectionHeading>
            {event.detail ? (
              <p className="text-sm whitespace-pre-wrap">{event.detail}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No detail provided.
              </p>
            )}
          </div>
        </div>

        {/* Right: structured metadata (fixed width) */}
        <div className="space-y-6">
          <div className="space-y-2">
            <SectionHeading>Temporal</SectionHeading>
            <TemporalDisplay
              value={startTemporal}
              endValue={endTemporal}
              format="block"
              showExact
            />
            <p className="text-xs text-muted-foreground">
              {duration ?? "point event"}
            </p>
          </div>

          {(event.location || coordinates) && (
            <div className="space-y-2">
              <SectionHeading>Location</SectionHeading>
              {event.location && <p className="text-sm">{event.location}</p>}
              {coordinates && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {coordinates}
                </p>
              )}
            </div>
          )}

          <TimelinesPanel
            home={home}
            guests={guests}
            expandsInto={expandsInto}
            earlier={neighbors.earlier}
            later={neighbors.later}
          />

          {stories.length > 0 && (
            <div className="space-y-2">
              <SectionHeading>Related stories</SectionHeading>
              <ul className="space-y-1">
                {stories.map((s) => (
                  <li key={s.id} className="text-sm">
                    <Link
                      href={`/stories/${s.slug}`}
                      className="hover:underline"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="participants">
        <TabsList>
          <TabsTrigger value="participants">
            Participants ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categories ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="media">Media ({mediaItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="pt-4">
          <ParticipantsTab
            participants={participants}
            isLoading={participantsPending}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="categories" className="pt-4">
          <CategoriesTab
            categories={categories}
            isLoading={categoriesPending}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="media" className="pt-4">
          <MediaSection
            client={client}
            items={mediaItems}
            isLoading={mediaPending}
            canEdit={canEdit}
            ordering="sort"
            onAttach={handleAttachMedia}
            onDetach={handleDetachMedia}
            onReorder={handleReorderMedia}
            onChanged={refreshMedia}
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
            aria-expanded={showDangerZone}
            aria-controls="event-danger-zone"
          >
            {showDangerZone ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Danger zone
          </button>
          {showDangerZone && (
            <div
              id="event-danger-zone"
              className="px-4 pb-4 pt-1 border-t border-destructive/20"
            >
              <p className="text-xs text-muted-foreground mb-3">
                Deleting an event is permanent and cannot be undone. All
                participant, category, and media associations will be removed.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                Delete event
              </Button>
            </div>
          )}
        </div>
      )}

      <DeleteEventDialog
        open={showDelete}
        title={event.title}
        onConfirm={() =>
          deleteEvent.mutate(event.id, {
            onSuccess: () => router.replace("/events"),
          })
        }
        onClose={() => setShowDelete(false)}
      />
    </div>
  );
}
