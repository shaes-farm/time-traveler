# Project Context

- **Owner:** SHAES Farm
- **Project:** Time Traveler — A temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time.
- **Stack:** Next.js 16+, TypeScript, Supabase (Auth, Storage, Realtime, RLS), PostgreSQL with JSONB, pnpm workspaces, Turborepo
- **Created:** 2026-03-23

## Core Context

### What We're Building

Time Traveler is a temporal CMS. Key infrastructure concerns for this project:

- **Monorepo:** pnpm + Turborepo — build pipeline must handle `packages/` building before `apps/`
- **Deployment:** Vercel (frontend apps) + Supabase (backend/database)
- **Two Next.js apps:** `apps/admin` (admin/creator interface) and `apps/docs` (documentation)
- **Database migrations:** Supabase CLI migrations — must run before app deploys that depend on them
- **Environment separation:** dev (local Supabase) → staging → production
- **Secrets:** Supabase URL, anon key, service role key, OAuth credentials — managed via Vercel env + local `.env.local`

### Key Files to Know

- `turbo.json` — Turborepo task graph (build depends on `^build`)
- `pnpm-workspace.yaml` — workspace packages layout
- `apps/admin/next.config.js`, `apps/docs/next.config.js` — Next.js config per app
- `.github/workflows/` — GitHub Actions (currently squad automation only, no CI pipeline yet)
- `package.json` root — workspace-level scripts: `build`, `lint`, `check-types`, `format`

### Build Commands (validated)

```bash
pnpm install          # install all workspace deps
pnpm run build        # turbo build across all packages+apps
pnpm run lint         # eslint --max-warnings 0 (zero warnings policy)
pnpm run check-types  # tsc --noEmit in all packages+apps
```

## Learnings

