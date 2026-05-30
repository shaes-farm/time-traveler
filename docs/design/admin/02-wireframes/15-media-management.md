# 15 — Media Management (cross-cutting)

**Purpose.** A reusable media surface for attaching, ordering, previewing, and detaching media on the three entities that carry it: **events** (`event_media`), **characters** (`character_media`), and **timelines** (`timeline_media`). Like the [TemporalInput control](10-temporal-input.md), this is a primitive, not a screen — it's embedded in the editors and detail tabs already designed, so its behavior must be defined once and reused.

Issue #49 deliberately scopes this to **hybrid media** (uploaded files + external URL embeds) with **association + ordering** — _not_ a full digital-asset-manager. There is no standalone media library browser in this pass.

## The two media kinds

`media` rows are one of two kinds, distinguished by how the bytes are sourced:

| Kind         | Where bytes live                                         | `storage_path`     | `url`                          |
| ------------ | -------------------------------------------------------- | ------------------ | ------------------------------ |
| **Uploaded** | Supabase Storage bucket                                  | the object path    | the resolved public/signed URL |
| **External** | a third-party host (YouTube, archive.org, a museum CDN…) | — (see schema gap) | the external URL               |

> **Schema gap — must resolve before build.** `media.storage_path` is `NOT NULL` in the current schema, but an _external_ embed has no stored object. There is also **no column distinguishing uploaded vs external** (no `source`/`is_external` flag) and no `media_type`-independent kind marker. #49 cannot ship external embeds cleanly until this is addressed. Recommended fix: make `storage_path` nullable **and** add `source VARCHAR CHECK (source IN ('upload','external'))` (or infer kind from `storage_path IS NULL`). `// BLOCKED: storage_path NOT NULL + no upload/external discriminator — needs a migration before external embeds work.` File as an upstream schema issue (mirrors the [#177](https://github.com/shaes-farm/time-traveler/issues/177) treatment for the fractal column).

## Data captured

Per `media` row: `slug`, `alt_text`, `caption`, `storage_path`, `url`, `media_type` (`image|video|audio|document`), `width`, `height`, `file_size_bytes`, `mime_type`, `metadata`.

Per association (junction):

- `event_media` — `(event_id, media_id, sort_order)`
- `timeline_media` — `(timeline_id, media_id, sort_order)`
- `character_media` — `(character_id, media_id, is_primary)` — **no `sort_order`; has a single-primary invariant** (partial unique index, [#125](https://github.com/shaes-farm/time-traveler/issues/125) / [#133](https://github.com/shaes-farm/time-traveler/pull/133))

## The Attach dialog

Invoked from every `[ + Attach media ]` / `[ + Add media ]` affordance (event detail, character detail/editor, timeline detail).

```
  ── Attach media ───────────────────────────────────────────────────────┐
  │  ( Upload )   ( External URL )                                        │
  │  ──────────────────────────────────────────────────────────────────  │
  │  Upload tab:                                                          │
  │  ┌────────────────────────────────────────────────────────────────┐ │
  │  │   ⬆  Drop a file here, or click to browse                       │ │
  │  │      images · video · audio · documents                        │ │
  │  └────────────────────────────────────────────────────────────────┘ │
  │  [filename.jpg ▓▓▓▓▓▓▓░░░ 68%]                                        │
  │                                                                      │
  │  Alt text   [ Marie Curie in her laboratory, 1898         ]          │
  │  Caption    [ Source: Curie Museum archive               ]          │
  │                                                                      │
  │                                          [ Cancel ]  [ Attach ]       │
  └──────────────────────────────────────────────────────────────────────┘

  ── External URL tab ───────────────────────────────────────────────────┐
  │  URL       [ https://archive.org/details/…           ]  ✓ recognized │
  │  ┌──────────────┐                                                    │
  │  │ [preview]    │  detected: image · 1200×800                        │
  │  └──────────────┘                                                    │
  │  Alt text   [ … ]      Caption  [ … ]                                │
  │                                          [ Cancel ]  [ Attach ]       │
  └──────────────────────────────────────────────────────────────────────┘
```

## Display: list / grid with per-item actions

The attached-media render is shared across the three detail surfaces. It matches the media tab already sketched in [08-event-detail.md](08-event-detail.md) (thumbnail + caption + `⋯` overflow):

```
  Media (3)                                           [ + Attach media ]
  ───────────────────────────────────────────────────────────────────
  ⠿ ╔════════════╗  Marie Curie in her laboratory, 1898
    ║ [thumb]    ║  uploaded · image · sort_order 0          [⋯]
    ╚════════════╝
  ⠿ ╔════════════╗  Newsreel: Curie receives 1911 Nobel
    ║ [▶ thumb]  ║  external (archive.org) · video · sort 1   [⋯]
    ╚════════════╝
  ⠿ ╔════════════╗  Polonium discovery paper, first page
    ║ [doc icon] ║  uploaded · document · sort 2             [⋯]
    ╚════════════╝
```

## Annotations

1. **One dialog, two tabs: Upload / External URL** — the "hybrid" of #49. Upload streams to Supabase Storage then creates the `media` row + the junction row; External validates/recognizes the URL then creates an external `media` row + junction row. Both end by attaching to the current entity.
2. **`media_type` is inferred, not asked.** Upload derives it from MIME (`image`/`video`/`audio`/`document`); External derives it from the recognized URL / content-type. The four-value CHECK (`image|video|audio|document`) is the closed set — anything unrecognized falls back to `document` with a notice.
3. **Per-item actions live in the `⋯` overflow** (consistent with [08-event-detail.md](08-event-detail.md) annotation #12): **Edit caption / alt text**, **Reorder** (or drag the `⠿` handle), **Set as primary** (character only), **Detach**, **Delete original**. Keeping these in the overflow keeps dense media lists clean.
4. **Reorder applies only where the junction has `sort_order`** — events and timelines. Drag the `⠿` handle to rewrite `event_media.sort_order` / `timeline_media.sort_order`. **Character media has no `sort_order`** (schema) — so the character media list has no drag handle; its only ordering concept is **primary vs. the rest** (annotation #5).
5. **`is_primary` is character-only** and single-valued, enforced by the partial unique index ([#125](https://github.com/shaes-farm/time-traveler/issues/125)/[#133](https://github.com/shaes-farm/time-traveler/pull/133)). "Set as primary" does the atomic swap (unset old, set new) as a UX flow; the DB index is the correctness backstop. The primary item renders with a `primary` badge. This matches [04-character-detail.md](04-character-detail.md).
6. **Detach vs. Delete are different, and the difference matters for shared media** (issue #49 acceptance: "delete behavior is explicit for uploaded vs external"):
   - **Detach** removes only the _junction row_ — the `media` record survives and may still be attached elsewhere. Always safe.
   - **Delete original** removes the `media` row itself (and, for uploaded media, the Storage object). Confirm with blast radius: "This image is attached to 2 other entities. Deleting it removes it everywhere and deletes the stored file." For external media, no Storage object is removed — only the row.
     The `⋯` menu offers Detach by default; Delete original is the heavier, separately-confirmed action.
7. **Upload progress + partial failure** follow the editor pattern already established ([05](05-character-editor.md)/[09](09-event-editor.md)): uploads complete in the background; if the entity saves but the upload fails, a toast offers retry from the detail view. Media never blocks the parent entity save.
8. **Previews degrade by type.** Image → thumbnail; video → poster frame with a ▶ overlay; audio → waveform/clip icon; document → file-type icon + filename. External embeds show the host's thumbnail when available, otherwise the type icon. No inline players in the admin this pass — preview is a still; playback opens the source.
9. **No standalone library browser this pass.** Attachment always starts from an entity ("attach to _this_ event"). A cross-entity "pick from existing media" picker (browse everything you've uploaded and reuse it) is a natural #49 follow-up but is **not** required by the acceptance criteria — documented under Open Questions.

## Edge cases

- **External URL not recognized.** Allow attach anyway as a generic link with a `document` fallback and a "couldn't generate a preview" note. Never block on preview failure.
- **Oversized upload.** #49 scopes uploads to "small files." Enforce a client-side size cap (value is a services/config decision); over-cap files are rejected with the limit stated. `// NEEDS: max upload size config`.
- **Detaching the character's primary media.** Confirm and, if other media exist, prompt "Make another image primary?" so the character isn't left with no primary. Non-blocking.
- **Reordering during an in-flight attach.** New item lands at the end (`max(sort_order)+1`); reorder is enabled once the attach settles.
- **Empty state.** Per entity: "No media attached yet." + the Attach CTA.
- **Loading / error.** Grid skeleton; failed attach rolls back optimistic insert and toasts.

## Open questions

- **Reusable media picker** (browse + reattach existing media across entities) — the biggest deferred piece. Becomes worthwhile once authors accumulate a library; out of scope for #49's association-focused acceptance criteria.
- **External-embed schema discriminator** — see the schema-gap callout above. Must be resolved (nullable `storage_path` + a `source` discriminator) before external embeds ship. Treat as a hard prerequisite for the External URL tab.
- **Transcoding / responsive variants** — explicit non-goal (#49). Originals are stored and served as-is this pass.
