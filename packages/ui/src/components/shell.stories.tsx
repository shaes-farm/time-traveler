import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Calendar,
  Clock,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { useUiStore } from "@repo/ui/stores";
import { Skeleton } from "./skeleton";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";

const meta = {
  title: "Pages/Shell",
  component: Shell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

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

const USER = {
  name: "Marie Curie",
  email: "marie@example.com",
};

const resetShellUiState = () => {
  useUiStore.setState({
    sidebarOpen: true,
    sidebarWidth: 280,
    activeModal: null,
    modalData: {},
    toasts: [],
  });
};

const placeholderRowIds = ["row-1", "row-2", "row-3", "row-4", "row-5"];

const PlaceholderContent = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="mx-auto max-w-5xl space-y-6 p-6">
    <header className="space-y-1">
      <h1 className="font-display text-3xl text-foreground">{title}</h1>
      <p className="font-body text-sm text-foreground-muted">{description}</p>
    </header>
    <div className="space-y-2 rounded-md border border-border bg-surface p-4">
      {placeholderRowIds.map((rowId) => (
        <div key={rowId} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
);

const shellLoaders = [
  async () => {
    resetShellUiState();
    return {};
  },
];

export const Dashboard: Story = {
  loaders: shellLoaders,
  args: {
    nav: NAV,
    currentPath: "/dashboard",
    user: USER,
    quickCreateItems: QUICK_CREATE,
    children: (
      <PlaceholderContent
        title="Dashboard"
        description="Recent activity, draft work, and quick links."
      />
    ),
  },
};

export const Characters: Story = {
  loaders: shellLoaders,
  args: {
    ...Dashboard.args,
    currentPath: "/characters",
    children: (
      <PlaceholderContent
        title="Characters"
        description="Human, Animal, Mythological, Fictional, Organization, Divine, Artifact."
      />
    ),
  },
};

export const DeepBreadcrumb: Story = {
  loaders: shellLoaders,
  args: {
    ...Dashboard.args,
    currentPath: "/characters/curie-marie",
    breadcrumbs: [
      { label: "Characters", href: "/characters" },
      { label: "Marie Curie" },
    ],
    children: (
      <PlaceholderContent
        title="Marie Curie"
        description="Character detail — explicit breadcrumb override."
      />
    ),
  },
};
