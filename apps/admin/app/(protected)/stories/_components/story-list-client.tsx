"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/sonner";
import { Plus } from "lucide-react";
import {
  deleteStory,
  publishStory,
  unpublishStory,
  type StoryFilters,
  type StoryListRow,
} from "@repo/services/story-service";
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
import {
  CharacterTypeBadge,
  type CharacterType,
} from "@repo/ui/components/character-type-badge";
import {
  storyKeys,
  useStoriesPage,
  useStoryFacetCounts,
} from "@repo/ui/hooks/use-stories";
import { useCharacters } from "@repo/ui/hooks/use-characters";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const NARRATOR_TYPES: { value: string; label: string }[] = [
  { value: "first_person", label: "First-person" },
  { value: "third_person", label: "Third-person" },
  { value: "omniscient", label: "Omniscient" },
];
const NARRATOR_LABEL: Record<string, string> = Object.fromEntries(
  NARRATOR_TYPES.map((n) => [n.value, n.label]),
);
const VALID_NARRATORS = new Set(NARRATOR_TYPES.map((n) => n.value));

// Published is a 2-option checkbox group (not the shared radio) so both options
// can carry a count; the filter is applied only when exactly one is checked —
// the same "exactly one" convention the characters list uses for its Published
// and Has-media groups.
const VALID_PUBLICATIONS = new Set(["published", "draft"]);

const SORT_LABELS: Record<string, string> = {
  updated_at: "Last updated",
  created_at: "Created",
  title: "Title",
};
const VALID_SORT = new Set(Object.keys(SORT_LABELS));

// Perspective characters populate both the filter combobox and the per-row
// perspective chip. Capped at the service's max page size — admins rarely
// exceed this early on, and an unresolved id simply omits the chip.
const PERSPECTIVE_FETCH_SIZE = 100;

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
 * Windowed page numbers with "ellipsis" gaps: always first, last, current ±2.
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
  narrators: string[];
  publications: string[];
  perspective: string | null;
  tags: string[];
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
}

function readFiltersFromParams(params: URLSearchParams): ParsedFilters {
  const rawSort = params.get("sort") ?? "updated_at";
  const sortBy = VALID_SORT.has(rawSort) ? rawSort : "updated_at";

  const rawPage = parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;

  return {
    narrators: csvToArray(params.get("narrator")).filter((n) =>
      VALID_NARRATORS.has(n),
    ),
    publications: csvToArray(params.get("pub")).filter((p) =>
      VALID_PUBLICATIONS.has(p),
    ),
    perspective: params.get("persp"),
    tags: csvToArray(params.get("tags")),
    search: params.get("q") ?? "",
    sortBy,
    // Stories default to newest-first (updated_at desc): they are work surfaces.
    sortDir: params.get("dir") === "asc" ? "asc" : "desc",
    page,
  };
}

function buildServiceFilters(parsed: ParsedFilters): StoryFilters {
  const filters: StoryFilters = {
    page: parsed.page,
    pageSize: PAGE_SIZE,
    sortBy: parsed.sortBy as StoryFilters["sortBy"],
    sortDirection: parsed.sortDir,
  };

  // narrator/published: exactly one value selected → filter; otherwise omit
  // (both, or neither, checked narrows nothing).
  if (parsed.narrators.length === 1) {
    filters.narratorType = parsed.narrators[0] as StoryFilters["narratorType"];
  }
  if (parsed.publications.length === 1) {
    filters.published = parsed.publications[0] === "published";
  }
  if (parsed.perspective) {
    filters.perspectiveCharacterId = parsed.perspective;
  }
  if (parsed.tags.length > 0) {
    filters.tags = parsed.tags;
  }
  if (parsed.search.length > 0) {
    filters.search = parsed.search;
  }

  return filters;
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

type PerspectiveInfo = { name: string; character_type: CharacterType };

function TitleCell({
  row,
  perspectiveMap,
  onRowClick,
}: {
  row: StoryListRow;
  perspectiveMap: Map<string, PerspectiveInfo>;
  onRowClick: (row: StoryListRow) => void;
}) {
  const eventCount = row.story_events[0]?.count ?? 0;
  const characterCount = row.story_characters[0]?.count ?? 0;
  const tags = row.tags ?? [];
  const shownTags = tags.slice(0, 2);
  const extraTags = tags.length - shownTags.length;

  const perspective =
    row.perspective_character_id !== null
      ? (perspectiveMap.get(row.perspective_character_id) ?? null)
      : null;
  const isFirstPerson = row.narrator_type === "first_person";

  const counts = `${eventCount} ev · ${characterCount} ch`;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="flex flex-col gap-0.5 text-left hover:opacity-80 transition-opacity"
        onClick={(ev) => {
          ev.stopPropagation();
          onRowClick(row);
        }}
      >
        <span
          className="line-clamp-1 font-medium text-foreground leading-tight"
          title={row.title}
        >
          {row.title}
        </span>
        {row.sub_title && (
          <span
            className="line-clamp-1 text-xs text-foreground-muted"
            title={row.sub_title}
          >
            {row.sub_title}
          </span>
        )}
      </button>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
        {perspective && (
          <span className="inline-flex items-center gap-1">
            <CharacterTypeBadge
              type={perspective.character_type}
              label={perspective.name}
            />
            {isFirstPerson && (
              <span className="text-foreground-muted">(narrator)</span>
            )}
          </span>
        )}
        <span>{counts}</span>
        {shownTags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-surface-2 px-1.5 py-0.5 text-foreground-muted"
          >
            {tag}
          </span>
        ))}
        {extraTags > 0 && <span>+{extraTags}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function buildColumns(
  perspectiveMap: Map<string, PerspectiveInfo>,
  onRowClick: (row: StoryListRow) => void,
): DataTableProps<StoryListRow, unknown>["columns"] {
  return [
    createSelectColumn<StoryListRow>(),
    {
      id: "title",
      header: "Title",
      enableSorting: false,
      cell: ({ row }: { row: { original: StoryListRow } }) => (
        <TitleCell
          row={row.original}
          perspectiveMap={perspectiveMap}
          onRowClick={onRowClick}
        />
      ),
    },
    {
      accessorKey: "narrator_type",
      header: "Narrator",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const v = getValue() as string | null;
        return (
          <span className="text-sm text-foreground-muted">
            {v !== null ? (NARRATOR_LABEL[v] ?? v) : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "published",
      header: "Published",
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

export function StoryListClient() {
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
  // Facet counts key off the filters minus page/sort so paging or re-sorting
  // doesn't refire the count queries the rail depends on.
  const facetFilters = React.useMemo<StoryFilters>(() => {
    const picked: StoryFilters = {};
    if (filters.narratorType !== undefined) {
      picked.narratorType = filters.narratorType;
    }
    if (filters.published !== undefined) {
      picked.published = filters.published;
    }
    if (filters.perspectiveCharacterId !== undefined) {
      picked.perspectiveCharacterId = filters.perspectiveCharacterId;
    }
    if (filters.tags !== undefined) {
      picked.tags = filters.tags;
    }
    if (filters.search !== undefined) {
      picked.search = filters.search;
    }
    return picked;
  }, [filters]);

  const { data, isPending, isError, refetch } = useStoriesPage(client, filters);
  const { data: facetCounts } = useStoryFacetCounts(client, facetFilters);

  // Current user — used to gate bulk publish/unpublish/delete to owned rows
  // (RLS re-checks server-side regardless) and to scope the perspective query.
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

  // The user's characters drive the perspective filter options and the per-row
  // perspective chip. Only fetched once a user id is known.
  const { data: characters = [] } = useCharacters(
    client,
    { userId, pageSize: PERSPECTIVE_FETCH_SIZE, sortBy: "name" },
    { enabled: userId !== "" },
  );

  const perspectiveMap = React.useMemo(() => {
    const map = new Map<string, PerspectiveInfo>();
    for (const c of characters) {
      map.set(c.id, {
        name: c.name,
        character_type: c.character_type as CharacterType,
      });
    }
    return map;
  }, [characters]);

  const queryClient = useQueryClient();

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const rows = React.useMemo(
    () => (data?.rows ?? []) as StoryListRow[],
    [data],
  );
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Clamp an out-of-range page (e.g. a bulk delete shrank the result set below
  // the current page, or a deep link points past the last page) back to the
  // last valid page. Gated on !isPending so a legitimately deep-linked page
  // isn't clamped before its data loads. Builds from window.location like
  // updateParams (see #329) and mirrors handlePageChange's "page 1 → drop the
  // param" convention.
  React.useEffect(() => {
    if (isPending || isError) return;
    if (parsed.page <= totalPages) return;
    const next = new URLSearchParams(window.location.search);
    if (totalPages <= 1) next.delete("page");
    else next.set("page", String(totalPages));
    router.replace(`?${next.toString()}`, { scroll: false });
  }, [isPending, isError, parsed.page, totalPages, router]);

  // Selection lives on the current page only; reset whenever the query changes.
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
        ? publishStory
        : action === "unpublish"
          ? unpublishStory
          : deleteStory;
    const results = await Promise.allSettled(ids.map((id) => fn(client, id)));
    setBulkBusy(false);
    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    setRowSelection({});

    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = ids.length - failed;
    const verb =
      action === "publish"
        ? "Published"
        : action === "unpublish"
          ? "Unpublished"
          : "Deleted";
    const noun = (n: number) => `stor${n !== 1 ? "ies" : "y"}`;
    if (failed === 0) {
      toast.success(`${verb} ${ok} ${noun(ok)}.`);
    } else if (ok === 0) {
      toast.error(`Couldn't ${action} ${failed} ${noun(failed)}. Try again.`);
    } else {
      toast.warning(`${verb} ${ok} ${noun(ok)}; ${failed} failed.`);
    }
  }

  const hasFilters =
    parsed.narrators.length === 1 ||
    parsed.publications.length === 1 ||
    parsed.perspective !== null ||
    parsed.tags.length > 0 ||
    parsed.search.length > 0;

  // ---------------------------------------------------------------------------
  // URL update helpers
  // ---------------------------------------------------------------------------

  function updateParams(updates: Record<string, string | null>) {
    // Build from the live URL, not the closed-over snapshot: the search box's
    // debounced update fires ~300ms after a keystroke, and a filter/sort/page
    // change landing in that window must not be dropped. Only runs from event
    // handlers / the debounce timeout (never during render). Mirrors #329.
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

  function handleNarratorChange(values: string[]) {
    updateParams({ narrator: arrayToCsv(values) || null, page: null });
  }
  function handlePublicationChange(values: string[]) {
    updateParams({ pub: arrayToCsv(values) || null, page: null });
  }
  function handlePerspectiveChange(value: string | null) {
    updateParams({ persp: value, page: null });
  }
  function handleTagsChange(values: string[]) {
    updateParams({ tags: arrayToCsv(values) || null, page: null });
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

  function handleNewStory() {
    router.push("/stories/new");
  }

  const handleRowClick = React.useCallback(
    (row: StoryListRow) => {
      router.push(`/stories/${row.slug}`);
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
  // Filter groups
  // ---------------------------------------------------------------------------

  const filterGroups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "narrator",
      label: "Narrator",
      options: NARRATOR_TYPES.map((n) => ({
        ...n,
        count:
          facetCounts?.narratorType[
            n.value as keyof typeof facetCounts.narratorType
          ],
      })),
      value: parsed.narrators,
      onChange: handleNarratorChange,
    },
    {
      type: "combobox",
      id: "perspective",
      label: "Perspective",
      placeholder: "Any character",
      value: parsed.perspective,
      options: characters.map((c) => ({ value: c.id, label: c.name })),
      onChange: handlePerspectiveChange,
    },
    {
      type: "checkbox",
      id: "publication",
      label: "Status",
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
      type: "tags",
      id: "tags",
      label: "Tags",
      value: parsed.tags,
      onChange: handleTagsChange,
    },
  ];

  const columns = React.useMemo(
    () => buildColumns(perspectiveMap, handleRowClick),
    [perspectiveMap, handleRowClick],
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
            <h1 className="font-display text-xl text-foreground">Stories</h1>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {isPending
                ? "Loading…"
                : hasFilters
                  ? `${total} result${total !== 1 ? "s" : ""} · filtered`
                  : `${total} stor${total !== 1 ? "ies" : "y"}`}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={handleNewStory}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New story
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-3 shrink-0">
          <input
            type="search"
            placeholder="Search title, sub-title, summary, detail…"
            value={searchInput}
            onChange={handleSearchChange}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search stories"
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
                Failed to load stories.
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
                No stories yet. A story is a telling — your interpretation of
                events, from a point of view.
              </p>
              <Button variant="primary" size="sm" onClick={handleNewStory}>
                <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                New story
              </Button>
            </div>
          )}

          {!isError && !isPending && total === 0 && hasFilters && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <p className="text-sm text-foreground-muted">
                No stories match these filters.
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
                entityLabel="story"
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
                htmlFor="story-sort-select"
                className="text-xs text-foreground-muted"
              >
                Sort:
              </label>
              <select
                id="story-sort-select"
                value={parsed.sortBy}
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
