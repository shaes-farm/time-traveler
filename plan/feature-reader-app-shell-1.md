---
goal: Public reader app shell + routing skeleton (screen 0) for apps/reader
version: 1.1
date_created: 2026-06-09
last_updated: 2026-06-09
owner: Reader app track (Phase 8 — Public Reader App, milestone #9)
status: "Completed"
tags: [feature, frontend, reader, accessibility, app-shell]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

> **Completed 2026-06-09.** Shell shipped: `@repo/ui` `reader-*` composites
> (nav, footer, live-dot, stale-content banner, skip-link) + 25 unit tests; the
> `apps/reader` shell wrapper, anon Realtime provider, and Explore/Stories/Search
> routing skeleton. Placement decision recorded in
> [ADR-0033](../docs/adr/adr-0033-reader-shell-composites-in-ui-package.md); the
> app-shell mid-fidelity spec carries an "Implemented (#258)" pointer. The full
> `pnpm verify` gate passes, and the reader builds static with no Supabase env.
> Open follow-ups: sub-640px hamburger focus-trap (#171), live-dot/banner final
> visual treatment (#172).

This plan implements GitHub issue **#258 — Public reader app shell + routing skeleton (screen 0)**. It builds the persistent reader chrome (top nav, brand/home, footer, skip-to-content link, single Sign-in deep-link, `ambient-presence` live-dot slot, and a reusable stale-content banner primitive) that wraps every `apps/reader` route. The shell is theme-fixed dark-only (ADR-0023), consumes `@repo/ui` design tokens + the #255 motion classes, and must **never** import or share the admin navigation `Shell` (ADR-0030 / ADR-0031). The scaffold (#254) is already complete; this plan composes the shell on top of it and lands a routing skeleton of placeholder routes so the shell can be verified across navigations. It blocks every other reader screen ticket.

## 1. Requirements & Constraints

- **REQ-001**: Root layout for `apps/reader` renders persistent chrome on every route: top nav (`Explore` / `Stories` / `Search`), brand/home affordance, footer, and skip-to-content link.
- **REQ-002**: Top-nav destinations are exactly three — `Explore` (`/explore`), `Stories` (`/stories`), `Search` (`/search`, stubbed). No Periods/Characters/Events in global nav (`docs/design/public/06-mid-fidelity/00-app-shell.md` annotation 2).
- **REQ-003**: A single, low-emphasis, right-aligned "Sign in" affordance deep-links **out** to the admin/auth surface (`apps/admin` auth route). It gates nothing and triggers no auth flow in the reader.
- **REQ-004**: Landmark structure is `banner` (nav bar), `navigation` (top nav), `main` (content, with a programmatically-focusable `h1`), `contentinfo` (footer) — per accessibility-spec §2.3.
- **REQ-005**: Skip-to-content link is the **first focusable element**, visible only on focus, and targets the `main` landmark (accessibility-spec §2.3; 00-app-shell annotation 5).
- **REQ-006**: On route navigation, focus moves to the destination screen's `main` `h1`, made focusable via `tabindex="-1"` (accessibility-spec §2.2).
- **REQ-007**: Stale-content banner primitive: `aria-live="polite"` region, pinned below the nav bar, with a keyboard-reachable Refresh/reconnect affordance in tab order, **no auto-focus**, announces once on appearance (accessibility-spec §4.3; motion-spec §3). Reused by each data screen.
- **REQ-008**: `ambient-presence` live-dot slot near the brand: hidden (idle) / subscribed / update / paused states; opacity-only motion ≤200ms, never pulse/blink (00-app-shell Motion; motion.css `.ambient-presence`).
- **REQ-009**: Realtime/SSR provider wiring exposes the **anon** Supabase client from `@repo/services` (browser client) to the reader tree. No service-role key.
- **SEC-001**: Reader uses the anon key only. No `SUPABASE_SERVICE_ROLE_KEY` in any reader env, server module, or bundle.
- **CON-001**: Theme is fixed dark-only — no theme toggle (ADR-0023). `color-scheme: dark` already set by `@repo/ui` globals.
- **CON-002**: **No import of the admin navigation shell** (`@repo/ui/components/shell`) or any `apps/admin` route/component. The reader chrome is a separate composition (ADR-0030 / ADR-0031).
- **CON-003**: Reduced-motion is enforced at the token layer (motion.css `@media (prefers-reduced-motion: reduce)`); shell components must rely on the `.ambient-presence` / `.enter-exit` classes rather than hand-rolled durations, so reduced-motion collapses to instant automatically (ADR-0032 IMP-002).
- **CON-004**: Strict TypeScript (`strict`, `strictNullChecks`, `noUncheckedIndexedAccess`); zero-warnings lint (`eslint --max-warnings 0`); ESM only.
- **CON-005**: Coverage threshold is 80% (`pnpm test:coverage`, enforced by the husky pre-push hook). New testable units in this plan live in `@repo/ui` (which has Vitest); `apps/reader` has no test runner.
- **GUD-001**: Run `pnpm format` before staging (husky pre-commit runs `format:check`).
- **GUD-002**: Mirror existing `apps/admin` conventions for fonts/metadata/providers; reuse `@repo/ui` primitives (`button`, `alert`, `skeleton`) rather than introducing new dependencies.
- **PAT-001**: Server Component layout renders static chrome; a thin `"use client"` wrapper owns `usePathname()` for active-route state + focus-on-navigation, mirroring `apps/admin/app/(protected)/_components/protected-shell.tsx`.
- **PAT-002**: Shared, reusable reader composites (nav, footer, stale banner, live dot) are authored in `@repo/ui/components/reader-*` so they are unit-testable and reusable by later screen tickets; `apps/reader` only wires Next-specific adapters (Link, pathname, env).

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Author the reusable, framework-agnostic reader-shell composites in `@repo/ui` (nav, footer, live dot, stale-content banner, skip link), unit-tested and a11y-correct, with no Next.js coupling.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Create `packages/ui/src/components/reader-nav.tsx`: a `ReaderNav` presentational component rendering `<header role="banner">` with brand/home, a `<nav aria-label="Primary">` containing `Explore`/`Stories`/`Search`, the `ambient-presence` live-dot slot, and the Sign-in deep-link. Props: `currentPath: string`, `signInHref: string`, `LinkComponent` (generic link adapter, typed like `apps/admin/components/shell-link.tsx`), `liveState: "hidden" \| "subscribed" \| "update" \| "paused"`. Active item gets `aria-current="page"` + underline accent; uses `--color-foreground-muted` default / `--color-foreground` active per 00-app-shell token callouts. |           |      |
| TASK-002 | Create `packages/ui/src/components/reader-footer.tsx`: a `ReaderFooter` rendering `<footer role="contentinfo">` with brand line + About / Sign in / Legal links via the same `LinkComponent` prop. Body S muted links, top hairline `--color-border-muted` (00-app-shell annotation 7).                                                                                                                                                                                                                                                                                                                                                                                 |           |      |
| TASK-003 | Create `packages/ui/src/components/reader-live-dot.tsx`: a 6px `LiveDot` consuming the `.ambient-presence` class; `hidden` → not rendered/opacity 0, `subscribed` → `--color-foreground-subtle`, `update` → brief opacity rise to `--color-foreground-muted`, `paused` → static. Opacity-only, no pulse/blink (00-app-shell §Live dot; motion.css).                                                                                                                                                                                                                                                                                                                     |           |      |
| TASK-004 | Create `packages/ui/src/components/stale-content-banner.tsx`: a `StaleContentBanner` primitive. Renders an `aria-live="polite"` region (`role="status"`) using the `.ambient-presence` class, pinned-below-bar styling, banner **text** (never color-only), and a Refresh button (reuse `@repo/ui/components/button`) in tab order. Props: `state: "hidden" \| "stale" \| "reconnecting"`, `message: string`, `onRefresh: () => void`. **No auto-focus**; announces once on appearance.                                                                                                                                                                                 |           |      |
| TASK-005 | Create `packages/ui/src/components/skip-link.tsx`: a `SkipLink` rendering an anchor to `#main-content`, visually hidden until `:focus-visible`, then revealed. First-focusable contract documented in the component.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |           |      |
| TASK-006 | Add Vitest unit tests next to each component: `reader-nav.test.tsx` (active-route `aria-current`, three nav items, Sign-in href, banner landmark role), `reader-footer.test.tsx` (contentinfo role + links), `stale-content-banner.test.tsx` (`aria-live="polite"`, Refresh in tab order, no focus stealing on appearance, hidden state renders nothing), `reader-live-dot.test.tsx` (state→class mapping), `skip-link.test.tsx` (href target + hidden-until-focus). Keep `@repo/ui` coverage ≥80%.                                                                                                                                                                     |           |      |

### Implementation Phase 2

- GOAL-002: Compose the shell in `apps/reader` — wire the Next.js root layout, the client shell wrapper (pathname + focus-on-nav), the anon Supabase Realtime/SSR provider, and the routing skeleton of placeholder routes.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-007 | Create `apps/reader/components/reader-link.tsx`: a Next.js `Link` adapter matching the `LinkComponent` prop contract used by the `@repo/ui` reader composites (mirror `apps/admin/components/shell-link.tsx`).                                                                                                                                                                                                                                                                       |           |      |
| TASK-008 | Create `apps/reader/lib/nav.ts`: export `READER_NAV_ITEMS` (`Explore`→`/explore`, `Stories`→`/stories`, `Search`→`/search`) and `SIGN_IN_HREF` (deep-link to the admin auth surface; derive from an env var `NEXT_PUBLIC_ADMIN_URL` with a sane fallback, e.g. `http://localhost:3000/auth/login`). Add `NEXT_PUBLIC_ADMIN_URL` to `.env.local.example`.                                                                                                                             |           |      |
| TASK-009 | Create `apps/reader/app/_components/reader-shell.tsx` (`"use client"`): reads `usePathname()`, mounts `ReaderNav` + `StaleContentBanner` (hidden by default at this stage) + `<main id="main-content" tabIndex={-1}>{children}</main>` + `ReaderFooter`. On pathname change, move focus to the destination `h1` (or the `main` landmark) per REQ-006, independent of motion. Pass `READER_NAV_ITEMS`, `SIGN_IN_HREF`, `ReaderLink`. Does **not** import `@repo/ui/components/shell`. |           |      |
| TASK-010 | Update `apps/reader/app/layout.tsx`: keep fonts + metadata; wrap `{children}` in `Providers` then `ReaderShell`, so chrome persists on every route. Ensure `<html lang="en">` retains the font CSS variables and dark register (already set).                                                                                                                                                                                                                                        |           |      |
| TASK-011 | Update `apps/reader/app/providers.tsx`: keep `QueryClientProvider`; add a `ReaderRealtimeProvider` (new `apps/reader/app/_components/realtime-provider.tsx`, `"use client"`) that instantiates the anon **browser** Supabase client via `@repo/services` `supabase/client` and exposes it through context for screen-level subscriptions. No subscriptions started here (each screen owns its own — issue Non-Goals).                                                                |           |      |
| TASK-012 | Update `apps/reader/app/page.tsx`: strip the scaffold placeholder card; render a minimal landing `main` body with a focusable `<h1 tabIndex={-1}>` so the shell + focus-on-nav are demonstrable. (Full landing screen is a separate ticket.)                                                                                                                                                                                                                                         |           |      |
| TASK-013 | Create routing-skeleton placeholder routes so navigation across the persistent shell is verifiable: `apps/reader/app/explore/page.tsx`, `apps/reader/app/stories/page.tsx`, `apps/reader/app/search/page.tsx`. Each exports a server component with a single focusable `<h1 tabIndex={-1}>` and a one-line "coming soon" body. `Search` notes it is stubbed (00-app-shell annotation 2; screen-inventory §3 row 10).                                                                 |           |      |
| TASK-014 | Verify `apps/reader/app/not-found.tsx` renders inside the shell with a focusable `h1`; adjust the existing `<main>` so it does not double-wrap the shell's `main` landmark (it should render shell-`main` content, not its own `role="main"`).                                                                                                                                                                                                                                       |           |      |

### Implementation Phase 3

- GOAL-003: Validate accessibility, reduced-motion, anon-only access, and the full `pnpm verify` gate; document the shell.

| Task     | Description                                                                                                                                                                                                                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-015 | Manual a11y pass: tab order is skip-link → brand → Explore → Stories → Search → Sign in → main → footer (accessibility-spec §2.1 / 00-app-shell §Accessibility row 1). Skip-link reveals on first Tab and jumps to `main`. Focus lands on destination `h1` on navigation.                                           |           |      |
| TASK-016 | Manual reduced-motion pass: enable OS `prefers-reduced-motion: reduce`; confirm live-dot updates and stale-banner appearance are instant (no transition), via the token-layer collapse in motion.css.                                                                                                               |           |      |
| TASK-017 | Confirm anon-only: grep the reader workspace for `SERVICE_ROLE`; confirm none present, `.env.local.example` carries only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ `NEXT_PUBLIC_ADMIN_URL`). Confirm no import path resolves into `apps/admin` or `@repo/ui/components/shell` (grep imports). |           |      |
| TASK-018 | Run `pnpm format`, then `pnpm run check-types`, `pnpm run lint`, `pnpm run test:coverage`, `pnpm run build` (or `pnpm verify`). All must pass with the reader workspace included.                                                                                                                                   |           |      |
| TASK-019 | Update `apps/reader/README.md` with a short "App shell" section: landmark map, the reusable `@repo/ui/components/reader-*` + `stale-content-banner` primitives, and the "never import the admin shell" rule.                                                                                                        |           |      |

## 3. Alternatives

- **ALT-001**: Author the nav/footer/banner directly inside `apps/reader/app` (no `@repo/ui` composites). Rejected: later reader screen tickets reuse the stale-content banner and live dot, and `apps/reader` has no Vitest runner — putting the logic in `@repo/ui` makes it reusable and unit-testable (CON-005, PAT-002).
- **ALT-002**: Reuse the admin `Shell` (`@repo/ui/components/shell`) with reader props. Rejected outright — violates ADR-0030 / ADR-0031 and issue acceptance criterion "No import of the admin navigation shell." The reader chrome is a distinct composition (no sidebar, breadcrumb, or authoring affordances).
- **ALT-003**: Implement the mobile hamburger focus-trap menu now. Deferred: exact mobile-menu focus-trap + Escape behavior is owned by #171 (00-app-shell open questions); this ticket provides responsive structure but the trap detail is out of scope. Build the breakpoint structure; leave the trap to #171.
- **ALT-004**: Start a Realtime subscription in the shell provider. Rejected per issue Non-Goals — each screen owns its own subscription; this ticket only provides the anon client provider + the banner primitive.

## 4. Dependencies

- **DEP-001**: #254 (apps/reader scaffold) — **complete** (closed); provides package, fonts, providers, globals, tsconfig.
- **DEP-002**: #255 (motion tokens + classes) — **complete** (merged, commits 01f0d0d / 9bbe783); provides `packages/ui/src/styles/motion.css` (`.ambient-presence`, `.enter-exit`, reduced-motion collapse) consumed via `@repo/ui/styles/globals.css`.
- **DEP-003**: `@repo/services` anon Supabase clients — `packages/services/src/supabase/client.ts` (browser) and `server.ts` (SSR), both anon-key only.
- **DEP-004**: `@repo/ui` primitives — `components/button.tsx`, `components/alert.tsx`, `components/skeleton.tsx`, `styles/tokens.css`, `styles/motion.css`.
- **DEP-005**: ADR-0023 (dark-only), ADR-0030 (reader app placement), ADR-0031 (reader design divergence), ADR-0032 (motion tokens / reduced-motion contract).
- **DEP-006**: `@tanstack/react-query` (already a reader dependency) for the QueryClientProvider.

## 5. Files

- **FILE-001**: `packages/ui/src/components/reader-nav.tsx` — new; `banner`/`navigation` chrome, brand, three nav items, Sign-in deep-link, live-dot slot.
- **FILE-002**: `packages/ui/src/components/reader-footer.tsx` — new; `contentinfo` footer.
- **FILE-003**: `packages/ui/src/components/reader-live-dot.tsx` — new; `ambient-presence` live dot.
- **FILE-004**: `packages/ui/src/components/stale-content-banner.tsx` — new; reusable `aria-live="polite"` stale-content banner primitive.
- **FILE-005**: `packages/ui/src/components/skip-link.tsx` — new; first-focusable skip-to-content link.
- **FILE-006**: `packages/ui/src/components/{reader-nav,reader-footer,reader-live-dot,stale-content-banner,skip-link}.test.tsx` — new; Vitest unit tests.
- **FILE-007**: `apps/reader/components/reader-link.tsx` — new; Next.js Link adapter.
- **FILE-008**: `apps/reader/lib/nav.ts` — new; `READER_NAV_ITEMS` + `SIGN_IN_HREF`.
- **FILE-009**: `apps/reader/app/_components/reader-shell.tsx` — new; client shell wrapper (pathname + focus-on-nav).
- **FILE-010**: `apps/reader/app/_components/realtime-provider.tsx` — new; anon browser-client context provider.
- **FILE-011**: `apps/reader/app/layout.tsx` — modify; wrap children in Providers + ReaderShell.
- **FILE-012**: `apps/reader/app/providers.tsx` — modify; add ReaderRealtimeProvider.
- **FILE-013**: `apps/reader/app/page.tsx` — modify; minimal landing with focusable `h1`.
- **FILE-014**: `apps/reader/app/explore/page.tsx`, `apps/reader/app/stories/page.tsx`, `apps/reader/app/search/page.tsx` — new; routing-skeleton placeholders.
- **FILE-015**: `apps/reader/app/not-found.tsx` — modify; render inside shell, single `main` landmark.
- **FILE-016**: `apps/reader/.env.local.example` (or repo root `.env.local.example`) — modify; add `NEXT_PUBLIC_ADMIN_URL`.
- **FILE-017**: `apps/reader/README.md` — modify; App shell documentation.

## 6. Testing

- **TEST-001**: `reader-nav.test.tsx` — renders `banner` + `navigation` landmarks; exactly three nav items; active route gets `aria-current="page"`; Sign-in renders the provided `signInHref`.
- **TEST-002**: `stale-content-banner.test.tsx` — region is `aria-live="polite"`; Refresh button is keyboard-reachable and in tab order; appearance does **not** move focus; `hidden` state renders no live content; banner text present (never color-only).
- **TEST-003**: `reader-footer.test.tsx` — `contentinfo` role; About/Sign in/Legal links resolve via `LinkComponent`.
- **TEST-004**: `reader-live-dot.test.tsx` — state→class/color mapping (`hidden`/`subscribed`/`update`/`paused`); uses `.ambient-presence`; no pulse/blink animation declared.
- **TEST-005**: `skip-link.test.tsx` — targets `#main-content`; hidden until focus; is first in DOM order.
- **TEST-006**: Coverage — `pnpm test:coverage` stays ≥80% across `@repo/ui`.
- **TEST-007** (manual): Navigate `/` → `/explore` → `/stories` → `/search`; shell persists, skip-link works, focus lands on each `h1`.
- **TEST-008** (manual): OS reduced-motion on — banner/live-dot transitions are instant.
- **TEST-009** (CI gate): `pnpm verify` (format / lint / check-types / test:coverage / build) green with `apps/reader` included.

## 7. Risks & Assumptions

- **RISK-001**: Focus-on-navigation in the App Router can fire before the destination `h1` mounts, or steal focus from in-page anchors. Mitigation: move focus in an effect keyed on `pathname`, target `main`/`h1` only, and guard against re-running on same-path renders.
- **RISK-002**: Double `main` landmark — placeholder pages currently use their own `<main>`; the shell now owns `main`. Mitigation: pages render heading/content only; shell provides the single `main` (TASK-014).
- **RISK-003**: `apps/reader` has no Vitest runner, so reader-local components are untested. Mitigation: put testable logic in `@repo/ui` (PAT-002); keep reader files as thin adapters.
- **RISK-004**: Sign-in deep-link target may differ between local/prod admin URLs. Mitigation: drive from `NEXT_PUBLIC_ADMIN_URL` env with a documented fallback (TASK-008).
- **ASSUMPTION-001**: The motion classes from #255 (`.ambient-presence`, reduced-motion token collapse) are available to `apps/reader` because its `globals.css` imports `@repo/ui/styles/globals.css`, which imports `motion.css`. (Verified in `packages/ui/src/styles/globals.css`.)
- **ASSUMPTION-002**: The mobile hamburger focus-trap full behavior is deferred to #171; this ticket lands the responsive structure and breakpoints only.
- **ASSUMPTION-003**: The `ambient-presence` live-dot is wired as a presentational slot driven by a prop; no Realtime subscription is started in the shell (Non-Goals) — the dot stays `hidden` until a screen drives it.

## 8. Related Specifications / Further Reading

- GitHub issue #258 — Public reader app shell + routing skeleton (screen 0)
- GitHub issue #254 — Scaffold apps/reader (foundation); #255 — motion tokens; #171/#172 — deferred mobile-menu + live-dot detail
- `docs/design/public/06-mid-fidelity/00-app-shell.md` — mid-fidelity app-shell spec (tokens, states, motion, a11y)
- `docs/design/public/04-wireframes/00-app-shell.md` — app-shell wireframe + annotations
- `docs/design/public/06-mid-fidelity/accessibility-spec.md` — focus order, landmarks, live-region verbosity, reduced-motion catalog
- `docs/design/public/02-screen-inventory.md` §3 — system states incl. connection-loss / stale-content banner scope
- `docs/design/public/06-mid-fidelity/motion-spec.md` §2.5/§3/§5 — `ambient-presence` + reduced-motion contract
- ADR-0023 (dark-mode-only), ADR-0030 (reader app placement), ADR-0031 (reader design divergence), ADR-0032 (reader motion tokens)
- Reference implementation pattern: `apps/admin/app/(protected)/_components/protected-shell.tsx`, `apps/admin/components/shell-link.tsx`
