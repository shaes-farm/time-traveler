# 01 — Landing / Discovery (mid-fidelity)

> **Drift note (2026-07-19):** the hi-fi final
> (`../08-high-fidelity/Time_Traveler_Landing_Final.html`, implemented in
> `apps/reader/app/page.tsx`) replaces the featured/recent rails below with an
> interactive era timeline strip + marketing sections. Divergences tracked in
> [#395](https://github.com/shaes-farm/time-traveler/issues/395).

Builds on: [04 wireframe — Landing](../04-wireframes/01-landing.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/` · Flows: F1, F3 ([03](../03-user-flows.md))

**Purpose.** The dual-CTA entry to both spines (Explore / Stories) plus featured + recent published-content rails — structure from the [04 wireframe](../04-wireframes/01-landing.md); this fixes token application, states, motion, a11y.

## Visual hierarchy + token callouts

- **Hero:** Display XL (Fraunces ~3rem) headline; Body L sub; two CTAs — **Explore** (primary, `--color-primary` on `--color-primary-foreground`) and **Stories** (secondary, `--color-surface` + `--color-border`). Generous vertical rhythm (one dominant column, [01 §4.2](../01-ux-principles.md)).
- **Featured cards:** `--color-surface`, `--radius-md`; Display M title; each card carries a `TemporalDisplay` (era code in mono + value).
- **Recent rails:** horizontal scroll rails of cards; Body S meta; era/type accents from `--color-era-*` / reserved `--color-type-*` (badge + label, never color-only).
- **Cards are reserved for genuinely card-shaped content** ([01 §5](../01-ux-principles.md)) — covers/portraits, not prose.

## Component states

| Module        | States                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| Hero CTA      | default · hover · focus-visible (`--color-ring`) · active                   |
| Featured card | default · hover (`--color-surface-2` wash + lift) · focus-visible · pressed |
| Rail item     | default · hover · focus-visible                                             |
| Rail scroller | scroll affordances at overflow; keyboard arrow scroll                       |

## System states

- **Empty** (nothing published): friendly "nothing published yet" + Explore CTA ([02 §3](../02-screen-inventory.md)).
- **Loading:** skeleton rails for featured/recent ([02 §3](../02-screen-inventory.md)).
- **Error:** retryable error panel; shell intact.
- **Connection-loss:** stale-content banner; auto-resubscribe ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** hero centered, multi-column featured grid, horizontal rails.
- **Tablet:** 2-up featured grid; rails keep horizontal scroll.
- **Mobile:** hero stacks; CTAs full-width stacked; featured + rails become single-column vertical lists ([04](../04-wireframes/01-landing.md)).

## Motion

- **`fractal-zoom`** entering a timeline from a featured card (spatial origin = the card) ([motion-spec §2.1](motion-spec.md)).
- **`context-shift`** to `/explore` or `/stories` from a CTA (320ms).
- **`cross-fade`** for rail content refresh; **`ambient-presence`** for live updates. **Reduced-motion:** all instant; rails update statically ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern          | Spec                                                                                                                                              |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order      | skip-link → nav → hero headline (`h1`) → Explore CTA → Stories CTA → featured cards → recent rails → footer                                       |
| 2   | Landmarks        | `main` wraps content; rails are labelled `region`s ("Featured", "Recent")                                                                         |
| 3   | Contrast         | hero + card titles AA on `--color-surface`/`--color-background`; era codes in mono beside values ([accessibility-spec §3](accessibility-spec.md)) |
| 4   | Never color-only | era/type accents paired with code/label ([accessibility-spec §6](accessibility-spec.md))                                                          |
| 5   | Rails keyboard   | rail items Tab-reachable; arrow-key horizontal scroll; no hover-only affordances                                                                  |
| 6   | Reduced-motion   | card→canvas `fractal-zoom` collapses to instant ([motion-spec §5](motion-spec.md))                                                                |
