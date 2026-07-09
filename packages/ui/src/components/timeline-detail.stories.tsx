import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  CornerRightDown,
  FolderTree,
  GitBranch,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  Plus,
  Users,
  X,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { useUiStore } from "@repo/ui/stores";
import { Badge } from "./badge";
import { Button } from "./button";
import { CollaboratorList, type Collaborator } from "./collaborator-list";
import { PublishControl } from "./publish-control";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { TemporalDisplay } from "./temporal-display";

// ─── Shell fixture data ───────────────────────────────────────────────────────

const NAV: ShellNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Timelines", href: "/timelines", icon: GitBranch },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Characters", href: "/characters", icon: Users },
  { label: "Periods", href: "/periods", icon: Clock },
  { label: "Stories", href: "/stories", icon: BookOpen },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "Media", href: "/media", icon: ImageIcon },
];

const QUICK_CREATE: ShellQuickCreateItem[] = [
  { label: "Character", href: "/characters/new" },
  { label: "Event", href: "/events/new" },
  { label: "Period", href: "/periods/new" },
  { label: "Story", href: "/stories/new" },
  { label: "Timeline", href: "/timelines/new" },
  { label: "Category", href: "/categories/new" },
  { label: "Media", href: "/media/new" },
  { label: "Relationship", href: "/relationships/new" },
];

const SHELL_USER = { name: "Philipe Banglarian", email: "philipe@example.com" };

// ─── Event row fixture ──────────────────────────────────────────────────────────

interface TimelineEventRow {
  id: string;
  title: string;
  date: TemporalData;
  eventType: string;
  importance: number;
  membership: "home" | "linked";
  /** Has a `detail_timeline_id` → drill-down marker. */
  expandable?: boolean;
}

const INITIAL_EVENTS: TimelineEventRow[] = [
  {
    id: "1",
    title: "Sklodowska arrives in Paris",
    date: { year: 1891, era: "CE", precision: "exact" },
    eventType: "milestone",
    importance: 7,
    membership: "home",
  },
  {
    id: "2",
    title: "Marriage to Pierre Curie",
    date: { year: 1895, era: "CE", precision: "exact" },
    eventType: "ceremony",
    importance: 6,
    membership: "home",
  },
  {
    id: "3",
    title: "Discovery of polonium",
    date: { year: 1898, era: "CE", precision: "exact" },
    eventType: "discovery",
    importance: 8,
    membership: "home",
    expandable: true,
  },
  {
    id: "4",
    title: "Discovery of radium",
    date: { year: 1898, era: "CE", precision: "exact" },
    eventType: "discovery",
    importance: 8,
    membership: "home",
  },
  {
    id: "5",
    title: "Curies share Nobel in Physics",
    date: { year: 1903, era: "CE", precision: "exact" },
    eventType: "ceremony",
    importance: 9,
    membership: "home",
  },
  {
    id: "6",
    title: "Pierre Curie killed",
    date: { year: 1906, era: "CE", precision: "exact" },
    eventType: "incident",
    importance: 10,
    membership: "linked",
  },
  {
    id: "7",
    title: "Solo Nobel in Chemistry",
    date: { year: 1911, era: "CE", precision: "exact" },
    eventType: "ceremony",
    importance: 9,
    membership: "home",
  },
];

const COLLABORATORS: Collaborator[] = [
  {
    id: "c1",
    username: "irenejc",
    displayName: "Irène Joliot-Curie",
    role: "editor",
  },
  {
    id: "c2",
    username: "ebranly",
    displayName: "Édouard Branly",
    role: "viewer",
  },
];

function importanceLabel(importance: number): string {
  if (importance <= 3) return "Low";
  if (importance <= 6) return "Medium";
  if (importance <= 8) return "High";
  return "Critical";
}

// ─── Events tab ──────────────────────────────────────────────────────────────────

function EventsTab() {
  const [events, setEvents] =
    React.useState<TimelineEventRow[]>(INITIAL_EVENTS);

  const move = (index: number, delta: number) => {
    setEvents((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const a = next[index];
      const b = next[target];
      if (!a || !b) return prev;
      next[index] = b;
      next[target] = a;
      return next;
    });
  };

  const remove = (id: string) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between gap-2 pb-3">
        <input
          className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Filter events…"
          aria-label="Filter events"
        />
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Link event
        </Button>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {events.map((event, index) => (
          <li
            key={event.id}
            className="flex items-center gap-3 py-2.5 pl-1 pr-2"
          >
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Move ${event.title} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="text-foreground-subtle hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={`Move ${event.title} down`}
                disabled={index === events.length - 1}
                onClick={() => move(index, 1)}
                className="text-foreground-subtle hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <GripVertical
              className="h-4 w-4 shrink-0 text-foreground-subtle"
              aria-hidden
            />
            <span className="w-24 shrink-0 text-xs text-foreground-muted">
              <TemporalDisplay value={event.date} format="compact" />
            </span>
            <span className="flex-1 truncate text-sm text-foreground">
              {event.title}
            </span>
            <Badge variant="outline" className="text-xs capitalize">
              {event.eventType}
            </Badge>
            <span
              className="w-16 shrink-0 text-right text-xs tabular-nums text-foreground-muted"
              title={importanceLabel(event.importance)}
            >
              ★ {event.importance}
            </span>
            <Badge
              variant={event.membership === "home" ? "secondary" : "outline"}
              className="w-16 justify-center text-xs"
            >
              {event.membership}
            </Badge>
            {event.expandable ? (
              <button
                type="button"
                aria-label={`Drill into ${event.title}`}
                className="text-foreground-subtle hover:text-foreground"
              >
                <CornerRightDown className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : (
              <span className="h-3.5 w-3.5" aria-hidden />
            )}
            <button
              type="button"
              aria-label={`Unlink ${event.title}`}
              onClick={() => remove(event.id)}
              className="text-foreground-subtle hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <p className="pt-3 text-xs text-foreground-muted">
        Showing {events.length} events · chronological order (no manual sort
        set) · drag or use the arrows to reorder
      </p>
    </div>
  );
}

// ─── Detail page ─────────────────────────────────────────────────────────────────

const SPAN_START: TemporalData = { year: 1867, era: "CE", precision: "exact" };
const SPAN_END: TemporalData = { year: 1934, era: "CE", precision: "exact" };

function TimelineDetailPage() {
  const [published, setPublished] = React.useState(true);
  const [collaborators, setCollaborators] =
    React.useState<Collaborator[]>(COLLABORATORS);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-foreground">
            Curie scientific biography
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground-muted">
            <span className="capitalize">Biographical</span>
            <span aria-hidden>·</span>
            <span>about Marie Curie</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" aria-hidden />
              Public
            </span>
            <span aria-hidden>·</span>
            <span>scale: a single lifetime</span>
          </p>
          <p className="mt-1 text-sm text-foreground">
            <TemporalDisplay value={SPAN_START} endValue={SPAN_END} />
          </p>

          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs text-foreground-muted">
            <Info className="h-3.5 w-3.5" aria-hidden />
            Details the event:{" "}
            <button type="button" className="text-foreground hover:underline">
              ↗ &ldquo;Marie Curie&rsquo;s life&rdquo; (in Cosmic history)
            </button>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PublishControl
            published={published}
            entityLabel="timeline"
            onPublish={() => setPublished(true)}
            onUnpublish={() => setPublished(false)}
          />
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </div>
      </div>

      {/* Summary */}
      <section className="mt-6">
        <h2 className="mb-1.5 font-display text-sm font-normal text-foreground">
          Summary
        </h2>
        <div className="border-t border-border pt-3 text-sm text-foreground-muted">
          The scientific life of Marie Curie, from her arrival in Paris through
          her two Nobel Prizes to her death from aplastic anemia.
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Events (7)</TabsTrigger>
            <TabsTrigger value="periods">Periods (0)</TabsTrigger>
            <TabsTrigger value="collaborators">
              Collaborators ({collaborators.length})
            </TabsTrigger>
            <TabsTrigger value="media">Media (3)</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="pt-4">
            <EventsTab />
          </TabsContent>

          <TabsContent value="periods" className="pt-4">
            <p className="py-8 text-center text-sm text-foreground-muted">
              — Period management arrives in a later release (Phase 6) —
            </p>
          </TabsContent>

          <TabsContent value="collaborators" className="pt-4">
            <CollaboratorList
              collaborators={collaborators}
              owner={{
                displayName: "Philipe Banglarian (you)",
                username: "philipeb",
              }}
              ownerUserId="owner-1"
              resolveUsername={async (username) => ({
                id: username,
                username,
                displayName: username,
              })}
              onAdd={(userId, role) =>
                setCollaborators((prev) => [
                  ...prev,
                  {
                    id: userId,
                    username: userId,
                    displayName: userId,
                    role,
                  },
                ])
              }
              onRemove={(id) =>
                setCollaborators((prev) => prev.filter((c) => c.id !== id))
              }
              onRoleChange={(id, role) =>
                setCollaborators((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, role } : c)),
                )
              }
            />
          </TabsContent>

          <TabsContent value="media" className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-border bg-surface/50 text-foreground-muted">
                <ImageIcon className="h-5 w-5 opacity-40" aria-hidden />
              </div>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Attach media
              </Button>
            </div>
            <p className="mt-2 text-xs text-foreground-muted">
              Drag to reorder (timeline_media.sort_order). Full media management
              ships with the media library (Batch I).
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Store reset ────────────────────────────────────────────────────────────────

const shellLoaders = [
  async () => {
    useUiStore.setState({
      sidebarOpen: true,
      sidebarWidth: 280,
      activeModal: null,
      modalData: {},
      toasts: [],
    });
    return {};
  },
];

// ─── Meta ───────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Pages/Timeline Detail",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/timelines"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Timelines", href: "/timelines" },
        { label: "Curie scientific biography" },
      ]}
    >
      <TimelineDetailPage />
    </Shell>
  ),
};
