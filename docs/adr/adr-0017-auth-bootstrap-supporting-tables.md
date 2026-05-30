---
title: "ADR-0017: Auth Bootstrap and Supporting Tables (Profile Trigger, is_admin, Notifications, Content Reports)"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "auth", "data-model"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0017: Auth Bootstrap and Supporting Tables (Profile Trigger, is_admin, Notifications, Content Reports)

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00003_supporting_tables.sql` (2026-05-21) and
`00004_is_admin_and_profile_trigger.sql` (2026-05-21); specified in
`docs/system-design.md` §9.1 (Appendix B Decisions #15, #18, #19).

## Context

Supabase Auth owns `auth.users`, but the app needs an application-level
`profiles` row per user, a way to distinguish admins for RLS (ADR-0014), a
notifications channel (e.g., publish/collaborator events — ADR-0011), and an audit
trail for user-reported content. These supporting concerns underpin authorization
and moderation across the rest of the schema.

## Decision

Establish auth bootstrap and supporting tables:

- **`handle_new_user` trigger** on `auth.users` insert auto-creates a `profiles`
  row, **deriving a display name** from the signup metadata/email and **padding**
  it to satisfy the profile name constraint when the source is too short
  (Decision #15).
- **`is_admin()` function** — the single admin predicate consumed by RLS policies
  (ADR-0014), rather than scattering role checks.
- **`notifications` table** — **write-once** records (insert + read/mark-read, no
  arbitrary update of content), owner-scoped by RLS.
- **`content_reports` table** — a moderation **audit trail** that is
  **polymorphic** via (`entity_type`, `entity_id`) so any content type can be
  reported through one table (Decisions #18, #19).

## Consequences

### Positive

- **POS-001**: Every authenticated user deterministically has a `profiles` row from
  first sign-in; downstream FKs and RLS can rely on it.
- **POS-002**: `is_admin()` centralizes the admin check, so policies stay uniform
  and a single function governs elevation (ADR-0015 hardening applies to it).
- **POS-003**: Write-once `notifications` and polymorphic `content_reports` cover
  notification and moderation needs without per-entity report tables.

### Negative

- **NEG-001**: The name-derivation/padding logic is a small piece of business
  logic living in a trigger; edge cases (very short/empty names) are handled by
  padding rather than rejection.
- **NEG-002**: Polymorphic (`entity_type`, `entity_id`) reports cannot use a real
  FK, so referential integrity of a report's target is not DB-enforced.
- **NEG-003**: `is_admin()` is `SECURITY`-sensitive and must remain hardened
  (`search_path = ''`, ADR-0015).

## Alternatives Considered

### Create the profile lazily in app code on first action

- **ALT-001**: **Description**: Insert `profiles` from the app the first time a user
  does something.
- **ALT-002**: **Rejection Reason**: Race-prone and easy to miss; a DB trigger on
  `auth.users` guarantees the row exists exactly once.

### Per-entity report tables / a role column instead of is_admin()

- **ALT-003**: **Description**: `event_reports`, `character_reports`, … and inline
  role checks in policies.
- **ALT-004**: **Rejection Reason**: Multiplies tables and scatters the admin
  check; one polymorphic audit table + one `is_admin()` predicate is simpler and
  consistent.

## Implementation Notes

- **IMP-001**: `notifications` and `content_reports` in `00003`; `is_admin()` and
  the `handle_new_user` trigger in `00004`.
- **IMP-002**: `is_admin()` is referenced throughout `00007` RLS policies
  (ADR-0014) and hardened in `00010` (ADR-0015).
- **IMP-003**: Notifications are produced by the `publish` Edge Function
  (ADR-0011/0018).

## References

- **REF-001**: ADR-0014 (`is_admin` in RLS), ADR-0015 (function hardening),
  ADR-0011/0018 (notifications on publish)
- **REF-002**: `supabase/migrations/00003_supporting_tables.sql`,
  `00004_is_admin_and_profile_trigger.sql`; `docs/system-design.md` §9.1
- **REF-003**: PRD §9 (accounts, moderation, notifications)
