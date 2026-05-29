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

const DAYS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const isWithinLastSevenDays = (timestamp: string): boolean =>
  Date.now() - new Date(timestamp).getTime() <= DAYS_WINDOW_MS;

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
    client
      .from("timelines")
      .select("id, title, slug, updated_at, published")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(10),
    client
      .from("events")
      .select("id, title, slug, updated_at, published")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(10),
    client
      .from("characters")
      .select("id, name, slug, updated_at, published")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(10),
  ]);

  if (profileResult.error) {
    throw new Error(`Dashboard.profile: ${profileResult.error.message}`);
  }
  if (metricsResult.error) {
    throw new Error(`Dashboard.metrics: ${metricsResult.error.message}`);
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

  // Safe badge counts derive from already-fetched recent activity sources,
  // avoiding extra count queries that previously caused runtime errors.
  const sevenDayBadgeCounts = { ...EMPTY_METRICS };
  sevenDayBadgeCounts.timelines = timelineActivity.filter((item) =>
    isWithinLastSevenDays(item.updatedAt),
  ).length;
  sevenDayBadgeCounts.events = eventActivity.filter((item) =>
    isWithinLastSevenDays(item.updatedAt),
  ).length;
  sevenDayBadgeCounts.characters = characterActivity.filter((item) =>
    isWithinLastSevenDays(item.updatedAt),
  ).length;

  return {
    displayName: toDisplayName(
      profileResult.data?.first_name ?? null,
      profileResult.data?.last_name ?? null,
      user.email ?? "Traveler",
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
