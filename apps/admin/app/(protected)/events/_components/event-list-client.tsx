"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/sonner";
import { CornerDownRight, Plus } from "lucide-react";
import type { Era, TemporalData } from "@repo/services/schemas/temporal";
import {
  publishEvent,
  unpublishEvent,
  type EventDetailScope,
  type EventFilters,
  type EventListRow,
  type EventType,
} from "@repo/services/event-service";
import { BulkActionBar } from "@repo/ui/components/bulk-action-bar";
import { Button } from "@repo/ui/components/button";
import {
  DataTable,
  createSelectColumn,
  type DataTableProps,
  type RowSelectionState,
} from "@repo/ui/components/data-table";
import {
  FilterRail,
  type FilterGroup,
  type RadioValue,
} from "@repo/ui/components/filter-rail";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import { eventKeys, useEventsPage } from "@repo/ui/hooks/use-events";
import { useTimelinesPage } from "@repo/ui/hooks/use-timelines";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;
const IMPORTANCE_MIN = 1;
const IMPORTANCE_MAX = 10;

// Event types are the exact schema enum values (events.event_type CHECK).
const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "milestone", label: "Milestone" },
  { value: "discovery", label: "Discovery" },
  { value: "period", label: "Period" },
  { value: "incident", label: "Incident" },
  { value: "creation", label: "Creation" },
  { value: "destruction", label: "Destruction" },
  { value: "transformation", label: "Transformation" },
  { value: "migration", label: "Migration" },
  { value: "conflict", label: "Conflict" },
  { value: "ceremony", label: "Ceremony" },
];
const VALID_TYPES = new Set<string>(EVENT_TYPES.map((t) => t.value));

// Era is the most-used filter for events; pinned to the top of the rail.
const ERAS: { value: Era; label: string }[] = [
  { value: "BYA", label: "BYA" },
  { value: "MYA", label: "MYA" },
  { value: "KYA", label: "KYA" },
  { value: "BCE", label: "BCE" },
  { value: "CE", label: "CE" },
];
const VALID_ERAS = new Set<string>(ERAS.map((e) => e.value));

const VALID_PUBLICATIONS = new Set<string>(["published", "draft"]);

const SORT_LABELS: Record<string, string> = {
  sort_order_years: "Date",
  title: "Title",
  importance: "Importance",
  updated_at: "Last updated",
};
const VALID_SORT = new Set(Object.keys(SORT_LABELS));

// ---------------------------------------------------------------------------
// URL state helpers
// ---------------------------------------------------------------------------

function csvToArray(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function arrayToCsv(values: string[]): string {
  return values.join(",");
}

/**
 * Returns a windowed list of page numbers and "ellipsis" placeholders.
 * Always shows first, last, current ±2, with "ellipsis" gaps between.
 */
function buildPageWindows(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total]);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) {
      result.push("ellipsis");
    }
    result.push(sorted[i]!);
  }
  return result;
}

interface ParsedFilters {
  types: string[];
  eras: string[];
  importance: [number, number];
  timelineId: string;
  participants: RadioValue;
  media: RadioValue;
  detailScope: EventDetailScope;
  publications: string[];
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
}

// The drill-down 3-state filter (annotation #10) maps onto the shared radio
// component's yes/no/any vocabulary: Expandable→yes, Leaf→no, All→any.
function radioToScope(value: RadioValue): EventDetailScope {
  if (value === "yes") return "expandable";
  if (value === "no") return "leaf";
  return "all";
}
function scopeToRadio(scope: EventDetailScope): RadioValue {
  if (scope === "expandable") return "yes";
  if (scope === "leaf") return "no";
  return "any";
}

function readFiltersFromParams(params: URLSearchParams): ParsedFilters {
  const rawSort = params.get("sort") ?? "sort_order_years";
  const sortBy = VALID_SORT.has(rawSort) ? rawSort : "sort_order_years";

  const rawPage = parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;

  const rawMin = parseInt(params.get("imin") ?? "", 10);
  const rawMax = parseInt(params.get("imax") ?? "", 10);
  const imin =
    Number.isFinite(rawMin) &&
    rawMin >= IMPORTANCE_MIN &&
    rawMin <= IMPORTANCE_MAX
      ? rawMin
      : IMPORTANCE_MIN;
  const imax =
    Number.isFinite(rawMax) &&
    rawMax >= IMPORTANCE_MIN &&
    rawMax <= IMPORTANCE_MAX
      ? rawMax
      : IMPORTANCE_MAX;

  const rawParticipants = params.get("chars");
  const participants: RadioValue =
    rawParticipants === "yes" || rawParticipants === "no"
      ? rawParticipants
      : "any";

  const rawMedia = params.get("media");
  const media: RadioValue =
    rawMedia === "yes" || rawMedia === "no" ? rawMedia : "any";

  const rawScope = params.get("scope");
  const detailScope: EventDetailScope =
    rawScope === "expandable" || rawScope === "leaf" ? rawScope : "all";

  // Sanitize multi-value params against their known option sets at parse time,
  // so the parsed state (which drives the "filtered" header and the rail
  // checkboxes) stays consistent with what the query actually applies — an
  // unknown ?type=bogus must not register as an active filter.
  return {
    types: csvToArray(params.get("type")).filter((t) => VALID_TYPES.has(t)),
    eras: csvToArray(params.get("era")).filter((e) => VALID_ERAS.has(e)),
    importance: [Math.min(imin, imax), Math.max(imin, imax)],
    timelineId: params.get("tl") ?? "",
    participants,
    media,
    detailScope,
    publications: csvToArray(params.get("pub")).filter((p) =>
      VALID_PUBLICATIONS.has(p),
    ),
    search: params.get("q") ?? "",
    sortBy,
    sortDir: params.get("dir") === "desc" ? "desc" : "asc",
    page,
  };
}

function buildServiceFilters(parsed: ParsedFilters): EventFilters {
  const filters: EventFilters = {
    page: parsed.page,
    pageSize: PAGE_SIZE,
    sortBy: parsed.sortBy as EventFilters["sortBy"],
    sortDirection: parsed.sortDir,
  };

  const safeTypes = parsed.types.filter((t) =>
    VALID_TYPES.has(t),
  ) as EventType[];
  if (safeTypes.length > 0) {
    filters.eventType = safeTypes;
  }

  const safeEras = parsed.eras.filter((e) => VALID_ERAS.has(e)) as Era[];
  if (safeEras.length > 0) {
    filters.era = safeEras;
  }

  // Only send importance bounds when the range is narrowed from the full span.
  const [imin, imax] = parsed.importance;
  if (imin > IMPORTANCE_MIN) filters.importanceMin = imin;
  if (imax < IMPORTANCE_MAX) filters.importanceMax = imax;

  if (parsed.timelineId.length > 0) {
    filters.timelineId = parsed.timelineId;
  }

  if (parsed.participants === "yes") filters.hasParticipants = true;
  else if (parsed.participants === "no") filters.hasParticipants = false;

  if (parsed.media === "yes") filters.hasMedia = true;
  else if (parsed.media === "no") filters.hasMedia = false;

  if (parsed.detailScope !== "all") {
    filters.detailScope = parsed.detailScope;
  }

  // The era multi-select is this list's temporal-range control (wireframe
  // annotation #8): selecting eras scopes the visible span, and cross-era
  // selections interleave via sort_order_years. The service additionally
  // supports a precise sortStart/sortEnd window for programmatic callers, which
  // this list intentionally does not surface — the era checkboxes are the
  // author-facing affordance.

  // published filter: exactly one value selected → filter; otherwise omit
  if (parsed.publications.length === 1) {
    filters.published = parsed.publications[0] === "published";
  }

  if (parsed.search.length > 0) {
    filters.search = parsed.search;
  }

  return filters;
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function ImportanceCell({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-sm text-foreground-muted">—</span>;
  // Sequential single-hue scale: 10 darkest, 1 faintest (03-aesthetic-notes).
  const opacity = 0.35 + (value / IMPORTANCE_MAX) * 0.65;
  return (
    <span
      className="block text-right text-sm font-medium tabular-nums text-foreground"
      style={{ opacity }}
      title={`Importance ${value} of ${IMPORTANCE_MAX}`}
    >
      {value}
    </span>
  );
}

function CategoryBadges({ row }: { row: EventListRow }) {
  const categories = row.event_categories
    .map((ec) => ec.categories)
    .filter((c): c is NonNullable<typeof c> => c !== null);
  if (categories.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1 pt-0.5">
      {categories.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] leading-none text-foreground-muted ring-1 ring-inset ring-border"
          style={c.color ? { color: c.color } : undefined}
        >
          {c.title}
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface TimelineInfo {
  title: string;
  slug: string;
}

function buildColumns(
  onRowClick: (row: EventListRow) => void,
  timelineInfo: Map<string, TimelineInfo>,
  onOpenSubTimeline: (id: string) => void,
): DataTableProps<EventListRow, unknown>["columns"] {
  return [
    createSelectColumn<EventListRow>(),
    {
      id: "drilldown",
      header: "",
      enableSorting: false,
      cell: ({ row }: { row: { original: EventListRow } }) => {
        const e = row.original;
        // ⤵ marks an event that expands into a sub-timeline (annotation #3).
        // Blank for leaf events. Clicking opens the sub-timeline when it's
        // known (i.e. it's among the timelines visible to the user).
        if (e.detail_timeline_id === null) return null;
        const subTimelineId = e.detail_timeline_id;
        const sub = timelineInfo.get(subTimelineId);
        if (!sub) {
          return (
            <CornerDownRight
              className="h-3.5 w-3.5 text-foreground-muted"
              aria-label="Expands into a sub-timeline"
            />
          );
        }
        return (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              onOpenSubTimeline(subTimelineId);
            }}
            aria-label={`Open sub-timeline: ${sub.title}`}
            title={`Open sub-timeline: ${sub.title}`}
            className="text-foreground-muted hover:text-foreground"
          >
            <CornerDownRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: false,
      cell: ({ row }: { row: { original: EventListRow } }) => {
        const e = row.original;
        const typeLabel =
          EVENT_TYPES.find((t) => t.value === e.event_type)?.label ??
          e.event_type;
        const participantCount = e.event_characters[0]?.count ?? 0;
        const timelineName =
          e.timeline_id !== null
            ? timelineInfo.get(e.timeline_id)?.title
            : undefined;
        const line2 = [
          timelineName,
          typeLabel,
          participantCount > 0
            ? `${participantCount} char${participantCount !== 1 ? "s" : ""}`
            : null,
        ].filter(Boolean);
        return (
          <button
            type="button"
            className="flex w-full flex-col gap-0.5 text-left hover:opacity-80 transition-opacity"
            onClick={(ev) => {
              ev.stopPropagation();
              onRowClick(e);
            }}
          >
            <span
              className="line-clamp-1 font-medium text-foreground leading-tight"
              title={e.title}
            >
              {e.title}
            </span>
            <span className="text-xs text-foreground-muted">
              {line2.join(" · ")}
            </span>
            <CategoryBadges row={e} />
          </button>
        );
      },
    },
    {
      accessorKey: "temporal_data",
      header: "Date",
      enableSorting: false,
      cell: ({ row }: { row: { original: EventListRow } }) => {
        const e = row.original;
        const temporal = e.temporal_data as TemporalData | null;
        if (!temporal || Object.keys(temporal).length === 0) {
          return <span className="text-sm text-foreground-muted">—</span>;
        }
        return (
          <span className="text-sm text-foreground-muted">
            <TemporalDisplay
              value={temporal}
              endValue={
                (e.end_temporal_data as TemporalData | null) ?? undefined
              }
              format="compact"
            />
          </span>
        );
      },
    },
    {
      accessorKey: "importance",
      // Star glyph for sighted users; sr-only text so the column is announced.
      header: () => (
        <>
          <span aria-hidden>★</span>
          <span className="sr-only">Importance</span>
        </>
      ),
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <ImportanceCell value={getValue() as number | null} />
      ),
    },
    {
      accessorKey: "published",
      header: "Status",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const v = getValue() as boolean | null;
        return <StatusBadge status={v === true ? "published" : "draft"} />;
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function TableSkeleton() {
  const skeletonRowIds = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];
  return (
    <div className="space-y-2">
      {skeletonRowIds.map((rowId) => (
        <Skeleton key={rowId} className="h-16 w-full rounded-md" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EventListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const parsed = React.useMemo(
    () => readFiltersFromParams(searchParams),
    [searchParams],
  );

  const searchDebounceRef = React.useRef<number | null>(null);
  const [searchInput, setSearchInput] = React.useState(parsed.search);
  const [prevUrlSearch, setPrevUrlSearch] = React.useState(parsed.search);
  if (parsed.search !== prevUrlSearch) {
    setPrevUrlSearch(parsed.search);
    setSearchInput(parsed.search);
  }

  React.useEffect(() => {
    return () => {
      if (searchDebounceRef.current !== null) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const filters = React.useMemo(() => buildServiceFilters(parsed), [parsed]);

  const { data, isPending, isError, refetch } = useEventsPage(client, filters);

  // Current user — used to gate bulk publish/unpublish to owner-owned rows
  // (publishing is owner-only; the DB trigger from #48 re-checks server-side).
  const { data: userId = "" } = useQuery({
    queryKey: ["auth", "user-id"],
    queryFn: async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      return user?.id ?? "";
    },
    staleTime: 5 * 60_000,
  });

  const queryClient = useQueryClient();

  // Row selection for the bulk-action bar, keyed by event id (getRowId).
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkBusy, setBulkBusy] = React.useState(false);

  // Timelines power both the "Timeline" filter options and the per-row
  // timeline-name/slug lookup. Fetched once at a large page size.
  //
  // KNOWN LIMITATION (#243): this caps at 100 timelines. A user with more gets
  // an incomplete filter dropdown and unresolved names/slugs on some rows — the
  // ⤵ drill-down degrades to a non-clickable indicator (handled in buildColumns),
  // but the dropdown omission is silent. The real fix is an async/searchable
  // timeline picker; tracked in #243.
  const { data: timelineData } = useTimelinesPage(client, {
    pageSize: 100,
    sortBy: "title",
    sortDirection: "asc",
  });
  const timelines = React.useMemo(
    () =>
      (timelineData?.rows ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
      })),
    [timelineData],
  );
  const timelineInfo = React.useMemo(
    () =>
      new Map<string, TimelineInfo>(
        timelines.map((t) => [t.id, { title: t.title, slug: t.slug }]),
      ),
    [timelines],
  );

  const rows = React.useMemo(
    () => (data?.rows ?? []) as EventListRow[],
    [data],
  );
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Selection lives on the current page only; reset it whenever the query
  // (filters/sort/page) changes so stale ids never leak into a bulk action.
  // Keyed on the stable URL string and done in render (not an effect), per the
  // list's existing prevUrl pattern.
  const filterKey = searchParams.toString();
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setRowSelection({});
  }

  const selectedRows = React.useMemo(
    () => rows.filter((r) => rowSelection[r.id]),
    [rows, rowSelection],
  );
  // Publishing is owner-only — exclude shared/other-owned rows from the action
  // and report them as skipped.
  const ownedSelected = React.useMemo(
    () => selectedRows.filter((r) => r.user_id === userId),
    [selectedRows, userId],
  );
  const skippedCount = selectedRows.length - ownedSelected.length;

  async function runBulk(action: "publish" | "unpublish") {
    const ids = ownedSelected.map((r) => r.id);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const fn = action === "publish" ? publishEvent : unpublishEvent;
    const results = await Promise.allSettled(ids.map((id) => fn(client, id)));
    setBulkBusy(false);
    await queryClient.invalidateQueries({ queryKey: eventKeys.all });
    setRowSelection({});

    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = ids.length - failed;
    const verb = action === "publish" ? "Published" : "Unpublished";
    const noun = (n: number) => `event${n !== 1 ? "s" : ""}`;
    if (failed === 0) {
      toast.success(`${verb} ${ok} ${noun(ok)}.`);
    } else if (ok === 0) {
      toast.error(`Couldn't ${action} ${failed} ${noun(failed)}. Try again.`);
    } else {
      toast.warning(`${verb} ${ok} ${noun(ok)}; ${failed} failed.`);
    }
  }
  const hasFilters =
    parsed.types.length > 0 ||
    parsed.eras.length > 0 ||
    parsed.importance[0] > IMPORTANCE_MIN ||
    parsed.importance[1] < IMPORTANCE_MAX ||
    parsed.timelineId.length > 0 ||
    parsed.participants !== "any" ||
    parsed.media !== "any" ||
    parsed.detailScope !== "all" ||
    // Both (or neither) published+draft selected narrows nothing — buildService-
    // Filters only applies the predicate when exactly one is checked, so only
    // that case counts as an active filter for the header.
    parsed.publications.length === 1 ||
    parsed.search.length > 0;

  // ---------------------------------------------------------------------------
  // URL update helpers
  // ---------------------------------------------------------------------------

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  function handleTypeChange(values: string[]) {
    updateParams({ type: arrayToCsv(values) || null, page: null });
  }
  function handleEraChange(values: string[]) {
    updateParams({ era: arrayToCsv(values) || null, page: null });
  }
  function handleImportanceChange(value: [number, number]) {
    updateParams({
      imin: value[0] > IMPORTANCE_MIN ? String(value[0]) : null,
      imax: value[1] < IMPORTANCE_MAX ? String(value[1]) : null,
      page: null,
    });
  }
  function handleParticipantsChange(value: RadioValue) {
    updateParams({ chars: value === "any" ? null : value, page: null });
  }
  function handleMediaChange(value: RadioValue) {
    updateParams({ media: value === "any" ? null : value, page: null });
  }
  function handleScopeChange(value: RadioValue) {
    const scope = radioToScope(value);
    updateParams({ scope: scope === "all" ? null : scope, page: null });
  }
  function handlePublicationChange(values: string[]) {
    updateParams({ pub: arrayToCsv(values) || null, page: null });
  }
  function handleTimelineChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateParams({ tl: e.target.value || null, page: null });
  }
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchInput(value);
    if (searchDebounceRef.current !== null) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      updateParams({ q: value || null, page: null });
    }, 300);
  }
  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateParams({ sort: e.target.value, page: null });
  }
  function handleDirToggle() {
    updateParams({
      dir: parsed.sortDir === "desc" ? "asc" : "desc",
      page: null,
    });
  }
  function handlePageChange(newPage: number) {
    updateParams({ page: newPage === 1 ? null : String(newPage) });
  }
  function handleClearAll() {
    router.replace("?", { scroll: false });
  }

  // The /events/new create route is built by #46 (event create/edit form).
  // The "New event" CTAs target it to match the timelines convention.
  function handleNewEvent() {
    router.push("/events/new");
  }

  const handleRowClick = React.useCallback(
    (row: EventListRow) => {
      router.push(`/events/${row.slug}`);
    },
    [router],
  );

  const handleOpenSubTimeline = React.useCallback(
    (id: string) => {
      router.push(`/timelines/${id}`);
    },
    [router],
  );

  const pageWindowElements: React.ReactNode[] = [];
  let ellipsisCount = 0;
  for (const item of buildPageWindows(parsed.page, totalPages)) {
    if (item === "ellipsis") {
      ellipsisCount += 1;
      pageWindowElements.push(
        <span
          key={`ellipsis-${ellipsisCount}`}
          className="px-1 text-sm text-foreground-muted"
          aria-hidden
        >
          …
        </span>,
      );
      continue;
    }
    pageWindowElements.push(
      <button
        key={item}
        type="button"
        onClick={() => handlePageChange(item)}
        aria-current={item === parsed.page ? "page" : undefined}
        className={`rounded px-2 py-1 text-sm ${
          item === parsed.page
            ? "bg-primary text-primary-foreground"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        {item}
      </button>,
    );
  }

  // ---------------------------------------------------------------------------
  // Filter groups. Era is pinned first (annotation #1); the drill-down scope
  // (annotation #10) sits between Era and Type.
  // ---------------------------------------------------------------------------

  const filterGroups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "era",
      label: "Era",
      options: ERAS,
      value: parsed.eras,
      onChange: handleEraChange,
    },
    {
      type: "radio",
      id: "drilldown",
      label: "Drill-down",
      value: scopeToRadio(parsed.detailScope),
      onChange: handleScopeChange,
      yesLabel: "Expandable",
      noLabel: "Leaf",
    },
    {
      type: "checkbox",
      id: "type",
      label: "Type",
      options: EVENT_TYPES,
      value: parsed.types,
      onChange: handleTypeChange,
    },
    {
      type: "range",
      id: "importance",
      label: "Importance",
      min: IMPORTANCE_MIN,
      max: IMPORTANCE_MAX,
      value: parsed.importance,
      onChange: handleImportanceChange,
    },
    {
      type: "radio",
      id: "participants",
      label: "Has characters",
      value: parsed.participants,
      onChange: handleParticipantsChange,
    },
    {
      type: "radio",
      id: "media",
      label: "Has media",
      value: parsed.media,
      onChange: handleMediaChange,
    },
    {
      type: "checkbox",
      id: "publication",
      label: "Status",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
      ],
      value: parsed.publications,
      onChange: handlePublicationChange,
    },
  ];

  const columns = React.useMemo(
    () => buildColumns(handleRowClick, timelineInfo, handleOpenSubTimeline),
    [handleRowClick, timelineInfo, handleOpenSubTimeline],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full">
      <main className="flex flex-1 flex-col overflow-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h1 className="font-display text-xl text-foreground">Events</h1>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {isPending
                ? "Loading…"
                : hasFilters
                  ? `${total} result${total !== 1 ? "s" : ""} · filtered`
                  : `${total} event${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={handleNewEvent}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New event
          </Button>
        </div>

        {/* Search + timeline */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-3 shrink-0">
          <input
            type="search"
            placeholder="Search title, summary, detail…"
            value={searchInput}
            onChange={handleSearchChange}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search events"
          />
          <select
            value={parsed.timelineId}
            onChange={handleTimelineChange}
            aria-label="Filter by timeline"
            className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Any timeline</option>
            {timelines.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Table area */}
        <div className="flex-1 overflow-auto p-6">
          {isError && (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center"
            >
              <p className="text-sm text-destructive">Failed to load events.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          )}

          {!isError && isPending && <TableSkeleton />}

          {!isError && !isPending && total === 0 && !hasFilters && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="max-w-sm text-sm text-foreground-muted">
                No events yet. Events are the moments your timelines are built
                from.
              </p>
              <Button variant="primary" size="sm" onClick={handleNewEvent}>
                <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                New event
              </Button>
            </div>
          )}

          {!isError && !isPending && total === 0 && hasFilters && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <p className="text-sm text-foreground-muted">
                No events match these filters.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
              >
                Clear filters
              </button>
            </div>
          )}

          {!isError && !isPending && total > 0 && (
            <div className="space-y-3">
              <BulkActionBar
                count={ownedSelected.length}
                skippedCount={skippedCount}
                entityLabel="event"
                busy={bulkBusy}
                onPublish={() => void runBulk("publish")}
                onUnpublish={() => void runBulk("unpublish")}
                onClear={() => setRowSelection({})}
              />
              <DataTable
                columns={columns}
                data={rows}
                onRowClick={handleRowClick}
                getRowId={(row) => row.id}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </div>
          )}
        </div>

        {/* Footer: pagination + sort */}
        {!isError && !isPending && total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(parsed.page - 1)}
                disabled={parsed.page <= 1}
                aria-label="Previous page"
                className="rounded px-2 py-1 text-sm text-foreground-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {pageWindowElements}
              <button
                type="button"
                onClick={() => handlePageChange(parsed.page + 1)}
                disabled={parsed.page >= totalPages}
                aria-label="Next page"
                className="rounded px-2 py-1 text-sm text-foreground-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="event-sort-select"
                className="text-xs text-foreground-muted"
              >
                Sort:
              </label>
              <select
                id="event-sort-select"
                value={parsed.sortBy}
                onChange={handleSortChange}
                className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="sort_order_years">
                  {SORT_LABELS["sort_order_years"]}
                </option>
                <option value="title">{SORT_LABELS["title"]}</option>
                <option value="importance">{SORT_LABELS["importance"]}</option>
                <option value="updated_at">{SORT_LABELS["updated_at"]}</option>
              </select>
              <button
                type="button"
                onClick={handleDirToggle}
                aria-label={
                  parsed.sortDir === "desc"
                    ? "Sort descending, click for ascending"
                    : "Sort ascending, click for descending"
                }
                className="rounded border border-border px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
              >
                {parsed.sortDir === "desc" ? "▾" : "▴"}
              </button>
            </div>
          </div>
        )}
      </main>

      <FilterRail groups={filterGroups} onClearAll={handleClearAll} />
    </div>
  );
}
