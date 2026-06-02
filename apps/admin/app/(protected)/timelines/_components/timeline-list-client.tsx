"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Lock, Plus, Users } from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import type { TimelineFilters } from "@repo/services/timeline-service";
import { Button } from "@repo/ui/components/button";
import { DataTable, type DataTableProps } from "@repo/ui/components/data-table";
import { FilterRail, type FilterGroup } from "@repo/ui/components/filter-rail";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import { useTimelinesPage } from "@repo/ui/hooks/use-timelines";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineType = "general" | "biographical" | "comparative";
type Visibility = "private" | "public" | "shared";

interface TimelineRow {
  id: string;
  title: string;
  slug: string;
  timeline_type: TimelineType | null;
  visibility: Visibility | null;
  published: boolean | null;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData | null;
  updated_at: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const VISIBILITY_META: Record<
  Visibility,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  private: { icon: Lock, label: "Private" },
  public: { icon: Globe, label: "Public" },
  shared: { icon: Users, label: "Shared" },
};

const SORT_LABELS: Record<string, string> = {
  updated_at: "Last updated",
  created_at: "Created",
  title: "Title",
};

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

function readFiltersFromParams(params: URLSearchParams): {
  types: string[];
  visibilities: string[];
  publications: string[];
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
  includeSubTimelines: boolean;
} {
  return {
    types: csvToArray(params.get("type")),
    visibilities: csvToArray(params.get("vis")),
    publications: csvToArray(params.get("pub")),
    search: params.get("q") ?? "",
    sortBy: params.get("sort") ?? "updated_at",
    sortDir: params.get("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, parseInt(params.get("page") ?? "1", 10)),
    includeSubTimelines: params.get("sub") === "1",
  };
}

function buildServiceFilters(
  types: string[],
  visibilities: string[],
  publications: string[],
  search: string,
  sortBy: string,
  sortDir: "asc" | "desc",
  page: number,
  includeSubTimelines: boolean,
): TimelineFilters {
  const filters: TimelineFilters = {
    page,
    pageSize: PAGE_SIZE,
    sortBy: sortBy as TimelineFilters["sortBy"],
    sortDirection: sortDir,
    includeSubTimelines,
  };

  if (visibilities.length > 0) {
    filters.visibility =
      visibilities.length === 1
        ? (visibilities[0] as Visibility)
        : (visibilities as Visibility[]);
  }

  if (types.length > 0) {
    filters.timelineType =
      types.length === 1
        ? (types[0] as TimelineType)
        : (types as TimelineType[]);
  }

  // published filter: exactly one value selected → filter; otherwise omit
  if (publications.length === 1) {
    filters.published = publications[0] === "published";
  }

  if (search.length > 0) {
    filters.search = search;
  }

  return filters;
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function VisibilityCell({ visibility }: { visibility: Visibility | null }) {
  if (!visibility)
    return <span className="text-sm text-foreground-muted">—</span>;
  const { icon: Icon, label } = VISIBILITY_META[visibility];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

function UpdatedAtCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-sm text-foreground-muted">—</span>;
  const date = new Date(value);
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return (
    <span className="text-sm text-foreground-muted" title={date.toISOString()}>
      {formatted}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function buildColumns(
  onRowClick: (row: TimelineRow) => void,
): DataTableProps<TimelineRow, unknown>["columns"] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: false,
      cell: ({ row }: { row: { original: TimelineRow } }) => {
        const t = row.original;
        const hasTemporalData =
          t.temporal_data && Object.keys(t.temporal_data).length > 0;
        return (
          <button
            type="button"
            className="flex flex-col gap-0.5 text-left w-full hover:opacity-80 transition-opacity"
            onClick={() => onRowClick(t)}
          >
            <span className="font-medium text-foreground leading-tight">
              {t.title}
            </span>
            {hasTemporalData && (
              <span className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                <TemporalDisplay
                  value={t.temporal_data}
                  endValue={t.end_temporal_data ?? undefined}
                  format="compact"
                />
              </span>
            )}
            {!hasTemporalData && (
              <span className="text-xs text-foreground-muted">—</span>
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "timeline_type",
      header: "Type",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const v = getValue() as TimelineType | null;
        if (!v) return <span className="text-sm text-foreground-muted">—</span>;
        return (
          <span className="text-sm capitalize text-foreground-muted">{v}</span>
        );
      },
    },
    {
      accessorKey: "visibility",
      header: "Visibility",
      enableSorting: false,
      cell: ({ row }: { row: { original: TimelineRow } }) => (
        <VisibilityCell visibility={row.original.visibility} />
      ),
    },
    {
      accessorKey: "published",
      header: "Publication",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const v = getValue() as boolean | null;
        return <StatusBadge status={v === true ? "published" : "draft"} />;
      },
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <UpdatedAtCell value={getValue() as string | null} />
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TimelineListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    types,
    visibilities,
    publications,
    search,
    sortBy,
    sortDir,
    page,
    includeSubTimelines,
  } = readFiltersFromParams(searchParams);

  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const typesKey = types.join(",");
  const visibilitiesKey = visibilities.join(",");
  const publicationsKey = publications.join(",");

  const filters = React.useMemo(
    () =>
      buildServiceFilters(
        types,
        visibilities,
        publications,
        search,
        sortBy,
        sortDir,
        page,
        includeSubTimelines,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      typesKey,
      visibilitiesKey,
      publicationsKey,
      search,
      sortBy,
      sortDir,
      page,
      includeSubTimelines,
    ],
  );

  const { data, isPending, isError, refetch } = useTimelinesPage(
    client,
    filters,
  );

  const rows = (data?.rows ?? []) as unknown as TimelineRow[];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters =
    types.length > 0 ||
    visibilities.length > 0 ||
    publications.length > 0 ||
    search.length > 0;

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
  function handleVisibilityChange(values: string[]) {
    updateParams({ vis: arrayToCsv(values) || null, page: null });
  }
  function handlePublicationChange(values: string[]) {
    updateParams({ pub: arrayToCsv(values) || null, page: null });
  }
  function handleScopeChange(values: string[]) {
    updateParams({
      sub: values.includes("include-sub") ? "1" : null,
      page: null,
    });
  }
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateParams({ q: e.target.value || null, page: null });
  }
  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateParams({ sort: e.target.value, page: null });
  }
  function handleDirToggle() {
    updateParams({ dir: sortDir === "desc" ? "asc" : "desc", page: null });
  }
  function handlePageChange(newPage: number) {
    updateParams({ page: newPage === 1 ? null : String(newPage) });
  }
  function handleClearAll() {
    router.replace("?", { scroll: false });
  }
  function handleRowClick(row: TimelineRow) {
    router.push(`/timelines/${row.slug}`);
  }

  // ---------------------------------------------------------------------------
  // Filter groups
  // ---------------------------------------------------------------------------

  const filterGroups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Timeline type",
      options: [
        { value: "general", label: "General" },
        { value: "biographical", label: "Biographical" },
        { value: "comparative", label: "Comparative" },
      ],
      value: types,
      onChange: handleTypeChange,
    },
    {
      type: "checkbox",
      id: "visibility",
      label: "Visibility",
      options: [
        { value: "private", label: "Private" },
        { value: "public", label: "Public" },
        { value: "shared", label: "Shared" },
      ],
      value: visibilities,
      onChange: handleVisibilityChange,
    },
    {
      type: "checkbox",
      id: "publication",
      label: "Publication",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
      ],
      value: publications,
      onChange: handlePublicationChange,
    },
    {
      type: "checkbox",
      id: "scope",
      label: "Scope",
      options: [
        {
          value: "include-sub",
          label: "Include sub-timelines",
        },
      ],
      value: includeSubTimelines ? ["include-sub"] : [],
      onChange: handleScopeChange,
    },
  ];

  // ---------------------------------------------------------------------------
  // Column definitions (stable reference per component lifetime)
  // ---------------------------------------------------------------------------

  const columns = React.useMemo(
    () => buildColumns(handleRowClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full">
      <FilterRail groups={filterGroups} onClearAll={handleClearAll} />

      <main className="flex flex-1 flex-col overflow-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h1 className="font-display text-xl text-foreground">Timelines</h1>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {isPending
                ? "Loading…"
                : hasFilters
                  ? `${total} result${total !== 1 ? "s" : ""} · filtered`
                  : `${total} timeline${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/timelines/new")}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New timeline
          </Button>
        </div>

        {/* Search */}
        <div className="border-b border-border px-6 py-3 shrink-0">
          <input
            type="search"
            placeholder="Search title, summary, detail…"
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search timelines"
          />
        </div>

        {/* Table area */}
        <div className="flex-1 overflow-auto p-6">
          {isError && (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center"
            >
              <p className="text-sm text-destructive">
                Failed to load timelines.
              </p>
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
                No timelines yet. A timeline is the canvas you arrange events on
                — from a single lifetime to the whole of cosmic history.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/timelines/new")}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                New timeline
              </Button>
            </div>
          )}

          {!isError && !isPending && total === 0 && hasFilters && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <p className="text-sm text-foreground-muted">
                No timelines match these filters.
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
            <DataTable
              columns={columns}
              data={rows}
              onRowClick={handleRowClick}
            />
          )}
        </div>

        {/* Footer: pagination + sort */}
        {!isError && !isPending && total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 shrink-0">
            {/* Pagination */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
                className="rounded px-2 py-1 text-sm text-foreground-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`rounded px-2 py-1 text-sm ${
                    p === page
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="rounded px-2 py-1 text-sm text-foreground-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-select"
                className="text-xs text-foreground-muted"
              >
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="updated_at">{SORT_LABELS["updated_at"]}</option>
                <option value="created_at">{SORT_LABELS["created_at"]}</option>
                <option value="title">{SORT_LABELS["title"]}</option>
              </select>
              <button
                type="button"
                onClick={handleDirToggle}
                aria-label={
                  sortDir === "desc"
                    ? "Sort descending, click for ascending"
                    : "Sort ascending, click for descending"
                }
                className="rounded border border-border px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
              >
                {sortDir === "desc" ? "▾" : "▴"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
