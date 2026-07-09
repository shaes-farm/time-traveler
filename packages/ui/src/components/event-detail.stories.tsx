import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Calendar,
  Clock,
  CornerRightDown,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  Users,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { useUiStore } from "@repo/ui/stores";
import { Avatar, AvatarFallback } from "./avatar";
import { Badge } from "./badge";
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

const SHELL_USER = { name: "Admin User", email: "admin@example.com" };

// ─── Fixtures ───────────────────────────────────────────────────────────────────

const EVENT_DATE: TemporalData = { year: 1898, era: "CE", precision: "exact" };

interface ParticipantRow {
  id: string;
  name: string;
  initials: string;
  role: string;
  significance: string;
}

const PARTICIPANTS: ParticipantRow[] = [
  {
    id: "1",
    name: "Marie Curie",
    initials: "MC",
    role: "protagonist",
    significance: "primary",
  },
  {
    id: "2",
    name: "Pierre Curie",
    initials: "PC",
    role: "protagonist",
    significance: "primary",
  },
];

const GUEST_TIMELINES = ["History of radioactivity", "Women in science"];
const NEARBY = [
  {
    id: "n1",
    title: "Discovery of radium",
    date: { year: 1898, era: "CE", precision: "exact" } as TemporalData,
  },
  {
    id: "n2",
    title: "Marriage to Pierre Curie",
    date: { year: 1895, era: "CE", precision: "exact" } as TemporalData,
  },
  {
    id: "n3",
    title: "Curies share Nobel in Physics",
    date: { year: 1903, era: "CE", precision: "exact" } as TemporalData,
  },
];
const CATEGORIES = ["Physics", "Discovery", "Chemistry"];

function RailHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
      {children}
    </h3>
  );
}

// ─── Detail page ─────────────────────────────────────────────────────────────────

function EventDetailPage() {
  const [published, setPublished] = React.useState(true);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-foreground">
            Discovery of polonium
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground-muted">
            <Badge variant="outline" className="capitalize">
              discovery
            </Badge>
            <span aria-hidden>·</span>
            <span className="tabular-nums">★ 8 High</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Paris, France
            </span>
          </p>
          <p className="mt-1 text-sm text-foreground">
            <TemporalDisplay value={EVENT_DATE} />
          </p>
        </div>
        <div className="shrink-0">
          <PublishControl
            published={published}
            entityLabel="event"
            onPublish={() => setPublished(true)}
            onUnpublish={() => setPublished(false)}
          />
        </div>
      </div>

      {/* Body: two columns */}
      <div className="mt-6 flex gap-8">
        {/* Left: narrative */}
        <div className="min-w-0 flex-1 space-y-6">
          <section>
            <h2 className="mb-1.5 font-display text-sm font-normal text-foreground">
              Summary
            </h2>
            <div className="border-t border-border pt-3 text-sm text-foreground-muted">
              Marie and Pierre Curie isolate polonium, the first new element
              identified through radioactivity research.
            </div>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-sm font-normal text-foreground">
              Detail
            </h2>
            <div className="border-t border-border pt-3 text-sm leading-relaxed text-foreground-muted">
              In 1898, Marie and Pierre Curie announced the discovery of a new
              radioactive element, which they named polonium after Marie&rsquo;s
              homeland. This marked the first element discovered through the
              novel technique of tracking radioactivity.
            </div>
          </section>

          {/* Tabs */}
          <Tabs defaultValue="participants">
            <TabsList>
              <TabsTrigger value="participants">Participants (2)</TabsTrigger>
              <TabsTrigger value="categories">Categories (3)</TabsTrigger>
              <TabsTrigger value="media">Media (1)</TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="pt-4">
              <ul className="divide-y divide-border border-y border-border">
                {PARTICIPANTS.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {p.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm text-foreground">
                      {p.name}
                    </span>
                    <span className="text-xs capitalize text-foreground-muted">
                      {p.role}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {p.significance}
                    </Badge>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="categories" className="pt-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="pt-4">
              <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-border bg-surface/50 text-foreground-muted">
                <ImageIcon className="h-5 w-5 opacity-40" aria-hidden />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: metadata rail */}
        <aside className="w-72 shrink-0 space-y-6">
          <section>
            <RailHeading>Temporal scope</RailHeading>
            <div className="text-sm text-foreground">
              <TemporalDisplay value={EVENT_DATE} format="block" showExact />
            </div>
          </section>

          <section>
            <RailHeading>Timelines</RailHeading>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-foreground-subtle">
                  Contained in
                </p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-foreground hover:underline"
                    >
                      Curie scientific biography
                    </button>
                    <Badge variant="secondary" className="text-xs">
                      home
                    </Badge>
                  </li>
                  {GUEST_TIMELINES.map((tl) => (
                    <li key={tl} className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-foreground-muted hover:text-foreground hover:underline"
                      >
                        {tl}
                      </button>
                      <Badge variant="outline" className="text-xs">
                        linked
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1 text-xs text-foreground-subtle">
                  Expands into
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-foreground hover:underline"
                >
                  <CornerRightDown className="h-3.5 w-3.5" aria-hidden />
                  Polonium isolation (sub-timeline) · 6 events
                </button>
              </div>

              <div>
                <p className="mb-1 text-xs text-foreground-subtle">
                  Nearby in timeline
                </p>
                <ul className="space-y-1">
                  {NEARBY.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        className="truncate text-foreground-muted hover:text-foreground hover:underline"
                      >
                        {n.title}
                      </button>
                      <span className="shrink-0 text-xs text-foreground-subtle">
                        <TemporalDisplay value={n.date} format="compact" />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </aside>
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
  title: "Pages/Event Detail",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/events"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Curie scientific biography", href: "/timelines/curie" },
        { label: "Discovery of polonium" },
      ]}
    >
      <EventDetailPage />
    </Shell>
  ),
};
