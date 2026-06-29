# Implementation Plan — MediaDetailDrawer primitive (#293)

> Realizes [fidelity-2-plan § Batch I](../docs/design/admin/fidelity-2-plan.md#batch-i--media-library--picker) and [screen 17 "Media detail panel"](../docs/design/admin/02-wireframes/17-media-library.md). Builds on #291 (query layer, merged) and #292 (MediaPicker primitive, PR #310, in flight on `feat/292-media-picker-primitive`).

## Objective

Build the **`MediaDetailDrawer`** primitive (right drawer) for the Media Library:

1. Edit the `media` row — alt text, caption, slug — propagating to **every** attachment ([annotation #6](../docs/design/admin/02-wireframes/17-media-library.md#annotations)).
2. Render the authoritative **"Attached to (N)"** reuse map with per-entity **Detach** and a read-only `(primary)` marker for character attachments ([#8](../docs/design/admin/02-wireframes/17-media-library.md#annotations)).
3. **Delete original** behind a live blast-radius confirm computed from the attachment list ([#7](../docs/design/admin/02-wireframes/17-media-library.md#annotations)).
4. "Open source ↗" for external media.

## What already exists (reuse — do not rebuild)

| Need                                                                              | Existing API                                   | Location                                                                  |
| --------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Attachment list `{kind,id,label,is_primary?}[]` (list **and** blast-radius count) | `useMediaAttachments(client, mediaId)`         | [use-media.tsx:159](../packages/ui/src/hooks/use-media.tsx#L159)          |
| Edit alt/caption/slug (optimistic, rollback, invalidates detail + lists)          | `useUpdateMedia(client)` → `{id, data}`        | [use-media.tsx:224](../packages/ui/src/hooks/use-media.tsx#L224)          |
| Delete row + Storage object (upload only)                                         | `useDeleteMedia(client)` → `id`                | [use-media.tsx:247](../packages/ui/src/hooks/use-media.tsx#L247)          |
| Full row (if not passed in from the grid)                                         | `useMediaItem` / `getMediaById`                | [use-media.tsx:81](../packages/ui/src/hooks/use-media.tsx#L81)            |
| Signed URL for private upload preview                                             | `useMediaSignedUrl(client, id)`                | [use-media.tsx:98](../packages/ui/src/hooks/use-media.tsx#L98)            |
| Per-entity detach (service layer)                                                 | `removeMediaFrom{Character,Event,Timeline}`    | character/event/timeline service                                          |
| Per-entity detach (hooks)                                                         | `useRemoveMediaFrom{Character,Event,Timeline}` | use-characters/events/timelines                                           |
| Slug validation                                                                   | `mediaSchema.partial()` via `updateMedia`      | [media.ts:10](../packages/services/src/schemas/media.ts#L10)              |
| Drawer chrome                                                                     | `Sheet` primitive                              | [components/sheet.tsx](../packages/ui/src/components/sheet.tsx)           |
| Browse-mode open hook                                                             | `MediaPicker` already exposes `onOpen?(id)`    | [media-picker.tsx:64](../packages/ui/src/components/media-picker.tsx#L64) |

`MediaAttachment.is_primary` is already populated for `character` kind only — the read-only `(primary)` marker reads straight off it; nothing new on the data side.

## Gotchas / decisions

1. **Detach invalidation gap (the key integration risk).** The three `useRemoveMediaFrom*` hooks invalidate only `<entity>Keys.detail(entityId)` — **not** `mediaKeys.attachments(mediaId)` or `mediaKeys.library`. Calling them raw leaves the drawer's "Attached to" list and the grid's `⛓ N` badges stale. → **Add a `useDetachMedia` dispatcher hook** in `use-media.tsx` that switches on `attachment.kind`, calls the right service `removeMediaFrom*`, and in `onSuccess` invalidates `mediaKeys.attachments(mediaId)` **and** `mediaKeys.lists()`/`mediaKeys.all` (library + facets). Keeps the drawer thin and fixes the cache coherence in one place. (The existing per-entity hooks stay for the entity surfaces.)
2. **Blast-radius confirm → add a shadcn `alert-dialog` primitive** (`packages/ui/src/components/alert-dialog.tsx`). Standard shadcn, focus-trapped, destructive action; fits the "composite of shadcn primitives" rule (only `Tree` is bespoke) and is reusable for future destructive confirms. Confirm copy is computed live from the attachment list length: _"Attached to N entit{y|ies} — this removes it everywhere."_ N=0 (orphan) still confirms but with the no-friction "not attached to anything" copy.
3. **Preview degradation reuse.** `MediaCard`'s `MediaPreview` (type-degraded image/video/audio/document rendering) is a **local, unexported** function in [media-card.tsx:160](../packages/ui/src/components/media-card.tsx#L160). Extract it to a shared `media-preview.tsx` (export `MediaPreview`) and have both `MediaCard` and the drawer import it, rather than duplicating the type-icon/poster/waveform logic. Small refactor of #292's file — flag in the PR since #310 is still open (rebase coordination).
4. **Delete is library-only.** The drawer is mounted only in `mode="browse"`; pick mode never renders it (already true — `MediaPicker` only calls `onOpen` in browse). No mode prop needed on the drawer itself; just don't wire it in pick.
5. **File location:** flat in `packages/ui/src/components/` as `media-detail-drawer.tsx` (matches the actual `media-*.tsx` convention; the issue's `media-picker/` subdir text predates #292's flat layout).

## Files to create / change

**New**

- `packages/ui/src/components/media-detail-drawer.tsx` — the drawer component.
- `packages/ui/src/components/media-detail-drawer.test.tsx` — Vitest.
- `packages/ui/src/components/alert-dialog.tsx` — shadcn AlertDialog primitive (+ optional `.stories.tsx`).
- `packages/ui/src/components/media-preview.tsx` — extracted shared preview (with `MediaCard`).

**Changed**

- `packages/ui/src/hooks/use-media.tsx` — add `useDetachMedia` dispatcher + `mediaKeys` already has `attachments`/`library`/`facets` (reuse).
- `packages/ui/src/components/media-card.tsx` — import `MediaPreview` from the new module instead of the local copy.
- `packages/ui/src/components/media-picker.stories.tsx` — add a `Pages > Media Library` story variant (or a dedicated drawer story) showing the populated drawer: multi-attachment + orphan.
- Barrel/subpath exports if the package re-exports components explicitly (check `media-picker.tsx` re-export block — add `MediaDetailDrawer`, `AlertDialog`).

## Component shape

```tsx
interface MediaDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ServiceClient; // for the hooks
  media: MediaLibraryRow | null; // passed from the grid row (avoids a refetch)
  // Optional callbacks so the consuming route can react (toast, close, refocus)
  onDeleted?: (id: string) => void;
}
```

Internal structure (top → bottom of [the wireframe](../docs/design/admin/02-wireframes/17-media-library.md#layout--media-detail-panel-drawer)):

- **Header:** caption/alt as title + `Sheet` close.
- **Preview + metadata:** `<MediaPreview>` (shared) + read-only source/type/dimensions/size/mime/slug.
- **Edit form:** controlled alt text, caption, slug inputs → "Save changes" → `useUpdateMedia.mutate({id, data})`. Disable Save while pristine/pending; surface error.
- **Divider → "Attached to (N)":** `useMediaAttachments`; each row `{kind} — {label}` + `(primary)` if `is_primary` + `[Detach]` → `useDetachMedia.mutate({kind, mediaId, entityId})`. Empty list ⇒ "Not attached to anything (orphaned)."
- **Footer:** `[ Open source ↗ ]` (external only; `<a target=_blank rel=noopener>`) and `[ Delete original… ] ⚠` → opens AlertDialog with blast-radius copy → `useDeleteMedia.mutate(id)` → `onOpenChange(false)` + `onDeleted(id)`.

States: pending (skeleton in preview/list), error (alert + retry), empty attachment list (orphan copy).

## Tests (Vitest — the acceptance list)

In `media-detail-drawer.test.tsx`, mock the hooks (follow existing `media-*.test.tsx` patterns, `@testing-library/react` + QueryClient wrapper):

- **Edit save** — typing alt/caption/slug + Save calls `updateMedia` with the right partial; Save disabled when pristine.
- **Detach row** — clicking a row's Detach calls `useDetachMedia` with `{kind, mediaId, entityId}`; assert it dispatches to the correct service per kind.
- **Blast-radius count** — confirm dialog text reflects `attachments.length` (0, 1, N → singular/plural).
- **Read-only primary** — `(primary)` marker renders for a character attachment with `is_primary: true`; **no** set-primary control is present.
- **Delete confirm** — Delete is gated behind the AlertDialog; `useDeleteMedia` fires only after explicit confirm, not on first click.
- **Open source** — link shown for `source: "external"`, absent for uploads.
- a11y roles: dialog/sheet role, labelled inputs, focus on open.

Coverage must clear the 80% threshold (pre-push hook).

## Validation (CLAUDE.md order)

1. `pnpm run format` (before `git add`)
2. `pnpm run check-types`
3. `pnpm run lint` (zero warnings)
4. `pnpm run test:coverage`
5. `pnpm run build`

Storybook: drawer story (multi-attachment + orphan) renders without console errors.

## Sequencing / dependency note

#293 depends on #292 (PR #310) for `MediaLibraryRow`, the `MediaPicker.onOpen` mount point, and the `MediaPreview` source. **Branch #293 off #310's branch** (or wait for #310 to merge to `main`) to avoid the `media-card.tsx` extraction colliding. The drawer is mounted into the library route by a later consuming issue — #293 ships the primitive + story + tests only.

## Acceptance criteria → coverage map

- [ ] Drawer edits alt/caption/slug on the `media` row → `useUpdateMedia`, edit-save test.
- [ ] "Attached to" lists all entities with working per-entity Detach → `useMediaAttachments` + `useDetachMedia`, detach test.
- [ ] `is_primary` shown but not settable → read-only-primary test.
- [ ] Delete original shows live blast radius + explicit confirm → AlertDialog + delete-confirm test.
- [ ] `check-types`, `lint`, `test:coverage` pass.
- [ ] Story: populated drawer (multi-attachment + orphan).
