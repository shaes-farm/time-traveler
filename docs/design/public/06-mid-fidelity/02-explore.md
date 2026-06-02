# 02 — Explore / Timeline Navigator (mid-fidelity)

Builds on: [04 wireframe — Explore](../04-wireframes/02-explore.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/explore` · Flows: F1, F5 ([03](../03-user-flows.md))

**Purpose.** Browse/filter published timelines — the master-timeline entry (PRD §2.2.1). Facet rail + result grid + sort + pagination, structure from the [04 wireframe](../04-wireframes/02-explore.md).

## Visual hierarchy + token callouts

- **Facet rail** (`?type=`/`?era=`/`?category=`/`?character=`): `--color-surface` panel, `--radius-md`; facet groups as labelled sections; era chips use `--color-era-*` fills with mono era code + count; active facets show a removable chip + result count (never color-only, [accessibility-spec §6](accessibility-spec.md)).
- **Result grid:** timeline cards on `--color-surface`; Display M title; `TemporalDisplay` span; type/era badges. Sort control (Body M) top-right.
- **Add-to-compare** affordance on each card (checkbox/button) feeds [09](09-comparative-viewer.md) (F5); shows a "selected" state.

## Component states

| Module        | States                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| Facet chip    | default · hover · focus-visible · selected (`aria-pressed`, accent + count) |
| Result card   | default · hover (lift) · focus-visible · pressed · compare-selected         |
| Sort control  | default · focus-visible · open                                              |
| Pagination    | default · focus-visible · disabled (first/last)                             |
| Clear filters | shown only when facets active                                               |

## System states

- **Empty** (no matches): "No timelines match your filters" + **Clear filters** (facets stay in URL) ([02 §3](../02-screen-inventory.md); F1 edge case).
- **Loading:** skeleton grid; facet rail interactive immediately ([02 §3](../02-screen-inventory.md)).
- **Error:** retryable region; facets preserved in URL.
- **Connection-loss:** banner; new published rows merge on reconnect ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** facet rail left, grid right (multi-column).
- **Tablet:** rail collapses to a **Filters** disclosure; 2-up grid.
- **Mobile:** **Filters** opens an `enter-exit` sheet; grid single-column ([04](../04-wireframes/02-explore.md)).

## Motion

- **`cross-fade`** (200ms) for facet/sort result updates — layout-stable, opacity-only ([motion-spec §2.3](motion-spec.md)).
- **`fractal-zoom`** entering a timeline from a card; **`context-shift`** to `/compare`. **Reduced-motion:** facet updates instant; canvas entry instant ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern          | Spec                                                                                                                                                     |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order      | skip-link → nav → `h1` "Explore" → facet rail (groups in order) → sort → result grid → pagination → footer                                               |
| 2   | Facets           | each facet group is a labelled `group`; chips `aria-pressed`; result count announced `polite` on change ([accessibility-spec §4](accessibility-spec.md)) |
| 3   | Contrast         | era-chip fills validated as badges, not text; counts/labels AA ([accessibility-spec §3](accessibility-spec.md))                                          |
| 4   | Never color-only | facets carry label + count; cards carry era code + type label                                                                                            |
| 5   | Reduced-motion   | `cross-fade` → instant content replace ([motion-spec §5](motion-spec.md))                                                                                |
