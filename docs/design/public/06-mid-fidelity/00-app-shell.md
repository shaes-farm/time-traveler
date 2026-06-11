# 00 — App Shell (mid-fidelity)

Builds on: [04 wireframe — App shell](../04-wireframes/00-app-shell.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Resolves for this screen: live-dot visual treatment + reduced-motion fallback (deferred to #172 by [04 app-shell](../04-wireframes/00-app-shell.md)).

> **Implemented (#258).** This spec is realized by the reader shell shipped in #258.
> Composites live in `@repo/ui` as `reader-*` components: `ReaderNav`
> (`banner`/`navigation` + brand + live-dot slot + Sign-in deep-link),
> `ReaderFooter` (`contentinfo`), `ReaderLiveDot` (`ambient-presence`),
> `StaleContentBanner` (the reusable connection-loss primitive), and `SkipLink`.
> They are composed by `apps/reader/app/_components/reader-shell.tsx`, which owns
> pathname resolution and focus-on-navigation. Placement rationale is
> [ADR-0033](../../../adr/adr-0033-reader-shell-composites-in-ui-package.md). The
> sub-640px hamburger focus-trap (#171) and the live-dot/banner final visual
> treatment (#172) remain open per the deferrals below.

**Purpose.** The persistent reader chrome (nav, brand, single Sign-in deep-link, footer, skip-link) — structure fixed in the [04 wireframe](../04-wireframes/00-app-shell.md); this doc fixes its token application, states, motion, and a11y. Distinct from the admin shell ([ADR-0030](../../../adr/adr-0030-public-reader-app-placement.md)/[ADR-0031](../../../adr/adr-0031-public-reader-design-divergence.md)).

## Visual hierarchy + token callouts

- **Bar:** `--color-background` shell, bottom hairline `--color-border-muted`; height ~56px; content max ~1200px with side gutters.
- **Brand:** Display M (Fraunces) wordmark + ⏳ glyph; links home.
- **Nav items** (Explore / Stories / Search): Body M (Inter Tight); default `--color-foreground-muted`, active route `--color-foreground` with a 2px underline accent.
- **Sign in:** Body S, low emphasis, right-aligned; a deep-link out (gates nothing).
- **`ambient-presence` live dot:** 6px dot near the brand; idle = hidden; active subscription = `--color-foreground-subtle`; recent update = brief opacity rise to `--color-foreground-muted` (see Motion); paused = static, no color alarm.
- **Footer:** `--color-background`, top hairline `--color-border-muted`, Body S muted links.

## Component states

| Module         | States                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Nav item       | default (muted) · hover (`--color-foreground`) · focus-visible (`--color-ring`) · active route (underline accent + `aria-current="page"`) |
| Brand / home   | default · hover · focus-visible                                                                                                           |
| Sign in        | default · hover · focus-visible                                                                                                           |
| Mobile menu ☰ | default · focus-visible · open (`aria-expanded`)                                                                                          |
| Live dot       | hidden · subscribed · update · paused (static)                                                                                            |

## System states

- **Loading:** shell renders immediately (SSR-first); only the content viewport shows a route skeleton ([04](../04-wireframes/00-app-shell.md)).
- **Connection-loss:** live dot → static "paused"; stale-content banner pins below the bar ([motion-spec §3](motion-spec.md)); content stays usable.
- **Empty / error:** owned by the wrapped screen, not the shell.

## Responsive

- **Desktop ≥1024px:** full horizontal nav, generous gutters.
- **Tablet 640–1023px:** nav stays horizontal; brand may abbreviate to the mark.
- **Mobile <640px:** nav collapses to brand + ☰; ☰ opens an `enter-exit` panel (Explore/Stories/Search/Sign in) that traps focus; Escape closes and returns focus to ☰ ([04](../04-wireframes/00-app-shell.md); [05](../05-interaction-specification.md)).

## Motion

- **`enter-exit`** — mobile nav panel (320ms in / 120ms out, [motion-spec §2.4](motion-spec.md)).
- **`ambient-presence`** — live dot + stale banner: opacity-only ≤200ms, no pulse/blink ([motion-spec §2.5/§3](motion-spec.md)). **Reduced-motion:** dot updates as a static state change; panel appears/dismisses instantly ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern        | Spec                                                                                                                                              |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order    | skip-link (first focusable) → brand → Explore → Stories → Search → Sign in → [main] → footer ([accessibility-spec §2](accessibility-spec.md))     |
| 2   | Landmarks      | `banner` (bar), `navigation` (nav), `contentinfo` (footer); **Skip to content** targets `main` ([accessibility-spec §2.3](accessibility-spec.md)) |
| 3   | Live region    | live dot + banner are `aria-live="polite"`; announce once ([accessibility-spec §4.3](accessibility-spec.md))                                      |
| 4   | Contrast       | nav muted text + Sign-in meet AA 4.5:1 on `--color-background` ([accessibility-spec §3](accessibility-spec.md))                                   |
| 5   | Reduced-motion | nav panel instant; live dot static ([motion-spec §5](motion-spec.md))                                                                             |
| 6   | Mobile menu    | `aria-expanded`; focus trapped while open; Escape returns focus to trigger                                                                        |
