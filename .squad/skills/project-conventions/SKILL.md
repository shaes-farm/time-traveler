---
name: "project-conventions"
description: "Core conventions and patterns for the Time Traveler temporal CMS codebase"
---

## Context

Time Traveler is a temporal content management system for historical events spanning the Big Bang to the present. It uses a Turborepo monorepo with Next.js 16 + React 19 on the frontend, Supabase (PostgreSQL + PostgREST + Edge Functions + RLS) on the backend, and a hybrid JSONB temporal data model that supports dates across all eras (CE, BCE, KYA, MYA, BYA). These conventions codify the architectural decisions from the system design and ensure consistent development practices.

---

## 1. Local Development Setup

### Prerequisites

- Node.js 18+ (see `.nvmrc`)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.0.0 --activate`)
- Docker Desktop or Docker Engine (required by Supabase CLI)
- Supabase CLI (`npx supabase --version` or install globally)

### Startup Sequence

```bash
# 1. Install dependencies
pnpm install

# 2. Start local Supabase (boots PostgreSQL, PostgREST, Auth, Realtime, Studio via Docker)
supabase start

# 3. Copy the output keys into apps/admin/.env.local:
#    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from output>
#    SUPABASE_SERVICE_ROLE_KEY=<service_role key from output>

# 4. Generate TypeScript types from local schema
supabase gen types typescript --local > apps/admin/src/lib/supabase/types.ts

# 5. Start dev servers (admin on :3000, docs on :3001)
pnpm dev
```

### Local Supabase Ports

| Port  | Service         |
|-------|-----------------|
| 54321 | API (PostgREST) |
| 54322 | PostgreSQL      |
| 54323 | Studio (UI)     |
| 54324 | Inbucket (email)|

### Common Commands

```bash
supabase stop              # Shut down local containers (preserves data)
supabase stop --no-backup  # Shut down and wipe all local data
supabase db reset          # Re-run all migrations + seed.sql from scratch
supabase db diff -f <name> # Generate a new migration from local schema changes
supabase gen types typescript --local > apps/admin/src/lib/supabase/types.ts  # Regen types
```

### Environment Variables

Each app has its own `.env.local` (never committed). Required for `apps/admin`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start>
```

- `NEXT_PUBLIC_` vars are exposed to the browser — never use this prefix for the service role key.
- Turbo already includes `.env*` in build inputs. Add Supabase vars to `globalEnv` in `turbo.json` if you get `turbo/no-undeclared-env-vars` warnings.

---

## 2. Monorepo Conventions

### Structure

```
time-traveler/
  apps/admin/                  # Main Next.js app (port 3000)
  apps/docs/                   # Documentation site (port 3001)
  packages/ui/                 # Shared React components (@repo/ui)
  packages/eslint-config/      # Shared ESLint configs (@repo/eslint-config)
  packages/typescript-config/  # Shared TSConfig bases (@repo/typescript-config)
  supabase/                    # Supabase project (migrations, functions, seed)
  docs/                        # Project documentation (PRD, system design)
```

### Package Naming and Imports

- Workspace packages use the `@repo/` scope: `@repo/ui`, `@repo/eslint-config`
- Reference with `"workspace:*"` protocol in `package.json`
- `@repo/ui` uses direct file exports — no barrel `index.ts`:

```typescript
// Correct
import { Button } from "@repo/ui/button";

// Wrong — no barrel exports
import { Button } from "@repo/ui";
```

### Dependency Placement

- Shared devDependencies (`prettier`, `turbo`, `typescript`) at the monorepo root
- App-specific dependencies in the app's own `package.json`
- TypeScript version pinned at `5.9.2` across all packages (not caret-ranged)

### Turbo Tasks

- `pnpm build` — builds all packages/apps (respects dependency order via `^build`)
- `pnpm dev` — starts all dev servers (`persistent: true`, never cached)
- `pnpm lint` — lints all packages/apps
- `pnpm check-types` — type-checks all packages/apps
- Filter to a single app: `turbo run dev --filter=admin`

---

## 3. TypeScript & Code Style

### Strict Mode

TypeScript strict mode is enabled globally via `packages/typescript-config/base.json`:

- `strict: true` — enables all strict checks
- `noUncheckedIndexedAccess: true` — `obj[key]` returns `T | undefined`, must narrow before use
- `isolatedModules: true` — no `const enum`, no namespace merging
- Target: `ES2022`, Module: `ESNext`, Resolution: `Bundler`

```typescript
// noUncheckedIndexedAccess requires narrowing
const items: string[] = ["a", "b"];
const first = items[0]; // type: string | undefined

if (first) {
  console.log(first.toUpperCase()); // OK — narrowed to string
}
```

### Naming Conventions

| What                        | Convention       | Example                          |
|-----------------------------|------------------|----------------------------------|
| Utility/service files       | `kebab-case.ts`  | `temporal-service.ts`            |
| Shared UI components        | `lowercase.tsx`  | `button.tsx`, `card.tsx`         |
| Types/interfaces            | `PascalCase`     | `TemporalData`, `EventInput`    |
| Zod schemas                 | `camelCase` + `Schema` | `temporalDataSchema`       |
| Functions                   | `camelCase`      | `generateSlug`, `createEvent`   |
| Constants                   | `UPPER_SNAKE_CASE` | `MAX_TIMELINE_DEPTH`          |
| DB column names             | `snake_case`     | `created_at`, `temporal_data`   |
| TS properties matching DB   | `snake_case`     | Match generated Supabase types   |

### Database Types

Database row types are auto-generated by `supabase gen types typescript`. Never hand-write them.

```typescript
import type { Database } from "@/lib/supabase/types";

// Use generated types directly
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
```

### Linting & Formatting

- ESLint 9 flat config — base config at `packages/eslint-config/base.js`
- Next.js apps extend `packages/eslint-config/next.js`
- `eslint-plugin-only-warn` is active (all rules emit warnings)
- `--max-warnings 0` on lint script — warnings are errors in CI
- Prettier 3.7.4 — run `pnpm format` from root
- `eslint-config-prettier` disables conflicting rules

---

## 4. Next.js App Router Patterns

### Server vs. Client Components

Default to Server Components. Add `"use client"` only when the component uses hooks, browser APIs, event handlers, or Zustand stores.

```typescript
// Server Component (default) — fetches data directly
export default async function TimelinePage({ params }: { params: { slug: string } }) {
  const supabase = await createServerClient();
  const { data: timeline } = await supabase
    .from("timelines")
    .select("*, events(*)")
    .eq("slug", params.slug)
    .single();

  return <TimelineView timeline={timeline} />;
}
```

```typescript
// Client Component — uses hooks and interactivity
"use client";

import { useTimeline } from "@/hooks/use-timelines";

export function TimelineEditor({ slug }: { slug: string }) {
  const { data: timeline, isLoading } = useTimeline(slug);
  // ...
}
```

### Route Groups

```
app/
  (public)/          # No auth required — public timeline/event/character views
  (protected)/       # Requires authentication — dashboard, create, library
  (admin)/           # Requires is_admin() — admin dashboard, moderation
  auth/              # Login, signup, callback routes
```

### Routing Conventions

- Entity detail pages use slugs: `/timelines/[slug]`, `/events/[slug]`, `/characters/[slug]`
- Create/edit pages under protected routes: `/timelines/create`, `/events/[slug]/edit`
- `middleware.ts` at the app root handles auth route protection

---

## 5. Supabase Patterns

### Client Creation

```typescript
// lib/supabase/client.ts — Browser client (Client Components)
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts — Server client (Server Components, Route Handlers, Server Actions)
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createServerClient() {
  const cookieStore = await cookies();
  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### PostgREST — All CRUD Goes Here

```typescript
// Insert — always chain .select().single() to get the created row back
const { data, error } = await supabase
  .from("events")
  .insert({ title, slug, temporal_data, timeline_id, user_id: session.user.id })
  .select()
  .single();

// Update — always filter by ID
const { data, error } = await supabase
  .from("events")
  .update({ title, temporal_data })
  .eq("id", eventId)
  .select()
  .single();

// Delete — cascade handles dependent rows
const { error } = await supabase
  .from("events")
  .delete()
  .eq("id", eventId);

// Select with joins
const { data, error } = await supabase
  .from("events")
  .select("*, characters(*), categories(*), media(*)")
  .eq("timeline_id", timelineId)
  .order("sort_order_years", { ascending: true });

// Full-text search
const { data, error } = await supabase
  .from("events")
  .select()
  .textSearch("search_vector", query);
```

### RLS Policies

- Every table has RLS enabled — no exceptions
- Read policy pattern: `published = true OR user_id = auth.uid() OR is_admin()`
- Write policy pattern: `user_id = auth.uid() OR is_admin()`
- Junction tables derive ownership from the parent entity — no `user_id` column on junction tables
- `is_admin()` is a `SECURITY DEFINER` function that checks `profiles.role`

### Edge Functions

- Located in `supabase/functions/<function-name>/index.ts`
- Deno runtime — imports from `https://deno.land/std` and `https://esm.sh/`
- Used ONLY for orchestration: bulk import, timeline export, library import, image processing, geocoding, publish workflow
- Never for simple CRUD — that is PostgREST's job

### Migrations

```bash
# Create a new migration from local schema changes
supabase db diff -f add_story_arcs

# Apply all migrations locally (wipes and rebuilds)
supabase db reset

# Regenerate types after migration
supabase gen types typescript --local > apps/admin/src/lib/supabase/types.ts
```

- All migrations in `supabase/migrations/` with timestamps: `YYYYMMDDHHMMSS_description.sql`
- Generated types file is committed to the repo

---

## 6. Database Conventions

### JSONB Temporal Data

All dates use `temporal_data JSONB` — never VARCHAR. Structure:

```typescript
// Zod schema for temporal data validation
const temporalDataSchema = z.object({
  year: z.number(),
  era: z.enum(["CE", "BCE", "KYA", "MYA", "BYA"]),
  precision: z.enum(["exact", "circa", "approximate", "estimated", "geological"]),
  month: z.number().min(1).max(12).optional(),       // CE/BCE only
  day: z.number().min(1).max(31).optional(),          // CE/BCE only
  hour: z.number().min(0).max(23).optional(),         // CE/BCE only
  minute: z.number().min(0).max(59).optional(),       // CE/BCE only
  second: z.number().min(0).max(59).optional(),       // CE/BCE only
  uncertainty: z.number().optional(),
  geological_period: z.string().optional(),           // KYA/MYA/BYA eras
  geological_epoch: z.string().optional(),
  cosmological_epoch: z.string().optional(),          // BYA era
  display_format: z.string().optional(),
  dating_method: z.string().optional(),
  confidence_level: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
});

type TemporalData = z.infer<typeof temporalDataSchema>;
```

### Primary Keys and Slugs

- Primary keys: `UUID DEFAULT gen_random_uuid()` — never BIGINT
- Slugs: `VARCHAR(100)`, unique per user via composite index `(user_id, slug)`
- Slug generation logic lives in TypeScript, not the database

### Generated Columns

```sql
-- Temporal sort order (converts all eras to a comparable BIGINT)
sort_order_years BIGINT GENERATED ALWAYS AS (...) STORED

-- Full-text search vector (must use 'english'::regconfig — the text overload is STABLE, not IMMUTABLE)
search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || coalesce(description, ''))) STORED

-- Computed date for modern CE dates only
computed_start_date TIMESTAMPTZ GENERATED ALWAYS AS (...) STORED
```

Never write to generated columns — they are automatically maintained.

### Table and Column Naming

- Core entities: `profiles`, `timelines`, `periods`, `events`, `stories`, `characters`, `categories`, `media`
- Junction tables: `event_categories`, `event_media`, `event_characters`, `timeline_events`
- Junction tables use composite primary keys — no surrogate `id` column
- All foreign keys use `ON DELETE CASCADE`
- Use CHECK constraints for enum-like values — never PostgreSQL ENUM types
- Timestamps: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`

### Database Functions

- Read-only queries ONLY — never use functions for CRUD
- Use `LANGUAGE sql` with `STABLE` volatility (not `plpgsql`) — enables query optimizer inlining
- `SECURITY DEFINER` only when the function must bypass RLS (e.g., `is_admin()`)

---

## 7. State Management

### TanStack Query (Server State)

Use for ALL data from Supabase. Query key convention: `["entity", ...params]`.

```typescript
// hooks/use-events.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useEvents(timelineId: string) {
  return useQuery({
    queryKey: ["events", timelineId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("events")
        .select("*, characters(*), categories(*)")
        .eq("timeline_id", timelineId)
        .order("sort_order_years");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInsert) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("events")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events", data.timeline_id] });
    },
  });
}
```

### Zustand (Client-Only UI State)

Use ONLY for UI/navigation state not from the server.

```typescript
// stores/navigation-store.ts
import { create } from "zustand";

interface NavigationState {
  zoomLevel: number;
  viewMode: "fractal" | "list" | "map";
  selectedTimelineId: string | null;
  setZoomLevel: (level: number) => void;
  setViewMode: (mode: NavigationState["viewMode"]) => void;
  setSelectedTimeline: (id: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  zoomLevel: 1,
  viewMode: "fractal",
  selectedTimelineId: null,
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedTimeline: (id) => set({ selectedTimelineId: id }),
}));
```

### Decision Guide

| Question | Answer |
|----------|--------|
| Data from the database? | TanStack Query |
| UI state shared across components during navigation? | Zustand |
| UI state that resets on page reload? | React `useState` |
| Form state? | React Hook Form or `useState` |

---

## 8. UI & Component Patterns

### shadcn/ui

- Component source files in `apps/admin/src/components/ui/`
- Install: `npx shadcn@latest add <component>` from within `apps/admin`
- These are source code, not dependencies — customize freely

### Shared Component Library (`@repo/ui`)

- For components shared between apps
- One component per file, named export
- `"use client"` directive required on components using hooks or event handlers

### Tailwind CSS

- Utility-first — compose with Tailwind classes
- CSS variables for theming (shadcn/ui pattern)
- Responsive: mobile-first (`sm:`, `md:`, `lg:`)
- Use `cn()` for conditional class merging — no `@apply` in component files

```typescript
import { cn } from "@/lib/utils";

<div className={cn("p-4 rounded-lg", isActive && "bg-primary text-primary-foreground")} />
```

### Domain Component Directories

```
src/components/
  timeline/     # FractalView, TimelineRenderer, TimelineCard
  event/        # EventCard, EventDetail, EventForm
  character/    # CharacterProfile, CharacterTimeline, RelationshipNetwork
  temporal/     # TemporalInput, TemporalDisplay, PrehistoricTimeline
  showcase/     # MediaGallery, MediaUploader
  admin/        # Admin-only (moderation, user management)
  ui/           # shadcn/ui primitives
```

---

## 9. Testing

### Frameworks

- **Vitest** for unit and integration tests (to be configured)
- **Playwright** for E2E tests (to be configured)

### What to Test

- **Temporal logic**: era conversions, sort order computation, display formatting — critical business logic
- **Zod schemas**: validation of temporal data, event inputs, character inputs
- **Service layer**: `createEventWithRelations`, junction table management
- **Slug generation**: uniqueness, special character sanitization
- **RLS policies**: integration tests against local Supabase with different user roles

### Supabase Testing

```bash
# Reset to clean state before test suite
supabase db reset

# Run tests against local Supabase
pnpm test
```

- Use `supabase start` for integration tests against a real local database
- Seed test data via `supabase/seed.sql` or programmatic setup
- Test RLS by creating users with different roles and verifying access

### Test Location

- Unit/integration: `tests/services/`, `tests/schemas/` at app root
- E2E: `tests/e2e/`
- Co-located `*.test.ts` files acceptable for utility functions

---

## 10. Error Handling

### Supabase Calls

Every Supabase call returns `{ data, error }`. Always check `error` before using `data`.

```typescript
const { data, error } = await supabase.from("events").select().single();
if (error) throw new Error(`Failed to fetch event: ${error.message}`);
// data is now safely typed as non-null
```

### Form Validation

- Zod schemas for all form validation (same schemas used for API payloads)
- Display field-level errors from `ZodError.issues`
- Temporal data has era-dependent validation (month/day only for CE/BCE)

### Mutations

- Surface mutation errors to the user via toast notifications
- TanStack Query `onError` callbacks handle failures with user-friendly messages

### Multi-Step Operations

- Service layer functions throw on primary insert failure
- Junction table insert failures after a successful primary insert are non-fatal — the user can add relations later
- Log junction failures for debugging but do not roll back the primary entity

### Edge Functions

- Return structured JSON: `{ error: string, details?: unknown }`
- HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 500 (internal)

---

## 11. Anti-Patterns

- **Never use stored procedures for CRUD.** PostgREST handles all creates, updates, and deletes. Stored procedures bypass TypeScript type generation and move business logic where it's harder to test.

- **Never put `user_id` on junction tables.** Ownership is derived from the parent entity via RLS. Adding `user_id` creates data integrity risk.

- **Never use VARCHAR for temporal data.** All dates use `temporal_data JSONB` with the structured schema. VARCHAR dates cannot be sorted, range-queried, or validated.

- **Never use BIGINT for primary keys.** All PKs are `UUID DEFAULT gen_random_uuid()`. UUIDs enable client-side generation for optimistic inserts.

- **Never use PostgreSQL ENUM types.** Use VARCHAR with CHECK constraints. ENUMs require migrations to add values.

- **Never use Edge Functions for simple CRUD.** Edge Functions are for orchestration only. Single-entity CRUD goes through PostgREST.

- **Never put server data in Zustand.** Server state belongs in TanStack Query. Zustand is exclusively for client-side UI state.

- **Never use `plpgsql` for read-only database functions.** Use `LANGUAGE sql` with `STABLE` volatility. SQL functions are inlineable by the optimizer.

- **Never skip `.select()` after `.insert()`.** Always chain `.select().single()` to get the created row back with server-generated fields.

- **Never use `NEXT_PUBLIC_` prefix for service role keys.** The service role key bypasses RLS and must never be exposed to the browser.

- **Never create barrel `index.ts` files in `@repo/ui`.** Each component is a direct file export.

- **Never hand-edit the auto-generated Supabase types file.** It is overwritten on every `supabase gen types typescript` run. Extend types in `src/types/` instead.
