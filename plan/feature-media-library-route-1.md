# Implementation Plan — Media Library route (#294)

> Realizes [fidelity-2-plan § Batch I](../docs/design/admin/fidelity-2-plan.md#batch-i--media-library--picker) and [screen 17 "Where it lives" / "Layout — Library browser"](../docs/design/admin/02-wireframes/17-media-library.md). The consuming route that mounts the three primitives built in #291 (query layer, merged), #292 (`MediaPicker`, merged), and #293 (`MediaDetailDrawer`, merged). Replaces the Batch B placeholder at [`(protected)/media/page.tsx`](<../apps/admin/app/(protected)/media/page.tsx>).

## Objective

Ship `/media` as a top-level admin destination: mount `MediaPicker mode="browse"` + `MediaDetailDrawer`, wire the cursor pager, add the two upload entry points (upload-to-orphan), and add orphan multi-select bulk delete. Everything below the page is already built — this issue is **the connected wrapper plus two small additive extensions** to existing primitives.

1. `/media` renders the faceted, paginated, searchable library grid (`MediaPicker` in browse mode).
2. Selecting a card opens `MediaDetailDrawer` in place (no navigation).
3. `[ + Upload ]` / `[ + External URL ]` reuse `AttachMediaDialog`'s tabs **minus** the attach step — create a `media` row with **no** junction → lands in **Orphaned** ([annotation #11](../docs/design/admin/02-wireframes/17-media-library.md#annotations)).
4. Filtering to **Orphaned** enables multi-select **Delete selected** (library-only, no per-item confirm — orphans are `⛓ 0`) ([edge cases](../docs/design/admin/02-wireframes/17-media-library.md#edge-cases)).
5. Loading / empty / empty-after-filter / error states.

## What already exists (reuse — do not rebuild)

| Need                                          | Existing API                                                     | Location                                                                                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library grid + filter rail + search + pager   | `MediaPicker` (`mode="browse"`)                                  | [media-picker.tsx](../packages/ui/src/components/media-picker.tsx)                                                                                        |
| Detail drawer (edit / attach map / delete)    | `MediaDetailDrawer`                                              | [media-detail-drawer.tsx](../packages/ui/src/components/media-detail-drawer.tsx)                                                                          |
| One keyset page `{rows, nextCursor, hasMore}` | `useMediaLibrary(client, filters)`                               | [use-media.tsx:133](../packages/ui/src/hooks/use-media.tsx#L133)                                                                                          |
| Per-option facet counts                       | `useMediaFacetCounts(client, filters)`                           | [use-media.tsx:150](../packages/ui/src/hooks/use-media.tsx#L150)                                                                                          |
| Upload file → `media` row                     | `useUploadMedia` (via `AttachMediaDialog`)                       | [use-media.tsx:209](../packages/ui/src/hooks/use-media.tsx#L209)                                                                                          |
| Register external URL → `media` row           | `useCreateExternalMedia` (via `AttachMediaDialog`)               | [use-media.tsx:220](../packages/ui/src/hooks/use-media.tsx#L220)                                                                                          |
| Upload/External tabs UI                       | `AttachMediaDialog`                                              | [attach-media-dialog.tsx](<../apps/admin/app/(protected)/_components/media/attach-media-dialog.tsx>)                                                      |
| Delete row + Storage object (upload)          | `useDeleteMedia(client)` → `id`                                  | [use-media.tsx:257](../packages/ui/src/hooks/use-media.tsx#L257)                                                                                          |
| Browser Supabase client (memoised)            | `getBrowserSupabaseClient()`                                     | [lib/auth/browser-client.ts](../apps/admin/lib/auth/browser-client.ts)                                                                                    |
| Filter selection / facet count types          | `MediaFacetSelection`, `MediaLibraryFilters`, `MediaFacetCounts` | [media-filter-rail.tsx:13](../packages/ui/src/components/media-filter-rail.tsx#L13), [schemas/media.ts:76](../packages/services/src/schemas/media.ts#L76) |

The grid, facets, search, view toggle, card rendering, empty/error/loading states, the drawer, and the upload/external mutations are **all done**. The drawer is only ever mounted in browse and already invalidates `mediaKeys.all` on edit/detach/delete.

## Gotchas / decisions (the real work)

1. **Orphan bulk select is NOT in the primitive yet — the main extension.** `MediaCard` renders the selection checkbox **only** in `mode="pick"`; browse cards just call `onOpen` ([media-card.tsx:95](../packages/ui/src/components/media-card.tsx#L95)). `MediaPicker` keeps a `selectedIds` set but surfaces it only via the pick-mode footer. So "Delete selected" in browse mode has no UI today. → **Additively extend `MediaPicker`** with an optional browse-mode bulk-select layer, gated by the consumer:
   - New optional props: `bulkSelectable?: boolean`, `selectedIds?: ReadonlySet<string>`, `onSelectedChange?: (ids: Set<string>) => void`, `onDeleteSelected?: () => void`.
   - When `mode === "browse" && bulkSelectable`, render the pick-mode checkbox affordance on cards (reuse the existing `MediaGrid`/`MediaCard` `selectedIds`/`onSelect` path — it is already mode-agnostic at the grid level; only `MediaCard`'s checkbox is gated on `mode === "pick"`) and a slim action bar: `{n} selected · [ Delete selected ]`. Cards still open the drawer on the card body — selection is a corner checkbox, not a whole-card toggle, to preserve `onOpen`.
   - The **page** sets `bulkSelectable` only when the active `attachedTo` facet is exactly `["orphaned"]` (matches the edge-case spec: bulk delete is offered _when filtered to Orphaned_, library mode only). Lift `selectedIds` to the page so it can clear on filter/page change.
   - Keep it additive: when the new props are absent, browse mode behaves exactly as today (pick mode untouched). Small, reversible, no ADR.
   - **Alternative considered & rejected:** a page-level selection layer wrapping the grid duplicates card/grid rendering and breaks the "build once, mount four times" rule (annotation #1). Extend the primitive instead.

2. **Upload-to-orphan invalidation gap.** `useUploadMedia` / `useCreateExternalMedia` invalidate only `mediaKeys.lists()` ([use-media.tsx:213,225](../packages/ui/src/hooks/use-media.tsx#L213)) — but the library grid + facets hang off `mediaKeys.library` / `mediaKeys.facets` under `mediaKeys.all`, **not** `lists()`. A library upload would not refresh the grid or the **Orphaned** count. → The page's `onAttached` callback (see #3) invalidates `mediaKeys.all` after creation. Do it at the page, not by widening the hooks, so the entity-attach surfaces (#49 `MediaSection`) keep their narrower invalidation.

3. **`AttachMediaDialog` "minus the attach-to-entity step."** The dialog always calls `onAttached(mediaId)` and toasts _"Media uploaded and attached"_ / _"External media attached"_ ([attach-media-dialog.tsx:148,186](<../apps/admin/app/(protected)/_components/media/attach-media-dialog.tsx#L148>)). For the library, there is **no junction** and the "attached" copy is wrong. Two clean paths — **recommend (a):**
   - **(a) Minimal additive prop.** Add an optional `successLabel?: { upload: string; external: string }` (or a single `variant?: "attach" | "library"`) to `AttachMediaDialog`; in library variant the success toast reads _"Uploaded to library"_ / _"External media added"_ and the dialog title/CTA drop "attach". `onAttached` stays the post-create hook; the page passes an `onAttached` that **only** invalidates `mediaKeys.all` (no junction write) → the row is orphaned by construction. This keeps one dialog, one code path.
   - **(b)** Build a thin library-upload dialog in `apps/admin` from the same hooks. Rejected — duplicates the file-size/URL-validation/cleanup logic the dialog already has.

4. **Keyset pager needs a cursor stack.** `useMediaLibrary` is forward-only (`nextCursor`). `MediaPager` is prev/next ([media-grid.tsx:16](../packages/ui/src/components/media-grid.tsx#L16)). The page keeps `cursorStack: (string | undefined)[]` (current page's cursor on top). `onNext` pushes `nextCursor`; `onPrev` pops. `hasNext = page.hasMore`; `hasPrev = stack.length > 0`. **Any change to search/facets/view resets the stack to `[undefined]`** and clears `selectedIds` — otherwise a stale cursor points into a different result set.

5. **Drawer wants the full row, not just an id.** `MediaPicker.onOpen` yields an `id` ([media-picker.tsx:68](../packages/ui/src/components/media-picker.tsx#L68)); `MediaDetailDrawer` takes `media: MediaLibraryRow | null` ([media-detail-drawer.tsx:54](../packages/ui/src/components/media-detail-drawer.tsx#L54)). The page maps `id → row` from the **current page's `rows`** (no refetch — same intent as #293's "passed straight from the grid"). `onOpen(id) ⇒ setSelected(rows.find(r => r.id === id) ?? null)`.

6. **Bulk delete = loop the existing delete + one invalidation.** No bulk service exists (only `getOrphanMediaIds`, [media-service.ts:942](../packages/services/src/modules/media-service.ts#L942), which we don't need — the **Orphaned** facet already returns only `⛓ 0` rows). Add a small **`useDeleteMediaBulk(client)`** hook in `use-media.tsx`: `mutationFn` does `await Promise.all(ids.map(id => deleteMedia(client, id)))`, `onSuccess` invalidates `mediaKeys.all` **once**. `deleteMedia` already handles upload (Storage object) vs external per row. No per-item confirm (orphans → no blast radius); a single lightweight "Delete N items?" guard is optional and matches the no-friction intent.

7. **Page is a client component.** It owns all interaction state (search, facets, view, cursor stack, drawer selection, bulk selection, dialog open flags) and gets the client from `getBrowserSupabaseClient()`. The route file is thin; logic lives in a co-located `_components/media-library.tsx` client component so the `page.tsx` default export stays a server component shell (matches the app's route conventions). **Verify the left-nav already links `/media`** — it does (the placeholder route exists); no nav change expected.

8. **Optional: dashboard deep-link hydration.** Screen 17 "Where it lives" notes `get_user_recent_counts` (00015) can deep-link here. Cheap win: read `attachedTo` / `mediaTypes` from `searchParams` to pre-select facets (e.g. dashboard "4 orphaned ⚠" → `/media?attachedTo=orphaned`). Mark `// DECISION NEEDED` if the dashboard link target isn't finalized; the core ACs don't require it.

## Files to create / change

**New**

- `apps/admin/app/(protected)/_components/media/media-library.tsx` — the connected client component (state, hooks, pager, dialogs, bulk delete). The real work of this issue.
- `apps/admin/app/(protected)/_components/media/media-library.test.tsx` — Vitest (mock the hooks, follow existing `apps/admin` + `media-*.test.tsx` patterns).

**Changed**

- `apps/admin/app/(protected)/media/page.tsx` — replace `PlaceholderPage` with the `MediaLibrary` mount (+ optional `searchParams` facet hydration).
- `packages/ui/src/components/media-picker.tsx` — add optional browse-mode bulk-select props + slim "Delete selected" action bar (decision #1).
- `packages/ui/src/components/media-card.tsx` — allow the selection checkbox in browse mode when bulk-select is on (currently `mode === "pick"` only); keep card body → `onOpen`.
- `packages/ui/src/components/media-picker.test.tsx` — cover browse-mode bulk-select rendering + `onDeleteSelected`.
- `packages/ui/src/hooks/use-media.tsx` — add `useDeleteMediaBulk` (decision #6).
- `apps/admin/app/(protected)/_components/media/attach-media-dialog.tsx` — additive `variant`/`successLabel` prop + library copy (decision #3a); update `attach-media-dialog.test.tsx`.
- `packages/ui/src/components/media-picker.stories.tsx` — add a `Pages > Media Library` story (orphan-filter bulk-select state) if not already covered.

## Component shape

```tsx
// _components/media/media-library.tsx
"use client";
function MediaLibrary({
  initialFacets,
}: {
  initialFacets?: MediaFacetSelection;
}) {
  const client = getBrowserSupabaseClient();
  const [search, setSearch] = useState(""); // debounced into filters
  const [facets, setFacets] = useState<MediaFacetSelection>(
    initialFacets ?? EMPTY,
  );
  const [view, setView] = useState<MediaView>("grid");
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([
    undefined,
  ]);
  const [selected, setSelected] = useState<MediaLibraryRow | null>(null); // drawer
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set()); // orphan cleanup
  const [uploadKind, setUploadKind] = useState<null | "upload" | "external">(
    null,
  );

  const filters: MediaLibraryFilters = {
    search,
    ...toFilterArrays(facets),
    cursor: cursorStack.at(-1),
  };
  const page = useMediaLibrary(client, filters);
  const counts = useMediaFacetCounts(client, {
    search,
    ...toFilterArrays(facets),
  }); // no cursor
  const bulkDelete = useDeleteMediaBulk(client);

  const orphanOnly =
    facets.attachedTo.length === 1 && facets.attachedTo[0] === "orphaned";
  // changing search/facets/view → reset cursorStack to [undefined] + clear bulkIds (effect)

  return (
    <>
      <MediaPicker
        mode="browse"
        items={page.data?.rows ?? []}
        facetCounts={counts.data ?? EMPTY_COUNTS}
        search={search}
        onSearchChange={setSearch}
        facets={facets}
        onFacetsChange={setFacets}
        onClearFilters={() => setFacets(EMPTY)}
        view={view}
        onViewChange={setView}
        pager={{
          hasPrev: cursorStack.length > 1,
          hasNext: !!page.data?.hasMore,
          onPrev: popCursor,
          onNext: () => pushCursor(page.data?.nextCursor),
        }}
        isPending={page.isPending}
        isError={page.isError}
        onRetry={page.refetch}
        onOpen={(id) =>
          setSelected(page.data?.rows.find((r) => r.id === id) ?? null)
        }
        onUpload={() => setUploadKind("upload")}
        onAddExternal={() => setUploadKind("external")}
        bulkSelectable={orphanOnly}
        selectedIds={bulkIds}
        onSelectedChange={setBulkIds}
        onDeleteSelected={() =>
          bulkDelete.mutate([...bulkIds], {
            onSuccess: () => setBulkIds(new Set()),
          })
        }
      />
      <MediaDetailDrawer
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        client={client}
        media={selected}
        onDeleted={() => setSelected(null)}
      />
      <AttachMediaDialog
        open={uploadKind !== null}
        onOpenChange={(o) => !o && setUploadKind(null)}
        client={client}
        variant="library"
        defaultTab={uploadKind ?? "upload"} // open on the chosen tab
        onAttached={async () => {
          await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
        }}
      />
    </>
  );
}
```

> `AttachMediaDialog` currently hard-codes `defaultValue="upload"` on its `Tabs`. The two entry points (Upload vs External URL) should open the matching tab → add an optional `defaultTab` prop (small, additive) or mount with a `key` that forces the tab. Note in the PR.

## States (acceptance list)

- **Loading** — `isPending` → grid skeleton (already in `MediaPicker`).
- **Empty (no media)** — `items.length === 0 && !filtersActive` → "No media yet" + Upload / External CTAs (already in `MediaPicker` browse `EmptyState`); CTAs wired to `onUpload`/`onAddExternal`.
- **Empty after filter** — `filtersActive` → "No media match these filters" + Clear (already in `MediaPicker`).
- **Error** — `isError` → alert + Retry (already in `MediaPicker`; `onRetry → page.refetch`).
- **Orphan bulk** — `orphanOnly` → checkboxes + "Delete selected" bar; after delete, list + Orphaned count refresh via `mediaKeys.all` invalidation, selection clears.

## Tests (Vitest — the acceptance list)

`media-library.test.tsx` (mock the hooks + a fake client; QueryClient wrapper):

- **Renders grid** from `useMediaLibrary` rows; facet counts from `useMediaFacetCounts`.
- **Card open** — `onOpen(id)` opens the drawer with the matching row (drawer visible, no route change).
- **Upload-to-orphan** — opening `[ + Upload ]` mounts `AttachMediaDialog` (`variant="library"`, upload tab); on `onAttached` the page invalidates `mediaKeys.all` and writes **no** junction (assert no `addMediaTo*` call).
- **External entry** — `[ + External URL ]` opens the dialog on the external tab.
- **Pager** — `onNext` advances the cursor (filters carry `cursor=nextCursor`); `onPrev` pops; changing a facet resets the stack (next query has `cursor: undefined`).
- **Orphan bulk** — with `attachedTo:["orphaned"]`, checkboxes render; selecting N + "Delete selected" calls `useDeleteMediaBulk` with those ids and clears selection; **not** offered for any other facet.

`media-picker.test.tsx` (extend): browse + `bulkSelectable` renders checkboxes + the action bar; `onDeleteSelected` fires; absent props ⇒ unchanged browse behavior; **pick mode untouched**.

`attach-media-dialog.test.tsx` (extend): `variant="library"` shows library success copy and still creates the `media` row.

Coverage must clear the 80% threshold (pre-push hook). `apps/admin` has no tests yet — adding `media-library.test.tsx` is the first; confirm the admin Vitest config picks up `app/**/*.test.tsx`.

## Validation (CLAUDE.md order)

1. `pnpm run format` (before `git add`)
2. `pnpm run check-types`
3. `pnpm run lint` (zero warnings)
4. `pnpm run test:coverage`
5. `pnpm run build`

Manual (Verification checklist): browse, filter, search, paginate (next/prev), open drawer, edit/detach/delete from drawer, upload-to-orphan (appears under Orphaned), External URL to orphan, orphan multi-select Delete selected. Confirm no orphaned UI state after delete/detach (counts + grid refresh).

## Sequencing / dependency note

All three dependencies (#291, #292, #293) are merged to `main`, so this branches off `main` directly. The two primitive extensions (`MediaPicker` bulk-select, `AttachMediaDialog` variant) live in already-shipped files — keep them strictly additive so no consumer regresses. #294 is the last issue in Batch I; after it, the same `MediaPicker mode="pick"` mounts into the Attach dialog's _Existing_ tab and the character/event editors (separate issues).

## Acceptance criteria → coverage map

- [ ] `/media` renders faceted, paginated, searchable grid → `MediaLibrary` + `useMediaLibrary`/`useMediaFacetCounts`, renders-grid + pager tests.
- [ ] Card selection opens the detail drawer in place → `onOpen → setSelected`, card-open test.
- [ ] Upload / External URL create orphaned `media` rows (no junction) → `AttachMediaDialog variant="library"` + `onAttached` invalidate-only, upload-to-orphan test.
- [ ] Orphaned filter offers multi-select Delete selected → `bulkSelectable` + `useDeleteMediaBulk`, orphan-bulk test.
- [ ] Loading / empty / error states present → reused `MediaPicker` states, wired.
- [ ] `check-types`, `lint`, `build` pass → validation section.
