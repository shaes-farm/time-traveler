"use client";

import { Fragment, type ComponentType, type ReactNode } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Clock,
  LogOut,
  Plus,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useUiStore } from "@repo/ui/stores";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";

/**
 * Framework-agnostic link contract. The admin app supplies `next/link`;
 * Storybook stories supply a plain `<a>`. Keeping the Shell unaware of
 * Next means the future reader app (D3-based, deferred) can mount the
 * same primitive without a rewrite.
 */
export interface ShellLinkProps {
  href: string;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
}

export type ShellLinkComponent = ComponentType<ShellLinkProps>;

export interface ShellNavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export interface ShellQuickCreateItem {
  label: string;
  href: string;
}

export interface ShellBreadcrumbItem {
  label: string;
  /** Omit for the trailing/current crumb. */
  href?: string;
}

export interface ShellUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

const DefaultShellLink = ({
  href,
  className,
  children,
  ...rest
}: ShellLinkProps) => (
  <a href={href} className={className} {...rest}>
    {children}
  </a>
);

// ---------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------

export interface ShellSidebarProps {
  nav: ShellNavItem[];
  currentPath: string;
  LinkComponent?: ShellLinkComponent;
}

export const ShellSidebar = ({
  nav,
  currentPath,
  LinkComponent = DefaultShellLink,
}: ShellSidebarProps) => {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-150",
        sidebarOpen ? "w-60" : "w-16",
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-3",
          sidebarOpen ? "justify-start gap-2" : "justify-center",
        )}
      >
        <Clock className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
        {sidebarOpen && (
          <span className="font-display text-base leading-none text-foreground">
            Time Traveler
          </span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const active =
              currentPath === item.href ||
              (item.href !== "/" && currentPath.startsWith(`${item.href}/`));
            const Icon = item.icon;
            const link = (
              <LinkComponent
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex h-9 items-center rounded-md text-sm transition-colors",
                  sidebarOpen ? "gap-3 px-3" : "justify-center",
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-foreground-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {sidebarOpen && <span>{item.label}</span>}
              </LinkComponent>
            );
            return (
              <li key={item.href}>
                {sidebarOpen ? (
                  link
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full text-foreground-muted",
            sidebarOpen ? "justify-start" : "justify-center px-0",
          )}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <>
              <ChevronsLeft className="h-4 w-4" aria-hidden />
              <span className="ml-2 text-xs">Collapse</span>
            </>
          ) : (
            <ChevronsRight className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
    </aside>
  );
};

// ---------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------

export interface ShellBreadcrumbProps {
  items: ShellBreadcrumbItem[];
  LinkComponent?: ShellLinkComponent;
}

export const ShellBreadcrumb = ({
  items,
  LinkComponent = DefaultShellLink,
}: ShellBreadcrumbProps) => {
  if (items.length === 0) return null;
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {last || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <LinkComponent href={item.href}>{item.label}</LinkComponent>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && item.href && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// ---------------------------------------------------------------------
// User menu
// ---------------------------------------------------------------------

export interface ShellUserMenuProps {
  user: ShellUser;
  onSignOut?: () => void;
}

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const ShellUserMenu = ({ user, onSignOut }: ShellUserMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 gap-2 px-2"
        aria-label="Open user menu"
      >
        <Avatar className="h-7 w-7">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
          <AvatarFallback className="text-xs">
            {initialsFor(user.name) || "?"}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel className="flex flex-col gap-0.5">
        <span className="text-sm text-foreground">{user.name}</span>
        <span className="text-xs font-normal text-foreground-muted">
          {user.email}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled>
        <UserIcon className="mr-2 h-4 w-4" aria-hidden />
        Profile
      </DropdownMenuItem>
      <DropdownMenuItem disabled>
        <Settings className="mr-2 h-4 w-4" aria-hidden />
        Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={!onSignOut} onSelect={onSignOut}>
        <LogOut className="mr-2 h-4 w-4" aria-hidden />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// ---------------------------------------------------------------------
// Quick-create menu
// ---------------------------------------------------------------------

export interface ShellQuickCreateMenuProps {
  items: ShellQuickCreateItem[];
  LinkComponent?: ShellLinkComponent;
}

export const ShellQuickCreateMenu = ({
  items,
  LinkComponent = DefaultShellLink,
}: ShellQuickCreateMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="secondary" size="sm" aria-label="Quick create">
        <Plus className="h-4 w-4" aria-hidden />
        <span className="ml-1.5 hidden sm:inline">New</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuLabel>Create</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {items.map((item) => (
        <DropdownMenuItem key={item.href} asChild>
          <LinkComponent href={item.href}>{item.label}</LinkComponent>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

// ---------------------------------------------------------------------
// Search trigger
// ---------------------------------------------------------------------

export interface ShellSearchTriggerProps {
  onOpen?: () => void;
}

export const ShellSearchTrigger = ({ onOpen }: ShellSearchTriggerProps) => (
  <Button
    variant="secondary"
    size="sm"
    onClick={onOpen}
    className="h-9 w-full max-w-xs justify-start gap-2 text-foreground-muted"
    aria-label="Open search"
  >
    <Search className="h-4 w-4 shrink-0" aria-hidden />
    <span className="flex-1 text-left text-sm">Search…</span>
    <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-foreground-subtle sm:inline">
      ⌘K
    </kbd>
  </Button>
);

// ---------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------

export interface ShellTopbarProps {
  breadcrumbs: ShellBreadcrumbItem[];
  user: ShellUser;
  onSignOut?: () => void;
  quickCreateItems: ShellQuickCreateItem[];
  onSearchOpen?: () => void;
  LinkComponent?: ShellLinkComponent;
}

export const ShellTopbar = ({
  breadcrumbs,
  user,
  onSignOut,
  quickCreateItems,
  onSearchOpen,
  LinkComponent,
}: ShellTopbarProps) => (
  <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
    <div className="flex flex-1 items-center gap-4 overflow-hidden">
      <div className="hidden flex-1 sm:block">
        <ShellSearchTrigger onOpen={onSearchOpen} />
      </div>
      <div className="hidden min-w-0 flex-1 truncate md:block">
        <ShellBreadcrumb items={breadcrumbs} LinkComponent={LinkComponent} />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <ShellQuickCreateMenu
        items={quickCreateItems}
        LinkComponent={LinkComponent}
      />
      <ShellUserMenu user={user} onSignOut={onSignOut} />
    </div>
  </header>
);

// ---------------------------------------------------------------------
// Shell composer
// ---------------------------------------------------------------------

export interface ShellProps {
  /** Sidebar navigation entries. */
  nav: ShellNavItem[];
  /** Current route — drives sidebar active state and auto-breadcrumb fallback. */
  currentPath: string;
  /** Authenticated user. Placeholder during Batch B; wired to real auth in Batch C/D. */
  user: ShellUser;
  /** Entity types surfaced by the topbar quick-create dropdown. */
  quickCreateItems: ShellQuickCreateItem[];
  /** Explicit breadcrumb trail. Omit to auto-derive a single crumb from `currentPath` + `nav`. */
  breadcrumbs?: ShellBreadcrumbItem[];
  /** Sign-out handler for the user menu. Inert when omitted. */
  onSignOut?: () => void;
  /** Handler for the ⌘K search trigger. */
  onSearchOpen?: () => void;
  /** Framework-specific link primitive (e.g. `next/link`). Falls back to a plain `<a>`. */
  LinkComponent?: ShellLinkComponent;
  children: ReactNode;
}

const deriveBreadcrumbs = (
  currentPath: string,
  nav: ShellNavItem[],
): ShellBreadcrumbItem[] => {
  const match = nav.find(
    (item) =>
      currentPath === item.href ||
      (item.href !== "/" && currentPath.startsWith(`${item.href}/`)),
  );
  if (match) return [{ label: match.label }];
  return [];
};

export const Shell = ({
  nav,
  currentPath,
  user,
  quickCreateItems,
  breadcrumbs,
  onSignOut,
  onSearchOpen,
  LinkComponent,
  children,
}: ShellProps) => {
  const resolvedBreadcrumbs =
    breadcrumbs ?? deriveBreadcrumbs(currentPath, nav);
  const sidebarProps: ShellSidebarProps = {
    nav,
    currentPath,
    ...(LinkComponent ? { LinkComponent } : {}),
  };
  const topbarProps: ShellTopbarProps = {
    breadcrumbs: resolvedBreadcrumbs,
    user,
    quickCreateItems,
    ...(onSignOut ? { onSignOut } : {}),
    ...(onSearchOpen ? { onSearchOpen } : {}),
    ...(LinkComponent ? { LinkComponent } : {}),
  };
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <ShellSidebar {...sidebarProps} />
        <div className="flex min-w-0 flex-1 flex-col">
          <ShellTopbar {...topbarProps} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
};
