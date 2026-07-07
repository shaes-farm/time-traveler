"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import {
  deletePeriod,
  publishPeriod,
  unpublishPeriod,
} from "@repo/services/period-service";
import { periodKeys, usePeriods } from "@repo/ui/hooks/use-periods";
import { toast } from "@repo/ui/components/sonner";
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

import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import { SignificanceRamp, type Significance } from "./significance-ramp";

// A period row as returned by getPeriods (the generated Row type).
type PeriodRow = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData | null;
  parent_period_id: string | null;
  significance: string | null;
  characteristics: string[] | null;
  published: boolean | null;
  sort_order_start: number | null;
  updated_at: string | null;
};

const SIG_ORDER: Significance[] = ["low", "medium", "high", "critical"];
const SIG_RANK: Record<Significance, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
const SIG_LABEL: Record<Significance, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const ERAS = ["CE", "BCE", "KYA", "MYA", "BYA"] as const;

const SORT_LABELS: Record<string, string> = {
  start: "Start date",
  title: "Title",
  significance: "Significance",
  updated_at: "Last updated",
};

function sigOf(row: PeriodRow): Significance {
  return (row.significance as Significance | null) ?? "medium";
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function TitleCell({
  row,
  parentTitle,
}: {
  row: PeriodRow;
  parentTitle: string | null;
}) {
  const nested = row.parent_period_id !== null;
  const characteristics = row.characteristics ?? [];
  const shown = characteristics.slice(0, 3);
  const extra = characteristics.length - shown.length;
  return (
    <div
      className="flex min-w-0 flex-col gap-0.5"
      style={{ paddingLeft: nested ? 16 : 0 }}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-foreground-muted" aria-hidden>
          {nested ? "↳" : "⌒"}
        </span>
        <span
          className="truncate font-medium text-foreground"
          title={row.title}
        >
          {row.title}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5 pl-5 text-xs text-foreground-muted">
        {nested && parentTitle && <span>in {parentTitle}</span>}
        {shown.map((c) => (
          <span key={c} className="rounded bg-surface-2 px-1.5 py-0.5">
            {c}
          </span>
        ))}
        {extra > 0 && <span>+{extra}</span>}
      </span>
    </div>
  );
}

function buildColumns(
  parentTitles: Map<string, string>,
): DataTableProps<PeriodRow, unknown>["columns"] {
  return [
    createSelectColumn<PeriodRow>(),
    {
      id: "title",
      header: "Title",
      enableSorting: false,
      cell: ({ row }: { row: { original: PeriodRow } }) => (
        <TitleCell
          row={row.original}
          parentTitle={
            row.original.parent_period_id !== null
              ? (parentTitles.get(row.original.parent_period_id) ?? null)
              : null
          }
        />
      ),
    },
    {
      id: "span",
      header: "Span",
      enableSorting: false,
      cell: ({ row }: { row: { original: PeriodRow } }) => (
        <span className="text-xs text-foreground-muted">
          {row.original.temporal_data && (
            <TemporalDisplay
              value={row.original.temporal_data}
              endValue={row.original.end_temporal_data ?? undefined}
              format="compact"
            />
          )}
        </span>
      ),
    },
    {
      id: "significance",
      header: "Significance",
      enableSorting: false,
      cell: ({ row }: { row: { original: PeriodRow } }) => (
        <div className="flex justify-end">
          <SignificanceRamp value={sigOf(row.original)} showLabel={false} />
        </div>
      ),
    },
    {
      accessorKey: "published",
      header: "Status",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <StatusBadge status={getValue() === true ? "published" : "draft"} />
      ),
    },
  ];
}

function TableSkeleton() {
  const ids = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];
  return (
    <div className="space-y-2">
      {ids.map((id) => (
        <Skeleton key={id} className="h-16 w-full rounded-md" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PeriodListClient() {
  const router = useRouter();
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const queryClient = useQueryClient();

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

  const { data, isPending, isError, refetch } = usePeriods(
    client,
    { userId, pageSize: 100 },
    { enabled: userId !== "" },
  ) as unknown as {
    data: PeriodRow[] | undefined;
    isPending: boolean;
    isError: boolean;
    refetch: () => void;
  };
  const allPeriods = React.useMemo(() => data ?? [], [data]);

  // Filter + sort state (local — not URL-persisted for this view).
  const [search, setSearch] = React.useState("");
  const [sigFilter, setSigFilter] = React.useState<string[]>([]);
  const [eraFilter, setEraFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [nesting, setNesting] = React.useState<RadioValue>("any");
  const [sortBy, setSortBy] = React.useState("start");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const parentTitles = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allPeriods) map.set(p.id, p.title);
    return map;
  }, [allPeriods]);

  // Facet counts over the full set.
  const facets = React.useMemo(() => {
    const sig: Record<string, number> = {};
    const era: Record<string, number> = {};
    let published = 0;
    let draft = 0;
    for (const p of allPeriods) {
      const s = sigOf(p);
      sig[s] = (sig[s] ?? 0) + 1;
      const e = (p.temporal_data as TemporalData | null)?.era;
      if (e) era[e] = (era[e] ?? 0) + 1;
      if (p.published === true) published += 1;
      else draft += 1;
    }
    return { sig, era, published, draft };
  }, [allPeriods]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = allPeriods.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (sigFilter.length > 0 && !sigFilter.includes(sigOf(p))) return false;
      if (eraFilter.length > 0) {
        const e = (p.temporal_data as TemporalData | null)?.era;
        if (!e || !eraFilter.includes(e)) return false;
      }
      if (statusFilter.length === 1) {
        const wantPublished = statusFilter[0] === "published";
        if ((p.published === true) !== wantPublished) return false;
      }
      if (nesting === "yes" && p.parent_period_id !== null) return false;
      if (nesting === "no" && p.parent_period_id === null) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const compare = (a: PeriodRow, b: PeriodRow): number => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "significance")
        return SIG_RANK[sigOf(a)] - SIG_RANK[sigOf(b)];
      if (sortBy === "updated_at")
        return (a.updated_at ?? "").localeCompare(b.updated_at ?? "");
      return (a.sort_order_start ?? 0) - (b.sort_order_start ?? 0);
    };
    return [...rows].sort((a, b) => compare(a, b) * dir);
  }, [
    allPeriods,
    search,
    sigFilter,
    eraFilter,
    statusFilter,
    nesting,
    sortBy,
    sortDir,
  ]);

  // Selection is over the filtered rows; reset when the filtered set changes id-set.
  const selectedRows = React.useMemo(
    () => filtered.filter((r) => rowSelection[r.id]),
    [filtered, rowSelection],
  );
  const ownedSelected = React.useMemo(
    () => selectedRows.filter((r) => r.user_id === userId),
    [selectedRows, userId],
  );
  const skippedCount = selectedRows.length - ownedSelected.length;

  async function runBulk(action: "publish" | "unpublish" | "delete") {
    const ids = ownedSelected.map((r) => r.id);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const fn =
      action === "publish"
        ? publishPeriod
        : action === "unpublish"
          ? unpublishPeriod
          : deletePeriod;
    const results = await Promise.allSettled(ids.map((id) => fn(client, id)));
    setBulkBusy(false);
    await queryClient.invalidateQueries({ queryKey: periodKeys.all });
    setRowSelection({});

    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = ids.length - failed;
    const verb =
      action === "publish"
        ? "Published"
        : action === "unpublish"
          ? "Unpublished"
          : "Deleted";
    const noun = (n: number) => `period${n !== 1 ? "s" : ""}`;
    if (failed === 0) toast.success(`${verb} ${ok} ${noun(ok)}.`);
    else if (ok === 0)
      toast.error(`Couldn't ${action} ${failed} ${noun(failed)}. Try again.`);
    else toast.warning(`${verb} ${ok} ${noun(ok)}; ${failed} failed.`);
  }

  const hasFilters =
    search.length > 0 ||
    sigFilter.length > 0 ||
    eraFilter.length > 0 ||
    statusFilter.length === 1 ||
    nesting !== "any";

  function clearAll() {
    setSearch("");
    setSigFilter([]);
    setEraFilter([]);
    setStatusFilter([]);
    setNesting("any");
  }

  const columns = React.useMemo(
    () => buildColumns(parentTitles),
    [parentTitles],
  );

  const filterGroups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "significance",
      label: "Significance",
      options: SIG_ORDER.map((s) => ({
        value: s,
        label: SIG_LABEL[s],
        count: facets.sig[s],
      })),
      value: sigFilter,
      onChange: setSigFilter,
    },
    {
      type: "radio",
      id: "nesting",
      label: "Show",
      value: nesting,
      onChange: setNesting,
      yesLabel: "Top-level only",
      noLabel: "Nested only",
    },
    {
      type: "checkbox",
      id: "era",
      label: "Era",
      options: ERAS.filter((e) => facets.era[e]).map((e) => ({
        value: e,
        label: e,
        count: facets.era[e],
      })),
      value: eraFilter,
      onChange: setEraFilter,
    },
    {
      type: "checkbox",
      id: "status",
      label: "Status",
      options: [
        { value: "published", label: "Published", count: facets.published },
        { value: "draft", label: "Draft", count: facets.draft },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];

  return (
    <div className="flex h-full">
      <main className="flex flex-1 flex-col overflow-auto min-w-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h1 className="font-display text-xl text-foreground">Periods</h1>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {isPending
                ? "Loading…"
                : hasFilters
                  ? `${filtered.length} of ${allPeriods.length} shown`
                  : `${allPeriods.length} period${allPeriods.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/periods/new")}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New period
          </Button>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-6 py-3 shrink-0">
          <input
            type="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search periods"
          />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isError && (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center"
            >
              <p className="text-sm text-destructive">
                Failed to load periods.
              </p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isError && isPending && <TableSkeleton />}

          {!isError && !isPending && allPeriods.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="max-w-sm text-sm text-foreground-muted">
                No periods yet. Periods are the named spans — eras, ages, epochs
                — your events fall within.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/periods/new")}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                New period
              </Button>
            </div>
          )}

          {!isError &&
            !isPending &&
            allPeriods.length > 0 &&
            filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <p className="text-sm text-foreground-muted">
                  No periods match these filters.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Clear filters
                </button>
              </div>
            )}

          {!isError && !isPending && filtered.length > 0 && (
            <div className="space-y-3">
              <BulkActionBar
                count={ownedSelected.length}
                skippedCount={skippedCount}
                entityLabel="period"
                busy={bulkBusy}
                onPublish={() => void runBulk("publish")}
                onUnpublish={() => void runBulk("unpublish")}
                onDelete={() => void runBulk("delete")}
                onClear={() => setRowSelection({})}
              />
              <DataTable
                columns={columns}
                data={filtered}
                onRowClick={(row) => router.push(`/periods/${row.slug}`)}
                getRowId={(row) => row.id}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </div>
          )}
        </div>

        {!isError && !isPending && filtered.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3 shrink-0">
            <label
              htmlFor="period-sort-select"
              className="text-xs text-foreground-muted"
            >
              Sort:
            </label>
            <select
              id="period-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={
                sortDir === "asc"
                  ? "Sort ascending, click for descending"
                  : "Sort descending, click for ascending"
              }
              className="rounded border border-border px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
            >
              {sortDir === "asc" ? "▴" : "▾"}
            </button>
          </div>
        )}
      </main>

      <FilterRail groups={filterGroups} onClearAll={clearAll} />
    </div>
  );
}
