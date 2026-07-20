# 01 — Landing / Discovery (mid-fidelity)

> **Reconciled to the hi-fi final (2026-07-20).** This spec was revised to match
> `../08-high-fidelity/Time_Traveler_Landing_Final.html` (implemented in
> `apps/reader/app/page.tsx`, PR #396). The earlier draft specified
> featured/recent published-content rails with skeleton/empty/error states; the
> hi-fi final replaces those with an interactive era timeline strip and
> introductory/explanatory sections, and the landing fetches no data. The rails
> are **not** planned — discovery lives in `/explore` and `/stories`. Divergence
> history: [#395](https://github.com/shaes-farm/time-traveler/issues/395).

Builds on: [04 wireframe — Landing](../04-wireframes/01-landing.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/` · Flows: F1, F3 ([03](../03-user-flows.md))

**Purpose.** The dual-CTA entry to both spines (Explore / Stories) plus a short, introductory tour of the reader — structure from the [04 wireframe](../04-wireframes/01-landing.md); this fixes token application, states, motion, a11y. The landing is deliberately introductory: it fetches no published content.

## Sections (top → bottom)

1. **Hero** — kicker + headline + sub + dual CTA.
2. **Era timeline strip** — `EraTimelineStrip`, the illustrative all-of-time axis with a log/linear toggle.
3. **How it works** — four concept cards.
4. **Who it's for** — four persona cards.
5. **Get started** — the read-vs-author split.
6. **FAQ** — four `<details>` questions.

## Visual hierarchy + token callouts

- **Hero:** mono kicker (`--color-era-mya`, uppercase, tracked); Display XL headline (Fraunces, `text-4xl`→`text-6xl`); Body L sub; two CTAs — **Explore** (primary, `--color-primary` on `--color-primary-foreground`) and **Read stories** (secondary, `--color-surface` + `--color-border`). Two-column split on desktop, stacked on mobile ([01 §4.2](../01-ux-principles.md)).
- **Era strip:** full-bleed within the container; era bands tinted from `--color-era-*` in log mode; markers pair a dot with mono era-code text (never color-alone). Log/linear toggle uses `aria-pressed`.
- **How it works:** four cards with a 2px era-hued top rule (`--color-era-ce/bce/kya/bya`), mono index (`01`–`04`), Display M title, Body S copy. Hybrid-time card renders sample era codes (`13.8 BYA`, `44 BCE`) in mono.
- **Who it's for:** four cards on `--color-surface`, `--radius-md`, each with a mono era-hued kicker label.
- **Get started:** two cards on a `--color-surface/30` band; left = read (in-app CTAs), right = author (plain anchors **out** to admin/auth).
- **FAQ:** native `<details>`; `+` marker in `--color-primary` rotates to `×` on open.
- **Cards are reserved for genuinely card-shaped content** ([01 §5](../01-ux-principles.md)) — these are concept/persona/CTA panels, not content covers; no `TemporalDisplay` on the landing because no entities are shown.

## Component states

| Module                 | States                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| Hero CTA               | default · hover (opacity/wash) · focus-visible (`--color-ring`) · active |
| Era strip toggle       | default · hover · focus-visible · pressed (`aria-pressed=true`)          |
| Era strip marker       | static (no hover navigation — illustrative only)                         |
| Persona / concept card | static (non-interactive)                                                 |
| Get-started CTA        | default · hover · focus-visible · active                                 |
| FAQ `<summary>`        | collapsed · hover · focus-visible · open (marker rotated)                |

## System states

**None.** The landing fetches no published content, so it has no empty / loading / error / connection-loss states — it renders identically regardless of what exists. Those states live on `/explore`, `/stories`, and the entity screens ([02 §3](../02-screen-inventory.md)). This is the primary divergence from the earlier draft ([#395](https://github.com/shaes-farm/time-traveler/issues/395)).

## Responsive

- **Desktop:** hero 2-column split; concept + persona cards 4-up; get-started 2-up; FAQ 2-column.
- **Tablet:** hero stacks; cards 2-up.
- **Mobile:** hero stacks; CTAs full-width stacked; all grids single-column; era strip scales down but keeps its toggle ([04](../04-wireframes/01-landing.md)).

## Motion

- **`context-shift`** to `/explore` or `/stories` from a CTA (320ms) ([motion-spec §2](motion-spec.md)).
- **Era strip toggle** swaps scale/bands without an animated tween (content replace); FAQ marker is a short `transform` rotation (`duration-fast`, `ease-standard`).
- **No `fractal-zoom` from the landing** — there are no content cards to originate it (that transition now belongs to `/explore` and card grids). **Reduced-motion:** all instant ([motion-spec §5](motion-spec.md)).
- **Live dot** (in shared chrome) stays static per [motion-spec §2.5](motion-spec.md) — the hi-fi mockup's pulse/teal treatment was **not** adopted ([#395](https://github.com/shaes-farm/time-traveler/issues/395)).

## Accessibility

| #   | Concern          | Spec                                                                                                                                                 |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order      | skip-link → nav → hero headline (`h1`, focus target) → Explore CTA → Read-stories CTA → era-strip toggle → get-started CTAs → FAQ summaries → footer |
| 2   | Landmarks        | `main` wraps content; each section is `aria-labelledby` its heading (or `aria-label` for the strip)                                                  |
| 3   | Contrast         | hero + card titles AA on `--color-surface`/`--color-background`; era codes in mono beside values ([accessibility-spec §3](accessibility-spec.md))    |
| 4   | Never color-only | era hues always paired with mono era-code text / label ([accessibility-spec §6](accessibility-spec.md))                                              |
| 5   | Toggle semantics | era-strip scale toggle exposes `aria-pressed`; FAQ uses native `<details>`/`<summary>` (built-in expanded state, keyboard-operable)                  |
| 6   | Reduced-motion   | CTA `context-shift` and FAQ marker collapse to instant ([motion-spec §5](motion-spec.md))                                                            |
