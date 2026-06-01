# 11 — Not Found (404)

**Purpose.** The clean catch-all for any missing or unpublished reference (`404`). It **never confirms the existence of a private/draft entity** — an unpublished or non-existent ref returns this page, never a 403 ([00](../00-ia-route-model.md) §4.3; [ADR-0011](../../adr/adr-0011-publication-model.md) / [ADR-0014](../../adr/adr-0014-rls-single-source-of-authorization.md); [02](../02-screen-inventory.md) §2 screen 11).

**Flows:** all (fallback when any entity ref resolves to unpublished/missing).

> This is a **lightweight frame** — a single state.

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                              404                                               │
│                     This page isn't here                                       │
│                                                                                │
│       The timeline, story, event, or character you're looking for may have     │
│       moved, been unpublished, or never existed.                              │
│                                                                                │
│           [ ⏳ Back home ]        [ Explore timelines → ]                       │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- All breakpoints: a single centered message. The two affordances stack vertically on mobile (<640px). The shell (00) wraps the page as normal.

## Annotations

1. **404, never 403 — the safety contract.** Because every content table's `SELECT` policy leads with `published = true` ([ADR-0011](../../adr/adr-0011-publication-model.md) / [ADR-0014](../../adr/adr-0014-rls-single-source-of-authorization.md); system-design §9.2), the reader can only ever address published rows; a missing _or_ unpublished ref is indistinguishable and both land here. The copy deliberately does **not** say "you don't have permission" — it never confirms a private entity exists ([00](../00-ia-route-model.md) §4.3).
2. **Generic across entity types.** One 404 for timelines, stories, events, characters, periods — the copy names the entity families without revealing which (if any) the slug referred to.
3. **Two escape affordances.** **Back home** (`/`) and **Explore timelines** (`/explore`) keep the reader moving rather than dead-ending.
4. **In-page inert links never reach here.** Cross-links to unpublished entities render as inert text upstream ([00](../00-ia-route-model.md) §5.2 rule 1), so a reader rarely _clicks_ into a 404; this page is mainly for direct/stale URL navigation.

## Edge cases

- **Single state.** No empty/loading/error variants — the 404 is itself the terminal state.
- **Stale deep-link (`?at=` etc.).** A stale anchor on a valid timeline does _not_ 404 — it loads the root position (see screen 03, F2 step 9). Only a missing/unpublished _entity_ reaches this page.

## Open questions

> **Resolved (this pass):** 404 never 403; generic across entity types; two escape affordances. No remaining questions — behavior is fully determined by the publication/RLS contract.
