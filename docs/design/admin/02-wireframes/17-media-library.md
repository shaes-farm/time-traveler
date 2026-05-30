# 17 — Media Library & Picker (standalone)

**Purpose.** A **cross-entity media browser** plus a **reusable picker dialog**. Where [15 — Media Management](15-media-management.md) is the per-entity primitive ("attach to _this_ event / character / timeline"), screen 17 is the inverse view: **all media you own, in one place**, independent of any single entity — and the "choose from existing" path that lets one `media` row be reused across many entities instead of re-uploaded.

This is the piece [15](15-media-management.md) annotation #9 and its Open Questions explicitly deferred ("a cross-entity 'pick from existing media' picker… not required by #49's acceptance criteria"). Phase 5 promotes it from _deferred_ to _designed_ because the relationship and media work of this milestone is the point at which authors start **accumulating a library worth reusing** (the same portrait of a person attached to their character record, three events they appear in, and the timeline they anchor).

It has **two faces of the same data**:

1. **Library browser** — a full screen (a new entry in the left-nav under Media), for managing media as first-class records.
2. **Picker dialog** — the same grid + search + filters, embedded as a modal, returning a selection back to whatever invoked it.

> **Schema dependency.** Everything here sits on top of the same `media` table as screen 15 and inherits its blocker: `media.storage_path` is `NOT NULL` with no upload/external discriminator. The library's **upload-vs-external** filter and the kind badge cannot be computed cleanly until that is fixed. `// BLOCKED: media.storage_path NOT NULL + no source discriminator — see [#179](https://github.com/shaes-farm/time-traveler/issues/179).` Tracked upstream as [#179](https://github.com/shaes-farm/time-traveler/issues/179) (same fix the screen-15 schema-gap callout recommends: nullable `storage_path` + `source CHECK (source IN ('upload','external'))`).

## Where it lives

- **Left nav → Media** (new top-level destination; see [00-screen-inventory.md](../00-screen-inventory.md) screen 17). The dashboard's recent-counts surface ([`get_user_recent_counts`](../../../supabase/migrations/00015_get_user_recent_counts.sql), migration 00015) can deep-link here.
- **As a picker** — opened from the Attach dialog's new **Existing** tab ([15](15-media-management.md) Attach dialog) and from the character/event editors' media sections ([05-character-editor.md](05-character-editor.md), [09-event-editor.md](09-event-editor.md)).

## Layout — Library browser

```
  Media library                                              [ + Upload ]  [ + External URL ]
  ───────────────────────────────────────────────────────────────────────────────────────────
  ┌── Filters ───────────┐   [ ⌕ Search alt text, caption, filename…            ]   ⌗ 248 items
  │ Type                 │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  ☐ Image    (181)    │   │ [thumb]  │ │ [▶ thumb]│ │ [doc]    │ │ [thumb]  │
  │  ☐ Video     (22)    │   │          │ │          │ │          │ │          │
  │  ☐ Audio      (9)    │   │ Curie,   │ │ Newsreel │ │ Polonium │ │ Lab, '03 │
  │  ☐ Document  (36)    │   │ 1898     │ │ 1911     │ │ paper    │ │          │
  │                      │   │ img·3 ⛓  │ │ vid·1 ⛓  │ │ doc·0 ⚠  │ │ img·1 ⛓  │
  │ Source               │   └──────────┘ └──────────┘ └──────────┘ └──────────┘
  │  ☐ Uploaded (212)    │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  ☐ External  (36)    │   │   …      │ │   …      │ │   …      │ │   …      │
  │                      │   └──────────┘ └──────────┘ └──────────┘ └──────────┘
  │ Attached to          │
  │  ☐ Events            │   « ‹  1 2 3 … 21  › »                    [ Grid ▦ | List ☰ ]
  │  ☐ Characters        │
  │  ☐ Timelines         │
  │  ☐ Orphaned   (4) ⚠  │
  │                      │
  │ [ Clear filters ]    │
  └──────────────────────┘
```

Selecting a card opens the **detail panel** (right drawer) without leaving the grid.

## Layout — Media detail panel (drawer)

```
  ── Marie Curie in her laboratory, 1898 ──────────────────────────── [✕] ┐
  │  ┌───────────────────────────┐                                       │
  │  │        [ preview ]        │   uploaded · image · 1200×800          │
  │  │                           │   312 KB · image/jpeg                  │
  │  └───────────────────────────┘   slug: marie-curie-lab-1898          │
  │                                                                       │
  │  Alt text   [ Marie Curie in her laboratory, 1898            ]        │
  │  Caption    [ Source: Curie Museum archive                  ]        │
  │                                              [ Save changes ]         │
  │  ─────────────────────────────────────────────────────────────────   │
  │  Attached to (3)                                                      │
  │   • Character — Marie Curie            (primary)        [ Detach ]    │
  │   • Event — Discovery of polonium                      [ Detach ]    │
  │   • Timeline — Radioactivity research                 [ Detach ]    │
  │  ─────────────────────────────────────────────────────────────────   │
  │  [ Open source ↗ ]                         [ Delete original… ] ⚠     │
  └───────────────────────────────────────────────────────────────────────┘
```

## Layout — Picker dialog (choose from existing)

```
  ── Choose existing media ──────────────────────────────────────────────┐
  │  [ ⌕ Search…              ]   Type ▾  Source ▾            ⌗ 248       │
  │  ──────────────────────────────────────────────────────────────────  │
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
  │  │[✓]   │ │      │ │      │ │[✓]   │ │      │ │      │               │
  │  │thumb │ │thumb │ │thumb │ │thumb │ │thumb │ │thumb │               │
  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘               │
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
  │  │ …    │ │ …    │ │ …    │ │ …    │ │ …    │ │ …    │               │
  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘               │
  │  ──────────────────────────────────────────────────────────────────  │
  │  2 selected                          [ Cancel ]  [ Attach 2 items ]   │
  └───────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **`MediaPicker` is the shared `packages/ui` primitive — library and picker are one component in two modes (decision, not a recommendation).** The grid, search, filters, type/source/attachment facets, and card rendering are shared. The full-screen browser adds the detail drawer + upload entry points; the picker mode adds multi-select checkboxes and a returning **Attach N items** action and **omits Delete** (deletion is a library-only, deliberate act). **Build once, mount four times:** the library route, the Attach dialog's _Existing_ tab ([15](15-media-management.md)), and the character/event editor media sections ([05](05-character-editor.md), [09](09-event-editor.md)) all mount the same `MediaPicker`. A `mode` prop (`"browse" | "pick"`) flips the browser-vs-picker affordances; everything below the mode switch is identical. This component is built **now**, in Batch I, before any consumer needs it (see [fidelity-2-plan.md § Batch I](../fidelity-2-plan.md#batch-i--media-library--picker)) so the four surfaces never diverge. It is a **composite of shadcn primitives** (dialog, command/input, checkbox, scroll-area, card), not a bespoke primitive — only the timeline `Tree` is bespoke per the locked stack.
2. **Search spans `alt_text`, `caption`, and the filename/`slug`.** Case-insensitive substring. (Full-text over `metadata` is a later enhancement, not this pass.)
3. **Filters are faceted and counted.** **Type** (`image|video|audio|document`, the closed `media_type` set), **Source** (uploaded vs external — blocked on [#179](https://github.com/shaes-farm/time-traveler/issues/179)), and **Attached to** (events / characters / timelines / **orphaned**). Facets combine as AND across groups, OR within a group, matching the events-list filter-rail behavior ([07-events-list.md](07-events-list.md)).
4. **Orphaned media is a first-class filter.** A `media` row attached to nothing (every junction detached, original never deleted) is exactly the cruft this screen exists to surface. The `⚠` count makes it visible; orphan cards carry a `⚠ 0` attachment badge. This is the cleanup path that per-entity screen 15 can never offer.
5. **The attachment-count badge (`⛓ N`) on every card** tells you reuse at a glance and is the blast-radius preview before any delete. `⛓ 0` ⇒ orphan (`⚠`).
6. **The detail panel edits the `media` row, not a junction.** Alt text, caption, slug — these live on `media` and propagate to **every** place the item is attached. The "Attached to" list is the authoritative reuse map and the only place to **Detach** from a specific entity without visiting that entity. Editing here is the canonical fix for "wrong caption everywhere."
7. **Detach vs. Delete original — identical semantics to [15](15-media-management.md) annotation #6.** Detach removes one junction row (always safe; the `media` survives). **Delete original** removes the `media` row (+ Storage object for uploads) and is confirmed with the live blast radius computed from the attachment list ("attached to 3 entities — removes it everywhere"). The picker mode never deletes.
8. **`is_primary` is shown, not set, here.** The "(primary)" marker on a character attachment is read-only in this cross-entity view; setting primary stays on the character surface ([04-character-detail.md](04-character-detail.md), [15](15-media-management.md) annotation #5) where the single-primary swap has context. Avoids a confusing "primary of what?" affordance.
9. **Picker returns media ids; the caller writes the junction.** The picker is association-agnostic — it hands back selected `media_id`s and the invoking surface (event editor, character editor, Attach dialog) creates the correct junction (`event_media` / `character_media` / `timeline_media`) with its own ordering/primary rules. Re-attaching media already attached to the target is a no-op (the composite PK dedupes), surfaced as "already attached" rather than an error.
10. **Previews degrade by type** exactly as [15](15-media-management.md) annotation #8 (image thumb / video poster + ▶ / audio waveform / document type-icon). No inline players.
11. **Uploads start here too.** `[ + Upload ]` / `[ + External URL ]` reuse the screen-15 Attach dialog's Upload and External-URL tabs, minus the "attach to current entity" step — a library upload creates a `media` row with **no** junction (it lands in **Orphaned** until attached). This is the only way to stage media ahead of the entity that will use it.

## Edge cases

- **Empty library.** "No media yet." + Upload / External URL CTAs. In picker mode: "Nothing to choose from yet — upload from an entity first," with the picker's upload entry if reachable.
- **Empty after filtering.** "No media match these filters." + Clear filters.
- **Orphan bulk cleanup.** Filtering to **Orphaned** offers a multi-select **Delete selected** (library mode only), each still blast-radius-safe (orphans are `⛓ 0`, so no confirmation friction). Bulk delete is the one bulk action this pass; bulk re-attach is deferred.
- **Deleting media that is currently selected in an open picker elsewhere.** Last-writer-wins; the picker revalidates ids on Attach and drops any that vanished, with a notice.
- **Large libraries.** Grid is paginated (cursor over `created_at`/`slug`); filters and search run server-side. No infinite-scroll this pass — explicit pager matches the data-table convention.
- **Source filter while [#179](https://github.com/shaes-farm/time-traveler/issues/179) is open.** Until the discriminator lands, "Source" is derived from `storage_path IS NULL` as a stopgap and the facet shows a `provisional` tooltip. `// BLOCKED: accurate upload/external split needs #179.`
- **Permissions / RLS.** The library shows only media the current user owns or can see via the same collaborator path the entity tables use; orphan visibility follows the `media` row's own ownership, not any entity's.

## Open questions

- **Tags / collections.** Grouping media into named sets (vs. only entity attachments) is a future organizational layer; not this pass.
- **Bulk re-attach.** Selecting N media in the library and attaching them to one entity in a single action — natural follow-up once the picker ships, deferred here to keep the picker's return contract simple.
- **Usage analytics.** "Most-reused media," "unused since…" — reporting layer, out of scope.
- **Transcoding / responsive variants.** Same explicit non-goal as [15](15-media-management.md) / [#49](https://github.com/shaes-farm/time-traveler/issues/49). Originals served as-is.
