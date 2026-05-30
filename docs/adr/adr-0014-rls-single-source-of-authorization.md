---
title: "ADR-0014: Row-Level Security as the Single Source of Authorization"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-22"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "security", "rls", "authorization"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0014: Row-Level Security as the Single Source of Authorization

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00007_rls_policies.sql` (2026-05-22); specified in
`docs/system-design.md` §9 (Appendix B Decisions #8, #20).

## Context

Because apps talk to the database directly through PostgREST (ADR-0012), there is
no API server to centralize authorization. Authorization must therefore be
enforced where the data lives, and it must hold uniformly for anonymous reads of
published content, owners, admins, and timeline collaborators.

## Decision

Make **Row-Level Security the single source of authorization**. Every content
table has RLS enabled with policies built from one read pattern and one write
pattern:

- **Read**: `published = true` (ADR-0011) **OR** `user_id = auth.uid()` (owner)
  **OR** `is_admin()` (ADR-0017) **OR** the row is reachable by a timeline
  **collaborator** (ADR-0015 helpers).
- **Write**: owner **OR** admin **OR** collaborator-with-edit, depending on the
  table.

Global-read carve-outs exist for reference/shared data: `categories`, `media`,
and `profiles` are world-readable (with write still restricted), because they are
lookup/shared resources rather than private content
(`docs/system-design.md` §9.3). Junction tables have **no `user_id`** (ADR-0010)
and derive their policy from the parent entity via `EXISTS` checks.

## Consequences

### Positive

- **POS-001**: One enforcement point — there is no path (PostgREST, SQL function,
  or app) that can read/write around the policies.
- **POS-002**: The uniform "published OR owner OR admin OR collaborator" shape
  makes policies reviewable and consistent across every table.
- **POS-003**: Anonymous public browsing works without app-side gating, because
  `published = true` is the first clause of every read policy.

### Negative

- **NEG-001**: RLS evaluated per row can be a performance hazard (re-running
  `auth.uid()`/`is_admin()` per row, duplicate permissive policies) — addressed
  by ADR-0015 (`00011`).
- **NEG-002**: Collaborator and ownership checks risk recursive policy evaluation;
  this forced the `SECURITY DEFINER` helper functions in ADR-0015.
- **NEG-003**: Global-read tables (`categories`, `media`, `profiles`) must be kept
  genuinely non-sensitive, since any authenticated/anon user can read them.

## Alternatives Considered

### Enforce authorization in an application/API layer

- **ALT-001**: **Description**: Centralize checks in a Node/Next API in front of
  the DB.
- **ALT-002**: **Rejection Reason**: Contradicts the PostgREST-direct architecture
  (ADR-0012) and creates a bypass risk if anything ever queries the DB directly.

### Per-row `user_id` on every table including junctions

- **ALT-003**: **Description**: Give junctions their own `user_id` for simpler
  policies.
- **ALT-004**: **Rejection Reason**: Creates the owner-divergence integrity hole
  (ADR-0010); deriving from the parent is both correct and the documented
  convention.

## Implementation Notes

- **IMP-001**: All policies in `00007`; global-read carve-outs for `categories`,
  `media`, `profiles` per `docs/system-design.md` §9.3.
- **IMP-002**: Collaborator/ownership helper functions and InitPlan/performance
  rewrites are split into ADR-0015 (`00010`, `00011`).
- **IMP-003**: pgTAP tests in `supabase/tests/database/` assert the policy matrix
  (ADR-0026).

## References

- **REF-001**: ADR-0011 (published flag), ADR-0010 (junction RLS from parent),
  ADR-0015 (helpers + perf hardening), ADR-0017 (`is_admin`), ADR-0016 (storage
  RLS), ADR-0026 (RLS tests)
- **REF-002**: `supabase/migrations/00007_rls_policies.sql`;
  `docs/system-design.md` §9
- **REF-003**: PRD §9 (security/permissions)
