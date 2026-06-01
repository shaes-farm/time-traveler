# 00 — Public App Shell

**Purpose.** The persistent chrome that wraps every public reader route. It is not a "screen" but a layout primitive: global nav, brand/home affordance, the single unobtrusive "Sign in" deep-link out to the admin/auth surface, theme-fixed dark register, footer, and the skip-to-content link. It **never shares a navigation shell with the admin CMS** ([00](../00-ia-route-model.md) §1 principle 5; [ADR-0030](../../adr/adr-0030-public-reader-app-placement.md)).

**Flows:** all (every flow sits inside this shell).

## Data shown

- Brand mark + home link (static)
- Top-nav destinations: **Explore** (`/explore`), **Stories** (`/stories`), **Search** (`/search`, stubbed)
- Single **Sign in** affordance — a deep-link _out_ to the admin/auth surface (no reader screen is auth-gated; [02](../02-screen-inventory.md) §1)
- `ambient-presence` live-update indicator slot (unobtrusive; [01](../01-ux-principles.md) §6)
- Footer: brand, attribution, legal/links (static)

## Primary actions

- Navigate to Explore / Stories / Search via top nav
- Return home via brand mark
- Skip to main content (keyboard-first affordance, first focusable element)
- Deep-link out to sign-in (does not gate any reader content)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler          Explore   Stories   ⌕ Search          Sign in →    │  ← top nav
├──────────────────────────────────────────────────────────────────────────────┤
│  [ skip to content ]  (visible on focus)                                       │
│                                                                                │
│                                                                                │
│                         [ screen content goes here ]                           │
│                                                                                │
│                         fluid; max reading width ~1200px                       │
│                                                                                │
│                                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  ⏳ Time Traveler · An immersive temporal reader      About · Sign in · Legal  │  ← footer
└──────────────────────────────────────────────────────────────────────────────┘
        · · ·  (a faint "live" dot appears near brand on Realtime update — ambient-presence)
```

## Responsive behavior

- **Desktop (≥1024px):** full horizontal top nav as drawn; destinations inline; content centered with generous side gutters.
- **Tablet (640–1023px):** top nav remains horizontal; side gutters shrink; brand may abbreviate to the mark only.
- **Mobile (<640px):** top nav collapses to a brand mark + a single menu affordance (hamburger) that opens an `enter-exit` panel listing Explore / Stories / Search / Sign in. Skip-to-content remains the first focusable element. Footer links stack vertically.

## Annotations

1. **Distinct from the admin shell.** This chrome shares design _tokens_ (`@repo/ui`, [ADR-0020](../../adr/adr-0020-ui-package-shadcn-tailwind.md) / [ADR-0022](../../adr/adr-0022-design-tokens-dual-source.md)) but is a separate composition — no sidebar, no breadcrumb rail, no authoring affordances ([ADR-0031](../../adr/adr-0031-public-reader-design-divergence.md)). Data: none authored; static chrome.
2. **Three nav destinations only.** Explore / Stories / Search. Search is present but **stubbed** at launch (links to screen 10's "coming soon" frame; [02](../02-screen-inventory.md) §2). No Periods/Characters/Events in the global nav — those are reached contextually (entity cross-links), not as top-level browse surfaces.
3. **Single "Sign in" deep-link.** Per [02](../02-screen-inventory.md) §1, the reader requires no account; this affordance deep-links _out_ to the admin/auth surface and gates nothing. It is visually quiet (right-aligned, low emphasis).
4. **`ambient-presence` indicator.** A faint live dot near the brand signals an active Realtime subscription / recent published-content update ([01](../01-ux-principles.md) §6). It is text/quiet-only, never motion-heavy, and drops all motion under reduced-motion ([03](../03-user-flows.md) accessibility summary). Data: Supabase Realtime subscription state.
5. **Skip-to-content is the first focusable element.** Keyboard path requirement ([01](../01-ux-principles.md) §7; [03](../03-user-flows.md) keyboard variants reference it). Visible on focus, hidden otherwise.
6. **Theme is fixed dark.** No theme toggle in the reader chrome ([ADR-0023](../../adr/adr-0023-dark-mode-only-fidelity-2.md)) — unlike the admin shell, which offers one.
7. **Footer is minimal.** Brand line + About / Sign in / Legal. No sitemap, no entity directories (those would re-introduce admin-style navigation density).

## Edge cases

- **Loading.** Shell renders immediately (SSR-first); only the content viewport shows a route-specific skeleton.
- **Connection loss (Realtime).** The `ambient-presence` dot switches to a quiet "paused" state; content remains usable (SSR content already delivered). Auto-resubscribe on reconnect ([02](../02-screen-inventory.md) §3).
- **Mobile menu open.** The `enter-exit` nav panel traps focus while open; Escape closes it and returns focus to the menu trigger (exact behavior owned by #171).
- **Search stubbed.** The Search nav item is present but routes to the "coming soon" frame (screen 10); it is not hidden, so the IA stays stable when search ships.

## Open questions

> **Resolved (this pass):** Theme toggle — none in the reader (dark-only, [ADR-0023](../../adr/adr-0023-dark-mode-only-fidelity-2.md)). Global nav set — Explore / Stories / Search only; entity types are reached via contextual cross-links, not top-level nav.
>
> Deferred to **#171:** exact mobile-menu focus-trap + Escape behavior; `ambient-presence` indicator placement detail. Deferred to **#172:** live-dot visual treatment + reduced-motion fallback styling.
