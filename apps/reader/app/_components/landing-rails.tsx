"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTimelines, timelineKeys } from "@repo/ui/hooks/use-timelines";
import { useStories, storyKeys } from "@repo/ui/hooks/use-stories";
import {
  ReaderContentRail,
  type ReaderContentRailState,
} from "@repo/ui/components/reader-content-rail";
import { ReaderTimelineCard } from "@repo/ui/components/reader-timeline-card";
import {
  ReaderStoryCard,
  type StoryNarratorType,
} from "@repo/ui/components/reader-story-card";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { ReaderLink } from "../../components/reader-link";
import { useReaderSupabase } from "./realtime-provider";

/**
 * LandingRails — the data island for the reader landing page (screen 1).
 *
 * Fetches recent published content client-side (the anon client exists only
 * post-mount, so this cannot run during SSR — see {@link useReaderSupabase})
 * and renders two rails through the screen-inventory §3 state machine
 * (loading / error / empty / ready). When BOTH rails are empty it collapses to
 * a single page-level "nothing published yet" state with an Explore CTA.
 *
 * It also opens a `postgres_changes` subscription so newly published rows merge
 * in live; the shared connection-loss banner is driven separately by the
 * heartbeat in {@link useReaderSupabase}'s provider.
 *
 * "Featured" is intentionally absent: there is no curation column yet, so MVP
 * ships recent-only rails (#275 tracks a `featured` flag + admin curation and
 * per-card detail deep links). Timelines order by `updated_at desc` (no
 * `published_at` sort exists); stories order by `created_at desc` (default).
 */
type ReaderClient = NonNullable<ReturnType<typeof useReaderSupabase>>;

// How many cards to request per rail.
const RAIL_PAGE_SIZE = 8;

function railState(
  clientReady: boolean,
  query: { isPending: boolean; isError: boolean; data?: unknown[] },
): ReaderContentRailState {
  if (!clientReady || query.isPending) return "loading";
  if (query.isError) return "error";
  if (!query.data || query.data.length === 0) return "empty";
  return "ready";
}

export function LandingRails() {
  const client = useReaderSupabase();
  const clientReady = client != null;
  const queryClient = useQueryClient();

  const timelinesQuery = useTimelines(
    client as ReaderClient,
    { published: true, pageSize: RAIL_PAGE_SIZE },
    { enabled: clientReady },
  );
  const storiesQuery = useStories(
    client as ReaderClient,
    // No `published` filter param exists on stories; RLS restricts the anon
    // client to published rows.
    { pageSize: RAIL_PAGE_SIZE },
    { enabled: clientReady },
  );

  // Live updates: refresh the rails when published content changes.
  useEffect(() => {
    if (client == null) return;
    const channel = client
      .channel("reader:landing")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timelines",
          filter: "published=eq.true",
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: timelineKeys.lists(),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
          filter: "published=eq.true",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [client, queryClient]);

  const timelinesState = railState(clientReady, timelinesQuery);
  const storiesState = railState(clientReady, storiesQuery);

  // No published content anywhere → one friendly page-level empty state.
  if (timelinesState === "empty" && storiesState === "empty") {
    return (
      <section className="mx-auto max-w-xl space-y-4 rounded-lg border border-border-muted bg-surface p-8 text-center">
        <h2 className="font-display text-2xl text-foreground">
          Nothing published yet
        </h2>
        <p className="font-body text-sm text-foreground-muted">
          There’s no published content to explore just yet. Check back soon — or
          start browsing the timeline explorer.
        </p>
        <ReaderLink
          href="/explore"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Explore timelines
        </ReaderLink>
      </section>
    );
  }

  const timelines = timelinesQuery.data ?? [];
  const stories = storiesQuery.data ?? [];

  return (
    <div className="space-y-10">
      <ReaderContentRail
        title="Recent timelines"
        state={timelinesState}
        onRetry={() => void timelinesQuery.refetch()}
        emptyMessage="No published timelines yet."
        errorMessage="Couldn’t load timelines."
      >
        {timelines.map((t) => (
          <ReaderTimelineCard
            key={t.id}
            href="/explore"
            LinkComponent={ReaderLink}
            timeline={{
              title: t.title,
              summary: t.summary,
              temporalData: t.temporal_data as unknown as TemporalData,
              endTemporalData:
                (t.end_temporal_data as unknown as TemporalData | null) ?? null,
            }}
          />
        ))}
      </ReaderContentRail>

      <ReaderContentRail
        title="Recent stories"
        state={storiesState}
        onRetry={() => void storiesQuery.refetch()}
        emptyMessage="No published stories yet."
        errorMessage="Couldn’t load stories."
      >
        {stories.map((s) => (
          <ReaderStoryCard
            key={s.id}
            href="/stories"
            LinkComponent={ReaderLink}
            story={{
              title: s.title,
              subTitle: s.sub_title,
              summary: s.summary,
              narratorType:
                (s.narrator_type as StoryNarratorType | null) ?? null,
            }}
          />
        ))}
      </ReaderContentRail>
    </div>
  );
}
