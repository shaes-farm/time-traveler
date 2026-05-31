# 16 — Publish / Unpublish Workflow (cross-cutting)

**Purpose.** Define the one consistent publish/unpublish pattern used by **timelines** and **events** across their list, detail, and editor surfaces. Like media ([15](15-media-management.md)) and TemporalInput ([10](10-temporal-input.md)), this is a cross-cutting behavior, not a screen — the badges and the confirm dialog appear on screens designed elsewhere, so the rules live here once.

Scope is **timelines + events only** (issue #48). Characters carry a `published` column and already show a publish badge on their list/detail (the schema is uniform), but a _characters/stories/periods_ publish workflow is an explicit #48 non-goal — this pass formalizes the pattern for the two entities #48 names, and the same pattern extends to the others later without change.

## The model: `published` + `published_at`

Both `timelines` and `events` have:

- `published BOOLEAN DEFAULT false`
- `published_at TIMESTAMPTZ` (nullable)

The invariant (issue #48 acceptance):

- **Publish** → `published = true`, `published_at = now()`.
- **Unpublish** → `published = false`, `published_at = NULL` (cleared, not retained).

> **Publication is not visibility.** This is the single most important distinction in the timeline/event model and the reason the two axes get separate badges everywhere:
>
> - **`visibility`** (timelines: `private|public|shared`) = _who is allowed to reach this_ under RLS.
> - **`published`** = _whether it is live_ (vs. a work-in-progress draft).
>
> They are orthogonal: a `public` timeline that is still a draft is reachable by RLS rules but presents as not-yet-live; a `private` published timeline is "done" but only the owner sees it. Never collapse them into one control. (Events have no `visibility` column — an event's reach is derived from its containing timeline via RLS — so for events `published` is the only state axis.)

## Status badges (the shared vocabulary)

Three states, used identically on every list row and detail header (already referenced by [03](03-characters-list.md) #7, [07](07-events-list.md) #12, [08](08-event-detail.md), [11](11-timeline-list.md) #3):

| Badge         | Meaning                                                                              | Color (PRD §7.11.5) |
| ------------- | ------------------------------------------------------------------------------------ | ------------------- |
| `✓ Published` | `published = true`                                                                   | green               |
| `─ Draft`     | `published = false`                                                                  | gray                |
| `⇄ Shared`    | reachable via `timeline_collaborators` (permission-context, **not** a content state) | blue                |

`⇄ Shared` is orthogonal to Published/Draft — it marks _why you can see someone else's row_, and the underlying row may itself be Published or Draft from its owner's perspective. Exact colors/icons land at fidelity-2 visual design; the states and their semantics are fixed here.

## The publish/unpublish control

```
  Detail header (owner):              Detail header (after publish):
  ┌──────────────────────────┐        ┌──────────────────────────┐
  │  [Edit]  [ Publish ]     │        │  [Edit]  [ ✓ Published ▾ ]│
  └──────────────────────────┘        └──────────────────────────┘
                                         └ dropdown: Unpublish

  ── Confirm publish (dialog) ───────────────────────────────────────────┐
  │  Publish “Discovery of polonium”?                                     │
  │  ──────────────────────────────────────────────────────────────────  │
  │  This event becomes live. People with access to its timeline will     │
  │  see it as published. You can unpublish at any time.                  │
  │                                                                      │
  │                                          [ Cancel ]  [ Publish ]      │
  └──────────────────────────────────────────────────────────────────────┘

  ── Confirm unpublish (dialog) ─────────────────────────────────────────┐
  │  Unpublish “Discovery of polonium”?                                   │
  │  ──────────────────────────────────────────────────────────────────  │
  │  This returns the event to draft. published_at is cleared. It stays   │
  │  reachable to you and editors but reads as not-yet-live.              │
  │                                                                      │
  │                                          [ Cancel ]  [ Unpublish ]    │
  └──────────────────────────────────────────────────────────────────────┘
```

## Surfaces and behavior

1. **Detail header (canonical).** The publish/unpublish action lives in the detail header for both entities — [08-event-detail.md](08-event-detail.md) and [13-timeline-detail.md](13-timeline-detail.md). A draft shows `[ Publish ]`; a published row shows `[ ✓ Published ▾ ]` whose dropdown holds **Unpublish**. Both transitions go through the confirmation dialog above (issue #48 acceptance: "confirmation dialog exists for both actions").
2. **Editor (convenience).** The timeline ([12](12-timeline-editor.md)) and event ([09](09-event-editor.md)) editors carry a Draft/publish toggle on the right rail as a _create-and-publish-in-one-shot_ convenience. The toggle still routes through the confirm dialog on the publish transition. **Auto-save never publishes** — it only writes draft state (per PRD §7.11.3). Draft→Published is always an explicit, confirmed action.
3. **List rows (badge + bulk).** Every list row shows the status badge ([07](07-events-list.md), [11](11-timeline-list.md)). The bulk multi-select action bar offers **Publish** / **Unpublish** across selected rows; bulk transitions show a single batched confirm ("Publish 4 events?") rather than one dialog per row.
4. **List filters.** Both the [events list](07-events-list.md) and [timelines list](11-timeline-list.md) carry a Status filter group (`Published` / `Draft`) with counts — issue #48 acceptance: "publication-state filtering works on relevant list pages."

## Ownership & permission gating

Publish is a **higher-privilege action than edit** (issue #48 acceptance: "owner-only action gating enforced in UI and service paths"):

- **Owner** and **global admin** — can publish/unpublish.
- **Collaborator-editor** — can edit events but **cannot publish/unpublish** (the control is hidden, not just disabled). Publishing is an editorial go-live decision reserved to ownership. This matches the RLS posture in system-design §9 where editors get update but go-live stays with the owner.
- **Collaborator-viewer / non-collaborator** — read-only; no control.

UI gating mirrors the service/RLS check — the control's _visibility_ is computed from role, and the service path re-checks (defense in depth; the UI never assumes it's the only gate).

## Services & hooks (issue #48 contract work)

- **Timelines** already have publish/unpublish service methods.
- **Events** gain parity — `publishEvent(id)` / `unpublishEvent(id)` plus the publish/unpublish mutations on the events hook — landing in **PR #174** (`feat(services,ui): add event publish/unpublish parity for #48`).
- Both set/clear `published_at` server-side on transition. RLS visibility behavior stays aligned with existing policies (no policy changes required — `published = true` already widens read access in `read_events` / the timeline read policy).

## Edge cases

- **Publishing a timeline with draft events (or vice versa).** No cascade — publication is per-row. A timeline can be published while some of its events are drafts. Surface a non-blocking note on the timeline detail Events tab when this happens ("3 events in this timeline are still drafts"), mirroring [04-character-detail.md](04-character-detail.md) Edge Cases ("2 events not yet published"). Never auto-publish children.
- **Unpublishing something others can currently see.** The confirm dialog states the consequence; on unpublish, `published = false` narrows RLS read access back to owner/editors. Anyone relying on public reach loses it immediately on their next request.
- **Publish on an unsaved new entity.** The editor's publish toggle applies on save; you cannot publish a row that doesn't exist yet. The confirm fires as part of the save when the toggle is on.
- **Optimistic transition failure.** Badge flips optimistically; on service error it rolls back and toasts ("Couldn't publish — try again").
- **`published_at` retention.** Unpublish clears `published_at` to NULL (issue #48). If a future analytics need wants "first published at" history, that's a separate audit-column decision — flagged, not built.

## Open questions

- **Scheduled publish** ("go live on a date") — not in #48. `published_at` is a transition timestamp, not a schedule. A scheduled-publish feature would need a separate `publish_at_scheduled` column + a job; deferred.
- **Extending the pattern to characters/stories/periods.** The badge + control + confirm pattern is entity-agnostic by design; rolling it out to the other `published`-bearing entities is a later, mechanical pass once those entities' detail pages exist.
- **Re-publish timestamp semantics.** On unpublish→republish, `published_at` is set fresh to the new `now()`. If "original publish date" must persist across cycles, that's the audit-column decision above.
