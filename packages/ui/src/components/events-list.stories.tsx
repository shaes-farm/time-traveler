import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Calendar,
  Clock,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";
import { useUiStore } from "@repo/ui/stores";
import { Badge } from "./badge";
import { Button } from "./button";
import { DataTable, createSelectColumn } from "./data-table";
import { FilterRail, type FilterGroup } from "./filter-rail";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";

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

// ─── Importance helpers ───────────────────────────────────────────────────────

function importanceCssVar(importance: number): string {
  if (importance <= 3) return "var(--color-importance-low)";
  if (importance <= 6) return "var(--color-importance-medium)";
  if (importance <= 8) return "var(--color-importance-high)";
  return "var(--color-importance-critical)";
}

function importanceLabel(importance: number): string {
  if (importance <= 3) return "Low";
  if (importance <= 6) return "Medium";
  if (importance <= 8) return "High";
  return "Critical";
}

// ─── Event row fixture ────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  title: string;
  slug: string;
  eventType: string;
  era: string;
  date: string;
  importance: number;
  published: boolean;
}

const EVENTS: EventRow[] = [
  {
    id: "1",
    title: "Discovery of Radium",
    slug: "discovery-of-radium",
    eventType: "discovery",
    era: "CE",
    date: "1898 CE",
    importance: 9,
    published: true,
  },
  {
    id: "2",
    title: "Battle of Thermopylae",
    slug: "battle-of-thermopylae",
    eventType: "conflict",
    era: "BCE",
    date: "480 BCE",
    importance: 8,
    published: true,
  },
  {
    id: "3",
    title: "Toba Supervolcano Eruption",
    slug: "toba-supervolcano-eruption",
    eventType: "incident",
    era: "KYA",
    date: "74 KYA",
    importance: 7,
    published: false,
  },
  {
    id: "4",
    title: "Formation of the Moon",
    slug: "formation-of-the-moon",
    eventType: "creation",
    era: "BYA",
    date: "4.5 BYA",
    importance: 10,
    published: true,
  },
  {
    id: "5",
    title: "Founding of the Roman Republic",
    slug: "founding-roman-republic",
    eventType: "milestone",
    era: "BCE",
    date: "509 BCE",
    importance: 8,
    published: true,
  },
  {
    id: "6",
    title: "First Human Migration Out of Africa",
    slug: "first-human-migration-out-of-africa",
    eventType: "migration",
    era: "KYA",
    date: "70 KYA",
    importance: 10,
    published: false,
  },
];

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<EventRow>[] = [
  createSelectColumn<EventRow>(),
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "eventType",
    header: "Type",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="text-xs capitalize">
        {getValue() as string}
      </Badge>
    ),
  },
  {
    accessorKey: "era",
    header: "Era",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-foreground-muted">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground-muted">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "importance",
    header: "Importance",
    cell: ({ row }) => {
      const imp = row.original.importance;
      return (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: importanceCssVar(imp) }}
            aria-hidden
          />
          <span
            className="text-sm tabular-nums"
            style={{ color: importanceCssVar(imp) }}
          >
            {imp}
          </span>
          <span className="text-xs text-foreground-subtle">
            {importanceLabel(imp)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "published",
    header: "Published",
    cell: ({ getValue }) => {
      const pub = getValue() as boolean;
      return (
        <span
          className={
            pub
              ? "text-xs text-foreground-muted"
              : "text-xs text-foreground-subtle"
          }
        >
          {pub ? "Published" : "Draft"}
        </span>
      );
    },
  },
];

// ─── Filter options ───────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "conflict", label: "Conflict", count: 1 },
  { value: "creation", label: "Creation", count: 1 },
  { value: "discovery", label: "Discovery", count: 1 },
  { value: "incident", label: "Incident", count: 1 },
  { value: "migration", label: "Migration", count: 1 },
  { value: "milestone", label: "Milestone", count: 1 },
];

const ERA_OPTIONS = [
  { value: "CE", label: "CE", count: 1 },
  { value: "BCE", label: "BCE", count: 2 },
  { value: "KYA", label: "KYA", count: 2 },
  { value: "BYA", label: "BYA", count: 1 },
];

// ─── Page component ───────────────────────────────────────────────────────────

function EventsListPage() {
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  const [eraFilter, setEraFilter] = React.useState<string[]>([]);
  const [importanceRange, setImportanceRange] = React.useState<
    [number, number]
  >([1, 10]);

  const filtered = EVENTS.filter((e) => {
    if (typeFilter.length > 0 && !typeFilter.includes(e.eventType))
      return false;
    if (eraFilter.length > 0 && !eraFilter.includes(e.era)) return false;
    if (e.importance < importanceRange[0] || e.importance > importanceRange[1])
      return false;
    return true;
  });

  const groups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Event type",
      options: TYPE_OPTIONS,
      value: typeFilter,
      onChange: setTypeFilter,
    },
    {
      type: "checkbox",
      id: "era",
      label: "Era",
      options: ERA_OPTIONS,
      value: eraFilter,
      onChange: setEraFilter,
    },
    {
      type: "range",
      id: "importance",
      label: "Importance",
      min: 1,
      max: 10,
      value: importanceRange,
      onChange: setImportanceRange,
      formatLabel: (v) => `${v} — ${importanceLabel(v)}`,
    },
  ];

  function clearAll() {
    setTypeFilter([]);
    setEraFilter([]);
    setImportanceRange([1, 10]);
  }

  return (
    <div className="flex h-full">
      <FilterRail groups={groups} onClearAll={clearAll} />
      <main className="flex flex-1 flex-col overflow-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="font-display text-xl text-foreground">Events</h1>
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New event
          </Button>
        </div>
        <div className="p-6">
          <DataTable columns={COLUMNS} data={filtered} />
        </div>
      </main>
    </div>
  );
}

// ─── Store reset ──────────────────────────────────────────────────────────────

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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Pages/Events List",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/events"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[{ label: "Events" }]}
    >
      <EventsListPage />
    </Shell>
  ),
};

export const ImportanceFiltered: Story = {
  loaders: shellLoaders,
  render: () => {
    function Wrapper() {
      const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
      const [eraFilter, setEraFilter] = React.useState<string[]>([]);
      const [importanceRange, setImportanceRange] = React.useState<
        [number, number]
      >([8, 10]);

      const filtered = EVENTS.filter((e) => {
        if (typeFilter.length > 0 && !typeFilter.includes(e.eventType))
          return false;
        if (eraFilter.length > 0 && !eraFilter.includes(e.era)) return false;
        if (
          e.importance < importanceRange[0] ||
          e.importance > importanceRange[1]
        )
          return false;
        return true;
      });

      const groups: FilterGroup[] = [
        {
          type: "checkbox",
          id: "type",
          label: "Event type",
          options: TYPE_OPTIONS,
          value: typeFilter,
          onChange: setTypeFilter,
        },
        {
          type: "checkbox",
          id: "era",
          label: "Era",
          options: ERA_OPTIONS,
          value: eraFilter,
          onChange: setEraFilter,
        },
        {
          type: "range",
          id: "importance",
          label: "Importance",
          min: 1,
          max: 10,
          value: importanceRange,
          onChange: setImportanceRange,
          formatLabel: (v) => `${v} — ${importanceLabel(v)}`,
        },
      ];

      return (
        <Shell
          nav={NAV}
          currentPath="/events"
          user={SHELL_USER}
          quickCreateItems={QUICK_CREATE}
          breadcrumbs={[{ label: "Events" }]}
        >
          <div className="flex h-full">
            <FilterRail
              groups={groups}
              onClearAll={() => {
                setTypeFilter([]);
                setEraFilter([]);
                setImportanceRange([1, 10]);
              }}
            />
            <main className="flex flex-1 flex-col overflow-auto">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h1 className="font-display text-xl text-foreground">Events</h1>
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  New event
                </Button>
              </div>
              <div className="p-6">
                <DataTable columns={COLUMNS} data={filtered} />
              </div>
            </main>
          </div>
        </Shell>
      );
    }
    return <Wrapper />;
  },
};
