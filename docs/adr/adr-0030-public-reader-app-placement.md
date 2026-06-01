---
title: "ADR-0030: Public reader lives in a dedicated apps/reader Next.js application"
status: "Accepted"
date: "2026-05-31"
authors: "shaes-farm"
tags: ["routing", "public-reader", "monorepo", "app-placement", "architecture"]
supersedes: ""
superseded_by: ""
amends: "0003"
amended_by: ""
---

# ADR-0030: Public reader lives in a dedicated `apps/reader` Next.js application

## Status

**Accepted** — amends [ADR-0003](adr-0003-nextjs-app-router-react19.md) (app-split model).

## Context

[ADR-0003](adr-0003-nextjs-app-router-react19.md) established the monorepo app split:
`apps/admin` (authoring CMS) and `apps/docs` (project documentation). It noted a "future
public reader surface" but left its placement unresolved — the route groups `(public)`,
`(protected)`, and `(admin)` defined in `apps/admin` were placeholders for that future work.

The public reader IA is now defined in
[`docs/design/public/00-ia-route-model.md`](../design/public/00-ia-route-model.md). It
establishes two incompatible shells:

- **Admin shell** — dense authoring chrome, keyboard-first, table-centric, no immersive
  scroll/zoom. Principle 5 of the reader IA states: "Reader ≠ admin. They share design tokens
  but diverge in motion and composition. The two must **never** share a navigation shell."
- **Reader shell** — immersive, anonymous-first, scroll-and-zoom, fractal timeline canvas
  (PRD §2.2.2–2.2.3), Realtime published-content updates (PRD §2.2.10).

Placing the reader inside `apps/admin` would require sharing a Next.js layout hierarchy with
admin-authoring chrome, creating an ongoing structural pressure to re-entangle the two shells.
The `(public)` route group inside `apps/admin` would also load the admin bundle's dependencies
on every public page, undermining the reader's performance profile.

## Decision

The public reader is implemented as a **dedicated `apps/reader` Next.js application** within
the existing pnpm monorepo:

```
apps/
├── admin/    # CMS / authoring — (protected) + (admin) route groups
├── docs/     # Project documentation
└── reader/   # Public reader — (public) route group; anonymous by default
```

Key implications of this split:

- `apps/reader` is a new pnpm workspace entry with package name `reader`.
- Shared packages (`@repo/ui`, `@repo/services`, `@repo/typescript-config`,
  `@repo/eslint-config`) are the code-sharing mechanism — not a shared Next.js layout.
- The reader gets its own Vercel project and deployment pipeline, independent of `apps/admin`.
- `apps/admin` retains its `(protected)` and `(admin)` route groups. The `(public)` placeholder
  route group in `apps/admin` is removed when `apps/reader` is scaffolded.
- The reader requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in its
  environment; it never receives `SUPABASE_SERVICE_ROLE_KEY` (no server-side privileged access).

## Consequences

### Positive

- **POS-001**: Each app has a single-purpose shell; no structural entanglement between authoring
  chrome and the reader's immersive layout.
- **POS-002**: Bundle isolation — admin-specific dependencies (TanStack Query mutation hooks,
  form libraries, rich-text editor) never ship to reader visitors.
- **POS-003**: Independent Vercel deployments allow the reader to be deployed, scaled, or
  rolled back independently of the admin app.
- **POS-004**: Clear ownership boundary — `apps/reader/` is unambiguously the public surface;
  no ambiguity about which route group owns what.
- **POS-005**: Aligns with the reader-IA principle that the reader and admin "must never share a
  navigation shell" (§1 principle 5, `00-ia-route-model.md`).

### Negative

- **NEG-001**: One additional pnpm workspace app to maintain (CI target, Turborepo task graph
  entry, Vercel project, environment variable configuration).
- **NEG-002**: Code duplication risk for thin utility wrappers not yet extracted to shared
  packages. Mitigation: promote any shared patterns to `@repo/ui` or `@repo/services` early.
- **NEG-003**: A reader-side server action that needs `SUPABASE_SERVICE_ROLE_KEY` (e.g., a
  future authenticated reader feature) would require revisiting the env-var policy.

## Alternatives Considered

### Option A (rejected) — Reader as `(public)` route group inside `apps/admin`

- **ALT-001**: **Description**: Add `app/(public)/` alongside `app/(protected)/` and `app/(admin)/`
  inside `apps/admin`. One deployment, one build.
- **ALT-002**: **Rejection reason**: Violates the "never share a navigation shell" principle.
  Forces the admin and reader layouts to co-exist in one Next.js root layout tree. Admin bundle
  bloats every public page. No independent deployment for the reader surface.

## Implementation Notes

- **IMP-001**: Scaffold `apps/reader/` as a standard Next.js 16 app using the command below.
  Extend `@repo/typescript-config/nextjs.json` and `@repo/eslint-config/next-js`.

  ```bash
  pnpm create next-app@latest apps/reader --typescript --tailwind --app --src-dir no --import-alias "@/*"
  ```

- **IMP-002**: Add `apps/reader` to `pnpm-workspace.yaml` `packages:` list and confirm
  Turborepo picks up `reader:build`, `reader:lint`, `reader:check-types` in `turbo.json`.
- **IMP-003**: The route group inside `apps/reader/app/` can be `(public)/` for consistency
  with the convention, or simply the root `app/` layout if the whole app is public. The latter
  is simpler since there are no `(protected)` routes in the reader.
- **IMP-004**: Remove the `(public)` placeholder from `apps/admin` when `apps/reader` is
  scaffolded, to eliminate the abandoned route group.
- **IMP-005**: Create a new Vercel project for `apps/reader` and link it to the monorepo root
  with `rootDirectory: apps/reader` in the Vercel project settings.
- **IMP-006**: Reader env vars required: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to the reader
  project.

## References

- **REF-001**: [ADR-0003](adr-0003-nextjs-app-router-react19.md) — original app-split decision
  (`apps/admin`, `apps/docs`); this ADR amends it.
- **REF-002**: [ADR-0011](adr-0011-publication-model.md) — `published` RLS; anonymous read access.
- **REF-003**: [ADR-0014](adr-0014-rls-single-source-of-authorization.md) — RLS as authorization
  boundary; `SUPABASE_SERVICE_ROLE_KEY` exposure rules.
- **REF-004**: [ADR-0029](adr-0029-public-reader-route-scheme.md) — `/:username/:type/:slug`
  reference scheme; all entity routes in `apps/reader`.
- **REF-005**: [`docs/design/public/00-ia-route-model.md §1 principle 5`](../design/public/00-ia-route-model.md)
  — "Reader ≠ admin … must never share a navigation shell."
- **REF-006**: [Issue #166](https://github.com/shaes-farm/time-traveler/issues/166) — Public
  reader IA + route model; OQ-5 resolved here.
- **REF-007**: [Epic #165](https://github.com/shaes-farm/time-traveler/issues/165) — Public
  reader UX design artifacts.
