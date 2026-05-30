---
title: "ADR-0016: Storage Buckets with Graduated Access (Public Media/Avatars, Private Exports)"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-22"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "security", "storage"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0016: Storage Buckets with Graduated Access (Public Media/Avatars, Private Exports)

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00009_storage_buckets_and_policies.sql` (2026-05-22);
specified in `docs/system-design.md` §5.7 and §9.3.

## Context

The system stores three kinds of binary assets: media attached to public content
(images for events/characters/timelines), user avatars, and generated data
exports. These have different sensitivity: content media and avatars are meant to
be embeddable on public pages, while an export is a user's own data dump that
must not be world-readable.

## Decision

Define **three storage buckets with graduated access**:

- **`media`** — **public** bucket for content imagery (referenced by the `media`
  table; world-readable to match the global-read `media` RLS carve-out in
  ADR-0014). Writes are restricted by storage RLS to the owner.
- **`avatars`** — **public** bucket for profile pictures (embeddable anywhere).
  Writes restricted to the owning user.
- **`exports`** — **private** bucket; objects are reachable only via **time-limited
  signed URLs** generated server-side for the owner.

Per-object write/read authorization is enforced with **storage RLS policies**
keyed on the object path/owner, mirroring the database RLS model (ADR-0014).

## Consequences

### Positive

- **POS-001**: Public content imagery and avatars are directly embeddable (CDN
  cacheable) without per-request signing.
- **POS-002**: Exports stay private by construction — no public URL exists; access
  requires a short-lived signed URL for the owner.
- **POS-003**: Storage authorization follows the same owner/RLS mental model as
  the database, so there is one consistent permission story.

### Negative

- **NEG-001**: Public buckets mean any object placed there is world-readable;
  contributors must not put sensitive assets in `media`/`avatars`.
- **NEG-002**: Signed-URL access for exports adds an expiry/regeneration concern in
  the app (links go stale by design).
- **NEG-003**: Storage RLS path conventions must be kept in sync with how the app
  constructs object keys.

## Alternatives Considered

### One private bucket for everything, all access signed

- **ALT-001**: **Description**: Sign every media/avatar URL on read.
- **ALT-002**: **Rejection Reason**: Defeats CDN caching and adds latency/work for
  inherently public content; sensitivity only differs for exports.

### One public bucket for everything

- **ALT-003**: **Description**: Put exports in a public bucket too.
- **ALT-004**: **Rejection Reason**: Exports are private user data; a public bucket
  would leak them via guessable/listable URLs.

## Implementation Notes

- **IMP-001**: Bucket definitions and storage RLS policies in `00009`.
- **IMP-002**: The `media` bucket pairs with the global-read `media` table policy
  (ADR-0014, `docs/system-design.md` §9.3).
- **IMP-003**: Export generation (and its signed-URL issuance) is an Edge Function
  concern alongside the library-import/publish functions (ADR-0018).

## References

- **REF-001**: ADR-0014 (RLS model + global-read `media`), ADR-0018 (Edge
  Functions incl. exports)
- **REF-002**: `supabase/migrations/00009_storage_buckets_and_policies.sql`;
  `docs/system-design.md` §5.7, §9.3
- **REF-003**: Supabase Storage access-control / signed URL documentation
