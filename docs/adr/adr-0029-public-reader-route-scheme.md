---
title: "ADR-0029: Public reader entity reference scheme (/:username/:type/:slug)"
status: "Accepted"
date: "2026-05-31"
authors: "shaes-farm"
tags: ["routing", "public-reader", "url-design", "information-architecture"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0029: Public reader entity reference scheme (`/:username/:type/:slug`)

## Status

**Accepted**

## Context

The public reader surface exposes published content for five entity types — timelines, events,
characters, periods, and stories. Every entity has a `slug VARCHAR(100)` column, but the unique
index is **composite on `(user_id, slug)`**, enforced in
[`supabase/migrations/00001_initial_schema.sql`](../../supabase/migrations/00001_initial_schema.sql)
via `timelines_slug_idx`, `events_slug_idx`, `characters_slug_idx`, `periods_slug_idx`, and
`stories_slug_idx`. Slugs are **not globally unique** — two different authors can independently
publish a timeline with slug `space-race`.

Any public reader URL scheme must therefore either:

- **(a)** carry an author-disambiguating component alongside the slug, or
- **(b)** abandon slugs in favour of a globally-unique identifier (UUID primary key).

This decision was deferred as OQ-1 in
[`docs/design/public/00-ia-route-model.md §7`](../design/public/00-ia-route-model.md) during the
IA pass for issue
[#166](https://github.com/shaes-farm/time-traveler/issues/166), pending an explicit architecture
call. This ADR records that call.

## Decision

Use **`/:username/:type/:slug`** as the canonical reference scheme for all public-reader entity
routes, where `:username` is the author's `profiles.username`
(e.g. `/historymaven/timelines/space-race`).

| Entity type | Canonical public route        |
| ----------- | ----------------------------- |
| Timeline    | `/:username/timelines/:slug`  |
| Story       | `/:username/stories/:slug`    |
| Event       | `/:username/events/:slug`     |
| Character   | `/:username/characters/:slug` |
| Period      | `/:username/periods/:slug`    |

Multi-author list and discovery routes (`/`, `/explore`, `/stories`, `/search`) carry **no** author
prefix — they are cross-author surfaces not scoped to a single `(user_id, slug)` pair.

The `profiles` table is world-readable (ADR-0014 global-read carve-out: `USING (true)`) so
username resolution requires no authentication, preserving the anonymous-browsing contract
(PRD §2.3.2, ADR-0011).

## Consequences

### Positive

- **POS-001**: Route grain matches the database uniqueness grain exactly — `(user_id, slug)` — so
  there is no multi-row ambiguity on any entity lookup.
- **POS-002**: URLs are human-readable and SEO-friendly (`/historymaven/timelines/roman-republic`).
- **POS-003**: Author attribution is natural and visible in the URL; a future `/:username` author
  profile page falls directly out of the `[username]` dynamic segment.
- **POS-004**: No opaque identifiers in URLs; the `slug` investment in every entity table is
  fully leveraged.
- **POS-005**: `profiles.username` is already world-readable (ADR-0014), so public readers resolve
  routes without any auth overhead.

### Negative

- **NEG-001**: URLs are longer than bare-slug routes; deeply nested cross-links carry the
  `/:username` prefix on every hop.
- **NEG-002**: Username renames invalidate existing canonical URLs. A rename policy must be
  established before the reader is publicly launched. Recommended default: usernames are
  immutable after first publish; the UI warns before the author's first published entity.
  Redirect-table approach is an alternative. **Deferred to implementation — not a design blocker.**
- **NEG-003**: The Next.js App Router `[username]` dynamic segment sits at the root of the entity
  route tree. Fixed-path list routes (`/explore`, `/stories`, `/search`) must be defined as
  siblings of — and resolved before — the `[username]` dynamic segment to avoid accidental capture.

## Alternatives Considered

### Option B — `/timelines/:slug-:shortid`

- **ALT-001**: **Description**: Append a short UUID suffix to the slug to guarantee global
  uniqueness (`/timelines/space-race-a3f9`). Single path segment; no username required.
- **ALT-002**: **Rejection reason**: The suffix is opaque noise in the URL; it weakens the slug
  investment and requires a custom parser to split slug from ID. Author attribution is lost.

### Option C — `/timelines/:uuid`

- **ALT-003**: **Description**: Use the UUID primary key directly as the sole path identifier.
- **ALT-004**: **Rejection reason**: UUIDs are unreadable, unshareable, and harmful for SEO. The
  `slug` columns exist precisely to give entities human-meaningful identifiers; bypassing them
  in the URL discards that value entirely.

## Implementation Notes

- **IMP-001**: Next.js App Router layout: prefer type-specific segments
  `app/(public)/[username]/timelines/[slug]/page.tsx` over a single `[type]` dynamic segment —
  this prevents a typo in `:type` from silently matching as a slug.
- **IMP-002**: The `[username]` segment must be a sibling of `/explore`, `/stories`, and `/search`
  in the file-system hierarchy so Next.js resolves those fixed paths first (static before dynamic).
- **IMP-003**: Server-side resolution order: look up `profiles` by the `[username]` segment value
  → resolve `user_id` → query entity by `(user_id, slug)` with `AND published = true`. RLS
  enforces `published` at the DB layer; the app query is a belt-and-suspenders pre-filter.
- **IMP-004**: Responses for unpublished or non-existent `(username, type, slug)` triples must
  return **404**, never 403 — 403 would confirm the entity exists and leak private-content
  information. The `published = true` RLS clause already prevents reading the row; the 404 is the
  correct surface response.
- **IMP-005**: Username immutability (or a redirect table) must be resolved before public launch.
  See NEG-002.

## References

- **REF-001**: [ADR-0003](adr-0003-nextjs-app-router-react19.md) — Next.js App Router route groups
  `(public)`, `(protected)`, `(admin)`.
- **REF-002**: [ADR-0011](adr-0011-publication-model.md) — `published` boolean + `published_at`;
  RLS read enforcement.
- **REF-003**: [ADR-0014](adr-0014-rls-single-source-of-authorization.md) — RLS as single source
  of authorization; `profiles` world-readable carve-out.
- **REF-004**: [`supabase/migrations/00001_initial_schema.sql`](../../supabase/migrations/00001_initial_schema.sql)
  — composite unique indices on `(user_id, slug)` for all entity tables.
- **REF-005**: [docs/design/public/00-ia-route-model.md §4](../design/public/00-ia-route-model.md)
  — slug-uniqueness constraint analysis; OQ-1 where this decision was deferred.
- **REF-006**: [Issue #166](https://github.com/shaes-farm/time-traveler/issues/166) — Public reader
  IA + route model.
