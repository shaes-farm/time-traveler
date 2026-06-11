---
title: "ADR-0033: Reader shell composites live in @repo/ui (reader-* components), not in apps/reader"
status: "Accepted"
date: "2026-06-09"
authors: "shaes-farm"
tags: ["design-system", "public-reader", "app-shell", "ui-package", "testing"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0033: Reader shell composites live in @repo/ui (reader-\* components), not in apps/reader

## Status

**Accepted**

## Context

[ADR-0030](adr-0030-public-reader-app-placement.md) places the public reader in
a dedicated `apps/reader` app, and [ADR-0031](adr-0031-public-reader-design-divergence.md)
fixes that the reader **never shares the admin navigation shell** — it is a
separate composition over the shared `@repo/ui` tokens/primitives. Neither ADR
says **where the reader's own shell composition lives**: directly inside
`apps/reader/app`, or as reusable components in `@repo/ui`.

Issue #258 (reader app shell + routing skeleton, screen 0) is the first ticket
to build that chrome, and it does so under three constraints that force the
question:

- The shell's **stale-content banner** and **`ambient-presence` live dot** are
  explicitly **reused by every data screen** (screen-inventory §3; #258 ships
  the primitives, the screen tickets #65–#69 wire them).
- `apps/reader` (like `apps/admin`) **has no test runner** — Vitest runs only in
  `packages/ui` and `packages/services`, and the husky pre-push hook enforces an
  80% coverage threshold. Logic placed in `apps/reader` is effectively untested.
- The reader chrome must stay **framework-decoupled from the admin shell**
  (ADR-0031) while still consuming the shared design tokens.

The established precedent for shared chrome is the admin `Shell`
([`packages/ui/src/components/shell.tsx`](../../packages/ui/src/components/shell.tsx)):
a framework-agnostic component in `@repo/ui` with a `LinkComponent` slot, mounted
by a thin app-level wrapper
([`apps/admin/app/(protected)/_components/protected-shell.tsx`](<../../apps/admin/app/(protected)/_components/protected-shell.tsx>))
that supplies `next/link` and `usePathname()`.

## Decision

The reader's shell composites are authored in **`@repo/ui` as `reader-*`
components**, and `apps/reader` contributes only the **thin Next.js adapters**
(link adapter, pathname + focus-on-navigation wrapper, env-derived config, and
the route tree).

Concretely:

- **In `@repo/ui/components`:** `reader-nav`, `reader-footer`, `reader-live-dot`,
  `stale-content-banner`, `skip-link`, and the framework-agnostic link contract
  `reader-link` (`ReaderLinkProps` / `ReaderLinkComponent` / `DefaultReaderLink`).
  These are presentational, server-renderable, carry their own unit tests, and
  take a generic `LinkComponent` slot. They depend only on shared tokens, the
  motion classes ([ADR-0032](adr-0032-public-reader-motion-tokens.md)), and
  existing `@repo/ui` primitives.
- **In `apps/reader`:** `components/reader-link.tsx` (`next/link` adapter),
  `app/_components/reader-shell.tsx` (`"use client"` wrapper that resolves
  `usePathname()` and moves focus to the destination `h1` on navigation),
  `app/_components/realtime-provider.tsx` (anon browser-client context), and
  `lib/nav.ts` (the nav model + admin-deep-link config).

The reader composites are a **separate family** from the admin `Shell` — a
dedicated `reader-link` contract rather than reuse of `ShellLinkProps` — so the
"reader never imports the admin shell" rule (ADR-0031) holds at the import level,
not merely by convention.

## Consequences

### Positive

- **POS-001**: The reused primitives (stale-content banner, live dot) are
  unit-tested and counted toward the 80% coverage gate, instead of living
  untested in `apps/reader`.
- **POS-002**: Screen tickets (#65–#69) import the banner + live dot directly
  from `@repo/ui` without a later extraction/move.
- **POS-003**: The admin/reader separation (ADR-0031) is enforced structurally —
  the reader composites are their own module family with their own link contract,
  so there is no path by which the reader pulls in the admin `Shell`.
- **POS-004**: Mirrors the proven admin pattern (framework-agnostic component +
  thin app wrapper), keeping the monorepo's chrome conventions consistent.

### Negative

- **NEG-001**: Reader-specific presentation now lives in the shared package, so
  `@repo/ui` carries app-specific (reader) composites, not only generic
  primitives. Mitigated by the `reader-*` naming prefix making ownership obvious.
- **NEG-002**: Two link contracts now exist (`ShellLinkProps` and
  `ReaderLinkProps`) with near-identical shape. This is intentional duplication
  to keep the surfaces decoupled (ADR-0031), accepted over a shared base type.
- **NEG-003**: Truly app-local, non-Next-specific reader UI must still make a
  placement judgment; this ADR sets the default (shared, reusable → `@repo/ui`;
  Next-coupled glue → `apps/reader`) but does not mechanically decide every case.

## Alternatives Considered

### Option A (rejected) — Build the shell entirely inside apps/reader

- **ALT-001**: **Description**: Author nav/footer/banner/live-dot/skip-link as
  components under `apps/reader/app/_components`, colocated with the route tree.
- **ALT-002**: **Rejection reason**: `apps/reader` has no Vitest runner, so the
  reused primitives would ship untested under an 80% gate; and the banner + live
  dot — explicitly reused by sibling screen tickets — would need a later move to
  `@repo/ui` to be shared, churning imports.

### Option B (rejected) — Reuse the admin Shell with reader props

- **ALT-003**: **Description**: Parameterize `packages/ui/src/components/shell.tsx`
  to render a reader variant (no sidebar/breadcrumb) via props.
- **ALT-004**: **Rejection reason**: Directly violates ADR-0030/ADR-0031 ("the
  reader never shares the admin navigation shell") and the #258 acceptance
  criterion "No import of the admin navigation shell." It would also couple the
  two surfaces' evolution.

## Implementation Notes

- **IMP-001**: The reader composites consume only shared tokens + the motion
  classes; reduced-motion is inherited from the token-layer collapse in
  [`motion.css`](../../packages/ui/src/styles/motion.css)
  ([ADR-0032](adr-0032-public-reader-motion-tokens.md) IMP-002), not re-specified
  per component. The live dot and stale banner use `.ambient-presence`
  (opacity-only; never pulse/blink).
- **IMP-002**: Focus-on-navigation lives in the app wrapper (`reader-shell.tsx`),
  not the composites, because it requires `usePathname()`; the `main` landmark is
  programmatically focusable (`tabindex="-1"`) and the destination `h1` receives
  focus at the static end state (accessibility-spec §2.2).
- **IMP-003**: The anon Supabase client is created **lazily after mount** via a
  dynamic import inside an effect (`realtime-provider.tsx`), so the module-level
  env-var guard in `@repo/services/supabase/client` never runs during
  SSR/prerender — otherwise the static landing route (`/`) fails to build in an
  env-less CI. Reader access is anon-only; no service-role path exists in
  `apps/reader`.
- **IMP-004**: Future reader screen tickets import the banner/live-dot from
  `@repo/ui/components/*` and drive their state from per-screen subscriptions;
  #258 starts no subscriptions (provider + primitives only).

## References

- **REF-001**: [ADR-0030](adr-0030-public-reader-app-placement.md) — dedicated
  `apps/reader`; the two surfaces never share a navigation shell.
- **REF-002**: [ADR-0031](adr-0031-public-reader-design-divergence.md) — reader
  reuses shared tokens, diverges in composition; nav shell is never shared.
- **REF-003**: [ADR-0032](adr-0032-public-reader-motion-tokens.md) — motion-token
  scale + reduced-motion contract consumed by the reader composites.
- **REF-004**: [ADR-0020](adr-0020-ui-package-shadcn-tailwind.md) — `@repo/ui`
  design system; the home for shared components.
- **REF-005**: [`docs/design/public/06-mid-fidelity/00-app-shell.md`](../design/public/06-mid-fidelity/00-app-shell.md)
  — app-shell mid-fidelity spec implemented by these composites.
- **REF-006**: [`docs/design/public/06-mid-fidelity/accessibility-spec.md`](../design/public/06-mid-fidelity/accessibility-spec.md)
  — focus order, landmarks, live-region rules.
- **REF-007**: [Issue #258](https://github.com/shaes-farm/time-traveler/issues/258)
  — Public reader app shell + routing skeleton (screen 0).
- **REF-008**: `packages/ui/src/components/shell.tsx` +
  `apps/admin/app/(protected)/_components/protected-shell.tsx` — the admin
  precedent this pattern mirrors.
