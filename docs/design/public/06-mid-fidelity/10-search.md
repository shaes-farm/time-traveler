# 10 — Global Search (mid-fidelity, stub)

Builds on: [04 wireframe — Search](../04-wireframes/10-search.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/search` · **Post-MVP / stubbed at launch** ([02 §2](../02-screen-inventory.md))

**Purpose.** Faceted full-text search across all published types (PRD §2.2.8) — **stubbed at launch**. Per [02 §2](../02-screen-inventory.md), faceted browse on [02 explore](02-explore.md) / [04 story browser](04-story-browser.md) is the search floor for MVP. This screen is comp'd at **stub fidelity only**; the full retrieval UI is not designed this pass (don't over-spec).

## Stub comp

- The **Search** nav item is present (so IA stays stable when search ships, [00 app-shell](00-app-shell.md)) and routes here.
- The route renders a **"Search is coming soon"** state: Display M heading, Body M explanation, and two affordances pointing at the working search floor — **Browse timelines** (`/explore`) and **Browse stories** (`/stories`).
- No search input is wired at launch (or it renders disabled with a "coming soon" note); no result list, no facets.

## Token callouts

- Centered single-column message on `--color-background`; heading Display M; CTAs styled like the landing secondary CTA (`--color-surface` + `--color-border`).

## System states

- **Stub** is the only state at launch ([02 §3](../02-screen-inventory.md)): no empty/loading/error/connection-loss variants until search is built.

## Responsive

- Centered message, CTAs stack on mobile.

## Motion

- **`cross-fade`** only, reserved for when results land. No motion at stub. **Reduced-motion:** N/A at stub.

## Accessibility

| #   | Concern     | Spec                                                                                       |
| --- | ----------- | ------------------------------------------------------------------------------------------ |
| 1   | Focus order | skip-link → nav → `h1` "Search coming soon" → Browse timelines → Browse stories → footer   |
| 2   | Honest stub | the disabled/absent input is announced as unavailable; no dead controls                    |
| 3   | Contrast    | message + CTAs AA on `--color-background` ([accessibility-spec §3](accessibility-spec.md)) |

## Future (not designed this pass)

Full-text retrieval, result list grouped by type, and search facets are deferred post-MVP; they will get their own mid-fi pass when scheduled. Tracked as stubbed in [02 §2](../02-screen-inventory.md) / [04 gaps](../04-wireframes/README.md).
