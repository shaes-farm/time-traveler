---
title: "ADR-0011: Publication Model — published Boolean + published_at, Not a Status Enum"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "data-model", "publishing", "rls"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0011: Publication Model — published Boolean + published_at, Not a Status Enum

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00001_initial_schema.sql` (2026-05-21); the publish
workflow is specified in `docs/system-design.md` §5.5.6.

## Context

Content entities (timelines, periods, events, stories, characters) move between a
private draft state and a publicly visible state. The visibility distinction is
load-bearing for authorization: anonymous and non-owner users may read
**published** content but not drafts (ADR-0014). The model needs to express "is
this public?" cheaply in RLS, plus "when did it go public?" for ordering and
notifications.

## Decision

Represent publication with **two columns on each content table**: a
`published BOOLEAN DEFAULT false` flag and a nullable `published_at TIMESTAMPTZ`
timestamp — **not** a multi-value status enum. RLS reads test `published = true`
directly. Setting the flag and timestamp (and any downstream effects such as
collaborator notifications) is handled by a `publish` Edge Function rather than a
stored procedure (`docs/system-design.md` §5.5.6).

## Consequences

### Positive

- **POS-001**: `published = true` is a trivial, index-friendly predicate in every
  read policy (ADR-0014) — no enum parsing or status-set logic in RLS.
- **POS-002**: `published_at` gives a real publish time for ordering public feeds
  and for notification context, independent of `created_at`/`updated_at`.
- **POS-003**: Keeping the publish side effects (notifications, future cache
  invalidation/analytics) in an Edge Function avoids accreting business logic in
  the database (ADR-0013), where the prior schema's `publish_*` functions had
  parameter-shadowing bugs.

### Negative

- **NEG-001**: A boolean cannot express richer lifecycle states (e.g.,
  `in_review`, `scheduled`, `archived`); adding them later means a migration to a
  status column and rewriting the RLS predicate.
- **NEG-002**: The flag and timestamp can drift if a writer sets `published`
  without `published_at`; correctness depends on going through the publish path.

## Alternatives Considered

### A `status` enum (`draft` / `published` / `archived` / …)

- **ALT-001**: **Description**: A single `status VARCHAR CHECK` column encoding the
  lifecycle.
- **ALT-002**: **Rejection Reason**: Over-models current needs (only public/not is
  required), and complicates the hot RLS predicate that every anonymous read
  evaluates. Can be revisited via a future ADR if richer states are required.

### Visibility carried only by the `visibility` column

- **ALT-003**: **Description**: Reuse `timelines.visibility`
  (`private`/`public`/`shared`) as the publication signal for all entities.
- **ALT-004**: **Rejection Reason**: `visibility` models sharing scope and exists
  only on timelines; the `published` flag is a uniform per-entity gate that the
  RLS pattern in §9.2 depends on.

## Implementation Notes

- **IMP-001**: `published`/`published_at` on `timelines`, `periods`, `events`,
  `stories`, `characters` in `00001`. **Categories are intentionally excluded** —
  they are taxonomy, not audience-facing content, and have no `published` column
  or publish control (ADR-0028).
- **IMP-002**: The `publish` Edge Function sets both fields and fans out
  collaborator notifications (`docs/system-design.md` §5.5.6; ADR-0017
  notifications).
- **IMP-003**: RLS read policies across §9.2 begin with `published = true OR …`
  (ADR-0014).

## References

- **REF-001**: ADR-0013 (publish as Edge Function, not stored proc), ADR-0014
  (published in RLS), ADR-0017 (notifications on publish), ADR-0028 (categories
  excluded from the publication model)
- **REF-002**: `supabase/migrations/00001_initial_schema.sql`;
  `docs/system-design.md` §5.5.6, §9.2
- **REF-003**: PRD §4.9 (publishing/visibility)
