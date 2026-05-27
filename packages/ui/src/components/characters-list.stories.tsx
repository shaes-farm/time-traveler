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
import { FilterRail, type FilterGroup, type RadioValue } from "./filter-rail";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";
import { StatusBadge } from "./status-badge";

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

// ─── Character row fixture ────────────────────────────────────────────────────

interface CharacterRow {
  id: string;
  name: string;
  slug: string;
  characterType: string;
  era: string;
  significance: "low" | "medium" | "high" | "critical";
  status: "published" | "draft" | "shared";
  eventCount: number;
  updatedAt: string;
}

const CHARACTERS: CharacterRow[] = [
  {
    id: "1",
    name: "Marie Curie",
    slug: "marie-curie",
    characterType: "human",
    era: "CE",
    significance: "critical",
    status: "published",
    eventCount: 12,
    updatedAt: "2026-05-21",
  },
  {
    id: "2",
    name: "Homo sapiens idaltu",
    slug: "homo-sapiens-idaltu",
    characterType: "human",
    era: "KYA",
    significance: "high",
    status: "draft",
    eventCount: 2,
    updatedAt: "2026-05-10",
  },
  {
    id: "3",
    name: "Ra",
    slug: "ra",
    characterType: "mythological",
    era: "BCE",
    significance: "critical",
    status: "published",
    eventCount: 8,
    updatedAt: "2026-04-30",
  },
  {
    id: "4",
    name: "Don Quixote",
    slug: "don-quixote",
    characterType: "fictional",
    era: "CE",
    significance: "high",
    status: "published",
    eventCount: 5,
    updatedAt: "2026-04-18",
  },
  {
    id: "5",
    name: "Académie des sciences",
    slug: "academie-des-sciences",
    characterType: "organization",
    era: "CE",
    significance: "medium",
    status: "shared",
    eventCount: 19,
    updatedAt: "2026-05-03",
  },
];

const SIGNIFICANCE_LABEL: Record<CharacterRow["significance"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<CharacterRow, string>[] = [
  createSelectColumn<CharacterRow>() as ColumnDef<CharacterRow, string>,
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "characterType",
    header: "Type",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="text-xs capitalize">
        {getValue()}
      </Badge>
    ),
  },
  {
    accessorKey: "era",
    header: "Era",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-foreground-muted">
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: "significance",
    header: "Significance",
    cell: ({ getValue }) => {
      const sig = getValue() as CharacterRow["significance"];
      return (
        <span className="text-sm text-foreground-muted">
          {SIGNIFICANCE_LABEL[sig]}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() as CharacterRow["status"]} />
    ),
  },
  {
    accessorKey: "eventCount",
    header: "Events",
    cell: ({ getValue }) => (
      <span className="text-sm tabular-nums text-foreground-muted">
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ getValue }) => (
      <time className="text-xs text-foreground-subtle">{getValue()}</time>
    ),
  },
];

// ─── Filter options ───────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "human", label: "Human", count: 2 },
  { value: "mythological", label: "Mythological", count: 1 },
  { value: "fictional", label: "Fictional", count: 1 },
  { value: "organization", label: "Organization", count: 1 },
];

const ERA_OPTIONS = [
  { value: "CE", label: "CE", count: 3 },
  { value: "BCE", label: "BCE", count: 1 },
  { value: "KYA", label: "KYA", count: 1 },
];

// ─── Page component ───────────────────────────────────────────────────────────

function CharactersListPage() {
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  const [eraFilter, setEraFilter] = React.useState<string[]>([]);
  const [publishedFilter, setPublishedFilter] =
    React.useState<RadioValue>("any");

  const filtered = CHARACTERS.filter((c) => {
    if (typeFilter.length > 0 && !typeFilter.includes(c.characterType))
      return false;
    if (eraFilter.length > 0 && !eraFilter.includes(c.era)) return false;
    if (publishedFilter === "yes" && c.status !== "published") return false;
    if (publishedFilter === "no" && c.status === "published") return false;
    return true;
  });

  const groups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Character type",
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
      type: "radio",
      id: "published",
      label: "Published",
      value: publishedFilter,
      onChange: setPublishedFilter,
      yesLabel: "Published",
      noLabel: "Draft/Shared",
    },
  ];

  function clearAll() {
    setTypeFilter([]);
    setEraFilter([]);
    setPublishedFilter("any");
  }

  return (
    <div className="flex h-full">
      <FilterRail groups={groups} onClearAll={clearAll} />
      <main className="flex flex-1 flex-col overflow-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="font-display text-xl text-foreground">Characters</h1>
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New character
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
  title: "Pages/Characters List",
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
      currentPath="/characters"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[{ label: "Characters" }]}
    >
      <CharactersListPage />
    </Shell>
  ),
};

export const TypeFiltered: Story = {
  loaders: shellLoaders,
  render: () => {
    function Wrapper() {
      const [typeFilter, setTypeFilter] = React.useState<string[]>(["human"]);
      const [eraFilter, setEraFilter] = React.useState<string[]>([]);
      const [publishedFilter, setPublishedFilter] =
        React.useState<RadioValue>("any");

      const filtered = CHARACTERS.filter((c) => {
        if (typeFilter.length > 0 && !typeFilter.includes(c.characterType))
          return false;
        if (eraFilter.length > 0 && !eraFilter.includes(c.era)) return false;
        if (publishedFilter === "yes" && c.status !== "published") return false;
        if (publishedFilter === "no" && c.status === "published") return false;
        return true;
      });

      const groups: FilterGroup[] = [
        {
          type: "checkbox",
          id: "type",
          label: "Character type",
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
          type: "radio",
          id: "published",
          label: "Published",
          value: publishedFilter,
          onChange: setPublishedFilter,
          yesLabel: "Published",
          noLabel: "Draft/Shared",
        },
      ];

      return (
        <Shell
          nav={NAV}
          currentPath="/characters"
          user={SHELL_USER}
          quickCreateItems={QUICK_CREATE}
          breadcrumbs={[{ label: "Characters" }]}
        >
          <div className="flex h-full">
            <FilterRail
              groups={groups}
              onClearAll={() => {
                setTypeFilter([]);
                setEraFilter([]);
                setPublishedFilter("any");
              }}
            />
            <main className="flex flex-1 flex-col overflow-auto">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h1 className="font-display text-xl text-foreground">
                  Characters
                </h1>
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  New character
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
