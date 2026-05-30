---
title: "ADR-0003: Next.js 16 App Router + React 19, Split admin/docs Apps"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-03-01"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "frontend", "nextjs", "react"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0003: Next.js 16 App Router + React 19, Split admin/docs Apps

## Status

**Accepted (retroactively documented 2026-05-30)** — dated to the presentation
layer recorded in `docs/system-design.md` §2 and §11 and realized in
`apps/admin` and `apps/docs`.

## Context

The product needs server-rendered, auth-gated CRUD surfaces (the admin app), a
separate documentation surface, and a future public reader surface. The frontend
must integrate cleanly with Supabase server-side auth (cookie-based sessions),
support React Server Components for data-heavy pages, and share a design system
across surfaces.

## Decision

Build the frontends on **Next.js 16 (App Router)** with **React 19**, as
**separate apps** in the monorepo (`apps/admin` on port 3000, `apps/docs` on
port 3001). Both apps declare `"type": "module"` (ESM), extend the shared
`@repo/typescript-config/nextjs.json`, and consume `@repo/ui` and
`@repo/services`. Route groups (`(public)`, `(protected)`, `(admin)`, `auth`)
segment access tiers, and Next 16's edge proxy (`apps/admin/proxy.ts`, the
middleware successor) gates protected routes. See `docs/system-design.md` §2.2,
§7.5, §11.

## Consequences

### Positive

- **POS-001**: App Router + Server Components allow auth and initial data to load
  server-side (cookie session via `@supabase/ssr`), keeping the anon-key client
  thin and avoiding auth flashes.
- **POS-002**: Route groups express the public/protected/admin access tiers as
  filesystem structure, aligning the app surface with the RLS model (ADR-0014).
- **POS-003**: Splitting `admin` and `docs` keeps deploy units, dependencies, and
  build times independent while still sharing `@repo/ui`/`@repo/services`.
- **POS-004**: React 19 + Next 16 are the current major lines, aligning the team
  with first-class Server Actions and modern data APIs.

### Negative

- **NEG-001**: Bleeding-edge majors (Next 16, React 19) carry ecosystem-maturity
  risk; some libraries lag the React 19 release.
- **NEG-002**: The App Router's server/client boundary and caching model have a
  real learning curve and are easy to misuse.
- **NEG-003**: Per-app duplication of some config (eslint/tsconfig wrappers,
  `next.config.js`) is the cost of independent deploy units.

## Alternatives Considered

### A single Next.js app with everything

- **ALT-001**: **Description**: One app hosting admin, docs, and public reader
  under one deployment.
- **ALT-002**: **Rejection Reason**: Couples deploy cadence and dependency sets of
  surfaces with very different audiences and security postures; the public
  reader's design genre diverges sharply from admin (see ADR-0024).

### A client-only SPA (Vite/React Router)

- **ALT-003**: **Description**: A non-SSR single-page app talking directly to
  Supabase from the browser.
- **ALT-004**: **Rejection Reason**: Loses server-side session handling, SSR/SEO
  for public content, and Server Components for data-heavy admin pages.

## Implementation Notes

- **IMP-001**: Target host is Vercel for the frontends; Supabase hosts the
  backend (`docs/system-design.md` §2.2, §10).
- **IMP-002**: Auth route protection is in `apps/admin/proxy.ts`; auth utilities
  live in `apps/admin/lib/auth/` (see ADR-0017).
- **IMP-003**: The admin app is being built incrementally from the fidelity-2
  design system (ADR-0020); placeholder routes precede data-driven pages.

## References

- **REF-001**: ADR-0002 (monorepo), ADR-0004 (standards), ADR-0017 (auth),
  ADR-0020 (UI), ADR-0021 (state)
- **REF-002**: `docs/system-design.md` §2.2, §7.5, §11;
  `docs/design/admin/fidelity-2-plan.md`
- **REF-003**: Next.js App Router + React 19 documentation
