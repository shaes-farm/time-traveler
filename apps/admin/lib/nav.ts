import {
  BookOpen,
  Calendar,
  Clock,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  Network,
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
 * Nav entries only an admin (`profiles.role = 'admin'`) sees.
 *
 * Deliberately its own group rather than an entry under `Library` beside
 * Categories. `categories` is user-owned content taxonomy carrying a `user_id`;
 * the relationship vocabulary is global reference data that every user's editor
 * reads and only an admin can write. Filing them together would tell the reader
 * they are the same kind of thing.
 *
 * Hiding this is presentation only — `proxy.ts` and the route's own layout are
 * what actually enforce access. See ADR-0041.
 */
export const ADMIN_NAV_ITEMS: ShellNavEntry[] = [
  {
    label: "Administration",
    items: [
      {
        label: "Relationship vocabulary",
        href: "/admin/relationship-vocabulary",
        icon: Network,
      },
    ],
  },
];

/**
 * Sidebar entries for a given role. Admins get {@link ADMIN_NAV_ITEMS} appended
 * after Settings; everyone else gets {@link NAV_ITEMS} unchanged.
 *
 * The Shell itself stays role-agnostic — it renders whatever array it is given
 * — so role logic has exactly one home.
 */
export function navItemsForRole(role: "editor" | "admin"): ShellNavEntry[] {
  return role === "admin" ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;
}

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
  // Categories are a single tree+inspector surface; `new` is the create route
  // in that layout (the tree persists in the shell, the inspector swaps).
  { label: "Category", href: "/categories/new" },
  { label: "Media", href: "/media/new" },
  { label: "Relationship", href: "/relationships/new" },
];
