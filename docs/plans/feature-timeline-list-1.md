---
goal: Build the admin Timelines list route with schema-accurate filtering, sorting, and pagination (issue #42)
version: 1.0
date_created: 2026-06-02
last_updated: 2026-06-02
owner: Frontend (apps/admin)
status: "Planned"
tags: [feature, admin, timelines, list]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan implements the Timelines list route (`apps/admin/app/(protected)/timelines/page.tsx`), replacing the current `PlaceholderPage`. It wires the existing `useTimelines` hook and the `DataTable` / `FilterRail` / `StatusBadge` / `TemporalDisplay` UI primitives — already prototyped in `packages/ui/src/components/timeline-list.stories.tsx` — to live Supabase data, and extends the `getTimelines` service so the filter, sort, and pagination axes required by issue #42 are honoured at the SQL layer.

The dominant work is **not** UI assembly (the story is a near-complete blueprint) but closing service-layer gaps: `getTimelines` currently accepts only `visibility | userId | search | page | pageSize`, hard-codes `order("sort_order_start", asc)`, returns only a row array (no total count), and has no `timeline_type`, `published`, or root/sub-timeline filter. Each of those is required by an acceptance criterion.

## 1. Requirements & Constraints

- **REQ-001**: Route `apps/admin/app/(protected)/timelines/page.tsx` renders the list from the `useTimelines` hook (`@repo/ui/hooks`).
- **REQ-002**: Columns: title (two-line: title on line 1; temporal span + event count + collaborator count on line 2), `timeline_type`, `visibility`, published status, `updated_at`.
- **REQ-003**: Filters map to actual schema enums — `visibility` (`private|public|shared`), `timeline_type` (`general|biographical|comparative`), published state (`published|draft`), and free-text search. OR within a group, AND across groups.
- **REQ-004**: Sorting on `title`, `updated_at` (default, descending), `created_at`.
- **REQ-005**: Offset-based pagination, default page size 20; pagination preserves active filter + sort state.
- **REQ-006**: Published/draft indicator is the shared `StatusBadge` (`published`/`draft`) and is a **separate column** from `visibility`. The two axes must never be merged (wireframe 11 annotation #3, #48).
- **REQ-007**: Empty (zero timelines), filtered-to-zero, loading (skeleton rows), and error states are all present.
- **REQ-008**: Row click navigates to the timeline detail route.
- **REQ-009**: List defaults to top-level (root) timelines — those NOT referenced by any event's `detail_timeline_id`; an "Include sub-timelines" toggle (off by default) reveals nested ones. Until #177 lands, the partition is a no-op (all timelines treated as root) and must degrade gracefully.
- **REQ-010**: Filter + sort + page state is URL-encoded so a browser refresh restores the exact view.
- **CON-001**: `getTimelines` returns only `TimelineRow[]` today; total/filtered count must be obtained without breaking existing callers/tests.
- **CON-002**: No `nuqs` dependency in the repo — URL state must use Next `useSearchParams` + `useRouter` from `next/navigation`.
- **CON-003**: Event count and collaborator count are **deferred-tolerant** — the row must render correctly when those counts are absent. Do not block the list on a count query contract.
- **CON-004**: The `detail_timeline_id` column exists (added in migration `00017_events_detail_timeline_id.sql`), but the root/sub partition query logic is not yet implemented. `includeSubTimelines` is a no-op until that logic lands.
- **CON-005**: TypeScript strict mode + `--max-warnings 0` ESLint; both apps are ESM (`"type": "module"`).
- **CON-006**: Card/grid view and bulk actions are explicit non-goals for #42.
- **GUD-001**: Reuse `@repo/ui` primitives (`DataTable`, `FilterRail`, `StatusBadge`, `TemporalDisplay`, `Button`, `Skeleton`) before authoring new components — the story already demonstrates the exact composition.
- **GUD-002**: Server component by default; mark the interactive list a client component (`"use client"`) only at the leaf that owns filter/sort/query state.
- **PAT-001**: Follow the service convention in `packages/services/src/modules/timeline-service.ts` (clamp paging, `assertNoError`, leverage `search_vector` GIN via `textSearch(... { type: "websearch" })`).
- **PAT-002**: Obtain the browser Supabase client via `getBrowserSupabaseClient()` from `apps/admin/lib/auth/browser-client.ts`.

## 2. Implementation Steps

### Implementation Phase 1 — Extend the service & hook contract

- GOAL-001: Make `getTimelines` honour every filter/sort/pagination axis #42 requires and expose a total count, without breaking existing callers.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                              | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | In `packages/services/src/modules/timeline-service.ts`, extend `TimelineFilters` with optional `timelineType?: "general" \| "biographical" \| "comparative"`, `published?: boolean`, `sortBy?: "title" \| "updated_at" \| "created_at"` (default `"updated_at"`), `sortDirection?: "asc" \| "desc"` (default `"desc"`), and `includeSubTimelines?: boolean` (default `false`). Keep all existing fields. |           |      |
| TASK-002 | Update `getTimelines` query construction: add `.eq("timeline_type", timelineType)` and `.eq("published", published)` when those filters are set; replace the hard-coded `.order("sort_order_start", ...)` with `.order(sortBy, { ascending: sortDirection === "asc" })`. Preserve the existing `page`/`pageSize` clamping and `range()` logic.                                                           |           |      |
| TASK-003 | Add a count-returning variant: introduce `getTimelinesPage(client, filters): Promise<{ rows: TimelineRow[]; total: number }>` using Supabase `.select("*", { count: "exact" })` with the same filter chain, returning `{ rows: data ?? [], total: count ?? 0 }`. Keep `getTimelines` as a thin wrapper that returns only the rows so existing callers/tests are unaffected.                              |           |      |
| TASK-004 | Gate the root/sub partition behind #177: when `includeSubTimelines !== true`, apply the root-only predicate **only if** the `detail_timeline_id` mechanism exists; until #177 lands, document with a `// BLOCKED: #177 — detail_timeline_id column not present; root/sub partition is a no-op (all timelines treated as root)` comment and do not add a filter.                                          |           |      |
| TASK-005 | In `packages/ui/src/hooks/use-timelines.tsx`, add `useTimelinesPage(client, filters, options?)` wrapping `getTimelinesPage`, with a query key `timelineKeys.list(filters)` (filters already participate in the key). Keep `useTimelines` unchanged for existing consumers.                                                                                                                               |           |      |
| TASK-006 | Export the new symbols from the services and ui barrels as needed (`@repo/services/timeline-service.js`, `@repo/ui/hooks`) and regenerate types only if a DB change is introduced (none expected in this phase).                                                                                                                                                                                         |           |      |

### Implementation Phase 2 — URL-state model & page shell

- GOAL-002: Establish the client list component, its URL-encoded state, and the data query, with all four request states.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                 | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-007 | Create `apps/admin/app/(protected)/timelines/_components/timeline-list-client.tsx` (`"use client"`). Derive filter/sort/page state from `useSearchParams()` and write changes via `useRouter().replace(\`?\${params}\`, { scroll: false })`. Encode keys: `type`(csv),`vis`(csv),`pub`(csv),`q`(string),`sort` (`title\|updated_at\|created_at`), `dir` (`asc\|desc`), `page`(int, 1-based),`sub` (`1` when "Include sub-timelines" is on). |           |      |
| TASK-008 | Map URL state → `TimelineFilters` and call `useTimelinesPage(getBrowserClient(), filters)`. Translate `pub` csv (`published`/`draft`) to the boolean `published` filter only when exactly one value is selected (both selected or none → omit). Same OR-collapse rule for single-value `type`/`vis` filters that the service supports as scalar `.eq` (see TASK-013 for multi-value handling).                                              |           |      |
| TASK-009 | Replace the body of `apps/admin/app/(protected)/timelines/page.tsx`: keep it a server component that renders `<TimelineListClient />` inside a `<Suspense>` boundary (required because `useSearchParams` opts the subtree into client rendering). Remove the `PlaceholderPage` import.                                                                                                                                                      |           |      |
| TASK-010 | Implement the four states in the client: loading → `Skeleton` rows in the table body (filter rail renders immediately); error → inline error panel with a retry affordance bound to the query's `refetch`; empty (total 0, no filters) → full-panel empty state with a single **New timeline** CTA; filtered-to-zero → inline "No timelines match these filters." + Clear filters link.                                                     |           |      |

### Implementation Phase 3 — Table, filters, sorting, pagination wiring

- GOAL-003: Port the story's composition to the live component and connect every control to URL state and the query.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-011 | Define `ColumnDef<TimelineRow>[]` mirroring `timeline-list.stories.tsx`: title (two-line via `TemporalDisplay` for span + optional `· N events · M collaborators` rendered only when counts are present), `timeline_type` (capitalized label), `visibility` (icon+label cell, never icon-alone), published (`StatusBadge status={published ? "published" : "draft"}`), `updated_at` (relative/formatted). Source rows are real `TimelineRow`s — map `temporal_data`/`end_temporal_data` into the `TemporalDisplay` value props. |           |      |
| TASK-012 | Wire sorting: because `getTimelinesPage` sorts server-side, drive the `DataTable` header sort to update the `sort`/`dir` URL params (controlled), not the table's internal client-side `getSortedRowModel`. Limit sortable headers to `title`, `updated_at`, `created_at` per REQ-004. Render the active sort indicator from URL state.                                                                                                                                                                                         |           |      |
| TASK-013 | Build the `FilterRail` groups (`type`, `visibility`, `publication`, `scope`) exactly as the story. For multi-select groups the service's scalar `.eq` cannot express OR across >1 value — resolve by: (a) sending a single value when one option is checked, and (b) for multi-value selections, post-filter client-side on the current page OR (preferred) extend the service to accept arrays via `.in(...)`. Choose `.in(...)` extension and record the decision in this plan's §3.                                          |           |      |
| TASK-014 | Implement offset pagination controls below the table (Prev / page indicator / Next), computing total pages from `total / pageSize` (page size 20). Changing page updates the `page` URL param and never resets filters/sort (REQ-005). Disable Prev on page 1 and Next on the last page.                                                                                                                                                                                                                                        |           |      |
| TASK-015 | Wire row click → `useRouter().push()` to the timeline detail route (`/timelines/[slug]`, using the row's `slug`); ensure the row checkbox/select column (if present) does not trigger navigation.                                                                                                                                                                                                                                                                                                                               |           |      |
| TASK-016 | Add the "Include sub-timelines" toggle to the scope filter group bound to the `sub` URL param; until #177, surface it as present-but-no-op (tooltip or helper text noting nested timelines appear once #177 lands).                                                                                                                                                                                                                                                                                                             |           |      |
| TASK-017 | Render header counts ("N total · M shown") from `total` (unfiltered baseline may be approximated by the current query's `total` for the active filter set; if an unfiltered baseline is needed, issue a second lightweight `count`-only query — keep optional/deferred-tolerant).                                                                                                                                                                                                                                               |           |      |

### Implementation Phase 4 — Service array filters (supports TASK-013)

- GOAL-004: Allow OR-within-group multi-select for `visibility` and `timeline_type` at the SQL layer.

| Task     | Description                                                                                                                                                                                                                                                                                                                                        | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-018 | Extend `TimelineFilters` so `visibility` and `timelineType` accept `string \| string[]`; in `getTimelinesPage`/`getTimelines`, use `.in("visibility", values)` / `.in("timeline_type", values)` when an array is supplied and `.eq(...)` for a scalar. Maintain backward compatibility with the existing scalar `visibility` filter and its tests. |           |      |
| TASK-019 | Apply the same array handling to the `published` axis only if both `published` and `draft` are selected (which is equivalent to no filter) — short-circuit by omitting the predicate in that case.                                                                                                                                                 |           |      |

### Implementation Phase 5 — Validation

- GOAL-005: Prove correctness and satisfy the issue's verification checklist.

| Task     | Description                                                                                                                                                                                                                 | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-020 | Add/extend service unit tests in `packages/services` for `getTimelinesPage`: timeline_type filter, published filter, sort field + direction, `.in(...)` array filters, and `{ rows, total }` shape.                         |           |      |
| TASK-021 | Add/extend hook tests in `packages/ui/src/hooks/use-timelines.test.tsx` covering `useTimelinesPage` query-key participation and pass-through of new filters.                                                                |           |      |
| TASK-022 | Run `pnpm run format`, then `pnpm run check-types`, `pnpm run lint`, `pnpm run build`, `pnpm run test:coverage` — all must pass (≥80% coverage).                                                                            |           |      |
| TASK-023 | Manual verification: each filter produces the expected SQL-level subset; sort toggles change order; pagination preserves filters; URL/query state survives refresh; row click navigates; empty/loading/error states render. |           |      |

## 3. Alternatives

- **ALT-001**: Client-side filtering/sorting/pagination over a single fetched page — rejected: cannot honour "each filter produces expected SQL-level subset" or scale past one page; pagination would be inconsistent with server counts.
- **ALT-002**: Add `nuqs` for typed URL state — rejected: introduces a new dependency for straightforward state; native `useSearchParams`/`useRouter` is sufficient and matches existing conventions.
- **ALT-003**: Build a bespoke `TimelineList` component in `packages/ui` — rejected: the list is app-specific (routing, auth client, URL state); the reusable primitives (`DataTable`, `FilterRail`, `StatusBadge`) already live in `@repo/ui` and the story is the blueprint.
- **ALT-004**: Post-filter multi-select groups client-side instead of `.in(...)` (TASK-013) — rejected as the primary path because it breaks pagination/count accuracy; retained only as a fallback if the service extension is deferred.
- **ALT-005**: Denormalized event/collaborator count columns — out of scope (#42 leaves the count contract deferred); rows render without counts.

## 4. Dependencies

- **DEP-001**: `useTimelines` / `useTimelinesPage` (`packages/ui/src/hooks/use-timelines.tsx`) — extended in Phase 1.
- **DEP-002**: `getTimelines` / new `getTimelinesPage` (`packages/services/src/modules/timeline-service.ts`).
- **DEP-003**: UI primitives `DataTable`, `FilterRail`, `StatusBadge`, `TemporalDisplay`, `Button`, `Skeleton`, `Shell` (`@repo/ui`).
- **DEP-004**: `getBrowserClient()` (`apps/admin/lib/auth/browser-client.ts`) and the `(protected)` layout.
- **DEP-005**: Issues #28, #33, #37, #38 (foundational list/service work); #48 (publish badge/filter).
- **DEP-006 (soft)**: #177 — `detail_timeline_id` column for the root/sub partition; degrades to all-root until landed (CON-004, TASK-004/016).

## 5. Files

- **FILE-001**: `apps/admin/app/(protected)/timelines/page.tsx` — replace `PlaceholderPage` with a server component rendering the client list inside `<Suspense>`.
- **FILE-002**: `apps/admin/app/(protected)/timelines/_components/timeline-list-client.tsx` — new client component owning URL state, query, table, filters, pagination, and all four request states.
- **FILE-003**: `packages/services/src/modules/timeline-service.ts` — extend `TimelineFilters`; add `getTimelinesPage`; add array (`.in`) and `timeline_type`/`published`/`sort` handling.
- **FILE-004**: `packages/ui/src/hooks/use-timelines.tsx` — add `useTimelinesPage`.
- **FILE-005**: `packages/services/src/modules/__tests__/` (or co-located test) — service tests for the new filters/sort/count.
- **FILE-006**: `packages/ui/src/hooks/use-timelines.test.tsx` — hook tests for `useTimelinesPage`.
- **FILE-007**: `packages/ui/src/components/timeline-list.stories.tsx` — reference blueprint (no change expected; keep in sync if column markup is refined).

## 6. Testing

- **TEST-001**: `getTimelinesPage` returns `{ rows, total }` with `total` equal to the unranged filtered count.
- **TEST-002**: `timeline_type` filter restricts rows to the requested type(s) (scalar and `.in` array).
- **TEST-003**: `published` filter restricts to published/draft; selecting both omits the predicate.
- **TEST-004**: Sort by `title`/`updated_at`/`created_at` in both directions issues the correct `order`.
- **TEST-005**: `visibility` array filter uses `.in(...)`; scalar still uses `.eq(...)` (back-compat).
- **TEST-006**: `useTimelinesPage` includes all filters in its query key and passes them to the service.
- **TEST-007 (manual)**: URL state round-trips across refresh; pagination preserves filters/sort; row click navigates to `/timelines/[slug]`.
- **TEST-008 (manual)**: Loading (skeleton), error (retry), empty, and filtered-to-zero states each render.

## 7. Risks & Assumptions

- **RISK-001**: Multi-select OR within a group is not expressible via scalar `.eq`; mitigated by the `.in(...)` service extension (Phase 4). If deferred, fall back to ALT-004 with a documented pagination caveat.
- **RISK-002**: `useSearchParams` forces client rendering of the subtree; missing `<Suspense>` causes a build/runtime error — TASK-009 mandates the boundary.
- **RISK-003**: Event/collaborator counts have no wired contract; rows must render without them (CON-003) — columns treat counts as optional.
- **RISK-004**: Root/sub partition depends on #177; shipping the toggle as a no-op risks user confusion — mitigated with helper text (TASK-016).
- **ASSUMPTION-001**: `timelines` exposes `published`, `timeline_type`, `visibility`, `updated_at`, `created_at`, `slug`, `temporal_data`, `end_temporal_data` (confirmed via schema/types and `timelineSchema`).
- **ASSUMPTION-002**: The detail route is `/timelines/[slug]` (a `[slug]` segment already exists under the timelines route).
- **ASSUMPTION-003**: Extending `TimelineFilters` and adding `getTimelinesPage` does not require a DB migration or type regeneration.

## 8. Related Specifications / Further Reading

- Issue #42 — Build Timeline list page with filtering, sorting, and pagination
- [docs/design/admin/02-wireframes/11-timeline-list.md](../design/admin/02-wireframes/11-timeline-list.md)
- [docs/design/admin/02-wireframes/16-publish-workflow.md](../design/admin/02-wireframes/16-publish-workflow.md)
- [docs/design/admin/00-screen-inventory.md](../design/admin/00-screen-inventory.md) — "Milestone 5 additions"
- [packages/ui/src/components/timeline-list.stories.tsx](../../packages/ui/src/components/timeline-list.stories.tsx) — visual + composition blueprint
- [packages/services/src/modules/timeline-service.ts](../../packages/services/src/modules/timeline-service.ts) — service to extend
- [packages/ui/src/hooks/use-timelines.tsx](../../packages/ui/src/hooks/use-timelines.tsx) — hooks to extend
- ADR-0011 (publication model), ADR-0021 (TanStack Query + Zustand), ADR-0029 (public reader route scheme)
- Related: #48 (publish badge/filter), #177 (`detail_timeline_id` root/sub partition)
