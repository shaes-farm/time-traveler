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

**Greenfield, mid-development.** The Supabase layer is largely complete: 13 numbered migrations cover schema, RLS, indexes, views, functions, storage, and follow-up data integrity fixes, with pgTAP tests for the database surface. The two Next.js apps under `apps/` are currently Turborepo boilerplate — the admin app's fidelity-1 IA + interaction wireframes are documented in [`docs/design/admin/`](docs/design/admin/) and ready for implementation.

## Stack

| Layer         | Technology                                                                         |
| ------------- | ---------------------------------------------------------------------------------- |
| Frontend      | Next.js 16 (App Router), React 19, TypeScript 6.0                                  |
| UI            | CSS Modules, global CSS, shared React components in `@repo/ui`                     |
| Server state  | Planned: TanStack Query                                                            |
| Client state  | Planned: Zustand                                                                   |
| Backend / API | Supabase PostgREST (auto-generated REST), `@supabase/supabase-js`, `@supabase/ssr` |
| Database      | Supabase PostgreSQL 17 with JSONB temporal storage and RLS                         |
| Auth          | Supabase Auth (email, magic link, OAuth)                                           |
| Realtime      | Supabase Realtime (Postgres Changes, Broadcast, Presence)                          |
| Storage       | Supabase Storage                                                                   |
| Hosting       | Vercel (frontend) + Supabase Cloud (backend / database)                            |

Toolchain: **Node ≥24** (pinned via `.nvmrc`), **pnpm 11.2.2**, **Turborepo 2.9.14**, **TypeScript 6.0.3**, **Supabase CLI ^2.101**.

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
  migrations/                  # numbered SQL migrations (00001 → 00013)
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

Run all four; each must pass:

```bash
pnpm run format:check     # Prettier format check
pnpm run check-types      # TypeScript: next typegen + tsc --noEmit
pnpm run lint             # ESLint with --max-warnings 0 (warnings fail)
pnpm run build            # Turborepo: build all packages and apps
pnpm run test:coverage    # Vitest with 80% coverage threshold
```

For database schema changes also run:

```bash
pnpm run db:test          # pgTAP database tests
```

The same four validations run in GitHub Actions on every push and pull request (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

### Common tasks

```bash
pnpm run format                  # prettier --write "**/*.{ts,tsx,md}"
pnpm run db:reset                # reset local DB and re-apply migrations
pnpm run db:gen:migration <name> # scaffold a new migration
pnpm run db:gen:types            # regenerate ./packages/services/src/supabase/types.ts
pnpm run db:deploy               # supabase db push to remote
```

## Documentation

| Document                                         | Purpose                                                        |
| ------------------------------------------------ | -------------------------------------------------------------- |
| [PRD](docs/prd/PRD-0001-time-traveler-system.md) | Product requirements and functional specs (authoritative)      |
| [System Design](docs/system-design.md)           | Architecture, schema, RLS policies, API design (authoritative) |
| [Admin Design Wireframes](docs/design/admin/)    | Fidelity-1 IA + interaction spec for the admin app             |
| [Historical Papers](docs/historical-papers/)     | Reference material                                             |

For working in the codebase, see also [`CLAUDE.md`](CLAUDE.md) (guidance for Claude Code agents) and [`.github/copilot-instructions.md`](.github/copilot-instructions.md) (guidance for GitHub Copilot).

## Contributing

- TypeScript strict mode is enabled across the workspace (`strict`, `strictNullChecks`, `noUncheckedIndexedAccess`).
- ESLint runs with `--max-warnings 0` everywhere — warnings fail the build.
- Migrations are append-only and numbered; use `pnpm run db:gen:migration <name>` to scaffold.
- When implementing a task reveals a bug in an upstream spec (PRD, system design, schema), file a separate issue rather than silently working around it. See [#73](https://github.com/shaes-farm/time-traveler/issues/73) for the issue template style.

## License

See [LICENSE](LICENSE).
