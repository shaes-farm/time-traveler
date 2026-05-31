"use client";

import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/services/supabase/types";
import { getBrowserSupabaseClient } from "../../../../lib/auth";

export interface DashboardMetrics {
  events: number;
  timelines: number;
  periods: number;
  stories: number;
  characters: number;
  categories: number;
  media: number;
}

export type ActivityEntityType = "timeline" | "event" | "character";

export interface DashboardActivityItem {
  id: string;
  label: string;
  slug: string;
  updatedAt: string;
  entityType: ActivityEntityType;
  isPublished: boolean;
  href: string;
}

export interface DashboardData {
  displayName: string;
  metrics: DashboardMetrics;
  sevenDayBadgeCounts: DashboardMetrics;
  recentActivity: DashboardActivityItem[];
}

const METRIC_KEYS = [
  "events",
  "timelines",
  "periods",
  "stories",
  "characters",
  "categories",
  "media",
] as const;

const EMPTY_METRICS: DashboardMetrics = {
  events: 0,
  timelines: 0,
  periods: 0,
  stories: 0,
  characters: 0,
  categories: 0,
  media: 0,
};

const DASHBOARD_QUERY_KEY = ["dashboard", "summary"] as const;

type BrowserDatabaseClient = SupabaseClient<Database>;

const asBrowserClient = (): BrowserDatabaseClient =>
  getBrowserSupabaseClient() as BrowserDatabaseClient;

const toDisplayName = (
  firstName: string | null,
  lastName: string | null,
  fallback: string,
): string => {
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return displayName || fallback;
};

const toEntityHref = (entityType: ActivityEntityType, slug: string): string => {
  switch (entityType) {
    case "timeline":
      return `/timelines/${slug}/edit`;
    case "event":
      return `/events/${slug}/edit`;
    case "character":
      return `/characters/${slug}/edit`;
  }
};

const fetchDashboardData = async (): Promise<DashboardData> => {
  const client = asBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError) {
    throw new Error(`Dashboard.auth: ${authError.message}`);
  }

  if (!user) {
    throw new Error("Dashboard.auth: no active user session");
  }

  const [
    profileResult,
    metricsResult,
    recentCountsResult,
    timelinesResult,
    eventsResult,
    charactersResult,
  ] = await Promise.all([
    client
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle(),
    client.rpc("get_user_metrics", { p_user_id: user.id }),
    client.rpc("get_user_recent_counts", { p_user_id: user.id }),
    // Scope each recent-activity query to the authenticated user. RLS would
    // otherwise allow published rows from other users to surface here
    // (timelines/events/characters all expose a public-read policy for
    // published records), which would inflate the dashboard's "recent" feed
    // with foreign content. The metrics RPC is already user-scoped.
    client
      .from("timelines")
      .select("id, title, slug, updated_at, published")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(10),
    client
      .from("events")
      .select("id, title, slug, updated_at, published")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(10),
    client
      .from("characters")
      .select("id, name, slug, updated_at, published")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(10),
  ]);

  if (profileResult.error) {
    throw new Error(`Dashboard.profile: ${profileResult.error.message}`);
  }
  if (metricsResult.error) {
    throw new Error(`Dashboard.metrics: ${metricsResult.error.message}`);
  }
  if (recentCountsResult.error) {
    throw new Error(
      `Dashboard.recentCounts: ${recentCountsResult.error.message}`,
    );
  }
  if (timelinesResult.error) {
    throw new Error(`Dashboard.timelines: ${timelinesResult.error.message}`);
  }
  if (eventsResult.error) {
    throw new Error(`Dashboard.events: ${eventsResult.error.message}`);
  }
  if (charactersResult.error) {
    throw new Error(`Dashboard.characters: ${charactersResult.error.message}`);
  }
  const metrics = { ...EMPTY_METRICS };
  for (const metric of metricsResult.data ?? []) {
    if (
      METRIC_KEYS.includes(metric.entity_type as (typeof METRIC_KEYS)[number])
    ) {
      const key = metric.entity_type as keyof DashboardMetrics;
      metrics[key] = metric.count;
    }
  }

  const timelineActivity = (timelinesResult.data ?? [])
    .filter((row) => Boolean(row.updated_at))
    .map((row) => ({
      id: row.id,
      label: row.title,
      slug: row.slug,
      updatedAt: row.updated_at as string,
      entityType: "timeline" as const,
      isPublished: row.published === true,
      href: toEntityHref("timeline", row.slug),
    }));

  const eventActivity = (eventsResult.data ?? [])
    .filter((row) => Boolean(row.updated_at))
    .map((row) => ({
      id: row.id,
      label: row.title,
      slug: row.slug,
      updatedAt: row.updated_at as string,
      entityType: "event" as const,
      isPublished: row.published === true,
      href: toEntityHref("event", row.slug),
    }));

  const characterActivity = (charactersResult.data ?? [])
    .filter((row) => Boolean(row.updated_at))
    .map((row) => ({
      id: row.id,
      label: row.name,
      slug: row.slug,
      updatedAt: row.updated_at as string,
      entityType: "character" as const,
      isPublished: row.published === true,
      href: toEntityHref("character", row.slug),
    }));

  const recentActivity = [
    ...timelineActivity,
    ...eventActivity,
    ...characterActivity,
  ]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 10);

  // Seven-day badge counts come from the get_user_recent_counts RPC so they
  // reflect the true count across all rows, not the at-most-10 truncated
  // recent-activity list. Same shape as get_user_metrics.
  const sevenDayBadgeCounts = { ...EMPTY_METRICS };
  for (const row of recentCountsResult.data ?? []) {
    if (METRIC_KEYS.includes(row.entity_type as (typeof METRIC_KEYS)[number])) {
      const key = row.entity_type as keyof DashboardMetrics;
      sevenDayBadgeCounts[key] = row.count;
    }
  }

  return {
    displayName: toDisplayName(
      profileResult.data?.first_name ?? null,
      profileResult.data?.last_name ?? null,
      // Use the email's local part (before @) rather than the full
      // address so the greeting doesn't leak the user's email — falls
      // back to "Traveler" if there's no email at all.
      user.email?.split("@")[0] ?? "Traveler",
    ),
    metrics,
    sevenDayBadgeCounts,
    recentActivity,
  };
};

export const useDashboardData = () =>
  useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardData,
  });
