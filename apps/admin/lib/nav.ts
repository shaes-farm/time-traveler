import {
  BookOpen,
  Calendar,
  Clock,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import type {
  ShellNavEntry,
  ShellQuickCreateItem,
} from "@repo/ui/components/shell";

/**
 * Sidebar navigation. Routes match the route-group scaffolding in
 * `app/(protected)/*`. Order mirrors the wireframe inventory.
 */
export const NAV_ITEMS: ShellNavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Content",
    items: [
      { label: "Characters", href: "/characters", icon: Users },
      { label: "Events", href: "/events", icon: Calendar },
      { label: "Timelines", href: "/timelines", icon: GitBranch },
      { label: "Periods", href: "/periods", icon: Clock },
      { label: "Stories", href: "/stories", icon: BookOpen },
    ],
  },
  {
    label: "Library",
    items: [
      { label: "Media", href: "/media", icon: ImageIcon },
      { label: "Categories", href: "/categories", icon: FolderTree },
    ],
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

/**
 * Topbar quick-create dropdown. Eight entity types — the seven sidebar
 * routes that take CRUD plus Relationship (which is junction-only).
 * Routes 404-stub until Batch G ships the editor primitives.
 */
export const QUICK_CREATE_ITEMS: ShellQuickCreateItem[] = [
  { label: "Character", href: "/characters/new" },
  { label: "Event", href: "/events/new" },
  { label: "Period", href: "/periods/new" },
  { label: "Story", href: "/stories/new" },
  { label: "Timeline", href: "/timelines/new" },
  { label: "Category", href: "/categories/new" },
  { label: "Media", href: "/media/new" },
  { label: "Relationship", href: "/relationships/new" },
];
