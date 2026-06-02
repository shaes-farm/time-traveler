# 04 — Story Browser (mid-fidelity)

Builds on: [04 wireframe — Story browser](../04-wireframes/04-story-browser.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/stories` · Flows: F3 ([03](../03-user-flows.md))

**Purpose.** Browse/filter published stories (PRD §2.2.7). Facet rail (`?narrator=`/`?perspective=`/`?tag=`) + story-card grid + pagination, structure from the [04 wireframe](../04-wireframes/04-story-browser.md).

## Visual hierarchy + token callouts

- **Facet rail:** mirrors [02 explore](02-explore.md) — `--color-surface` panel, labelled groups, removable active chips + counts.
- **Story cards:** cover image (`--radius-md`), Display M title, narrator-type badge (icon + label), perspective-character chip (type icon + name). Cards are genuinely card-shaped content ([01 §5](../01-ux-principles.md)).
- **Editorial register:** larger display type than the admin; quiet supporting chrome ([01 §4.2](../01-ux-principles.md)).

## Component states

| Module           | States                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| Facet chip       | default · hover · focus-visible · selected (`aria-pressed` + count)                   |
| Story card       | default · hover (lift) · focus-visible · pressed                                      |
| Perspective chip | link when published · inert text when not ([00 §5.2 rule 1](../00-ia-route-model.md)) |
| Pagination       | default · focus-visible · disabled                                                    |

## System states

- **Empty:** "No stories match your filters" + **Clear filters** ([02 §3](../02-screen-inventory.md)).
- **Loading:** skeleton story cards.
- **Error:** retryable region.
- **Connection-loss:** stale banner; auto-resubscribe ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** rail left, multi-column card grid. **Tablet:** **Filters** disclosure + 2-up grid. **Mobile:** **Filters** sheet + single-column grid ([04](../04-wireframes/04-story-browser.md)).

## Motion

- **`cross-fade`** (200ms) facet result updates; **`context-shift`** to a story reader; **`ambient-presence`** live updates. **Reduced-motion:** instant ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern          | Spec                                                                                                               |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Focus order      | skip-link → nav → `h1` "Stories" → facet rail → result grid → pagination → footer                                  |
| 2   | Facets           | labelled groups; chips `aria-pressed`; result count `polite` ([accessibility-spec §4](accessibility-spec.md))      |
| 3   | Never color-only | narrator type = icon + label; perspective chip = icon + name ([accessibility-spec §6](accessibility-spec.md))      |
| 4   | Contrast         | card title/meta AA on `--color-surface`; cover overlays validated ([accessibility-spec §3](accessibility-spec.md)) |
| 5   | Reduced-motion   | `cross-fade` → instant ([motion-spec §5](motion-spec.md))                                                          |
