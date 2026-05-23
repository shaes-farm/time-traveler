# GitHub Copilot Instructions — Time Traveler

Trust these instructions. Only search the codebase if information here is incomplete or appears incorrect.

## What This Repository Is

**Time Traveler** is a temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time. Key features include fractal zoomable timelines, multi-dimensional character modeling (7 types: Human, Animal, Mythological, Fictional, Organization, Divine, Artifact), and a hybrid temporal system supporting dates from the Big Bang to the far future. The planned stack is **Next.js 16+ (App Router), React 19, TypeScript, Supabase (PostgreSQL + JSONB, Auth, Realtime, RLS), TanStack Query, Zustand, shadcn/ui, Tailwind CSS, D3.js**. Target hosting is **Vercel** (frontend) + **Supabase** (backend/database).

**Current state (branch `rebuild-app-from-scratch`):** Both apps contain Turborepo boilerplate scaffolding — the Time Traveler features are not yet implemented.

## Repository Layout

This is a **pnpm monorepo** orchestrated by **Turborepo**.

```
/
├── apps/
│   ├── admin/          # Next.js 16 administration app (port 3000) — package name: "admin"
│   └── docs/           # Next.js 16 docs app (port 3001) — package name: "docs"
├── packages/
│   ├── ui/             # @repo/ui — shared React components (button, card, code)
│   ├── eslint-config/  # @repo/eslint-config — shared ESLint configs (base, next, react-internal)
│   └── typescript-config/ # @repo/typescript-config — shared tsconfig (base, nextjs, react-library)
├── docs/               # Project documentation (PRD, system design, historical papers)
├── .github/
│   └── workflows/      # GitHub Actions workflows (no CI build pipeline)
├── package.json        # Root — defines workspace-level scripts
├── turbo.json          # Turborepo task graph
├── pnpm-workspace.yaml # Workspace packages: apps/*, packages/*
└── .nvmrc              # Node.js v24
```

**Key config files:**
- `apps/admin/eslint.config.js`, `apps/docs/eslint.config.js` — extend `@repo/eslint-config/next-js`
- `apps/admin/tsconfig.json`, `apps/docs/tsconfig.json` — extend `@repo/typescript-config/nextjs.json`
- `packages/ui/tsconfig.json` — extends `@repo/typescript-config/react-library.json`
- `packages/ui/package.json` — exports via `"./*": "./src/*.tsx"`

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

### No tests currently
There is no test framework configured (no jest, vitest, or cypress). The `package.json` files have no `test` script. Do not attempt to run `npm test` or `pnpm test`.

## Validation Checklist Before Submitting Changes

Run these in order — all must pass:

1. `pnpm install` — if you added/changed dependencies
2. `pnpm run check-types` — TypeScript must compile with no errors
3. `pnpm run lint` — zero ESLint errors or warnings
4. `pnpm run build` — must produce a successful Next.js build
5. `pnpm run db:test` — if you made database schema changes

## Important Rules & Conventions

- **TypeScript strict mode** is enabled (`strict: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`). All types must be explicit and correct.
- **ESLint zero-warnings policy**: `--max-warnings 0` is enforced in every app and package. Any warning is treated as an error.
- **ESM modules**: Both app `package.json` files have `"type": "module"`. Use ESM import/export syntax everywhere.
- **Shared packages**: Import UI components as `@repo/ui/button`, `@repo/ui/card`, etc. (resolved via `packages/ui/src/*.tsx`). Import configs as `@repo/eslint-config/...` and `@repo/typescript-config/...`.
- **Turborepo task graph**: `build` depends on `^build` (packages build before apps). Do not run per-app builds in isolation unless you have already built the packages.
- **No CI pipeline**: There is no `ci.yml` GitHub Actions build workflow. Validation is done locally via the commands above.
- **Documentation**: `docs/prd/PRD-0001-time-traveler-system.md` (product requirements) and `docs/system-design.md` (architecture, schema, API design) are the authoritative references for feature work.
- **App name discrepancy**: The admin app's `package.json` uses `"name": "web"` — Turborepo references it as `web:build`, `web:lint`, etc.

## When You're Blocked

- If a required API, package, or service is unavailable — STOP. Add a `// BLOCKED: [reason]` comment and move on. Do not mock, stub, or simulate the missing dependency.
- If a task requires credentials, secrets, or tokens you don't have — leave a placeholder with `// NEEDS: [credential description]`. Never hardcode, generate, or invent values.
- If you're unsure about the correct business logic — do not guess. Add `// DECISION NEEDED: [describe the ambiguity]` and implement the most conservative path.
- If a pattern conflicts with existing project conventions — follow the existing convention. Flag the conflict with a comment, don't silently override it.

## When You Find a Spec or Upstream Bug

If implementing a task reveals a bug in the spec (`docs/system-design.md`, PRD), schema, or another upstream artifact, do not silently work around it. File a separate GitHub issue documenting the bug, its evidence, the workaround applied in code, and the recommended upstream fix. Reference the tracking issue in the workaround comment if the workaround is non-obvious. See #73 for an example.
