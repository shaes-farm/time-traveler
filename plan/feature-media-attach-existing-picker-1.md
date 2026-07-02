---
goal: Attach-dialog Existing tab + editor media-section picker — reuse existing media via MediaPicker pick mode (#295)
version: 1.0
date_created: 2026-07-02
last_updated: 2026-07-02
owner: apps/admin (Time Traveler)
status: "Planned"
tags: [feature, frontend, admin, media]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Wire the **"choose from existing"** path so one `media` row can be reused across many entities instead of re-uploaded. Add an **Existing** tab to `AttachMediaDialog` (alongside Upload / External URL) that embeds `MediaPicker` in `pick` mode, and mount the same connected picker from the entity media sections. The picker returns `media_id`s; the **dialog/host** (not the picker) writes the correct junction (`event_media` / `character_media` / `timeline_media`) with its own ordering/primary rules and composite-PK dedup, so a re-attach is a silent **no-op**, not an error ([screen-17 annotation #9](../docs/design/admin/02-wireframes/17-media-library.md#annotations)).

This is the **consumer half** of [fidelity-2-plan § Batch I](../docs/design/admin/fidelity-2-plan.md#batch-i--media-library--picker) and the last open issue in epic #297. Every primitive it needs is already built and merged: the `MediaPicker` pick mode + library hooks (#292), the library query layer (#291), and the `AttachMediaDialog` + junction services (#49).

## What already exists (reuse — do not rebuild)

- **`MediaPicker` pick mode** — [`packages/ui/src/components/media-picker.tsx`](../packages/ui/src/components/media-picker.tsx). Pure primitive; `mode="pick"` renders multi-select checkboxes + an `Attach N items` footer and calls `onConfirm(mediaIds: string[])` / `onCancel()`. Owns its own selection set internally. Needs library query wiring (search/facets/pager) supplied by the consumer.
- **Library query wiring reference** — [`apps/admin/app/(protected)/_components/media/media-library.tsx`](<../apps/admin/app/(protected)/_components/media/media-library.tsx>) already wires `useMediaLibrary` + `useMediaFacetCounts` + debounced search + keyset cursor stack + facet reset for **browse** mode. The **Existing** tab needs the same wiring for **pick** mode.
- **`AttachMediaDialog`** — [`attach-media-dialog.tsx`](<../apps/admin/app/(protected)/_components/media/attach-media-dialog.tsx>). Two tabs (Upload / External URL), `variant: "attach" | "library"`, `onAttached(mediaId)` single-id callback. Add a **third** tab, gated to the `attach` variant.
- **`MediaSection`** — [`media-section.tsx`](<../apps/admin/app/(protected)/_components/media/media-section.tsx>). Renders the attached list + mounts `AttachMediaDialog` with `onAttached={onAttach}`. Used by **event detail** and **timeline detail** clients (ordering `"sort"`).
- **Junction add services + hooks** — `addMediaToEvent` / `addMediaToTimeline` / `addMediaToCharacter` (`packages/services/src/modules/*-service.ts`) and `useAddMediaToEvent` / `useAddMediaToTimeline` / `useAddMediaToCharacter`. **Currently use plain `.insert()`** — a duplicate composite PK throws `23505`, so they are **not yet idempotent**.

## 1. Requirements & Constraints

- **REQ-001**: `AttachMediaDialog` (attach variant) exposes three tabs: Upload / External URL / **Existing**.
- **REQ-002**: The Existing tab embeds `MediaPicker mode="pick"` with full faceted search + keyset pagination, and multi-select.
- **REQ-003**: On **Attach N items**, the **host** (not the picker) writes one junction per selected id into its own junction table with its own ordering (`sort_order` for events/timelines) / primary (`is_primary=false` for characters) rules.
- **REQ-004**: Re-attaching an already-attached row is a **no-op** ("already attached", not an error), realized via composite-PK dedup. The existing row's `sort_order`/`is_primary` MUST NOT be clobbered.
- **REQ-005**: On Attach, revalidate selected ids against the live `media` table; drop any id that vanished (deleted while the picker was open), attach the survivors, and surface a non-blocking notice naming the drop count.
- **REQ-006**: Entity media sections can attach from existing media (event detail + timeline detail wired now; character editor deferred — see CON-002).
- **REQ-007**: The Existing tab MUST NOT appear in the `library` variant (upload-to-orphan has no attach step — [annotation #11](../docs/design/admin/02-wireframes/17-media-library.md#annotations)).
- **SEC-001**: External-URL validation semantics in the dialog are unchanged; the Existing path only references pre-existing `media` rows already subject to RLS (`authenticated` writes junctions; `anon` never reaches this dialog).
- **CON-001**: Strict TypeScript (`strictNullChecks`, `noUncheckedIndexedAccess`), ESM only, zero-warnings lint. `pnpm run check-types`, `lint`, `build`, and `test:coverage` (80% threshold) must pass.
- **CON-002**: The character editor/detail is a **placeholder** ([`characters/[slug]/edit/page.tsx`](<../apps/admin/app/(protected)/characters/[slug]/edit/page.tsx>) renders `PlaceholderPage`) — no character host mounts `MediaSection` yet. Character attach-from-existing is therefore **wired at the `MediaSection`/service layer** (so it works the moment a character host lands) but **cannot be mounted end-to-end** in this issue.
- **GUD-001**: Keep primitives pure — all library query wiring lives in `apps/admin` connected wrappers, never in `packages/ui`.
- **PAT-001**: Follow the browse-mode wiring in `media-library.tsx` (debounced search, `cursorStack`, `filterKey` reset-during-render) verbatim for the pick wrapper.
- **PAT-002**: Follow the existing host handler pattern (`handleAttachMedia` computes `sort_order` from `mediaItems.length`, then `refreshMedia()`), extended to a batch that increments per item.

## 2. Implementation Steps

### Implementation Phase 1 — Idempotent junction writes + stale-id revalidation (service layer)

- GOAL-001: Make junction `add` writes dedup-tolerant and add a helper to filter selected ids down to those that still exist, so a re-attach is a no-op and a mid-session delete cannot orphan a junction write.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | In [`packages/services/src/modules/event-service.ts`](../packages/services/src/modules/event-service.ts) `addMediaToEvent`, change `.insert(...).select().single()` → `.upsert({ event_id, media_id, sort_order }, { onConflict: "event_id,media_id", ignoreDuplicates: true }).select().maybeSingle()`. Return type becomes `EventMediaRow \| null` (null = row already existed, dedup no-op). Update the JSDoc to state re-attach is idempotent and does NOT overwrite the existing `sort_order`. |           |      |
| TASK-002 | Same change in [`timeline-service.ts`](../packages/services/src/modules/timeline-service.ts) `addMediaToTimeline` (`onConflict: "timeline_id,media_id"`) and [`character-service.ts`](../packages/services/src/modules/character-service.ts) `addMediaToCharacter` (`onConflict: "character_id,media_id"`, do not clobber `is_primary`). Both return `<Row> \| null`.                                                                                                                               |           |      |
| TASK-003 | Add `getExistingMediaIds(client, ids: string[]): Promise<Set<string>>` to [`media-service.ts`](../packages/services/src/modules/media-service.ts): `if (ids.length === 0) return new Set();` else `select("id").in("id", ids)`, `assertNoError`, return `new Set(data.map((r) => r.id))`. Used by the dialog to drop vanished ids (REQ-005).                                                                                                                                                        |           |      |
| TASK-004 | Update the three `useAddMediaTo*` hooks (`use-events.tsx`, `use-timelines.tsx`, `use-characters.tsx`) only if their generics assume a non-null return; the mutation body is unchanged (still calls the service). No signature change to callers.                                                                                                                                                                                                                                                    |           |      |
| TASK-005 | Add a `useExistingMediaIds`-free path: expose `getExistingMediaIds` for direct call from the dialog handler (no hook needed — it is a one-shot on Attach, not a cached query). Confirm it is re-exported via `@repo/services/media-service`.                                                                                                                                                                                                                                                        |           |      |

### Implementation Phase 2 — Connected pick-mode picker wrapper (apps/admin)

- GOAL-002: Extract a reusable connected `MediaPicker mode="pick"` wrapper that owns the library query wiring, so both the Existing tab and (future) editor sections mount identical behavior and can never diverge.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-006 | Create [`apps/admin/app/(protected)/_components/media/existing-media-picker.tsx`](<../apps/admin/app/(protected)/_components/media/existing-media-picker.tsx>) (`"use client"`). Props: `{ client: ServiceClient; onConfirm: (mediaIds: string[]) => void \| Promise<void>; onCancel: () => void; busy?: boolean }`.                                                                                                                                                                                                                     |           |      |
| TASK-007 | Port the browse wiring from `media-library.tsx` (debounced search via `useDebouncedValue`, `facets` state, `EMPTY_FACETS`/`EMPTY_COUNTS`, `cursorStack`, `handleNext`/`handlePrev`, `filterKey` reset-during-render, `useMediaLibrary` + `useMediaFacetCounts`) into the wrapper. Render `<MediaPicker mode="pick" ... onConfirm={onConfirm} onCancel={onCancel} />`. Do NOT include `bulkSelectable`/delete/drawer/upload props (browse-only).                                                                                          |           |      |
| TASK-008 | Refactor `media-library.tsx` and the new wrapper to share the browse wiring via a small `useMediaLibraryBrowser(client, initialFacets?)` hook in a sibling file (`use-media-library-browser.ts`) returning `{ items, facetCounts, search, setSearch, facets, setFacets, clearFilters, pager, isPending, isError, refetch }`. Both `MediaLibrary` (browse) and `ExistingMediaPicker` (pick) consume it. (If the extraction risks regressing #294, keep the wrapper self-contained and leave `media-library.tsx` untouched — see ALT-002.) |           |      |
| TASK-009 | Constrain the picker to a bounded, scrollable height suitable for a dialog body (e.g. wrap in a `max-h-[60vh] min-h-0 overflow-hidden` container) so the sticky pick footer stays visible.                                                                                                                                                                                                                                                                                                                                               |           |      |

### Implementation Phase 3 — Existing tab in AttachMediaDialog

- GOAL-003: Add the third tab and the multi-attach + revalidation handler; keep Upload/External untouched.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-010 | In `attach-media-dialog.tsx`, add optional prop `onAttachExisting?: (mediaIds: string[]) => Promise<void> \| void` to `AttachMediaDialogProps`. The Existing tab renders only when `variant === "attach" && onAttachExisting` is provided.                                                                                                                                                                                                                                                                  |           |      |
| TASK-011 | Widen `TabsList` to `grid-cols-3` **only** when the Existing tab is shown (keep `grid-cols-2` otherwise). Add a `<TabsTrigger value="existing">` with a library/images icon (`ImageIcon` or `Library` from lucide-react) and label "Existing".                                                                                                                                                                                                                                                              |           |      |
| TASK-012 | Add `<TabsContent value="existing">` rendering `<ExistingMediaPicker client={client} onConfirm={handleAttachExisting} onCancel={() => handleOpenChange(false)} busy={busy} />`.                                                                                                                                                                                                                                                                                                                             |           |      |
| TASK-013 | Implement `handleAttachExisting(ids)`: (1) `const alive = await getExistingMediaIds(client, ids);` (2) `const survivors = ids.filter((id) => alive.has(id));` (3) if `survivors.length < ids.length`, `toast(`{dropped} item(s) were removed and could not be attached`)` (info/warning, not error); (4) if `survivors.length === 0`, return without closing; (5) `await onAttachExisting(survivors);` (6) `toast.success(...)`; (7) `handleOpenChange(false)`. Wrap in try/catch mirroring `handleUpload`. |           |      |
| TASK-014 | Extend `VARIANT_COPY.attach` with `existingSuccess: "Media attached"` (library variant needs no key — tab hidden there).                                                                                                                                                                                                                                                                                                                                                                                    |           |      |

### Implementation Phase 4 — MediaSection pass-through + host wiring

- GOAL-004: Surface the Existing tab from the entity media sections and implement the per-host batch junction writer.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-015 | In `media-section.tsx`, add optional prop `onAttachExisting?: (mediaIds: string[]) => Promise<void> \| void` and forward it to `<AttachMediaDialog onAttachExisting={onAttachExisting} />`. No behavior change when omitted.                                                                                                                                                                                                                                  |           |      |
| TASK-016 | In [`event-detail-client.tsx`](<../apps/admin/app/(protected)/events/[slug]/_components/event-detail-client.tsx>), add `handleAttachExistingMedia(ids)`: for each `id` at index `i`, `await addMedia.mutateAsync({ eventId, mediaId: id, sortOrder: mediaItems.length + i })`; then `await refreshMedia()`. Pass to `<MediaSection onAttachExisting={handleAttachExistingMedia} />`. Sequential or `Promise.all` — dedup no-op means a duplicate is harmless. |           |      |
| TASK-017 | In [`timeline-detail-client.tsx`](<../apps/admin/app/(protected)/timelines/[slug]/_components/timeline-detail-client.tsx>), mirror TASK-016 with `addMedia.mutateAsync({ timelineId, mediaId, sortOrder: mediaItems.length + i })` and pass `onAttachExisting` to its `<MediaSection>`.                                                                                                                                                                       |           |      |
| TASK-018 | Character host: no mount point exists (CON-002). Add a `// BLOCKED: character editor is a placeholder (#56/#57); attach-from-existing is wired at MediaSection + addMediaToCharacter and will light up when a character host mounts MediaSection with ordering="primary".` note near the character `MediaSection` contract in `media-section.tsx`. Do not fabricate a character host.                                                                         |           |      |

### Implementation Phase 5 — Tests + validation

- GOAL-005: Cover junction dispatch, dedup no-op, and stale-id revalidation; keep coverage ≥ 80%.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                     | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-019 | Service tests: `media-service.test.ts` for `getExistingMediaIds` (empty input → empty set, filters to live ids). `event-service` / `timeline-service` / `character-service` tests for the upsert-with-`ignoreDuplicates` path returning `null` on conflict and not overwriting existing order/primary.                                                                                          |           |      |
| TASK-020 | `attach-media-dialog.test.tsx`: Existing tab present in `attach` variant + `onAttachExisting` provided; absent in `library` variant. Mock `ExistingMediaPicker` (or `getExistingMediaIds` via `@repo/services/media-service`) to drive `onConfirm`. Assert `onAttachExisting` called with survivor ids; stale-id case drops vanished ids + shows notice; empty-survivor case keeps dialog open. |           |      |
| TASK-021 | `media-section.test.tsx`: `onAttachExisting` forwarded to the dialog; omission is safe (tab hidden / no crash).                                                                                                                                                                                                                                                                                 |           |      |
| TASK-022 | New `existing-media-picker.test.tsx` (+ `use-media-library-browser` test if extracted): search debounce, facet change resets cursor, `onConfirm` receives the picker's selected ids, `onCancel` fires.                                                                                                                                                                                          |           |      |
| TASK-023 | Run in order: `pnpm run format` → `pnpm run check-types` → `pnpm run lint` → `pnpm run test:coverage` → `pnpm run build`. All must pass.                                                                                                                                                                                                                                                        |           |      |

## 3. Alternatives

- **ALT-001** (dedup): Catch PostgREST `23505` in each host handler and swallow it as "already attached", leaving `.insert()` untouched. **Rejected** — scatters conflict handling across every call site and is brittle to error-shape changes; `upsert … ignoreDuplicates` centralizes dedup in the service (matches REQ-004 "via composite-PK dedup") and also hardens existing single-attach callers.
- **ALT-002** (wrapper extraction): Do **not** extract `useMediaLibraryBrowser`; copy the browse wiring into `ExistingMediaPicker` and leave `media-library.tsx` as-is. Acceptable fallback if the shared-hook refactor threatens to regress #294; costs ~130 duplicated lines and a divergence risk (GUD-001 discourages, but self-containment is safe).
- **ALT-003** (multi-attach API): Loop the existing single `onAttached(mediaId)` inside the dialog instead of adding `onAttachExisting`. **Rejected** — host handlers capture `mediaItems.length` in a `useCallback` dep and don't update mid-loop, so every looped attach would collide on the same `sort_order`. A dedicated batch handler computes `length + i` correctly.
- **ALT-004** (revalidation): Skip stale-id revalidation and rely on the FK to reject a vanished id. **Rejected** — REQ-005 requires a user-facing notice and graceful survivor-attach, not a raw FK error toast.

## 4. Dependencies

- **DEP-001**: #292 — `MediaPicker` pick mode + library hooks (`useMediaLibrary`, `useMediaFacetCounts`). **Merged.**
- **DEP-002**: #291 — media-service library query layer (`getMediaLibraryPage`, `getMediaFacetCounts`). **Merged.**
- **DEP-003**: #49 — `AttachMediaDialog` + `addMediaTo*` junction services/hooks. **Merged.**
- **DEP-004**: #294 — Media Library route (source of the browse-mode wiring reference; touched only if TASK-008 shares the hook). **Merged.**
- **DEP-005**: (soft) character host / editor (#56, #57) — required only to mount the character attach-from-existing path end-to-end; not a blocker for this issue's service + `MediaSection` wiring (CON-002).

## 5. Files

- **FILE-001**: `packages/services/src/modules/event-service.ts` — `addMediaToEvent` → idempotent upsert (TASK-001).
- **FILE-002**: `packages/services/src/modules/timeline-service.ts` — `addMediaToTimeline` → idempotent upsert (TASK-002).
- **FILE-003**: `packages/services/src/modules/character-service.ts` — `addMediaToCharacter` → idempotent upsert (TASK-002).
- **FILE-004**: `packages/services/src/modules/media-service.ts` — add `getExistingMediaIds` (TASK-003, TASK-005).
- **FILE-005**: `apps/admin/app/(protected)/_components/media/existing-media-picker.tsx` — **new** connected pick wrapper (TASK-006/007/009).
- **FILE-006**: `apps/admin/app/(protected)/_components/media/use-media-library-browser.ts` — **new** shared browse-wiring hook (TASK-008; optional per ALT-002).
- **FILE-007**: `apps/admin/app/(protected)/_components/media/media-library.tsx` — consume shared hook (TASK-008; only if extracted).
- **FILE-008**: `apps/admin/app/(protected)/_components/media/attach-media-dialog.tsx` — third tab + `handleAttachExisting` + `onAttachExisting` prop (TASK-010–014).
- **FILE-009**: `apps/admin/app/(protected)/_components/media/media-section.tsx` — forward `onAttachExisting` + character-host BLOCKED note (TASK-015, TASK-018).
- **FILE-010**: `apps/admin/app/(protected)/events/[slug]/_components/event-detail-client.tsx` — `handleAttachExistingMedia` + wire (TASK-016).
- **FILE-011**: `apps/admin/app/(protected)/timelines/[slug]/_components/timeline-detail-client.tsx` — `handleAttachExistingMedia` + wire (TASK-017).
- **FILE-012**: Test files: `attach-media-dialog.test.tsx`, `media-section.test.tsx`, new `existing-media-picker.test.tsx`, and `*-service.test.ts` (TASK-019–022).

## 6. Testing

- **TEST-001**: `getExistingMediaIds` — empty input returns empty set; filters a mixed input down to only live ids.
- **TEST-002**: `addMediaToEvent/Timeline/Character` — re-adding an existing pair resolves without throwing, returns `null`, and does not overwrite existing `sort_order`/`is_primary`.
- **TEST-003**: Dialog — Existing tab renders in `attach` variant with `onAttachExisting`; hidden in `library` variant and when `onAttachExisting` is omitted.
- **TEST-004**: Dialog — confirming a pick selection calls `onAttachExisting` with exactly the selected ids and closes on success.
- **TEST-005**: Dialog — when some selected ids no longer exist, only survivors are passed to `onAttachExisting` and a drop notice is shown; when none survive, the dialog stays open and `onAttachExisting` is not called.
- **TEST-006**: `MediaSection` — `onAttachExisting` is forwarded to `AttachMediaDialog`; omission does not crash.
- **TEST-007**: `ExistingMediaPicker` — search debounce feeds the query; a facet change resets the cursor stack; `onConfirm`/`onCancel` propagate.
- **TEST-008**: Host handler (event/timeline) assigns `sort_order = base + i` across a multi-id attach (unit-level on the handler if extractable, else covered by the service dedup test + manual verification).

## 7. Risks & Assumptions

- **RISK-001**: `.upsert(..., { ignoreDuplicates: true }).select().maybeSingle()` returns `null` on conflict; any caller that dereferences the returned row unconditionally will break. **Mitigation** — audit the three `useAddMediaTo*` call sites (they use the result only for cache invalidation) and the pgTAP/unit expectations before merge.
- **RISK-002**: Extracting `useMediaLibraryBrowser` (TASK-008) could regress the shipped #294 route. **Mitigation** — cover both consumers with the existing `media-library.test.tsx` + new picker test; fall back to ALT-002 (no extraction) if risk is non-trivial.
- **RISK-003**: `onConflict` column lists must exactly match each junction's composite PK (`event_id,media_id`, `timeline_id,media_id`, `character_id,media_id`). A wrong list silently disables dedup. **Mitigation** — TEST-002 asserts the no-op path.
- **ASSUMPTION-001**: The three junctions' composite PK is `(entity_id, media_id)` with no surrogate key (per `00002_relationships_junctions.sql` and CLAUDE.md junction convention) — confirm before writing `onConflict`.
- **ASSUMPTION-002**: `MediaPicker mode="pick"` selection state and `onConfirm` semantics are stable and need no change; only consumer wiring is added.
- **ASSUMPTION-003**: apps/admin Vitest runner (`apps/admin/vitest.config.ts`) executes these `.test.tsx` files in CI (confirmed present alongside `attach-media-dialog.test.tsx`).
- **ASSUMPTION-004**: Character attach-from-existing is out of end-to-end scope this issue (CON-002); the epic accepts it lighting up when a character host lands.

## 8. Related Specifications / Further Reading

- [Issue #295](https://github.com/shaes-farm/time-traveler/issues/295) — this feature
- [Epic #297 — Media Library & Picker](https://github.com/shaes-farm/time-traveler/issues/297)
- [screen 17 — Media library / picker wireframe (annotation #9)](../docs/design/admin/02-wireframes/17-media-library.md#annotations)
- [screen 15 — Media management / Attach dialog](../docs/design/admin/02-wireframes/15-media-management.md)
- [fidelity-2-plan § Batch I](../docs/design/admin/fidelity-2-plan.md#batch-i--media-library--picker)
- [character editor wireframe (05)](../docs/design/admin/02-wireframes/05-character-editor.md) · [event editor wireframe (09)](../docs/design/admin/02-wireframes/09-event-editor.md)
- Sibling plans: [#294 route](feature-media-library-route-1.md), [#293 detail drawer](feature-media-detail-drawer-1.md), [#291 query layer](feature-media-library-query-layer-1.md)
