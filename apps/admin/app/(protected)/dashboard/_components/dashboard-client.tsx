"use client";

import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  Plus,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  useDashboardData,
  type DashboardMetrics,
} from "../_hooks/use-dashboard-data";

const METRIC_CARDS: Array<{
  key: keyof DashboardMetrics;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "characters", label: "Characters", href: "/characters", icon: Users },
  { key: "events", label: "Events", href: "/events", icon: Calendar },
  { key: "timelines", label: "Timelines", href: "/timelines", icon: GitBranch },
  { key: "stories", label: "Stories", href: "/stories", icon: BookOpen },
  { key: "periods", label: "Periods", href: "/periods", icon: Clock },
  {
    key: "categories",
    label: "Categories",
    href: "/categories",
    icon: FolderTree,
  },
  { key: "media", label: "Media", href: "/media", icon: ImageIcon },
];

const QUICK_ACTIONS = [
  { label: "New character", href: "/characters/new" },
  { label: "New event", href: "/events/new" },
  { label: "New timeline", href: "/timelines/new" },
  { label: "View stories", href: "/stories" },
];

const RECENT_ACTIVITY_ROUTE_BY_TYPE = {
  character: "/characters",
  event: "/events",
  timeline: "/timelines",
} as const;

const ENTITY_LABEL_BY_TYPE = {
  character: "character",
  event: "event",
  timeline: "timeline",
} as const;

const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const target = new Date(timestamp).getTime();
  const deltaSeconds = Math.round((target - now) / 1000);
  const absSeconds = Math.abs(deltaSeconds);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return rtf.format(deltaSeconds, "second");
  const minutes = Math.round(deltaSeconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(months, "month");

  const years = Math.round(months / 12);
  return rtf.format(years, "year");
};

const DashboardLoadingState = () => (
  <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 7 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2 pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16" />
          </CardContent>
        </Card>
      ))}
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    </section>
  </div>
);

interface DashboardErrorStateProps {
  message: string;
  onRetry: () => void;
}

const DashboardErrorState = ({
  message,
  onRetry,
}: DashboardErrorStateProps) => (
  <Alert variant="destructive" className="max-w-3xl">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Unable to load dashboard</AlertTitle>
    <AlertDescription>
      <p className="mb-3 text-sm">{message}</p>
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </AlertDescription>
  </Alert>
);

const DashboardEmptyState = () => (
  <Card className="max-w-4xl border-border bg-surface">
    <CardHeader>
      <CardTitle className="font-display text-3xl">
        Welcome to Time Traveler
      </CardTitle>
      <CardDescription className="text-sm text-foreground-muted">
        Your library is empty. Start by creating a character, an event, or a
        timeline to begin building your historical world.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        <Link href="/characters/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New character
          </Button>
        </Link>
        <Link href="/events/new">
          <Button size="sm" variant="secondary">
            <Plus className="h-4 w-4" />
            New event
          </Button>
        </Link>
        <Link href="/timelines/new">
          <Button size="sm" variant="secondary">
            <Plus className="h-4 w-4" />
            New timeline
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

export const DashboardClient = () => {
  const { data, isPending, isError, error, refetch } = useDashboardData();

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const fullDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
          <p className="font-body text-sm text-foreground-muted">
            Loading your workspace...
          </p>
        </header>
        <DashboardLoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
          <p className="font-body text-sm text-foreground-muted">
            Recent activity and quick actions.
          </p>
        </header>
        <DashboardErrorState
          message={
            error instanceof Error
              ? error.message
              : "Unexpected dashboard error"
          }
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const totalCount = Object.values(data.metrics).reduce(
    (sum, value) => sum + value,
    0,
  );

  if (totalCount === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl text-foreground">
            {greeting}, {data.displayName}
          </h1>
          <p className="font-body text-sm text-foreground-muted">{fullDate}</p>
        </header>
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl text-foreground">
          {greeting}, {data.displayName}
        </h1>
        <p className="font-body text-sm text-foreground-muted">{fullDate}</p>
      </header>

      <section aria-label="Library metrics" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRIC_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.key} href={card.href} className="group">
                <Card className="h-full border-border bg-surface transition-colors group-hover:border-foreground/30">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardDescription className="text-xs uppercase tracking-wide text-foreground-subtle">
                      {card.label}
                    </CardDescription>
                    <Icon className="h-4 w-4 text-foreground-subtle" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-display text-3xl text-foreground">
                      {data.metrics[card.key]}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        <p className="font-body text-xs text-foreground-subtle">
          Counts include draft and unpublished records.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Recent activity
            </CardTitle>
            <CardDescription>
              Latest updates across timelines, events, and characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                Nothing edited recently. Create something to see activity here.
              </p>
            ) : (
              <ul className="space-y-1">
                {data.recentActivity.map((item) => (
                  <li key={`${item.entityType}:${item.id}`}>
                    <Link
                      href={RECENT_ACTIVITY_ROUTE_BY_TYPE[item.entityType]}
                      className="flex items-center justify-between rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-surface"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.label}
                        </p>
                        <p className="text-xs text-foreground-subtle">
                          {ENTITY_LABEL_BY_TYPE[item.entityType]} · edited{" "}
                          {formatRelativeTime(item.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Quick actions
            </CardTitle>
            <CardDescription>
              Jump straight to create and list routes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button variant="secondary" className="w-full justify-start">
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
