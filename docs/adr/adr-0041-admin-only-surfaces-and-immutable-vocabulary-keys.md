---
title: "ADR-0041: Admin-only surfaces are URL-prefixed and role-gated; vocabulary keys are immutable in the UI"
status: "Accepted"
date: "2026-08-10"
authors: "Engineering"
tags: ["architecture", "decision", "admin", "authorization", "next-js"]
supersedes: ""
superseded_by: ""
amends: "adr-0040-relationship-vocabulary-reference-data.md"
amended_by: ""
---

# ADR-0041: Admin-only surfaces are URL-prefixed and role-gated; vocabulary keys are immutable in the UI

## Status

**Accepted**

## Context

[ADR-0040](adr-0040-relationship-vocabulary-reference-data.md) moved the
relationship vocabulary into three reference tables so that adding a
relationship type is an `INSERT` rather than a migration. It shipped the tables,
the RLS policies and the GRANTs, but no UI — NEG-007 records that until admin
CRUD landed, "managed through the admin app" was true only via SQL. Issue #428
builds that surface, and doing so forced two decisions that outlive it.

**1. There was no way to express "admin-only" in the app.** `profiles.role` has
carried `'editor' | 'admin'` since `00001_initial_schema.sql`, and
`public.is_admin()` (`00004`) has gated RLS on it since. But the front end had
no admin surface at all: `NAV_ITEMS` in `apps/admin/lib/nav.ts` was a static
const with no conditional entries, and `app/(admin)/layout.tsx` was a role gate
guarding a route group that never held a page.

That empty gate concealed a trap. `proxy.ts` gates on the **URL prefix**
`/admin`, but Next.js route groups do not appear in URLs. A page added at
`app/(admin)/relationship-vocabulary/page.tsx` resolves to
`/relationship-vocabulary`; `isAdminRoute` would not match it, and the edge role
check would silently never run. The gate would appear to be in place and do
nothing.

**2. Renaming a vocabulary key is a bulk data edit disguised as a text input.**
ADR-0040 ALT-005 chose human-readable slugs over UUIDs partly _because_
`ON UPDATE CASCADE` makes renames safe at the database level. That is true, and
it is also why a rename is dangerous in a form: editing
`relationship_types.key` rewrites `relationship_type` on every referencing
`character_relationships` row, with no preview, no undo and no row count. The
capability is sound; exposing it beside "Label" as an equally routine field is
not.

## Decision

**Admin-only surfaces live at `app/(protected)/admin/*` — a real `/admin` URL
segment nested inside the protected route group — and are gated three times:**

1. `proxy.ts` matches the `/admin` URL prefix at the edge, reads
   `profiles.role`, and redirects a non-admin to `/dashboard?error=forbidden`.
2. `app/(protected)/admin/layout.tsx` re-checks in the Node runtime, so a
   misconfigured or skipped proxy is not a bypass.
3. RLS rejects the writes regardless of what the UI offers.

The former `app/(admin)/` route group is deleted; its gate logic moves into the
new layout. Nav visibility is computed by `navItemsForRole(role)` in
`apps/admin/lib/nav.ts`, with the role threaded from the `(protected)` layout
(which already loads the profile) into `ProtectedShell`. `Shell` itself stays
role-agnostic — it renders whatever array it is handed.

**Vocabulary keys are immutable in the UI.** The key field is editable on create
and disabled on edit, with the reason stated inline. Renaming remains available
via SQL. The service-layer update inputs omit `key` entirely, so the restriction
is a type error rather than a convention.

## Consequences

### Positive

- **POS-001**: An admin surface cannot be added without a `/admin` URL segment,
  so the edge gate cannot be silently bypassed by route-group placement.
- **POS-002**: Admin pages inherit `ProtectedShell`, so they keep the sidebar
  and the unsaved-changes guard rather than needing a parallel shell.
- **POS-003**: Role logic has exactly one home (`navItemsForRole`), so a second
  admin surface is a one-line addition.
- **POS-004**: Hiding the rename path removes the one operation in the
  vocabulary manager that could corrupt historical relationship data with a
  single keystroke and no confirmation.
- **POS-005**: Deactivation (`is_active = false`) covers the case a rename is
  usually reached for — retiring a badly-named type — without touching a single
  historical row.

### Negative

- **NEG-001**: The role check in `proxy.ts` costs a `profiles` query on every
  `/admin` request. Acceptable: the surface is low-traffic and the query is a
  primary-key lookup.
- **NEG-002**: The gate is duplicated in three places. Deliberate defence in
  depth, but a future role change must be made in all of them.
- **NEG-003**: Correcting a typo in a key now requires SQL. Judged rare enough
  to be worth the safety; a newly created key can still be deleted outright
  while nothing references it.
- **NEG-004**: `navItemsForRole` is presentation only. Hiding a nav entry is not
  authorization, and nothing prevents a future contributor from reading it as
  such.

## Alternatives Considered

### Keep the `(admin)` route group and add an `admin/` segment inside it

- **ALT-001**: **Description**: `app/(admin)/admin/relationship-vocabulary/` —
  keeps the existing gate file and produces the `/admin` URL the proxy needs.
- **ALT-002**: **Rejection Reason**: A route group named `(admin)` containing a
  segment named `admin` is confusing to read, and the group's layout would have
  to re-implement `ProtectedShell` to keep the sidebar.

### Gate by layout only, with no URL convention

- **ALT-003**: **Description**: Let admin pages live anywhere and rely on a
  server-component layout check.
- **ALT-004**: **Rejection Reason**: Drops the edge check, so every admin
  request renders further into the stack before being refused, and the
  `isAdminRoute` prefix in `proxy.ts` becomes dead code that looks live.

### Allow renaming behind a confirmation showing the affected row count

- **ALT-005**: **Description**: Keep `key` editable; on change, count the
  referencing `character_relationships` rows and require explicit confirmation.
- **ALT-006**: **Rejection Reason**: Puts a bulk data rewrite on the routine
  edit path for a benefit — fixing a typo — that deactivate-and-replace already
  covers. Rejected for now, not forever; the count query
  (`countRelationshipTypeUsage`) already exists if this is revisited.

## Implementation Notes

- **IMP-001**: `proxy.ts` carries a comment recording the route-group trap, so
  the next admin surface does not rediscover it.
- **IMP-002**: `lib/nav.test.ts` asserts every admin nav href starts with
  `/admin/`; an entry that lost the segment would fail there rather than
  becoming quietly ungated.
- **IMP-003**: The e2e suite runs two seeded accounts — an editor and an admin —
  in separate Playwright projects. The editor account must stay non-admin: it is
  what proves the gate refuses someone
  (`e2e/authenticated/admin-gate.spec.ts`).
- **IMP-004**: Key immutability is enforced at three levels: the update Zod
  schemas omit `key`, the service update inputs have no such field, and the form
  disables the input.

## References

- **REF-001**: [ADR-0040](adr-0040-relationship-vocabulary-reference-data.md) —
  the reference-data refactor this completes (NEG-007, IMP-005).
- **REF-002**: [ADR-0030](adr-0030-public-reader-app-placement.md) — the
  anonymous reader; the vocabulary is world-readable, admin-writable.
- **REF-003**: `supabase/migrations/00004_is_admin_and_profile_trigger.sql` —
  `is_admin()` and the `profiles.role` column it reads.
- **REF-004**: `supabase/migrations/00029_relationship_vocabulary.sql` §RLS —
  the `is_admin()` write policies this UI sits on top of.
- **REF-005**: Issue #428.
