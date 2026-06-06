# Time Traveler

[![Build Status](https://img.shields.io/github/actions/workflow/status/shaes-farm/time-traveler/ci.yml?style=flat&branch=main)](https://github.com/shaes-farm/time-traveler/actions)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/shaes-farm/time-traveler/codeql.yml?style=flat&branch=main&label=CodeQL)](https://github.com/shaes-farm/time-traveler/actions/workflows/codeql.yml)
[![Coverage Status](https://coveralls.io/repos/github/shaes-farm/time-traveler/badge.svg?style=flat&branch=main)](https://coveralls.io/github/shaes-farm/time-traveler?branch=main)
[![Snyk](https://snyk.io/test/github/shaes-farm/time-traveler/badge.svg)](https://snyk.io/test/github/shaes-farm/time-traveler)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat&logo=typescript&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2.x-EF4444?style=flat&logo=turborepo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3FCF8E?style=flat&logo=supabase&logoColor=white)

A temporal content management system for storing, visualizing, and interacting with historical events across the full span of time — from the Big Bang through the speculative future.

Distinguishing features:

- **Fractal timelines** — events contain nested sub-events for temporal hierarchy across scales.
- **Hybrid temporal system** — JSONB-encoded dates with era + precision metadata, extending beyond SQL date limits to handle BYA / MYA / KYA / BCE / CE in a single sort axis.
- **Seven character types** — Human, Animal, Mythological, Fictional, Organization, Divine, Artifact — with temporally-scoped relationships across 11 type categories.
- **Row-level security throughout** — published-or-owner-or-admin pattern; collaborator access via timeline junction tables.

For the product specification, see [`docs/prd/PRD-0001-time-traveler-system.md`](docs/prd/PRD-0001-time-traveler-system.md). For the system design, see [`docs/system-design.md`](docs/system-design.md).

---

## Status

**Greenfield, mid-development.** The Supabase layer is largely complete: 19 numbered migrations cover schema, RLS, indexes, views, functions, storage, and follow-up data-integrity fixes, with pgTAP tests for the database surface. `apps/admin` is under active development against fidelity-1 wireframes in [`docs/design/admin/`](docs/design/admin/) — auth, the app shell, dashboard, entity list pages, and the timeline create/edit editor are in place. The public-facing reader is designed (comprehensive UX artifacts in [`docs/design/public/`](docs/design/public/)) but not yet implemented; it will live in a dedicated `apps/reader` per [ADR-0030](docs/adr/adr-0030-public-reader-app-placement.md). All 32 load-bearing architectural decisions are documented in [`docs/adr/`](docs/adr/) — the first 27 were retroactively recorded in May 2026; the series continues with forward decisions (0028 onward). `apps/docs` is still Turborepo boilerplate.

## Stack

| Layer         | Technology                                                                         |
| ------------- | ---------------------------------------------------------------------------------- |
| Frontend      | Next.js 16 (App Router), React 19, TypeScript 6.0                                  |
| UI            | Tailwind CSS + shadcn/ui primitives in `@repo/ui`                                  |
| Server state  | TanStack Query (`@repo/ui/hooks`)                                                  |
| Client state  | Zustand (`@repo/ui/stores`)                                                        |
| Backend / API | Supabase PostgREST (auto-generated REST), `@supabase/supabase-js`, `@supabase/ssr` |
| Database      | Supabase PostgreSQL 17 with JSONB temporal storage and RLS                         |
| Auth          | Supabase Auth (email, magic link, OAuth)                                           |
| Realtime      | Supabase Realtime (Postgres Changes, Broadcast, Presence)                          |
| Storage       | Supabase Storage                                                                   |
| Hosting       | Vercel (frontend) + Supabase Cloud (backend / database)                            |

Toolchain: **Node ≥24** (pinned via `.nvmrc`), **pnpm 11.2.2**, **Turborepo 2.9.16**, **TypeScript 6.0.3**, **Supabase CLI ^2.101**.

## Repository layout

```text
apps/
  admin/                       # Next.js admin app (port 3000)
  docs/                        # Next.js docs app (port 3001)
packages/
  ui/                          # @repo/ui — shared React components
  services/                    # @repo/services — Supabase clients, schemas, service modules
  eslint-config/               # @repo/eslint-config — shared ESLint configs
  typescript-config/           # @repo/typescript-config — shared tsconfig presets
supabase/
  migrations/                  # numbered SQL migrations (00001 → 00019)
  tests/database/              # pgTAP database tests
docs/
  prd/                         # product requirements (authoritative)
  system-design.md             # architecture, schema, API design (authoritative)
  design/admin/                # admin app fidelity-1 wireframes (IA + interaction)
  historical-papers/           # reference material
```

## Getting started

### Prerequisites

- Node.js ≥24 (`nvm use` if using nvm)
- pnpm 11.2.2 (`corepack enable` or `npm install -g pnpm@11`)
- Supabase CLI ≥2.101 (for local development)

### Install

```bash
pnpm install
```

### Develop

```bash
pnpm run dev           # start both apps in watch mode (admin :3000, docs :3001)
pnpm run db:start      # boot local Supabase stack (Postgres 17 + Auth + Storage)
```

### Validate before submitting changes

Run all five; each must pass:

```bash
pnpm run format:check     # Prettier format check
pnpm run check-types      # TypeScript: next typegen + tsc --noEmit
pnpm run lint             # ESLint with --max-warnings 0 (warnings fail)
pnpm run test:coverage    # Vitest with 80% coverage threshold
pnpm run build            # Turborepo: build all packages and apps
```

For database schema changes also run:

```bash
pnpm run db:test          # pgTAP database tests
```

These validations run in GitHub Actions on every push and pull request (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

### Common tasks

```bash
pnpm run format                  # prettier --write "**/*.{ts,tsx,md}"
pnpm run db:reset                # reset local DB and re-apply migrations
pnpm run db:seed:discovery       # manually seed Age of Scientific Discovery dataset (non-auto)
pnpm run db:gen:migration <name> # scaffold a new migration
pnpm run db:gen:types            # regenerate ./packages/services/src/supabase/types.ts
pnpm run db:deploy               # supabase db push to remote
```

Manual dataset seeding docs: [docs/seeding-discovery.md](docs/seeding-discovery.md)

## Documentation

### Product & System

| Document                                         | Purpose                                                        |
| ------------------------------------------------ | -------------------------------------------------------------- |
| [PRD](docs/prd/PRD-0001-time-traveler-system.md) | Product requirements and functional specs (authoritative)      |
| [System Design](docs/system-design.md)           | Architecture, schema, RLS policies, API design (authoritative) |

### Design Artifacts

| Document                                                                                | Purpose                                                                  |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Admin Design](docs/design/admin/)                                                      | Fidelity-1 wireframes, IA, interaction spec, and aesthetic notes         |
| [Public Reader Design](docs/design/public/)                                             | Complete UX design for public-facing timeline explorer and story browser |
| [Public Reader Motion Spec](docs/design/public/06-mid-fidelity/motion-spec.md)          | Animation durations, easing, reduced-motion contract                     |
| [Public Reader Accessibility](docs/design/public/06-mid-fidelity/accessibility-spec.md) | WCAG compliance + keyboard navigation spec                               |

### Architecture & Decisions

| Document                        | Purpose                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| [ADR Index](docs/adr/README.md) | All 32 load-bearing architectural decisions (retroactive 0001–0027, forward 0028–0032) |

**Notable ADRs:** [0001 Supabase](docs/adr/adr-0001-supabase-backend-platform.md) • [0005 Temporal system](docs/adr/adr-0005-hybrid-temporal-system.md) • [0014 RLS](docs/adr/adr-0014-rls-single-source-of-authorization.md) • [0030 Public reader placement](docs/adr/adr-0030-public-reader-app-placement.md)

### Reference

| Document                                       | Purpose                   |
| ---------------------------------------------- | ------------------------- |
| [Historical Papers](docs/historical-papers/)   | Domain research material  |
| [Seeding Discovery](docs/seeding-discovery.md) | Manual dataset seed guide |

For working in the codebase, see also [`CLAUDE.md`](CLAUDE.md) (guidance for Claude Code agents) and [`.github/copilot-instructions.md`](.github/copilot-instructions.md) (guidance for GitHub Copilot).

## Contributing

- TypeScript strict mode is enabled across the workspace (`strict`, `strictNullChecks`, `noUncheckedIndexedAccess`).
- ESLint runs with `--max-warnings 0` everywhere — warnings fail the build.
- Migrations are append-only and numbered; use `pnpm run db:gen:migration <name>` to scaffold.
- When implementing a task reveals a bug in an upstream spec (PRD, system design, schema), file a separate issue rather than silently working around it. See [#73](https://github.com/shaes-farm/time-traveler/issues/73) for the issue template style.

## License

See [LICENSE](LICENSE).
