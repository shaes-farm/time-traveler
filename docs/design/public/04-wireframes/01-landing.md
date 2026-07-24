# 01 — Landing / Discovery

> **Reconciled to the hi-fi final (2026-07-20).** This wireframe was revised to
> match `../08-high-fidelity/Time_Traveler_Landing_Final.html` (implemented in
> `apps/reader/app/page.tsx`, PR #396). The earlier draft surfaced featured +
> recent published-content rails; the hi-fi final replaces those with an
> interactive era timeline strip and introductory/explanatory sections. The
> rails are **not** planned — the landing is deliberately introductory, not a
> content index (discovery lives in `/explore` and `/stories`). Divergence
> history: [#395](https://github.com/shaes-farm/time-traveler/issues/395).

**Purpose.** The reader's front door (`/`). Presents the **dual call-to-action** into both entry philosophies — timeline-first (Explore) and story-first (Stories) — and orients a first-time visitor with a short introduction to what the reader is and how it works, so they have an immediate path inward (PRD §2.2.1; [02](../02-screen-inventory.md) §2 screen 1).

**Flows:** F1 (timeline-first entry), F3 (story-first entry).

## Data shown

The landing is **static/introductory — it fetches no published content.** All copy is authored in the design and the components; there are no data-driven rails.

- Hero: kicker, headline, sub, and dual CTA — **Explore** → `/explore`, **Read stories** → `/stories`
- Era timeline strip: an illustrative all-of-time axis (Big Bang → present) with a log/linear scale toggle and era bands — a preview of the visualization idea, not live timeline data
- "How it works": four feature cards (Fractal zoom · Hybrid time · Characters · Stories)
- "Who it's for": four persona cards (Educators · Researchers · Storytellers · The curious)
- "Get started": the read-vs-author split
- FAQ: four common questions

## Primary actions

- Enter timeline-first path (Explore CTA / nav) → `/explore`
- Enter story-first path (Stories CTA / nav) → `/stories`
- Toggle the era strip's log/linear scale (illustrative only; no navigation)
- Deep-link **out** to authoring (Create an account / Sign in) — the reader is anonymous and gates nothing ([00 app-shell](00-app-shell.md) annotation 3)
- (All within the shell from [00](00-app-shell.md))

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏱ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  13.8 BILLION YEARS · ONE CONTINUOUS MAP                                       │  ← kicker (mono)
│                                                                                │
│  See all of time at once —      An immersive reader for published timelines    │  ← hero
│  then zoom in.                  and stories. Drag across eras, drill into any   │
│                                 moment, follow the threads that connect them.   │
│                                 [ Explore → ]   [ Read stories ]                │  ← dual CTA
│                                                                                │
│  ┌──────────────────────────── era timeline strip ─────────────────────────┐  │  ← EraTimelineStrip
│  │ BYA         MYA         KYA         BCE · CE                 [ log |linear]│  │    (interactive,
│  │   •13.8 BYA    •540 MYA    •12 KYA    •44 BCE     •1969 CE                │  │     client-only)
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ── How it works ───────────────────────────────────────────────────────────  │
│  01 Fractal zoom   02 Hybrid time   03 Characters   04 Stories                 │  ← 4 feature cards
│                                                                                │    (era-hued top rule)
│  ── Every question reveals a different landscape ───────────────────────────   │
│  [ Educators ]   [ Researchers ]   [ Storytellers ]   [ The curious ]          │  ← 4 persona cards
│                                                                                │
│  ── Come find it. Come make it visible. ────────────────────────────────────  │
│  ┌ Read & explore ──────────────┐   ┌ Author & publish ──────────────┐         │  ← get-started split
│  │ No account needed            │   │ Build your own                 │         │
│  │ [ Explore → ] [ Read stories]│   │ [ Create an account → ]  Sign in│         │
│  └──────────────────────────────┘   └────────────────────────────────┘         │
│                                                                                │
│  Questions                                                                     │
│  ⌄ Do I need an account?          ⌄ Timeline vs. story?                        │  ← FAQ (<details>)
│  ⌄ How far back does it go?       ⌄ What is fractal navigation?                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile frame (structural reflow)

```
┌────────────────────────┐
│ ⏱  TT           ☰      │
├────────────────────────┤
│ 13.8 BILLION YEARS ·   │  ← kicker
│                        │
│ See all of time at     │  ← hero stacks
│ once — then zoom in.   │
│ An immersive reader…   │
│ [ Explore →          ] │  ← CTAs stack,
│ [ Read stories       ] │    full-width
│                        │
│ ┌── era strip ───────┐ │  ← strip scales down,
│ │ •  •   •  • [lg|ln]│ │    toggle stays
│ └────────────────────┘ │
│ ── How it works        │
│ 01 Fractal zoom        │  ← cards 1-up
│ 02 Hybrid time         │
│ …                      │
│ ── Who it's for        │
│ [ Educators ] …        │  ← cards 1-up
│ ── Get started         │
│ ┌ Read & explore ────┐ │  ← split stacks
│ └────────────────────┘ │
│ ┌ Author & publish ──┐ │
│ └────────────────────┘ │
│ Questions              │
│ ⌄ Do I need an account?│
└────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** hero is a 2-column split (headline | sub + CTA); feature and persona cards are 4-up; the get-started split is 2-up; FAQ is 2-column.
- **Tablet (640–1023px):** hero stacks; feature/persona cards drop to 2-up; get-started and FAQ stay 2-up where space allows.
- **Mobile (<640px):** hero stacks; CTAs stack full-width; all card grids and the get-started split collapse to a single column; the era strip scales down but keeps its toggle.

## Annotations

1. **Dual CTA is the load-bearing decision.** The two entry philosophies are equal-weight ([00](../00-ia-route-model.md) §5.3; [01](../01-ux-principles.md)). Neither is primary; the hero presents both. This is the fork into F1 (Explore) vs. F3 (Stories). "Explore" is visually the primary button and "Read stories" the secondary, but both are first-class entries and reappear in the Get-started split.
2. **The landing is introductory, not a content index.** By design it fetches no published rows — no featured/recent rails. First-time orientation (what the reader is, how it works, who it's for) is the job here; browsing published content is the job of `/explore` and `/stories`. This is a deliberate scope decision, not a stub.
3. **The era timeline strip is illustrative.** `EraTimelineStrip` (`@repo/ui`) plots fixed sample markers from the Big Bang to the present with a log/linear toggle and era bands — a taste of the visualization language, **not** the real renderer (#65–#69) and not driven by data. Era hues always travel with their mono era-code text, never color-alone ([accessibility-spec §6](../06-mid-fidelity/accessibility-spec.md)).
4. **"How it works" teaches the four load-bearing concepts.** Fractal zoom, hybrid time (era + precision — e.g. `13.8 BYA`, `44 BCE`), the seven character types, and stories-over-events. Each card's top rule uses a reserved era hue.
5. **Read is open; authoring deep-links out.** The Get-started split keeps reading in-app (Explore / Read stories) and sends authoring **out** to the admin/auth surface as plain anchors (`Create an account`, `Sign in`) — the reader is anonymous ([00 app-shell](00-app-shell.md) annotation 3).
6. **No search box on landing.** Discovery here is introductory; full search is stubbed (screen 10). The Search nav item is the only search surface at launch.
7. **FAQ is native `<details>`/`<summary>`.** No JS, no client boundary; the `+`/`×` marker rotates on open. Everything on the page except the era strip is a server component.

## Edge cases

- **No data dependency.** Because the landing fetches nothing, it has no empty / loading / error / connection-loss states — it renders identically regardless of what is published. (Those states live on `/explore`, `/stories`, and the entity screens.)
- **Reduced motion.** The era strip's scale toggle swaps content without animated transitions; the FAQ marker rotation is a short transform that respects the global reduced-motion rules ([motion-spec §5](../06-mid-fidelity/motion-spec.md)).

## Open questions

> **Resolved:** No rails on landing (introductory-only; discovery lives in `/explore` + `/stories`). No search box on landing (search stubbed, screen 10). Dual CTA equal-weight (no default-primary path). Hero/section typography and the amber accent are fixed by the hi-fi final ([ADR-0038](../../../adr/adr-0038-amber-primary-accent.md)).
>
> **Post-MVP (candidate, not scheduled):** a link to the documentation app (`docs`, :3001) surfaced in the shared reader chrome (nav/footer) rather than on the landing specifically — so every reader page can reach usage docs. Tracked separately.
