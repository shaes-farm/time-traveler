# Architecture Decision Records

This directory holds the Architecture Decision Records (ADRs) for **Time
Traveler**. An ADR captures a single load-bearing architectural decision: the
context that forced it, the option chosen, and the consequences accepted.

ADRs `0001`–`0027` were **reconstructed retroactively** in a single
documentation pass (May 2026) to close a knowledge gap — the decisions were made
and implemented across the greenfield build (migrations `00001`–`00015`, the
fidelity-1/2 design passes, and the monorepo bootstrap) but were never recorded
as discrete records. Each retroactive ADR is dated to its evidence (the
migration or PR that implemented it) and carries the status **Accepted
(retroactively documented 2026-05-30)**. They record _what was decided_, not a
re-litigation of decided questions.

The first **forward** decision is `0028` (the Milestone 7 period/category
model); the next new ADR is the next free number (`0029` onward), per the
[ADR process](#when-to-write-an-adr) below.

## Format

- File naming: `adr-NNNN-[title-slug].md` (4-digit zero-padded sequence).
- Front matter + body per [`adr-0000-template.md`](adr-0000-template.md), the
  `create-architectural-decision-record` skill template. Every ADR carries the
  full key set (`title`, `status`, `date`, `authors`, `tags`, `supersedes`,
  `superseded_by`, `amends`, `amended_by`); relationship keys are empty strings
  when not applicable.
- Consequences/alternatives/implementation/references use coded bullets
  (`POS-`, `NEG-`, `ALT-`, `IMP-`, `REF-`) for machine parsing.
- **Superseding** a decision sets `superseded_by` on the old ADR and
  `supersedes` on the new one, and flips the old ADR's status to
  **Superseded**.
- **Amending** a decision (refining it without reversing it) sets `amended_by`
  on the original ADR and `amends` on the amending ADR. An amended ADR keeps its
  status (it is **not** Superseded); both ADRs stay in force and read together.

## Index

| #                                                                     | Title                                                                              | Status           | Supersedes / Superseded by                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------- | ------------------------------------------ |
| [0001](adr-0001-supabase-backend-platform.md)                         | Supabase as the backend platform                                                   | Accepted (retro) | —                                          |
| [0002](adr-0002-pnpm-turborepo-monorepo.md)                           | pnpm + Turborepo monorepo                                                          | Accepted (retro) | —                                          |
| [0003](adr-0003-nextjs-app-router-react19.md)                         | Next.js 16 App Router + React 19, split apps                                       | Accepted (retro) | —                                          |
| [0004](adr-0004-engineering-standards.md)                             | Engineering standards (strict TS, zero-warning, ESM)                               | Accepted (retro) | —                                          |
| [0005](adr-0005-hybrid-temporal-system.md)                            | Hybrid temporal system (JSONB + generated sort columns)                            | Accepted (retro) | —                                          |
| [0006](adr-0006-fractal-timeline-detail-timeline.md)                  | Fractal timeline via forward `detail_timeline_id`                                  | Accepted (retro) | supersedes prior `parent_event_id`† (#180) |
| [0007](adr-0007-seven-character-types.md)                             | Seven character types + type-specific columns                                      | Accepted (retro) | —                                          |
| [0008](adr-0008-character-relationships-directed-pairs.md)            | Character relationships as directed pairs                                          | Accepted (retro) | amended by 0009                            |
| [0009](adr-0009-relationship-sub-role-taxonomy.md)                    | Relationship sub-role taxonomy (`relationship_role`)                               | Accepted (retro) | amends 0008 (#119)                         |
| [0010](adr-0010-junction-table-conventions.md)                        | Junction tables: composite PK, no surrogate id/user_id                             | Accepted (retro) | —                                          |
| [0011](adr-0011-publication-model.md)                                 | Publication model: `published` boolean + `published_at`                            | Accepted (retro) | —                                          |
| [0012](adr-0012-postgrest-crud-thin-service-layer.md)                 | PostgREST for all CRUD + thin TS service layer                                     | Accepted (retro) | —                                          |
| [0013](adr-0013-db-functions-read-only.md)                            | DB functions reserved for complex read-only queries                                | Accepted (retro) | —                                          |
| [0014](adr-0014-rls-single-source-of-authorization.md)                | RLS as the single source of authorization                                          | Accepted (retro) | —                                          |
| [0015](adr-0015-rls-and-function-hardening.md)                        | RLS + function hardening (DEFINER, search_path, perf)                              | Accepted (retro) | —                                          |
| [0016](adr-0016-storage-buckets-graduated-access.md)                  | Storage buckets with graduated access control                                      | Accepted (retro) | —                                          |
| [0017](adr-0017-auth-bootstrap-supporting-tables.md)                  | Auth bootstrap (profile trigger, is_admin) + supporting                            | Accepted (retro) | —                                          |
| [0018](adr-0018-curated-content-library.md)                           | Curated content library (admin-owned + import)                                     | Accepted (retro) | —                                          |
| [0019](adr-0019-services-package.md)                                  | `@repo/services` package (clients, schemas, modules)                               | Accepted (retro) | —                                          |
| [0020](adr-0020-ui-package-shadcn-tailwind.md)                        | `@repo/ui` on shadcn/ui + Tailwind 4                                               | Accepted (retro) | —                                          |
| [0021](adr-0021-tanstack-query-zustand.md)                            | TanStack Query (server) + Zustand (client) state                                   | Accepted (retro) | —                                          |
| [0022](adr-0022-design-tokens-dual-source.md)                         | Design tokens dual TS/CSS source + OKLCH + lucide                                  | Accepted (retro) | —                                          |
| [0023](adr-0023-dark-mode-only-fidelity-2.md)                         | Dark-mode-only for fidelity-2 (light mode deferred)                                | Accepted (retro) | —                                          |
| [0024](adr-0024-accessibility-first-visual-language.md)               | Accessibility-first visual language                                                | Accepted (retro) | —                                          |
| [0025](adr-0025-shared-mediapicker-bespoke-tree.md)                   | `MediaPicker` shared primitive; bespoke `Tree` only                                | Accepted (retro) | —                                          |
| [0026](adr-0026-testing-strategy.md)                                  | Testing strategy: pgTAP + Vitest 80% + Storybook                                   | Accepted (retro) | —                                          |
| [0027](adr-0027-upstream-spec-bug-protocol.md)                        | Upstream-spec-bug + PRD-reconciliation protocol                                    | Accepted (retro) | —                                          |
| [0028](adr-0028-period-span-overlay-and-hierarchy-axes.md)            | Period span-overlays; period/category hierarchy axes                               | Accepted         | —                                          |
| [0029](adr-0029-public-reader-route-scheme.md)                        | Public reader entity reference scheme (`/:username/:type/:slug`)                   | Accepted         | —                                          |
| [0030](adr-0030-public-reader-app-placement.md)                       | Public reader lives in dedicated `apps/reader` Next.js app                         | Accepted         | Amends 0003                                |
| [0031](adr-0031-public-reader-design-divergence.md)                   | Public reader design divergence (shared tokens, divergent motion + composition)    | Accepted         | —                                          |
| [0032](adr-0032-public-reader-motion-tokens.md)                       | Public reader motion-token scale (durations, easing, reduced-motion contract)      | Accepted         | —                                          |
| [0033](adr-0033-reader-shell-composites-in-ui-package.md)             | Reader shell composites live in `@repo/ui` (`reader-*`); apps/reader holds glue    | Accepted         | —                                          |
| [0034](adr-0034-api-role-table-grants.md)                             | Explicit table GRANTs for API roles (anon read, authenticated DML, svc all)        | Accepted         | —                                          |
| [0035](adr-0035-list-filter-rail-placement.md)                        | List-page filter rail on the right (nav → content → filters)                       | Accepted         | —                                          |
| [0036](adr-0036-e2e-testing-strategy.md)                              | E2E strategy: Playwright, local-first, off the PR gate; smoke deferred             | Accepted         | —                                          |
| [0037](adr-0037-global-unsaved-changes-shell-guard.md)                | Global unsaved-changes guard for app-shell nav (`onNavigate` + Zustand registry)   | Accepted         | —                                          |
| [0038](adr-0038-amber-primary-accent.md)                              | Amber primary accent — `--color-primary` finalized (Batch B)                       | Accepted         | —                                          |
| [0039](adr-0039-reader-timeline-renderer-d3-strategy.md)              | Reader timeline renderer: D3 submodules as math/behavior engine, React owns SVG    | Accepted         | —                                          |
| [0040](adr-0040-relationship-vocabulary-reference-data.md)            | Relationship vocabulary as reference data (`relationship_types` + FK, not CHECK)   | Accepted         | amends 0008, 0009 (vocabulary mechanism)   |
| [0041](adr-0041-admin-only-surfaces-and-immutable-vocabulary-keys.md) | Admin surfaces are `/admin`-prefixed + role-gated; vocabulary keys immutable in UI | Accepted         | amends 0040 (key rename withheld from UI)  |

† ADR `0006` supersedes the original event-to-event `parent_event_id` nesting
approach, which was never given its own ADR; it is documented inside `0006` as
the rejected/superseded prior decision and tombstoned per #180.

## When to write an ADR

Write a new ADR (the next free number, `0029` onward) when a change does any of the following:

- Introduces, replaces, or removes a **platform, framework, or major dependency**
  (e.g., swapping a state manager, adding a queue, changing the host).
- Establishes or changes a **cross-cutting convention** that future code must
  follow (schema patterns, RLS patterns, auth flow, error handling, naming).
- Makes a **security or data-integrity** trade-off (RLS model, `SECURITY
DEFINER` usage, validation boundaries, storage access).
- **Supersedes or amends an existing ADR** — even a small reversal of a recorded
  decision needs its own record so the history stays readable.
- Resolves a decision that was previously marked `// DECISION NEEDED` in code or
  flagged as a divergence (e.g., #127).

Do **not** write an ADR for routine feature work, bug fixes, or choices fully
determined by an existing ADR. When in doubt, prefer a short ADR over an
undocumented decision.

### How to add one

1. Copy [`adr-0000-template.md`](adr-0000-template.md) to
   `adr-NNNN-[slug].md` using the next free number.
2. Fill in front matter; set status to **Proposed** until accepted.
3. Cite concrete evidence (migration file + section, doc section, or PR).
4. Add a row to the [Index](#index) table.
5. If it **supersedes** another ADR, set `superseded_by` on the old ADR, set
   `supersedes` on the new one, and flip the old ADR's status to **Superseded**.
   If it merely **amends** another ADR (refines without reversing it), set
   `amended_by` on the original and `amends` on the new one, and leave the
   original's status unchanged.
6. `npx prettier --write "docs/adr/**/*.md"` before committing.
