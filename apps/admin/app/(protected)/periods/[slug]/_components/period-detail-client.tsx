"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { toast } from "@repo/ui/components/sonner";
import type { TemporalData } from "@repo/services/schemas/temporal";

import {
  periodKeys,
  usePeriod,
  usePeriodBySlug,
  usePublishPeriod,
  useUnpublishPeriod,
  useDeletePeriod,
} from "@repo/ui/hooks/use-periods";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";

import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { PublishControl } from "@repo/ui/components/publish-control";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";

import {
  SignificanceRamp,
  type Significance,
} from "../../_components/significance-ramp";
import { PeriodTimelinesTab } from "./period-timelines-tab";
import { PeriodEventsTab } from "./period-events-tab";

export function PeriodDetailClient({
  userId,
  slug,
}: {
  userId: string;
  slug: string;
}) {
  const router = useRouter();
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const queryClient = useQueryClient();

  const {
    data: period,
    isPending,
    isError,
  } = usePeriodBySlug(client, userId, slug);

  const [tab, setTab] = React.useState("timelines");
  const [showDelete, setShowDelete] = React.useState(false);
  const [showDangerZone, setShowDangerZone] = React.useState(false);

  const publish = usePublishPeriod(client);
  const unpublish = useUnpublishPeriod(client);
  const deletePeriod = useDeletePeriod(client);

  // Junction mutations invalidate periodKeys.detail(id), but this page reads via
  // bySlug — refresh that query after a tab mutation.
  const refreshPeriod = React.useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: periodKeys.bySlug(userId, slug),
    });
  }, [queryClient, userId, slug]);

  if (isPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <div className="mt-6 space-y-2">
          {[1, 2, 3, 4].map((step) => (
            <Skeleton key={step} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !period) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">Period not found.</p>
        <Link
          href="/periods"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Back to periods
        </Link>
      </div>
    );
  }

  const isOwner = period.user_id === userId;
  const canEdit = isOwner;
  const editHref = `/periods/${slug}/edit`;

  const significance = (period.significance as Significance | null) ?? "medium";
  const characteristics = period.characteristics ?? [];
  const children = period.child_periods ?? [];
  const overlaidTimelineIds = (period.period_timelines ?? []).map(
    (r) => r.timeline_id,
  );
  const parentId = period.parent_period_id;

  const hasProse =
    (period.summary && period.summary.length > 0) ||
    (period.detail && period.detail.length > 0);

  // clipboard.writeText can reject (non-secure context, denied permission);
  // surface the outcome rather than dropping the promise. The id is captured in
  // a const so the narrowing survives into this closure.
  const periodId = period.id;
  async function copyId() {
    try {
      await navigator.clipboard.writeText(periodId);
      toast.success("Period ID copied.");
    } catch {
      toast.error("Couldn’t copy the ID to the clipboard.");
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/periods" className="hover:text-foreground">
              Periods
            </Link>
            <span aria-hidden>▸</span>
            {parentId && <ParentCrumb client={client} parentId={parentId} />}
          </nav>
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {period.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {period.temporal_data && (
              <span className="text-foreground">
                <TemporalDisplay
                  value={period.temporal_data as TemporalData}
                  endValue={
                    (period.end_temporal_data as TemporalData | null) ??
                    undefined
                  }
                  format="compact"
                />
              </span>
            )}
            <span aria-hidden>·</span>
            <SignificanceRamp value={significance} />
            <span className="font-mono">· {period.slug}</span>
          </div>
          {characteristics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {characteristics.map((c) => (
                <span
                  key={c}
                  className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-foreground-muted"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PublishControl
            published={period.published ?? false}
            entityLabel="period"
            canPublish={isOwner}
            onPublish={() =>
              publish.mutate(period.id, {
                onSuccess: () => toast.success("Period published."),
                onError: (err) =>
                  toast.error(
                    err instanceof Error ? err.message : "Publish failed",
                  ),
              })
            }
            onUnpublish={() =>
              unpublish.mutate(period.id, {
                onSuccess: () => toast.success("Period unpublished."),
                onError: (err) =>
                  toast.error(
                    err instanceof Error ? err.message : "Unpublish failed",
                  ),
              })
            }
          />
          {canEdit && (
            <Link
              href={editHref}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Edit
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void copyId()}>
                Copy ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview: narrative + hierarchy */}
      <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Description
          </h2>
          {hasProse ? (
            <div className="space-y-3">
              {period.summary && (
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {period.summary}
                </p>
              )}
              {period.detail && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {period.detail}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No description written yet.
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Parent
            </h2>
            {parentId ? (
              <ParentLink client={client} parentId={parentId} />
            ) : (
              <p className="text-sm text-muted-foreground">— top-level —</p>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Child periods
            </h2>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground">— none —</p>
            ) : (
              <ul className="space-y-1">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/periods/${child.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {child.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="timelines">
            Overlaid timelines ({overlaidTimelineIds.length})
          </TabsTrigger>
          <TabsTrigger value="events">Events in range</TabsTrigger>
        </TabsList>

        <TabsContent value="timelines" className="pt-4">
          <PeriodTimelinesTab
            client={client}
            periodId={period.id}
            userId={userId}
            canEdit={canEdit}
            overlaidTimelineIds={overlaidTimelineIds}
            onMutated={refreshPeriod}
          />
        </TabsContent>

        <TabsContent value="events" className="pt-4">
          {/* Lazy: only mount (and run the in-range query) when the tab opens. */}
          {tab === "events" && (
            <PeriodEventsTab
              client={client}
              periodId={period.id}
              hasOverlays={overlaidTimelineIds.length > 0}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Danger zone */}
      {isOwner && (
        <div className="rounded-md border border-destructive/30">
          <button
            type="button"
            aria-expanded={showDangerZone}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/5"
            onClick={() => setShowDangerZone((v) => !v)}
          >
            {showDangerZone ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Danger zone
          </button>
          {showDangerZone && (
            <div className="border-t border-destructive/20 px-4 pb-4 pt-1">
              <p className="mb-3 text-xs text-muted-foreground">
                Deleting a period is permanent.{" "}
                {children.length > 0 ? (
                  <>
                    It{" "}
                    <strong>
                      also deletes its {children.length} child period
                      {children.length === 1 ? "" : "s"}
                    </strong>{" "}
                    (cascade).
                  </>
                ) : (
                  "It has no child periods."
                )}{" "}
                Events and timelines are unaffected — the period only overlaid
                them.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                Delete period
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation — states the cascade blast radius */}
      <Dialog
        open={showDelete}
        onOpenChange={(o) => {
          if (!o) setShowDelete(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{period.title}”?</DialogTitle>
            <DialogDescription>
              {children.length > 0 ? (
                <>
                  This also deletes {children.length} child period
                  {children.length === 1 ? "" : "s"} (
                  {children
                    .slice(0, 3)
                    .map((c) => c.title)
                    .join(", ")}
                  {children.length > 3 ? "…" : ""}). Events and timelines are
                  unaffected. This cannot be undone.
                </>
              ) : (
                <>Events and timelines are unaffected. This cannot be undone.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(false)}
              disabled={deletePeriod.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletePeriod.isPending}
              onClick={() =>
                deletePeriod.mutate(period.id, {
                  onSuccess: () => {
                    toast.success("Period deleted.");
                    router.push("/periods");
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Delete failed",
                    ),
                })
              }
            >
              {deletePeriod.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parent helpers — resolve the parent period for the breadcrumb + hierarchy
// panel. Fetched by id via its own cached query so it survives navigation.
// ---------------------------------------------------------------------------

function ParentCrumb({
  client,
  parentId,
}: {
  client: ReturnType<typeof getBrowserSupabaseClient>;
  parentId: string;
}) {
  const parent = useParentPeriod(client, parentId);
  if (!parent) return null;
  return (
    <>
      <Link href={`/periods/${parent.slug}`} className="hover:text-foreground">
        {parent.title}
      </Link>
      <span aria-hidden>▸</span>
    </>
  );
}

function ParentLink({
  client,
  parentId,
}: {
  client: ReturnType<typeof getBrowserSupabaseClient>;
  parentId: string;
}) {
  const parent = useParentPeriod(client, parentId);
  if (!parent) {
    return <p className="text-sm text-muted-foreground">…</p>;
  }
  return (
    <Link
      href={`/periods/${parent.slug}`}
      className="text-sm text-primary hover:underline"
    >
      {parent.title}
    </Link>
  );
}

function useParentPeriod(
  client: ReturnType<typeof getBrowserSupabaseClient>,
  parentId: string,
) {
  const { data } = usePeriod(client, parentId);
  return data ?? null;
}
