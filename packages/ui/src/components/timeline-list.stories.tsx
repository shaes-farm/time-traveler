import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Calendar,
  Clock,
  FolderTree,
  GitBranch,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  Plus,
  Users,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { useUiStore } from "@repo/ui/stores";
import { Button } from "./button";
import { DataTable, createSelectColumn } from "./data-table";
import { FilterRail, type FilterGroup } from "./filter-rail";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";
import { StatusBadge } from "./status-badge";
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

// ─── Visibility helper (label always paired with icon) ──────────────────────────

type Visibility = "private" | "public" | "shared";

const VISIBILITY_META: Record<
  Visibility,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  private: { icon: Lock, label: "Private" },
  public: { icon: Globe, label: "Public" },
  shared: { icon: Users, label: "Shared" },
};

function VisibilityCell({ visibility }: { visibility: Visibility }) {
  const { icon: Icon, label } = VISIBILITY_META[visibility];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

// ─── Timeline row fixture ───────────────────────────────────────────────────────

type TimelineType = "general" | "biographical" | "comparative";

interface TimelineRow {
  id: string;
  title: string;
  slug: string;
  timelineType: TimelineType;
  visibility: Visibility;
  published: boolean;
  start: TemporalData;
  end?: TemporalData;
  eventCount: number;
  collaboratorCount: number;
  updated: string;
}

const TIMELINES: TimelineRow[] = [
  {
    id: "1",
    title: "Curie scientific biography",
    slug: "curie-scientific-biography",
    timelineType: "biographical",
    visibility: "public",
    published: true,
    start: { year: 1867, era: "CE", precision: "exact" },
    end: { year: 1934, era: "CE", precision: "exact" },
    eventCount: 24,
    collaboratorCount: 2,
    updated: "2 days ago",
  },
  {
    id: "2",
    title: "Cosmic history",
    slug: "cosmic-history",
    timelineType: "general",
    visibility: "public",
    published: true,
    start: { year: 13_800_000_000, era: "BYA", precision: "estimated" },
    end: { year: 1, era: "CE", precision: "exact" },
    eventCount: 142,
    collaboratorCount: 5,
    updated: "1 week ago",
  },
  {
    id: "3",
    title: "Bronze Age collapse (comparative)",
    slug: "bronze-age-collapse",
    timelineType: "comparative",
    visibility: "shared",
    published: false,
    start: { year: 1200, era: "BCE", precision: "circa" },
    end: { year: 1150, era: "BCE", precision: "circa" },
    eventCount: 18,
    collaboratorCount: 3,
    updated: "3 weeks ago",
  },
  {
    id: "4",
    title: "Pleistocene megafauna",
    slug: "pleistocene-megafauna",
    timelineType: "general",
    visibility: "private",
    published: false,
    start: { year: 2_580_000, era: "MYA", precision: "geological" },
    end: { year: 11, era: "KYA", precision: "estimated" },
    eventCount: 9,
    collaboratorCount: 0,
    updated: "1 month ago",
  },
];

// ─── Column definitions ─────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<TimelineRow>[] = [
  createSelectColumn<TimelineRow>(),
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{t.title}</span>
          <span className="flex items-center gap-2 text-xs text-foreground-muted">
            <TemporalDisplay
              value={t.start}
              endValue={t.end}
              format="compact"
            />
            <span aria-hidden>·</span>
            <span className="tabular-nums">{t.eventCount} events</span>
            {t.collaboratorCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="tabular-nums">
                  {t.collaboratorCount} collaborators
                </span>
              </>
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "timelineType",
    header: "Type",
    cell: ({ getValue }) => (
      <span className="text-sm capitalize text-foreground-muted">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => <VisibilityCell visibility={row.original.visibility} />,
  },
  {
    accessorKey: "published",
    header: "Publication",
    cell: ({ getValue }) => (
      <StatusBadge status={(getValue() as boolean) ? "published" : "draft"} />
    ),
  },
  {
    accessorKey: "updated",
    header: "Updated",
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground-muted">
        {getValue() as string}
      </span>
    ),
  },
];

// ─── Filter options ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "general", label: "General", count: 2 },
  { value: "biographical", label: "Biographical", count: 1 },
  { value: "comparative", label: "Comparative", count: 1 },
];

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private", count: 1 },
  { value: "public", label: "Public", count: 2 },
  { value: "shared", label: "Shared", count: 1 },
];

const PUBLICATION_OPTIONS = [
  { value: "published", label: "Published", count: 2 },
  { value: "draft", label: "Draft", count: 2 },
];

const SCOPE_OPTIONS = [
  { value: "include-sub", label: "Include sub-timelines" },
];

// ─── Page component ─────────────────────────────────────────────────────────────

function TimelineListPage() {
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  const [visibilityFilter, setVisibilityFilter] = React.useState<string[]>([]);
  const [publicationFilter, setPublicationFilter] = React.useState<string[]>(
    [],
  );
  const [scope, setScope] = React.useState<string[]>([]);

  const filtered = TIMELINES.filter((t) => {
    if (typeFilter.length > 0 && !typeFilter.includes(t.timelineType))
      return false;
    if (visibilityFilter.length > 0 && !visibilityFilter.includes(t.visibility))
      return false;
    if (publicationFilter.length > 0) {
      const state = t.published ? "published" : "draft";
      if (!publicationFilter.includes(state)) return false;
    }
    return true;
  });

  const groups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Timeline type",
      options: TYPE_OPTIONS,
      value: typeFilter,
      onChange: setTypeFilter,
    },
    {
      type: "checkbox",
      id: "visibility",
      label: "Visibility",
      options: VISIBILITY_OPTIONS,
      value: visibilityFilter,
      onChange: setVisibilityFilter,
    },
    {
      type: "checkbox",
      id: "publication",
      label: "Publication",
      options: PUBLICATION_OPTIONS,
      value: publicationFilter,
      onChange: setPublicationFilter,
    },
    {
      type: "checkbox",
      id: "scope",
      label: "Scope",
      options: SCOPE_OPTIONS,
      value: scope,
      onChange: setScope,
    },
  ];

  function clearAll() {
    setTypeFilter([]);
    setVisibilityFilter([]);
    setPublicationFilter([]);
    setScope([]);
  }

  return (
    <div className="flex h-full">
      <main className="flex flex-1 flex-col overflow-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="font-display text-xl text-foreground">Timelines</h1>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Showing top-level timelines · sorted by last updated
            </p>
          </div>
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New timeline
          </Button>
        </div>
        <div className="p-6">
          <DataTable columns={COLUMNS} data={filtered} />
        </div>
      </main>
      <FilterRail groups={groups} onClearAll={clearAll} />
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
  title: "Pages/Timeline List",
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
      breadcrumbs={[{ label: "Timelines" }]}
    >
      <TimelineListPage />
    </Shell>
  ),
};
