# GitHub Copilot Instructions — Time Traveler

Trust these instructions. Only search the codebase if information here is incomplete or appears incorrect.

## What This Repository Is

**Time Traveler** is a temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time. Key features include fractal zoomable timelines, multi-dimensional character modeling (7 types: Human, Animal, Mythological, Fictional, Organization, Divine, Artifact), and a hybrid temporal system supporting dates from the Big Bang to the far future. The planned stack is **Next.js 16+ (App Router), React 19, TypeScript, Supabase (PostgreSQL + JSONB, Auth, Realtime, RLS), TanStack Query, Zustand, shadcn/ui, Tailwind CSS, D3.js**. Target hosting is **Vercel** (frontend) + **Supabase** (backend/database).

**Current state:** `apps/admin` and `apps/docs` still contain Turborepo boilerplate pages, while the Supabase layer already has nine schema/policy/function/storage migrations plus pgTAP database tests.

## Repository Layout

This is a **pnpm monorepo** orchestrated by **Turborepo**.

```
/
├── apps/
│   ├── admin/          # Next.js 16 administration app (port 3000) — package name: "admin"
│   └── docs/           # Next.js 16 docs app (port 3001) — package name: "docs"
├── packages/
│   ├── ui/             # @repo/ui — shared React components (button, card, code)
│   ├── services/       # @repo/services — shared Supabase clients, schemas, and service modules
│   ├── eslint-config/  # @repo/eslint-config — shared ESLint configs (base, next, react-internal)
│   └── typescript-config/ # @repo/typescript-config — shared tsconfig (base, nextjs, react-library)
├── docs/               # Project documentation (PRD, system design, admin design wireframes, historical papers)
├── supabase/           # Local Supabase config, SQL migrations, and pgTAP database tests
├── .github/
│   └── copilot-instructions.md # Copilot repository instructions
├── package.json        # Root — defines workspace-level scripts
├── turbo.json          # Turborepo task graph
├── pnpm-workspace.yaml # Workspace packages: apps/*, packages/*
└── .nvmrc              # Node.js v24
```

**Key config files:**

- `apps/admin/eslint.config.js`, `apps/docs/eslint.config.js` — extend `@repo/eslint-config/next-js`
- `apps/admin/tsconfig.json`, `apps/docs/tsconfig.json` — extend `@repo/typescript-config/nextjs.json`
- `packages/ui/tsconfig.json` — extends `@repo/typescript-config/react-library.json`
- `packages/services/eslint.config.mjs` — extends `@repo/eslint-config/base`
- `packages/services/tsconfig.json` — extends `@repo/typescript-config/base.json`
- `packages/ui/package.json` — exports via `"./*": "./src/*.tsx"`
- `packages/services/package.json` — exports via `"./*": "./src/*.ts"`

## Runtime & Tool Versions

- **Node.js:** ≥24 (`.nvmrc` specifies v24; run `nvm use` if using nvm)
- **pnpm:** 9.0.0 (specified in `package.json` `packageManager` field)
- **Turborepo:** 2.8.20
- **TypeScript:** 5.9.2 (all packages)
- **Next.js:** 16.2.0 (both apps)
- **React:** 19.2.x (both apps)

## Build & Validation Commands

**Always run `pnpm install` before building for the first time, or after changing dependencies.**

### Bootstrap

```bash
pnpm install
```

Installs all workspace dependencies. Takes ~3s when packages are cached.

### Build (validated ✓)

```bash
pnpm run build
```

Runs `turbo run build` across all packages and apps. Takes ~7s on first run; subsequent runs use Turborepo cache (~44ms, "FULL TURBO"). Outputs go to `apps/*/`.next/`.

### Lint (validated ✓ — zero warnings allowed)

```bash
pnpm run lint
```

Runs ESLint with `--max-warnings 0` across `packages/ui`, `apps/admin`, and `apps/docs`. **Lint failures and warnings both fail the build.** Takes ~4s first run, faster with cache.

### Type Check (validated ✓)

```bash
pnpm run check-types
```

Runs `next typegen && tsc --noEmit` in each Next.js app and `tsc --noEmit` in `packages/ui`. Takes ~3s.

### Format

```bash
pnpm run format
```

Runs `prettier --write "**/*.{ts,tsx,md}"`. Run this after editing `.ts`, `.tsx`, or `.md` files.

### Dev (starts all apps in watch mode)

```bash
pnpm run dev
```

Starts `apps/admin` on port 3000 and `apps/docs` on port 3001 concurrently.

### Tests

**Vitest** is configured for `packages/ui` and `packages/services`. Run tests via Turborepo:

```bash
pnpm run test              # run all tests once
pnpm run test:coverage     # run tests with 80% coverage threshold enforcement
```

Coverage reports are written to `packages/*/coverage/`. Do not add apps to the test workspace until there is unit-testable code in them.

## Validation Checklist Before Submitting Changes

Run these in order — all must pass:

1. `pnpm install` — if you added/changed dependencies
2. **`pnpm run format`** — run this **before `git add`**; the husky pre-commit hook runs `format:check` and will block the commit if any `.ts`, `.tsx`, or `.md` file is not formatted. One write-pass here prevents hook-related commit failures.
3. `pnpm run check-types` — TypeScript must compile with no errors
4. `pnpm run lint` — zero ESLint errors or warnings
5. `pnpm run build` — must produce a successful Next.js build
6. `pnpm run test:coverage` — all tests must pass with ≥80% coverage
7. `pnpm run db:test` — if you made database schema changes

Or run steps 2–6 at once (minus db:test) via `pnpm verify`.

## Important Rules & Conventions

- **TypeScript strict mode** is enabled (`strict: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`). All types must be explicit and correct.
- **ESLint zero-warnings policy**: `--max-warnings 0` is enforced in every app and package. Any warning is treated as an error.
- **ESM modules**: Both app `package.json` files have `"type": "module"`. Use ESM import/export syntax everywhere.
- **Shared packages**: Import UI components as `@repo/ui/button`, `@repo/ui/card`, etc. (resolved via `packages/ui/src/*.tsx`). Import configs as `@repo/eslint-config/...` and `@repo/typescript-config/...`.
- **Turborepo task graph**: `build` depends on `^build` (packages build before apps). Do not run per-app builds in isolation unless you have already built the packages.
- **GitHub Actions workflows**: CI runs Lint, Type Check, Build, and Test on every push/PR. All four jobs are required status checks on `main`.
- **Documentation**: `docs/prd/PRD-0001-time-traveler-system.md` (product requirements) and `docs/system-design.md` (architecture, schema, API design) are the authoritative references for feature work. `docs/design/admin/` contains the fidelity-1 wireframes for the admin app (characters + events CRUD plus the relationships editor) — read these alongside PRD §7.11 when doing UI work in `apps/admin`. Divergences between the wireframes and PRD §7.11 are tracked in #127.
- **App package names**: The app package names are `admin` and `docs`; Turborepo references them as `admin:*` and `docs:*`.

## When You're Blocked

- If a required API, package, or service is unavailable — STOP. Add a `// BLOCKED: [reason]` comment and move on. Do not mock, stub, or simulate the missing dependency.
- If a task requires credentials, secrets, or tokens you don't have — leave a placeholder with `// NEEDS: [credential description]`. Never hardcode, generate, or invent values.
- If you're unsure about the correct business logic — do not guess. Add `// DECISION NEEDED: [describe the ambiguity]` and implement the most conservative path.
- If a pattern conflicts with existing project conventions — follow the existing convention. Flag the conflict with a comment, don't silently override it.

## When You Find a Spec or Upstream Bug

If implementing a task reveals a bug in the spec (`docs/system-design.md`, PRD), schema, or another upstream artifact, do not silently work around it. File a separate GitHub issue documenting the bug, its evidence, the workaround applied in code, and the recommended upstream fix. Reference the tracking issue in the workaround comment if the workaround is non-obvious. See #73 for an example.

## When to Write an ADR

Architectural decisions are recorded as Architecture Decision Records in `docs/adr/`. The retroactive series ADR-0001 through ADR-0027 documents every load-bearing decision made to date; the index, format rules, and process live in `docs/adr/README.md`.

- Write a new ADR when a decision is **hard to reverse, cross-cutting, or precedent-setting** — e.g., a new platform/dependency, a schema or RLS pattern, an API boundary, a state/data-flow choice, or a design-system rule. Routine, local, easily-reversible changes do not need one.
- **Number new ADRs from 0029 onward** (0028 records the Milestone 7 period/category model). Copy `docs/adr/adr-0000-template.md`, fill in every section, cite concrete evidence (a migration file/section or a doc section), and add a row to the `docs/adr/README.md` index.
- If a new decision **supersedes or amends** an existing ADR, set the `supersedes`/`superseded_by` front matter on both ADRs and update the index status accordingly.
