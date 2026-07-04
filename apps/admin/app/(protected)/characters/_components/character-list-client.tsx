"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/sonner";
import { Plus } from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import {
  deleteCharacter,
  publishCharacter,
  unpublishCharacter,
  type CharacterFilters,
  type CharacterListRow,
  type CharacterType,
  type Significance,
} from "@repo/services/character-service";
import { BulkActionBar } from "@repo/ui/components/bulk-action-bar";
import { Button } from "@repo/ui/components/button";
import {
  DataTable,
  createSelectColumn,
  type DataTableProps,
  type RowSelectionState,
} from "@repo/ui/components/data-table";
import { FilterRail, type FilterGroup } from "@repo/ui/components/filter-rail";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import { cn } from "@repo/ui/lib/utils";
import {
  characterKeys,
  useCharactersPage,
  useCharacterFacetCounts,
} from "@repo/ui/hooks/use-characters";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import {
  CharacterTypeBadge,
  CHARACTER_TYPE_ICON,
} from "./character-type-badge";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// character_type values are the exact schema enum (see characterTypeEnum).
const CHARACTER_TYPES: { value: CharacterType; label: string }[] = [
  { value: "human", label: "Human" },
  { value: "animal", label: "Animal" },
  { value: "mythological", label: "Mythological" },
  { value: "fictional", label: "Fictional" },
  { value: "organization", label: "Organization" },
  { value: "divine", label: "Divine" },
  { value: "artifact", label: "Artifact" },
];
const VALID_TYPES = new Set<string>(CHARACTER_TYPES.map((t) => t.value));

const SIGNIFICANCES: { value: Significance; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];
const VALID_SIGNIFICANCES = new Set<string>(SIGNIFICANCES.map((s) => s.value));

// Published and has-media are each rendered as a 2-option checkbox group
// (not the shared radio component) specifically so both options can carry a
// count, matching the wireframe — the filter is applied only when exactly one
// option is checked, same convention the events list uses for its own
// Status group.
const VALID_PUBLICATIONS = new Set<string>(["published", "draft"]);
const VALID_MEDIA = new Set<string>(["yes", "no"]);

const SORT_LABELS: Record<string, string> = {
  name: "Name",
  created_at: "Created",
  updated_at: "Last updated",
  sort_order_years: "Birth date",
};
const VALID_SORT = new Set(Object.keys(SORT_LABELS));

const SIGNIFICANCE_STARS: Record<Significance, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
// Reuses the existing Batch F importance sequential ramp — significance and
// importance are the same visual language (03-aesthetic-notes.md § Significance
// scale, finalized). Literal class names (not interpolated) so Tailwind's
// scanner picks them up.
const SIGNIFICANCE_CLASS: Record<Significance, string> = {
  low: "text-importance-low",
  medium: "text-importance-medium",
  high: "text-importance-high",
  critical: "text-importance-critical",
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
  significances: string[];
  publications: string[];
  media: string[];
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
}

function readFiltersFromParams(params: URLSearchParams): ParsedFilters {
  const rawSort = params.get("sort") ?? "name";
  const sortBy = VALID_SORT.has(rawSort) ? rawSort : "name";

  const rawPage = parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;

  return {
    types: csvToArray(params.get("type")).filter((t) => VALID_TYPES.has(t)),
    significances: csvToArray(params.get("sig")).filter((s) =>
      VALID_SIGNIFICANCES.has(s),
    ),
    publications: csvToArray(params.get("pub")).filter((p) =>
      VALID_PUBLICATIONS.has(p),
    ),
    media: csvToArray(params.get("media")).filter((m) => VALID_MEDIA.has(m)),
    search: params.get("q") ?? "",
    sortBy,
    sortDir: params.get("dir") === "desc" ? "desc" : "asc",
    page,
  };
}

function buildServiceFilters(parsed: ParsedFilters): CharacterFilters {
  const filters: CharacterFilters = {
    page: parsed.page,
    pageSize: PAGE_SIZE,
    sortBy: parsed.sortBy as CharacterFilters["sortBy"],
    sortDirection: parsed.sortDir,
  };

  const safeTypes = parsed.types.filter((t) =>
    VALID_TYPES.has(t),
  ) as CharacterType[];
  if (safeTypes.length > 0) {
    filters.characterType = safeTypes;
  }

  const safeSignificances = parsed.significances.filter((s) =>
    VALID_SIGNIFICANCES.has(s),
  ) as Significance[];
  if (safeSignificances.length > 0) {
    filters.significance = safeSignificances;
  }

  // published/hasMedia: exactly one value selected → filter; otherwise omit
  // (both, or neither, checked narrows nothing).
  if (parsed.publications.length === 1) {
    filters.published = parsed.publications[0] === "published";
  }
  if (parsed.media.length === 1) {
    filters.hasMedia = parsed.media[0] === "yes";
  }

  if (parsed.search.length > 0) {
    filters.search = parsed.search;
  }

  return filters;
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function SignificanceCell({ value }: { value: Significance | null }) {
  // significance is DEFAULT 'medium' but not NOT NULL (migration 00001), so a
  // row written outside the app's own create/update path (direct SQL, import)
  // can carry a null — render the same "—" placeholder as the Temporal cell
  // rather than indexing the lookup maps with a value they don't cover.
  if (value === null) {
    return <span className="text-sm text-foreground-muted">—</span>;
  }
  const filled = SIGNIFICANCE_STARS[value];
  return (
    <span
      className={cn("text-sm", SIGNIFICANCE_CLASS[value])}
      title={`Significance: ${value}`}
    >
      <span aria-hidden>{"★".repeat(filled)}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}

function NameCell({
  row,
  onRowClick,
}: {
  row: CharacterListRow;
  onRowClick: (row: CharacterListRow) => void;
}) {
  const primaryMedia =
    row.character_media.find((m) => m.is_primary === true)?.media ??
    row.character_media[0]?.media ??
    null;
  const aliases = row.aliases ?? [];
  const firstAlias = aliases[0];
  const extraAliasCount = aliases.length > 1 ? aliases.length - 1 : 0;
  const eventCount = row.event_characters[0]?.count ?? 0;
  const line2 = [
    firstAlias !== undefined
      ? `${firstAlias}${extraAliasCount > 0 ? ` +${extraAliasCount}` : ""}`
      : null,
    eventCount > 0 ? `${eventCount} event${eventCount !== 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  const PlaceholderIcon =
    CHARACTER_TYPE_ICON[row.character_type as CharacterType];

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex w-full flex-col gap-0.5 text-left hover:opacity-80 transition-opacity"
        onClick={(ev) => {
          ev.stopPropagation();
          onRowClick(row);
        }}
      >
        <span
          className="line-clamp-1 font-medium text-foreground leading-tight"
          title={row.name}
        >
          {row.name}
        </span>
        {line2.length > 0 && (
          <span className="text-xs text-foreground-muted">
            {line2.join(" · ")}
          </span>
        )}
      </button>
      <div className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden rounded-md border border-border bg-popover p-1 shadow-md group-hover:block">
        {primaryMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryMedia.url}
            alt={primaryMedia.alt_text ?? ""}
            className="h-24 w-24 rounded object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded bg-surface-2">
            <PlaceholderIcon
              className="h-8 w-8 text-foreground-muted"
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function buildColumns(
  onRowClick: (row: CharacterListRow) => void,
): DataTableProps<CharacterListRow, unknown>["columns"] {
  return [
    createSelectColumn<CharacterListRow>(),
    {
      id: "name",
      header: "Name",
      enableSorting: false,
      cell: ({ row }: { row: { original: CharacterListRow } }) => (
        <NameCell row={row.original} onRowClick={onRowClick} />
      ),
    },
    {
      accessorKey: "character_type",
      header: "Type",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <CharacterTypeBadge type={getValue() as CharacterType} />
      ),
    },
    {
      id: "temporal",
      header: "Temporal",
      enableSorting: false,
      cell: ({ row }: { row: { original: CharacterListRow } }) => {
        const c = row.original;
        const birth = c.birth_temporal as TemporalData | null;
        if (!birth || Object.keys(birth).length === 0) {
          return <span className="text-sm text-foreground-muted">—</span>;
        }
        return (
          <span className="text-sm text-foreground-muted">
            <TemporalDisplay
              value={birth}
              endValue={(c.death_temporal as TemporalData | null) ?? undefined}
              format="compact"
            />
          </span>
        );
      },
    },
    {
      accessorKey: "significance",
      // Star glyph for sighted users; sr-only text so the column is announced.
      header: () => (
        <>
          <span aria-hidden>★</span>
          <span className="sr-only">Significance</span>
        </>
      ),
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <SignificanceCell value={getValue() as Significance | null} />
      ),
    },
    {
      accessorKey: "published",
      header: "Published",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const v = getValue() as boolean | null;
        // DECISION NEEDED: wireframe 03 annotation #7 describes a 3rd "shared"
        // status (reachable via a timeline_collaborators join two hops away).
        // No query for that reachability exists yet and the events list (the
        // reference template) doesn't implement it either — deferring to
        // 2-state per the wireframe's own filter checkboxes and #55's AC.
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

export function CharacterListClient() {
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
  // Facet counts key off the filters minus page/sort, so paging or changing
  // sort doesn't refire all 15 count queries the rail depends on.
  const facetFilters = React.useMemo<CharacterFilters>(() => {
    const picked: CharacterFilters = {};
    if (filters.characterType !== undefined) {
      picked.characterType = filters.characterType;
    }
    if (filters.significance !== undefined) {
      picked.significance = filters.significance;
    }
    if (filters.published !== undefined) {
      picked.published = filters.published;
    }
    if (filters.hasMedia !== undefined) {
      picked.hasMedia = filters.hasMedia;
    }
    if (filters.search !== undefined) {
      picked.search = filters.search;
    }
    return picked;
  }, [filters]);

  const { data, isPending, isError, refetch } = useCharactersPage(
    client,
    filters,
  );
  const { data: facetCounts } = useCharacterFacetCounts(client, facetFilters);

  // Current user — used to gate bulk publish/unpublish/delete to owner-owned
  // rows (RLS re-checks server-side regardless).
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

  // Row selection for the bulk-action bar, keyed by character id (getRowId).
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const rows = React.useMemo(
    () => (data?.rows ?? []) as CharacterListRow[],
    [data],
  );
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Selection lives on the current page only; reset it whenever the query
  // (filters/sort/page) changes so stale ids never leak into a bulk action.
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
  // Publishing/deleting is owner-only — exclude shared/other-owned rows from
  // the action and report them as skipped.
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
        ? publishCharacter
        : action === "unpublish"
          ? unpublishCharacter
          : deleteCharacter;
    const results = await Promise.allSettled(ids.map((id) => fn(client, id)));
    setBulkBusy(false);
    await queryClient.invalidateQueries({ queryKey: characterKeys.all });
    setRowSelection({});

    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = ids.length - failed;
    const verb =
      action === "publish"
        ? "Published"
        : action === "unpublish"
          ? "Unpublished"
          : "Deleted";
    const noun = (n: number) => `character${n !== 1 ? "s" : ""}`;
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
    parsed.significances.length > 0 ||
    parsed.publications.length === 1 ||
    parsed.media.length === 1 ||
    parsed.search.length > 0;

  // ---------------------------------------------------------------------------
  // URL update helpers
  // ---------------------------------------------------------------------------

  function updateParams(updates: Record<string, string | null>) {
    // Build from the live URL, not the closed-over `searchParams` snapshot:
    // the search box's debounced update fires ~300ms after a keystroke, and
    // if a filter/sort/page change lands in that window, building from the
    // stale snapshot would drop it. updateParams only runs from event
    // handlers / the debounce timeout (never during render), so reading
    // window.location here is safe. See #329.
    const next = new URLSearchParams(window.location.search);
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
  function handleSignificanceChange(values: string[]) {
    updateParams({ sig: arrayToCsv(values) || null, page: null });
  }
  function handlePublicationChange(values: string[]) {
    updateParams({ pub: arrayToCsv(values) || null, page: null });
  }
  function handleMediaChange(values: string[]) {
    updateParams({ media: arrayToCsv(values) || null, page: null });
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

  function handleNewCharacter() {
    router.push("/characters/new");
  }

  const handleRowClick = React.useCallback(
    (row: CharacterListRow) => {
      router.push(`/characters/${row.slug}`);
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
  // Filter groups. Published and Has-media are checkbox groups (not the
  // shared radio component) so both options can carry a count.
  // ---------------------------------------------------------------------------

  const filterGroups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Type",
      options: CHARACTER_TYPES.map((t) => ({
        ...t,
        count: facetCounts?.characterType[t.value],
      })),
      value: parsed.types,
      onChange: handleTypeChange,
    },
    {
      type: "checkbox",
      id: "significance",
      label: "Significance",
      options: SIGNIFICANCES.map((s) => ({
        ...s,
        count: facetCounts?.significance[s.value],
      })),
      value: parsed.significances,
      onChange: handleSignificanceChange,
    },
    {
      type: "checkbox",
      id: "publication",
      label: "Published",
      options: [
        {
          value: "published",
          label: "Published",
          count: facetCounts?.published.published,
        },
        { value: "draft", label: "Draft", count: facetCounts?.published.draft },
      ],
      value: parsed.publications,
      onChange: handlePublicationChange,
    },
    {
      type: "checkbox",
      id: "media",
      label: "Has media",
      options: [
        { value: "yes", label: "Yes", count: facetCounts?.hasMedia.yes },
        { value: "no", label: "No", count: facetCounts?.hasMedia.no },
      ],
      value: parsed.media,
      onChange: handleMediaChange,
    },
  ];

  const columns = React.useMemo(
    () => buildColumns(handleRowClick),
    [handleRowClick],
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
            <h1 className="font-display text-xl text-foreground">Characters</h1>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {isPending
                ? "Loading…"
                : hasFilters
                  ? `${total} result${total !== 1 ? "s" : ""} · filtered`
                  : `${total} character${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={handleNewCharacter}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New character
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-3 shrink-0">
          <input
            type="search"
            placeholder="Search name, biography, aliases…"
            value={searchInput}
            onChange={handleSearchChange}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search characters"
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
                Failed to load characters.
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
                No characters yet. Characters are the people, beings, and
                organizations that participate in your events.
              </p>
              <Button variant="primary" size="sm" onClick={handleNewCharacter}>
                <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                New character
              </Button>
            </div>
          )}

          {!isError && !isPending && total === 0 && hasFilters && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <p className="text-sm text-foreground-muted">
                No characters match these filters.
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
                entityLabel="character"
                busy={bulkBusy}
                onPublish={() => void runBulk("publish")}
                onUnpublish={() => void runBulk("unpublish")}
                onDelete={() => void runBulk("delete")}
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
                htmlFor="character-sort-select"
                className="text-xs text-foreground-muted"
              >
                Sort:
              </label>
              <select
                id="character-sort-select"
                value={parsed.sortBy}
                onChange={handleSortChange}
                className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="name">{SORT_LABELS["name"]}</option>
                <option value="created_at">{SORT_LABELS["created_at"]}</option>
                <option value="updated_at">{SORT_LABELS["updated_at"]}</option>
                <option value="sort_order_years">
                  {SORT_LABELS["sort_order_years"]}
                </option>
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
