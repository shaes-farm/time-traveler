# Time Traveler: System Design Document

**Version 3.0** | March 2026  
**Platform:** Supabase + Next.js  
**Status:** Greenfield Design

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Design](#2-architecture-design)
3. [Database Schema](#3-database-schema)
4. [Hybrid Temporal System](#4-hybrid-temporal-system)
5. [API Layer Design](#5-api-layer-design)
6. [Temporal Service Layer](#6-temporal-service-layer)
7. [User Experience Design](#7-user-experience-design)
8. [Indexing & Performance Strategy](#8-indexing--performance-strategy)
9. [Security & Authentication](#9-security--authentication)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Project Structure](#11-project-structure)
12. [Curated Content Library](#12-curated-content-library)
13. [Use Cases & Applications](#13-use-cases--applications)
14. [Appendix A: Enumerated Values](#14-appendix-a-enumerated-values)
15. [Appendix B: Design Decisions Log](#15-appendix-b-design-decisions-log)

---

> **Architecture Decision Records.** The decisions described throughout this
> document are captured as ADRs in [`docs/adr/`](adr/README.md). Key mappings:
> §1.3 → [ADR-0001](adr/adr-0001-supabase-backend-platform.md); §2.2 →
> [ADR-0003](adr/adr-0003-nextjs-app-router-react19.md),
> [ADR-0021](adr/adr-0021-tanstack-query-zustand.md); §3.2 →
> [ADR-0005](adr/adr-0005-hybrid-temporal-system.md),
> [ADR-0006](adr/adr-0006-fractal-timeline-detail-timeline.md),
> [ADR-0007](adr/adr-0007-seven-character-types.md),
> [ADR-0011](adr/adr-0011-publication-model.md); §3.3 →
> [ADR-0008](adr/adr-0008-character-relationships-directed-pairs.md),
> [ADR-0009](adr/adr-0009-relationship-sub-role-taxonomy.md); §3.4 →
> [ADR-0010](adr/adr-0010-junction-table-conventions.md); §3.5/§9.1 →
> [ADR-0017](adr/adr-0017-auth-bootstrap-supporting-tables.md); §4 →
> [ADR-0005](adr/adr-0005-hybrid-temporal-system.md); §5 →
> [ADR-0012](adr/adr-0012-postgrest-crud-thin-service-layer.md),
> [ADR-0013](adr/adr-0013-db-functions-read-only.md); §5.7 →
> [ADR-0016](adr/adr-0016-storage-buckets-graduated-access.md); §6/§11 →
> [ADR-0019](adr/adr-0019-services-package.md); §9 →
> [ADR-0014](adr/adr-0014-rls-single-source-of-authorization.md),
> [ADR-0015](adr/adr-0015-rls-and-function-hardening.md); §12 →
> [ADR-0018](adr/adr-0018-curated-content-library.md). Front-end/design-system
> decisions (ADR-0020, 0022–0025) live against
> [`docs/design/admin/`](design/admin/fidelity-2-plan.md).

---

## 1. System Overview

Time Traveler is a temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time — from the Big Bang (13.8 billion years ago) through the present and into the speculative future.

The system provides a fractal approach to time visualization, allowing users to zoom in and out of temporal periods while maintaining semantic relationships between events. The character dimension transforms it into a multi-dimensional platform for biographical and relational storytelling, tracking not just _what_ happened and _when_, but _who_ was involved and _how_ they were connected.

### 1.1 Core Purpose

- **Storytelling**: Rich narrative construction across temporal dimensions
- **Historical & Prehistoric Documentation**: From cosmological origins to modern day
- **Criminal & Journalistic Investigation**: Event correlation and pattern identification
- **Educational Tools**: Interactive temporal navigation for immersive learning
- **Research Applications**: Academic temporal data analysis, including geological and paleontological timelines

### 1.2 Key Innovations

**Fractal Time Navigation.** The recursion unit is the **timeline**: a timeline contains events, and any event can _expand into_ its own sub-timeline (`events.detail_timeline_id`), which in turn contains finer events that may expand further. Users zoom seamlessly from billion-year geological scales to individual seconds by following this forward `timeline → event → sub-timeline` chain. (Nesting is forward-only; the earlier event-to-event `parent_event_id` mechanism is deprecated — see §3.2 and the fractal-model callout.)

**Hybrid Temporal System.** Structured JSONB date representation that extends beyond SQL date type limitations to support prehistoric, geological, and cosmological dates with precision metadata, uncertainty ranges, and scientific dating context.

**Multi-Dimensional Character System.** Seven character types (Human, Animal, Mythological, Fictional, Organization, Divine, Artifact) with temporally-scoped relationships and event participation tracking.

### 1.3 Platform Decision: Supabase

This system targets a Supabase implementation. Supabase provides PostgreSQL, authentication, real-time subscriptions, Edge Functions, and Storage — eliminating the need for a custom backend API layer. REST APIs are auto-generated from the schema, and Row Level Security (RLS) policies handle authorization at the database level.

---

## 2. Architecture Design

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Presentation Layer                                              │
│  Next.js 16+ (App Router) · React 19+ · TypeScript               │
│  shadcn/ui · Tailwind CSS · D3.js · Recharts                     │
│  TanStack Query (server state) · Zustand (client state)          │
├──────────────────────────────────────────────────────────────────┤
│  API Layer (Supabase-managed — no custom backend)                │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  PostgREST    │ │  Realtime    │ │  Edge Functions (Deno)   │ │
│  │  Auto-gen API │ │  Postgres Δ  │ │  Bulk import/export      │ │
│  │  CRUD + joins │ │  Presence    │ │  Timeline sharing/embed  │ │
│  │  via supabase │ │  Broadcast   │ │  Image processing        │ │
│  │  -js client   │ │              │ │  Geocoding               │ │
│  └───────────────┘ └──────────────┘ └──────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  Data Layer (PostgreSQL)                                         │
│  JSONB hybrid temporal storage · Generated sort columns          │
│  Row Level Security · Full-text search (tsvector)                │
│  Database functions (read-only queries only)                     │
│  Supabase Storage (media, avatars)                               │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer           | Technology                                                       |
| --------------- | ---------------------------------------------------------------- |
| Frontend        | Next.js 16+ (App Router), React 19+, TypeScript                  |
| UI Components   | shadcn/ui, Tailwind CSS, Recharts, D3.js                         |
| Server State    | TanStack Query (React Query)                                     |
| Client State    | Zustand (UI state, navigation, view modes)                       |
| Backend/API     | Supabase PostgREST (auto-generated), Edge Functions (Deno)       |
| Database        | Supabase PostgreSQL, JSONB temporal storage, RLS                 |
| Authentication  | Supabase Auth (email, magic link, OAuth)                         |
| Real-time       | Supabase Realtime (Postgres Changes, Broadcast, Presence)        |
| File Storage    | Supabase Storage (public buckets, signed URLs)                   |
| Search          | PostgreSQL full-text search (tsvector), GIN indexes              |
| Hosting         | Vercel (frontend), Supabase (backend/database)                   |
| Type Generation | `supabase gen types typescript` for database-to-TypeScript types |

### 2.3 Key Architectural Principles

**Let PostgREST do the work.** Supabase auto-generates a full REST API from the schema. Every table, view, and function is an endpoint. The `supabase-js` client provides a fluent query builder with filtering, ordering, pagination, and nested joins. The vast majority of reads and writes should go through this layer directly — not through stored procedures or Edge Functions.

**Database functions for read-only complex queries only.** PostgreSQL functions (`supabase.rpc()`) should be reserved for queries that cannot be expressed through the PostgREST query builder: recursive CTEs, complex aggregations across multiple tables, and temporal range queries with era-aware computation. They should _not_ be used for CRUD operations (see [Section 5: API Layer Design](#5-api-layer-design)).

**Edge Functions for orchestration, not for data access.** Edge Functions handle multi-step workflows that involve external services, file processing, or complex business logic that shouldn't run on the client. They do not replace PostgREST for database operations.

**RLS as the authorization layer.** Row Level Security policies are the single source of truth for access control. No authorization logic lives in stored functions, Edge Functions, or client code. This means any path to the data — PostgREST, direct SQL, Edge Functions — enforces the same rules.

**Client-side temporal logic.** The TemporalService handles era conversion, display formatting, and sort-order computation in TypeScript. The database stores the structured JSONB and the generated sort column, but the _interpretation_ of temporal data lives in the client, where it can be unit-tested and shared between rendering, input, and query-building code.

---

## 3. Database Schema

This is a greenfield schema. It incorporates lessons from the prior migrations but is designed from scratch with modern Supabase best practices.

### 3.1 Design Decisions

**UUIDs for primary keys.** The prior schema used BIGINT identity columns. For a greenfield build, UUIDs are the better choice because they enable client-side ID generation (optimistic inserts with TanStack Query), eliminate sequential ID guessing, work naturally with Supabase Auth (which uses UUIDs), and simplify future data federation or import/export scenarios. The performance cost vs. BIGINT is negligible at the scale this application will operate.

**Slugs as a separate concern.** Slugs remain as a URL-friendly unique identifier per user, enforced via a composite unique index `(user_id, slug)`. They are not primary keys.

**No user_id on junction tables.** The prior schema placed `user_id` on every junction table for RLS. This is unnecessary and creates data integrity risk — a user could insert a junction row with their own `user_id` pointing to another user's entities. Instead, junction table RLS policies validate ownership by checking the parent entity. This is cleaner and more secure.

**ON DELETE CASCADE everywhere.** All foreign keys on junction tables and child tables use `ON DELETE CASCADE`. This eliminates the need for stored functions that manually delete dependent rows before deleting a parent.

**No stored procedures for CRUD.** The prior schema used composite types and `plpgsql` functions for all create/update/delete operations. This is an anti-pattern in Supabase because it bypasses PostgREST's type generation (TypeScript types are not generated for composite type parameters), it creates a parallel API surface that must be maintained alongside PostgREST, it moves business logic into the database where it is harder to test, version, and debug, and it duplicates what PostgREST + cascade constraints + client-side transaction patterns already provide. The greenfield design uses direct PostgREST operations for all CRUD, with junction table management handled by the client service layer (see [Section 5](#5-api-layer-design)).

**Temporal data is always JSONB.** No VARCHAR date columns. All temporal data uses the `temporal_data JSONB` structure from day one, with generated `sort_order_years` columns for indexing and ordering.

### 3.2 Core Tables

#### profiles

Created automatically via trigger on `auth.users` insert.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  role VARCHAR(20) DEFAULT 'editor'
    CHECK (role IN ('editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT first_name_length CHECK (char_length(first_name) > 1),
  CONSTRAINT last_name_length CHECK (char_length(last_name) > 1),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

CREATE UNIQUE INDEX profiles_username_idx ON profiles (username);
```

> **Change from prior schema:** Social media links consolidated into a single `social_links JSONB` column rather than individual `social_x`, `social_facebook`, etc. columns. This is more extensible — new platforms can be added without schema changes.
>
> **Admin role:** The `role` column defaults to `editor` for all new users. Admin role is assigned manually via SQL or an admin interface. The `is_admin()` helper function (see [Section 9.2](#92-rls-pattern)) checks this column in RLS policies.

#### is_admin() Helper Function

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;
```

> **SECURITY DEFINER** is required here because the function needs to read `profiles` regardless of the calling user's RLS context. The function is `STABLE` (no side effects) and returns a simple boolean used in RLS policy clauses.
>
> **Hardening rule for all SECURITY DEFINER functions in this schema:** declare with `SET search_path = ''` and use fully-qualified table references (`public.<table>`, `auth.<table>`). Without this, a malicious caller can plant shadowing objects in a schema they control and trick the function into reading attacker-supplied data. This rule applies to every SECURITY DEFINER function defined in this spec — `is_admin()` above, the timeline RLS helpers below, the profile-creation trigger in §9.1, and `get_user_metrics` in §5.4.

#### Timeline RLS Helpers (is_timeline_owner, is_timeline_collaborator, is_timeline_collab_editor)

These three SECURITY DEFINER predicates exist to **break an RLS recursion cycle** between the `timeline_collaborators` and `timelines` tables. The RLS policies in §9.2.2 (`read_timelines`) and §9.2.4 (`read_collaborators`) each need to check the other table's contents; an inline `EXISTS (SELECT 1 FROM <other>)` triggers the other table's RLS policy, which triggers the original's RLS policy, producing `infinite recursion detected in policy for relation "timeline_collaborators"` (SQLSTATE 42P17) whenever a non-owner non-collaborator queries either table. SECURITY DEFINER bypasses RLS inside the helper, breaking the cycle.

```sql
CREATE OR REPLACE FUNCTION public.is_timeline_owner(t_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.timelines
    WHERE id = t_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_timeline_collaborator(t_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.timeline_collaborators
    WHERE timeline_id = t_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_timeline_collab_editor(t_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.timeline_collaborators
    WHERE timeline_id = t_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
  );
$$;
```

All §9.2 policies reference these helpers in place of inline `EXISTS (SELECT 1 FROM timeline_collaborators ...)` and `EXISTS (SELECT 1 FROM timelines ...)`. See §9.2.1, §9.2.2, and §9.2.4.

#### timelines

```sql
CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  summary TEXT,
  detail TEXT,
  scale VARCHAR(2000),
  temporal_data JSONB NOT NULL DEFAULT '{}',
  sort_order_start BIGINT GENERATED ALWAYS AS ( /* era conversion */ ) STORED,
  end_temporal_data JSONB DEFAULT '{}',
  sort_order_end BIGINT GENERATED ALWAYS AS ( /* era conversion */ ) STORED,
  timeline_type VARCHAR(50) DEFAULT 'general'
    CHECK (timeline_type IN ('general', 'biographical', 'comparative')),
  subject_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  visibility VARCHAR(20) DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'shared')),
  fractal_depth INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(detail, ''))
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX timelines_slug_idx ON timelines (user_id, slug);
```

> **Addition per PRD:** `search_vector` column added to timelines to support full-text search across all four searchable entity types (events, characters, stories, timelines) as required by PRD Section 4.12.1.

#### periods

```sql
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  summary TEXT,
  detail TEXT,
  temporal_data JSONB NOT NULL DEFAULT '{}',
  sort_order_start BIGINT GENERATED ALWAYS AS ( /* era conversion */ ) STORED,
  end_temporal_data JSONB DEFAULT '{}',
  sort_order_end BIGINT GENERATED ALWAYS AS ( /* era conversion */ ) STORED,
  parent_period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  significance VARCHAR(20) DEFAULT 'medium'
    CHECK (significance IN ('low', 'medium', 'high', 'critical')),
  characteristics TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX periods_slug_idx ON periods (user_id, slug);
```

#### events

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  summary TEXT,
  detail TEXT,
  event_type VARCHAR(100) DEFAULT 'milestone'
    CHECK (event_type IN (
      'milestone', 'period', 'incident', 'discovery', 'creation',
      'destruction', 'transformation', 'migration', 'conflict', 'ceremony'
    )),
  temporal_data JSONB NOT NULL DEFAULT '{}',
  sort_order_years BIGINT GENERATED ALWAYS AS ( /* era conversion */ ) STORED,
  computed_start_date TIMESTAMPTZ GENERATED ALWAYS AS ( /* CE dates only */ ) STORED,
  end_temporal_data JSONB DEFAULT '{}',
  sort_order_end BIGINT GENERATED ALWAYS AS ( /* era conversion */ ) STORED,
  computed_end_date TIMESTAMPTZ GENERATED ALWAYS AS ( /* CE dates only */ ) STORED,
  location VARCHAR(2000),
  spatial_data JSONB,
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,  -- DEPRECATED (#180): event-to-event nesting; superseded by detail_timeline_id
  timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,  -- primary containing timeline (RLS source)
  detail_timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,  -- PENDING (#177): the sub-timeline this event expands into (forward fractal drill-down)
  metadata JSONB DEFAULT '{}',
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(detail, ''))
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX events_slug_idx ON events (user_id, slug);
```

> **Key changes from prior schema:**
>
> - Renamed from `historical_events` to `events`. The table name `historical_events` created awkward FK names (`historical_event_id`) throughout the entire schema. In a greenfield build, brevity wins.
> - ~~Added `parent_event_id` self-reference for fractal nesting.~~ **Deprecated (#180).** Fractal nesting is now forward-only via `detail_timeline_id` → sub-timeline (#177); see the fractal-model callout below. `parent_event_id` is being tombstoned (no data uses it) and dropped in a later migration.
> - Added `event_type` with CHECK constraint.
> - Added `spatial_data JSONB` alongside the free-form `location` string.
> - Added `search_vector` as a generated column.
> - `importance` is now a 1–10 integer with CHECK constraint rather than unconstrained.
> - Temporal data is JSONB from day one — no VARCHAR date columns.
> - Both start and end dates have their own `temporal_data`/`sort_order` pair, rather than embedding end dates inside the start temporal JSONB. This is cleaner for range queries.

**The event ↔ timeline model (canonical).** An event relates to timelines along two axes — _containment_ ("which timeline shows this event") and _decomposition_ ("what does this event expand into"). These are distinct and must not be conflated:

| Mechanism                    | Axis              | Meaning                                                                                                                                                                                                                      |
| ---------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events.timeline_id`         | containment       | The event's **primary / home** timeline. **This is the RLS source** — `read_events` / `update_events` derive collaborator access from it (§9), and `idx_events_timeline_sort` is built on it. One event → one home timeline. |
| `timeline_events` junction   | containment       | **Additional** "also appears in" timelines (e.g. an event surfaced in a comparative timeline). Many-to-many; carries `sort_order` for editorial arrangement (§3.4). Does **not** affect RLS.                                 |
| `events.detail_timeline_id`  | decomposition     | The **sub-timeline this event expands into** — the forward fractal drill-down. One event → one sub-timeline. `ON DELETE SET NULL`. Pending migration #177.                                                                   |
| ~~`events.parent_event_id`~~ | ~~decomposition~~ | **Deprecated (#180).** Event-to-event nesting — redundant with, and weaker than, `detail_timeline_id`. Being tombstoned and dropped.                                                                                         |

**Nesting is forward-only.** The hierarchy is `timeline → events → (event expands into) sub-timeline → events`, recursing on the timeline — not a backward `parent_event_id` tree. This preserves the committed event RLS untouched (access is keyed on the _containing_ `timeline_id`, never on the _child_ `detail_timeline_id`), eliminates the cross-timeline parent-link integrity holes `parent_event_id` permits, and keeps reads to one bounded query per zoom level. The forward model is the IA spec across the admin wireframes (`docs/design/admin/`).

#### stories

```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  sub_title VARCHAR(2000),
  summary TEXT,
  detail TEXT,
  perspective_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  narrator_type VARCHAR(50) CHECK (
    narrator_type IN ('first_person', 'third_person', 'omniscient')
  ),
  tags TEXT[],
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(sub_title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(detail, ''))
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX stories_slug_idx ON stories (user_id, slug);
```

#### characters

> **Prerequisite:** The `characters.search_vector` generated column references `immutable_array_to_string`, a thin SQL wrapper around `array_to_string` that is declared `IMMUTABLE`. This wrapper is required because PostgreSQL's built-in `array_to_string(anyarray, text)` is marked `STABLE` (it is polymorphic over array element types), so it cannot appear directly inside a `GENERATED ALWAYS AS` expression. For `TEXT[]` the result is fully deterministic, making the `IMMUTABLE` declaration safe. The wrapper must be created before the `characters` table:
>
> ```sql
> CREATE OR REPLACE FUNCTION immutable_array_to_string(arr TEXT[], sep TEXT)
> RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
>   SELECT array_to_string(arr, sep);
> $$;
> ```

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(2000) NOT NULL,
  character_type VARCHAR(50) NOT NULL
    CHECK (character_type IN (
      'human', 'animal', 'mythological', 'fictional',
      'organization', 'divine', 'artifact'
    )),
  biography TEXT,
  aliases TEXT[],
  cultural_context TEXT[],
  physical_description TEXT,
  species VARCHAR(500),
  breed VARCHAR(500),
  domain VARCHAR(500),
  significance VARCHAR(20) DEFAULT 'medium'
    CHECK (significance IN ('low', 'medium', 'high', 'critical')),
  birth_temporal JSONB,
  death_temporal JSONB,
  profile_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english'::regconfig,
      coalesce(name, '') || ' ' ||
      coalesce(biography, '') || ' ' ||
      coalesce(immutable_array_to_string(aliases, ' '), ''))
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX characters_slug_idx ON characters (user_id, slug);
```

> **Change from prior analysis:** `birth_temporal` and `death_temporal` are top-level JSONB columns (TemporalData objects) rather than VARCHAR strings. Character type-specific fields (`species`, `breed`, `domain`) remain as dedicated columns rather than being buried in JSONB, since they're filterable.

#### categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(100),
  parent_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX categories_slug_idx ON categories (user_id, slug);
```

> **Change from prior schema:** Added `description`, `color`, `icon`, and `parent_category_id` for hierarchical categorization, which were in the design document but missing from the original migration.

#### media

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug VARCHAR(100) NOT NULL,
  alt_text TEXT,
  caption TEXT,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  media_type VARCHAR(50) CHECK (
    media_type IN ('image', 'video', 'audio', 'document')
  ),
  width INTEGER,
  height INTEGER,
  file_size_bytes BIGINT,
  mime_type VARCHAR(200),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX media_slug_idx ON media (user_id, slug);
```

> **Changes from prior schema:** Added `storage_path` (Supabase Storage object path, separate from the public URL), `media_type` with CHECK constraint, `file_size_bytes`, and `mime_type`. Renamed `alternativetext` to `alt_text`. Replaced the `formats` TEXT column (unclear purpose) with `metadata JSONB`.

### 3.3 Relationship Tables

#### character_relationships

```sql
CREATE TABLE character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  related_character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  relationship_type VARCHAR(100) NOT NULL
    CHECK (relationship_type IN (
      'family', 'professional', 'friendship', 'rivalry',
      'owner_pet', 'trainer_trainee', 'creator_creation',
      'worship', 'collaboration', 'enemy', 'mentor_student'
    )),
  description TEXT,
  start_temporal JSONB,
  end_temporal JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CHECK (character_id != related_character_id)
);

CREATE UNIQUE INDEX char_rels_unique ON character_relationships
  (character_id, related_character_id, relationship_type);
```

> **Note on relationship directionality:** Relationships are stored as directed pairs. For bidirectional relationships (e.g., friendship), the application layer can query in both directions. A unique index on `(character_id, related_character_id, relationship_type)` prevents duplicates while allowing the same pair to have multiple relationship types.

### 3.4 Junction Tables

All junction tables use composite primary keys, no surrogate `id`, no `user_id`. RLS is enforced via parent entity ownership checks.

> **Single-primary junction flag pattern:** When a junction table exposes an `is_primary BOOLEAN` flag
> that must be unique per group (e.g., "one primary media per character"), enforce it with a partial
> unique index rather than a trigger or application-layer check:
>
> ```sql
> CREATE UNIQUE INDEX <table>_one_primary
>   ON <table> (<group_column>)
>   WHERE is_primary = true;
> ```
>
> Applied to `character_media` via migration `00012` (issue #125). If `event_media` or `timeline_media`
> later grow a primary flag, apply the same pattern.

> **Self-referential FK cycles:** `parent_period_id` and `parent_category_id` are unconstrained at the database level — cycles (A → B → A) are accepted by PostgreSQL. Cycle prevention is enforced in the service layer during create/update operations (#31, #59, #60); the database intentionally does not attempt to detect cycles via constraints. (`parent_event_id` formerly belonged to this set but is deprecated — #180.)
>
> **Fractal-decomposition cycles:** the forward fractal mechanism `events.detail_timeline_id` → timeline can also form a cycle (an event expands into a timeline that, transitively, contains the event itself). Like the self-FK cases, this is **not** DB-constrained — the service layer rejects an `detail_timeline_id` assignment that would close such a loop (#177). The `detail_timeline_id` FK is `ON DELETE SET NULL`, so deleting a sub-timeline detaches the drill-down rather than cascading into the parent event.

```sql
-- Events ↔ Categories
CREATE TABLE event_categories (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);

-- Events ↔ Media
CREATE TABLE event_media (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (event_id, media_id)
);

-- Events ↔ Characters (participation)
CREATE TABLE event_characters (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL DEFAULT 'participant'
    CHECK (role IN (
      'protagonist', 'antagonist', 'witness', 'participant',
      'victim', 'beneficiary', 'performer', 'competitor',
      'owner', 'creator', 'observer'
    )),
  significance VARCHAR(50) NOT NULL DEFAULT 'secondary'
    CHECK (significance IN ('primary', 'secondary', 'minor', 'mentioned')),
  description TEXT,
  PRIMARY KEY (event_id, character_id)
);

-- Timelines ↔ Events — ADDITIONAL ("also appears in") membership, distinct from
-- the primary events.timeline_id home (see the event ↔ timeline model in §3.2).
-- Does not affect RLS. sort_order added in migration 00012 (#122).
CREATE TABLE timeline_events (
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,  -- editorial ordering; default 0 ⇒ fall back to events.sort_order_start (chronological)
  PRIMARY KEY (timeline_id, event_id)
);

-- Periods ↔ Timelines
CREATE TABLE period_timelines (
  period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  PRIMARY KEY (period_id, timeline_id)
);

-- Stories ↔ Periods
CREATE TABLE story_periods (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, period_id)
);

-- Stories ↔ Characters
CREATE TABLE story_characters (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  role_in_story VARCHAR(50) DEFAULT 'mentioned'
    CHECK (role_in_story IN ('protagonist', 'supporting', 'mentioned', 'narrator')),
  PRIMARY KEY (story_id, character_id)
);

-- Stories ↔ Events
CREATE TABLE story_events (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, event_id)
);

-- Characters ↔ Media
CREATE TABLE character_media (
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (character_id, media_id)
);

-- Single-primary enforcement: at most one row per character_id may have is_primary = true.
-- Applied via migration 00012 (issue #125).
CREATE UNIQUE INDEX IF NOT EXISTS character_media_one_primary
  ON public.character_media (character_id)
  WHERE is_primary = true;

-- Timelines ↔ Collaborators
CREATE TABLE timeline_collaborators (
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer'
    CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (timeline_id, user_id)
);
```

> **Key changes from prior schema:**
>
> - No `user_id` on junction tables (except `timeline_collaborators` which _is_ about user association).
> - No surrogate `id` columns — composite PKs only.
> - `ON DELETE CASCADE` on all FKs.
> - Added `event_media.sort_order` for controlling display order.
> - Added `story_events` (stories linked directly to events, not just via periods).
> - Added `character_media` for character profile images; `is_primary` is enforced single-per-character via a partial unique index (`character_media_one_primary`, migration `00012`).
> - Added `timeline_collaborators` for shared timeline access.
> - Added `timeline_media` for timeline cover images and header media (per PRD Section 4.8.5).

```sql
-- Timelines ↔ Media
CREATE TABLE timeline_media (
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (timeline_id, media_id)
);
```

### 3.5 Supporting Tables

#### notifications

Notifications support collaboration invitations, content moderation alerts, and system messages as required by PRD Sections 3.3.2, 3.4.1, and 4.9.7.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN (
      'collaborator_invite', 'content_moderated', 'content_reported',
      'library_update', 'system_message'
    )),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, read, created_at DESC);
```

> **Design notes:** Notifications are write-once — they are never updated except to mark `read = true`. The `metadata` JSONB field stores context-specific data (e.g., `{ "timeline_id": "...", "role": "editor" }` for collaboration invites, or `{ "entity_type": "timeline", "entity_id": "...", "reason": "misinformation" }` for moderation alerts). RLS: users can only read their own notifications.

#### content_reports

Content reporting enables users to flag inappropriate or inaccurate content for admin moderation as described in PRD Section 3.3.2.

```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users NOT NULL,
  entity_type VARCHAR(50) NOT NULL
    CHECK (entity_type IN ('timeline', 'event', 'period', 'story', 'character')),
  entity_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL
    CHECK (reason IN ('inaccurate', 'inappropriate', 'spam', 'copyright', 'other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_status ON content_reports (status, created_at DESC);
CREATE INDEX idx_reports_entity ON content_reports (entity_type, entity_id);
```

> **Design notes:** Reports use a polymorphic `entity_type`/`entity_id` pattern rather than separate FK columns per entity, keeping the schema simple. The `resolved_by` FK tracks which admin handled the report. RLS: reporters can read their own reports; admins can read and update all reports.

---

## 4. Hybrid Temporal System

### 4.1 The Problem

| Type                     | Range               | Limitation                                  |
| ------------------------ | ------------------- | ------------------------------------------- |
| PostgreSQL `TIMESTAMPTZ` | 4713 BC – 294276 AD | Nothing before ~4700 BC                     |
| JavaScript `Date`        | ±~270,000 years     | Even more restrictive                       |
| VARCHAR                  | Unbounded           | No sorting, no range queries, no validation |

### 4.2 The Solution: Structured JSONB

Each temporal point is a `temporal_data JSONB` column:

```json
{
  "year": 66,
  "era": "MYA",
  "precision": "approximate",
  "uncertainty": 1000000,
  "geological_period": "Cretaceous-Paleogene boundary",
  "dating_method": "radiometric",
  "confidence_level": "high",
  "display_format": "geological"
}
```

| Field                  | Type   | Required | Notes                                                      |
| ---------------------- | ------ | -------- | ---------------------------------------------------------- |
| year                   | number | Yes      | Meaning depends on era                                     |
| month                  | 1–12   | No       | CE/BCE only                                                |
| day                    | 1–31   | No       | CE/BCE only                                                |
| hour / minute / second | number | No       | Modern dates                                               |
| era                    | string | Yes      | `CE`, `BCE`, `KYA`, `MYA`, `BYA`                           |
| precision              | string | Yes      | `exact`, `circa`, `approximate`, `estimated`, `geological` |
| uncertainty            | number | No       | ± years                                                    |
| geological_period      | string | No       | e.g. "Cretaceous"                                          |
| geological_epoch       | string | No       | e.g. "Paleocene"                                           |
| cosmological_epoch     | string | No       | e.g. "Big Bang"                                            |
| display_format         | string | No       | `standard`, `scientific`, `geological`, `cosmological`     |
| dating_method          | string | No       | Provenance                                                 |
| confidence_level       | string | No       | `high`, `medium`, `low`                                    |
| source                 | string | No       | Citation                                                   |

### 4.3 Start/End Date Separation

**Change from prior design:** The v2 design embedded end dates (`end_year`, `end_era`, etc.) inside the start `temporal_data` JSONB. The greenfield design uses two separate columns:

```sql
temporal_data JSONB NOT NULL DEFAULT '{}',       -- start
sort_order_years BIGINT GENERATED ALWAYS AS (...) STORED,
end_temporal_data JSONB DEFAULT '{}',             -- end
sort_order_end BIGINT GENERATED ALWAYS AS (...) STORED,
```

**Why:** Separate columns enable proper range-overlap queries (`WHERE sort_order_years <= :end AND sort_order_end >= :start`), simpler JSONB validation (each object has one schema), and cleaner TemporalService code (one converter function, applied to either column).

### 4.4 Sort Order Computation

The generated `sort_order_years` column converts all eras to a single numeric axis:

```sql
BIGINT GENERATED ALWAYS AS (
  CASE
    WHEN (temporal_data->>'era') = 'CE'  THEN  (temporal_data->>'year')::BIGINT
    WHEN (temporal_data->>'era') = 'BCE' THEN -(temporal_data->>'year')::BIGINT
    WHEN (temporal_data->>'era') = 'KYA' THEN -(temporal_data->>'year')::BIGINT * 1000
    WHEN (temporal_data->>'era') = 'MYA' THEN -(temporal_data->>'year')::BIGINT * 1000000
    WHEN (temporal_data->>'era') = 'BYA' THEN -(temporal_data->>'year')::BIGINT * 1000000000
    ELSE 0
  END
) STORED
```

| Era | Example    | sort_order_years |
| --- | ---------- | ---------------- |
| CE  | year: 2024 | 2,024            |
| BCE | year: 44   | −44              |
| KYA | year: 12   | −12,000          |
| MYA | year: 66   | −66,000,000      |
| BYA | year: 14   | −14,000,000,000  |

> **Integer constraint required.** The `(temporal_data->>'year')::BIGINT` cast fails at the database level for fractional values such as `13.8` (error: `invalid input syntax for type bigint: "13.8"`). Year values for all eras must be whole integers. For BYA/MYA/KYA-scale dates, sub-year precision is meaningless — temporal resolution at those scales is in millions or billions of years. The integer constraint is enforced in Zod validation (#23) and the TemporalService layer (#24); the spec example has been updated from `13.8` to `14` accordingly.

### 4.5 Computed TIMESTAMPTZ for Modern Dates

For CE dates within PostgreSQL's range, a generated TIMESTAMPTZ column enables native date operations:

```sql
computed_start_date TIMESTAMPTZ GENERATED ALWAYS AS (
  CASE
    WHEN (temporal_data->>'era') = 'CE'
    THEN make_timestamp(
      (temporal_data->>'year')::INT,
      COALESCE((temporal_data->>'month')::INT, 1),
      COALESCE((temporal_data->>'day')::INT, 1),
      COALESCE((temporal_data->>'hour')::INT, 0),
      COALESCE((temporal_data->>'minute')::INT, 0),
      COALESCE((temporal_data->>'second')::DOUBLE PRECISION, 0)
    ) AT TIME ZONE 'UTC'
    ELSE NULL
  END
) STORED
```

> **Why `make_timestamp(...) AT TIME ZONE 'UTC'` instead of `make_timestamptz(...)`:** Both the 6-argument and 7-argument overloads of `make_timestamptz` are marked `STABLE` in PostgreSQL, which means they cannot be used inside `GENERATED ALWAYS AS ... STORED` columns (only `IMMUTABLE` functions are permitted). `make_timestamp(...)` returns `TIMESTAMP` (no timezone) and is `IMMUTABLE`. Converting the result via `AT TIME ZONE 'UTC'` calls `timezone(text, timestamp)`, which is also `IMMUTABLE`. The `second` parameter uses `::DOUBLE PRECISION` to match `make_timestamp`'s signature directly (the function expects `double precision`, not `numeric`).
>
> **Upper bound:** `make_timestamp` errors for year values outside PostgreSQL's `TIMESTAMP` range (roughly year 294,276 CE). Input should be validated with a year upper-bound check in Zod (#23) to surface a clear error rather than an opaque database error.
>
> **Removed redundant check:** An earlier version of this spec included `AND (temporal_data->>'year')::BIGINT > -4712` in the CE branch. For `era = 'CE'` the year is positive by convention, so this check is always true and has been removed to simplify the example. No migration change is needed; the condition is cosmetic-only.

### 4.6 JSONB Validation

Temporal data validation is enforced at the application layer (TypeScript) via Zod schemas, not via PostgreSQL CHECK constraints on JSONB. This is because JSONB CHECK constraints are verbose and hard to maintain, Zod provides much better developer experience with typed errors, and validation can be shared between form input, API calls, and seed scripts.

```typescript
// packages/services/src/schemas/temporal.ts
import { z } from "zod";

export const temporalDataSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12).optional(),
  day: z.number().min(1).max(31).optional(),
  hour: z.number().min(0).max(23).optional(),
  minute: z.number().min(0).max(59).optional(),
  second: z.number().min(0).max(59).optional(),
  era: z.enum(["CE", "BCE", "KYA", "MYA", "BYA"]),
  precision: z.enum([
    "exact",
    "circa",
    "approximate",
    "estimated",
    "geological",
  ]),
  uncertainty: z.number().optional(),
  geological_period: z.string().optional(),
  geological_epoch: z.string().optional(),
  cosmological_epoch: z.string().optional(),
  display_format: z
    .enum(["standard", "scientific", "geological", "cosmological"])
    .optional(),
  dating_method: z.string().optional(),
  confidence_level: z.enum(["high", "medium", "low"]).optional(),
  source: z.string().optional(),
});

export type TemporalData = z.infer<typeof temporalDataSchema>;
```

---

## 5. API Layer Design

This is the most significantly reworked section. The prior design used stored procedures for all CRUD; the greenfield design eliminates them in favor of PostgREST for writes and a thin client service layer for transaction-like operations.

### 5.1 Why Not Stored Procedures for CRUD

The prior schema defined `create_event`, `update_event`, `delete_event`, `create_timeline`, etc. as `plpgsql` functions with custom composite types. This approach has significant drawbacks in a Supabase context:

**No TypeScript type generation.** `supabase gen types typescript` generates types for tables, views, and simple function signatures, but composite type parameters do not produce usable input types. Every caller has to manually construct the parameter shape.

**Parallel API surface.** Stored functions create a second API alongside PostgREST. Developers must know _which_ operations go through `supabase.rpc()` and which go through `supabase.from()`. This cognitive overhead grows with every entity.

**Harder to test and debug.** PL/pgSQL functions are tested via SQL, not via the same test framework as the rest of the application. Stack traces are opaque. Logging is limited to `RAISE NOTICE`.

**Business logic in the wrong place.** Slug generation, temporal validation, junction table synchronization — these are application concerns that belong in TypeScript where they can be unit-tested, composed, and reused.

**Cascade constraints solve the delete problem.** The primary motivation for `delete_event` (delete junction rows before deleting the event) is eliminated by `ON DELETE CASCADE`.

### 5.2 PostgREST for All CRUD

All creates, updates, and deletes go through the standard `supabase.from()` API:

```typescript
// Create an event
const { data: event } = await supabase
  .from("events")
  .insert({
    user_id: session.user.id,
    slug: generateSlug(title),
    title,
    summary,
    detail,
    temporal_data: temporalDataSchema.parse(startDate),
    end_temporal_data: endDate ? temporalDataSchema.parse(endDate) : null,
    event_type: "milestone",
    importance: 5,
    timeline_id: timelineId,
  })
  .select()
  .single();

// Delete an event (cascades to all junction tables)
await supabase.from("events").delete().eq("id", eventId);

// Update an event
await supabase.from("events").update({ title: newTitle }).eq("id", eventId);
```

### 5.3 Client Service Layer for Multi-Step Operations

Some operations require multiple inserts (e.g., creating an event with categories, media, and character assignments). These are handled by a thin TypeScript service layer:

```typescript
// packages/services/src/modules/eventService.ts
export async function createEventWithRelations(
  supabase: SupabaseClient,
  eventData: EventInput,
  categoryIds: string[],
  mediaIds: string[],
  characterAssignments: {
    characterId: string;
    role: string;
    significance: string;
  }[],
) {
  // 1. Insert the event
  const { data: event, error } = await supabase
    .from("events")
    .insert(eventData)
    .select()
    .single();

  if (error) throw error;

  // 2. Insert junction rows (parallel)
  const junctionOps = [
    categoryIds.length > 0 &&
      supabase
        .from("event_categories")
        .insert(
          categoryIds.map((cid) => ({ event_id: event.id, category_id: cid })),
        ),
    mediaIds.length > 0 &&
      supabase
        .from("event_media")
        .insert(mediaIds.map((mid) => ({ event_id: event.id, media_id: mid }))),
    characterAssignments.length > 0 &&
      supabase.from("event_characters").insert(
        characterAssignments.map((a) => ({
          event_id: event.id,
          character_id: a.characterId,
          role: a.role,
          significance: a.significance,
        })),
      ),
  ].filter(Boolean);

  await Promise.all(junctionOps);

  return event;
}
```

> **Note on atomicity:** These multi-step operations are not wrapped in a database transaction. If a junction insert fails after the event is created, the event exists without its relations. This is acceptable because the user can add relations after the fact, RLS prevents orphaned data from being a security issue, and TanStack Query's `onError` callback can prompt the user to retry. If strict atomicity is required for specific workflows (e.g., bulk import), use an Edge Function that calls the Supabase Admin client with a Postgres transaction via `supabase.rpc()` wrapping a single `plpgsql` function — but this should be the exception, not the default.

### 5.4 Database Functions (Read-Only Queries)

PostgreSQL functions are reserved for complex _read_ queries that cannot be expressed through PostgREST:

```sql
-- Temporal range query (uses computed sort column)
CREATE OR REPLACE FUNCTION events_in_temporal_range(
  p_start_years BIGINT,
  p_end_years BIGINT,
  p_timeline_id UUID DEFAULT NULL
) RETURNS SETOF events LANGUAGE sql STABLE AS $$
  SELECT * FROM events
  WHERE sort_order_years >= p_start_years
    AND sort_order_years <= p_end_years
    AND (p_timeline_id IS NULL OR timeline_id = p_timeline_id)
  ORDER BY sort_order_years;
$$;

-- Recursive character relationship network
CREATE OR REPLACE FUNCTION character_network(
  p_character_id UUID,
  p_depth INT DEFAULT 2
) RETURNS TABLE(
  source_id UUID, target_id UUID, rel_type TEXT,
  source_name TEXT, target_name TEXT, depth INT
) LANGUAGE sql STABLE AS $$
  WITH RECURSIVE network AS (
    SELECT
      cr.character_id, cr.related_character_id,
      cr.relationship_type, 1 AS depth
    FROM character_relationships cr
    WHERE cr.character_id = p_character_id
    UNION ALL
    SELECT
      cr.character_id, cr.related_character_id,
      cr.relationship_type, n.depth + 1
    FROM character_relationships cr
    JOIN network n ON cr.character_id = n.related_character_id
    WHERE n.depth < p_depth
  )
  SELECT
    n.character_id, n.related_character_id, n.relationship_type,
    c1.name, c2.name, n.depth
  FROM network n
  JOIN characters c1 ON n.character_id = c1.id
  JOIN characters c2 ON n.related_character_id = c2.id;
$$;

-- Events shared between multiple characters
CREATE OR REPLACE FUNCTION events_shared_by_characters(
  p_character_ids UUID[]
) RETURNS SETOF events LANGUAGE sql STABLE AS $$
  SELECT e.* FROM events e
  WHERE (
    SELECT COUNT(DISTINCT ec.character_id)
    FROM event_characters ec
    WHERE ec.event_id = e.id
      AND ec.character_id = ANY(p_character_ids)
  ) = array_length(p_character_ids, 1)
  ORDER BY e.sort_order_years;
$$;

-- User metrics dashboard
CREATE OR REPLACE FUNCTION public.get_user_metrics(p_user_id UUID)
RETURNS TABLE(entity_type TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 'events'::text,     COUNT(*) FROM public.events     WHERE user_id = p_user_id
  UNION ALL
  SELECT 'timelines'::text,  COUNT(*) FROM public.timelines  WHERE user_id = p_user_id
  UNION ALL
  SELECT 'periods'::text,    COUNT(*) FROM public.periods    WHERE user_id = p_user_id
  UNION ALL
  SELECT 'stories'::text,    COUNT(*) FROM public.stories    WHERE user_id = p_user_id
  UNION ALL
  SELECT 'characters'::text, COUNT(*) FROM public.characters WHERE user_id = p_user_id
  UNION ALL
  SELECT 'categories'::text, COUNT(*) FROM public.categories WHERE user_id = p_user_id
  UNION ALL
  SELECT 'media'::text,      COUNT(*) FROM public.media      WHERE user_id = p_user_id;
$$;
```

> **Note:** All functions are `LANGUAGE sql` with `STABLE` volatility, not `plpgsql`. SQL functions are inlineable by the PostgreSQL optimizer, meaning they can be folded into the calling query plan. PL/pgSQL functions are always executed as opaque blocks. For read-only queries, SQL functions are strictly better.
>
> **Why `get_user_metrics` is SECURITY DEFINER and accepts arbitrary `p_user_id`:** the function is designed to support public-profile use cases where any caller (including `anon`) can display per-entity counts for any user (e.g., "Author X has 47 published timelines"). Bypassing RLS ensures accurate counts independent of the caller's read access. If you want to restrict to self+admin instead, replace SECURITY DEFINER with SECURITY INVOKER and add `WHERE p_user_id = auth.uid() OR public.is_admin()` guards. The hardening rule from §3.2 applies: `SET search_path = ''` and fully-qualified table references are required.

### 5.5 Edge Functions

Edge Functions (Deno runtime) handle operations that _cannot or should not_ run on the client. Each function below maps to a specific PRD requirement.

#### 5.5.1 Bulk Import (`supabase/functions/bulk-import/index.ts`)

Accepts CSV/JSON uploads, validates temporal data, and inserts events + junction rows in a server-side transaction (PRD Section 4.10). This is the one place where a `plpgsql` transactional wrapper is justified — the Edge Function calls `supabase.rpc('bulk_import_events', { ... })` with a validated payload.

```typescript
// supabase/functions/bulk-import/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { timelineId, events, options } = await req.json();
  // options: { mode: 'partial' | 'strict', duplicateStrategy: 'skip' | 'update' | 'create' }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Admin access for bulk ops
  );

  // 1. Parse CSV/JSON input into event objects
  // 2. Validate each row against Zod temporalDataSchema
  // 3. In strict mode: reject entire batch if any validation errors
  //    In partial mode: collect errors, continue with valid rows
  // 4. Resolve slug-based references (timeline_slug, category slugs, character slugs)
  // 5. Insert events + junction rows in a plpgsql transaction
  // 6. Return import summary:
  //    { total_rows, imported, rejected, errors: [{ row, field, error, suggestion }] }
});
```

**Timeout:** 30s (Supabase Edge Function limit). For imports exceeding ~500 rows, implement chunked processing with progress tracking.

#### 5.5.2 Timeline Export (`supabase/functions/export-timeline/index.ts`)

Generates timeline exports in multiple formats per PRD Section 4.11.

```typescript
serve(async (req) => {
  const { timelineId, format, options } = await req.json();
  // format: 'pdf' | 'json' | 'csv' | 'html'
  // options: { includeCharacters, includeMedia, colorScheme, ... }

  // 1. Fetch timeline + all related entities (events, characters, periods, stories, media)
  //    via joins through junction tables
  // 2. Format-specific generation:

  // PDF: Use @react-pdf/renderer (Deno-compatible) or jsPDF
  //   - Cover page: title, summary, author, date range, export date
  //   - Timeline visualization: horizontal graphic with positioned events
  //   - Event list: chronological, with temporal display, characters, categories
  //   - Character profiles (if included)
  //   - Appendices: period definitions, sources
  //   - Professional typography, page numbers, TOC

  // JSON: Complete structured dump matching PRD Section 4.11.3 schema
  //   - Excludes generated columns (sort_order_years, search_vector)
  //   - Includes all junction relationships
  //   - Re-importable via bulk-import function

  // CSV: Flat tabular format per PRD Section 4.11.5
  //   - Columns: title, temporal_year, temporal_era, temporal_display, summary,
  //     detail, event_type, importance, location, latitude, longitude,
  //     categories (comma-separated), characters (comma-separated), published

  // HTML: Self-contained embeddable file per PRD Section 4.11.4
  //   - Single file <500KB with inline CSS/JS
  //   - Interactive timeline navigation, event popups, client-side search
  //   - Responsive, no server dependencies
  //   - Customizable: color scheme, font, density, feature toggles

  // 3. Upload result to Supabase Storage (exports bucket, private)
  // 4. Return signed URL (expires in 24h)
});
```

#### 5.5.3 Library Import (`supabase/functions/library-import/index.ts`)

Duplicates curated library content to a user's account per PRD Section 4.14 and Section 12 of this document.

```typescript
serve(async (req) => {
  const { sourceTimelineId, eventIds, mode, targetTimelineId } =
    await req.json();
  // mode: 'customize' | 'readonly'
  // eventIds: null (entire timeline) or array (cherry-pick)
  // targetTimelineId: null (create new) or UUID (add to existing)

  // 1. Fetch library entities (owned by admin, metadata.is_library_content = true)
  // 2. Deep-copy with new UUIDs, user_id = requesting user
  // 3. Import referenced characters (match by slug to avoid duplicates)
  // 4. Import referenced categories (match by title to reuse existing)
  // 5. Create junction rows (event_characters, event_categories, timeline_events)
  // 6. Handle slug conflicts (append numeric suffix)
  // 7. Return: { imported_events, imported_characters, imported_categories, timeline_id }
});
```

#### 5.5.4 Image Processing (`supabase/functions/process-media/index.ts`)

When a user uploads media to Supabase Storage, a database webhook triggers this function to generate thumbnails, extract EXIF metadata, and update the `media` row with dimensions and file size.

#### 5.5.5 Geocoding (`supabase/functions/geocode/index.ts`)

When `spatial_data` is missing but `location` text is present, this function calls a geocoding API (e.g., Mapbox, Google Places) and backfills the `spatial_data` JSONB.

#### 5.5.6 Publish Workflow (`supabase/functions/publish/index.ts`)

The `publish` operation sets `published = true` and `published_at = now()`, triggers notifications for collaborators, and handles any downstream effects.

```typescript
// supabase/functions/publish/index.ts
serve(async (req) => {
  const { entityType, entityId, action } = await req.json();
  // 1. Validate user owns entity
  // 2. Set published state and published_at timestamp
  // 3. If timeline has collaborators, insert notifications for each
  // 4. Return updated entity
});
```

> **Why not a stored function for publish?** The prior schema's `publish_*` functions had parameter shadowing bugs. More fundamentally, publish workflows tend to accumulate business logic (notifications, cache invalidation, analytics events) that doesn't belong in the database.

### 5.6 Supabase Realtime

```typescript
const channel = supabase
  .channel(`timeline:${timelineId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "events",
      filter: `timeline_id=eq.${timelineId}`,
    },
    (payload) =>
      queryClient.invalidateQueries({ queryKey: ["events", timelineId] }),
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "event_characters" },
    (payload) =>
      queryClient.invalidateQueries({ queryKey: ["event-characters"] }),
  )
  .on("presence", { event: "sync" }, () =>
    setActiveUsers(channel.presenceState()),
  )
  .subscribe();
```

### 5.7 Supabase Storage

| Bucket    | Public | Purpose                              |
| --------- | ------ | ------------------------------------ |
| `media`   | Yes    | Event and character media            |
| `avatars` | Yes    | User profile avatars                 |
| `exports` | No     | Private timeline exports (PDF, JSON) |

---

## 6. Temporal Service Layer

### 6.1 TemporalService (TypeScript)

All temporal logic lives in TypeScript, not in the database:

```typescript
// packages/services/src/modules/temporalService.ts
export class TemporalService {
  static toSortableYears(t: TemporalData): number {
    switch (t.era) {
      case "CE":
        return t.year;
      case "BCE":
        return -t.year;
      case "KYA":
        return -t.year * 1_000;
      case "MYA":
        return -t.year * 1_000_000;
      case "BYA":
        return -t.year * 1_000_000_000;
    }
  }

  static formatDisplay(t: TemporalData): string {
    /* ... */
  }
  static createFromDate(date: Date): TemporalData {
    /* ... */
  }
  static createFromYear(year: number, era: Era): TemporalData {
    /* ... */
  }
}
```

### 6.2 Display Formats

| Input                                                    | Format       | Output                    |
| -------------------------------------------------------- | ------------ | ------------------------- |
| year: 2024, month: 8, day: 11, era: CE                   | standard     | August 11, 2024           |
| year: 44, month: 3, day: 15, era: BCE                    | standard     | March 15, 44 BCE          |
| year: 66, era: MYA, geological_period: "Late Cretaceous" | geological   | Late Cretaceous (~66 MYA) |
| year: 5, era: BYA, ±500M                                 | scientific   | 5 ± 0.5 BYA               |
| year: 14, era: BYA, epoch: "Big Bang"                    | cosmological | Big Bang (~14 BYA)        |

### 6.3 Logarithmic Scale for Visualization

When timelines span prehistoric dates, logarithmic positioning is essential. Display position is computed as `sign * log10(|sort_order_years| + 1)`, with a user toggle between logarithmic and linear views.

---

## 7. User Experience Design

### 7.1 User Personas

**The Historian.** Create timeline → add events → categorize → multimedia → share.

**The Investigator.** Import data → filter → correlate timelines → generate reports.

**The Educator.** Design curriculum timeline → interactive content → learning objectives.

**The Storyteller.** Plan arc → place events → rich media → assign characters → publish.

**The Biographer.** Character profile → life events → biographical timeline → relationships.

**The Scientist.** Set era context → events with uncertainty → dating provenance → geological comparison.

### 7.2 Navigation Modes

**Temporal View (Default).** Timeline with fractal zoom, character participation visible, logarithmic scaling for prehistoric spans.

**Character-Centric View.** Biography-focused, life journey, milestones, event participation.

**Relationship Network View.** Graph visualization of character relationships over time.

**Multi-Character Comparative View.** Parallel timelines with shared events highlighted.

### 7.3 Interface Principles

Progressive disclosure (detail reveals on zoom), contextual actions (tools based on selection), seamless view switching, responsive design, collaborative presence indicators via Supabase Realtime.

### 7.4 Temporal Input Component

Adapts form fields by era: CE/BCE shows year, month, day, optional time. KYA/MYA/BYA hides month/day, shows geological period, dating method, uncertainty, confidence level. Live preview via `TemporalService.formatDisplay()`. Precision selector always visible.

### 7.5 Admin App Design (Fidelity-1 Wireframes)

Concrete information-architecture wireframes for the admin app are documented in [`docs/design/admin/`](design/admin/). Scope of the fidelity-1 pass:

- Characters and Events full CRUD
- The `character_relationships` editor (temporally-scoped many-to-many with sub-role taxonomy)
- Inline junction editing for `event_characters`, `event_categories`, `event_media`, `character_media`
- The reusable temporal input control (the system primitive described in §7.4 above)

The wireframes resolve 29 admin-interaction decisions across cross-cutting conventions (chip-input array editors, slug locked-by-default on edit, debounced live slug preview), editor load-bearing patterns (relationship card stream, sub-role enum taxonomy from #119, parent-event picker UX), and detail-view refinements. They serve as the IA + interaction spec for fidelity-2 (in-tree React in `apps/admin`).

This document remains the authoritative spec for schema, services, RLS, and API design. The admin design docs are downstream — they refine UX within the constraints established here. Reconciliation work between the wireframes and PRD §7.11 (Admin Interface) is tracked in #127.

---

## 8. Indexing & Performance Strategy

### 8.1 Indexes

```sql
-- Slug lookups (unique per user)
CREATE UNIQUE INDEX events_slug_idx ON events (user_id, slug);
CREATE UNIQUE INDEX timelines_slug_idx ON timelines (user_id, slug);
CREATE UNIQUE INDEX periods_slug_idx ON periods (user_id, slug);
CREATE UNIQUE INDEX stories_slug_idx ON stories (user_id, slug);
CREATE UNIQUE INDEX characters_slug_idx ON characters (user_id, slug);
CREATE UNIQUE INDEX categories_slug_idx ON categories (user_id, slug);
CREATE UNIQUE INDEX media_slug_idx ON media (user_id, slug);

-- Temporal ordering and range
CREATE INDEX idx_events_sort ON events (sort_order_years);
CREATE INDEX idx_events_timeline_sort ON events (timeline_id, sort_order_years);
CREATE INDEX idx_events_range ON events (sort_order_years, sort_order_end);
CREATE INDEX idx_periods_sort ON periods (sort_order_start);
CREATE INDEX idx_periods_range ON periods (sort_order_start, sort_order_end);

-- Full-text search (all four searchable entity types per PRD Section 4.12.1)
CREATE INDEX idx_events_search ON events USING GIN (search_vector);
CREATE INDEX idx_timelines_search ON timelines USING GIN (search_vector);
CREATE INDEX idx_characters_search ON characters USING GIN (search_vector);
CREATE INDEX idx_stories_search ON stories USING GIN (search_vector);

-- Character lookups
CREATE INDEX idx_characters_type ON characters (character_type);
CREATE INDEX idx_characters_aliases ON characters USING GIN (aliases);

-- Junction table performance (reverse-FK lookups; the composite PK's leading
-- column already supports lookups by the first-named column for free)
CREATE INDEX idx_event_chars_char ON event_characters (character_id);
CREATE INDEX idx_char_rels_char ON character_relationships (character_id);
CREATE INDEX idx_char_rels_related ON character_relationships (related_character_id);
CREATE INDEX idx_timeline_events_event ON timeline_events (event_id);

-- Parent lookups (hierarchy)
CREATE INDEX idx_events_parent ON events (parent_event_id);  -- DEPRECATED (#180): dropped with the column
CREATE INDEX idx_periods_parent ON periods (parent_period_id);
CREATE INDEX idx_categories_parent ON categories (parent_category_id);

-- Forward fractal drill-down reverse lookup ("which event details this timeline?") — PENDING (#177)
CREATE INDEX idx_events_detail_timeline ON events (detail_timeline_id) WHERE detail_timeline_id IS NOT NULL;
```

### 8.2 Performance Strategies

- Cursor-based pagination on `sort_order_years` for large event sets
- TanStack Query with `staleTime: 5 * 60 * 1000` for entity data
- Supabase Realtime for cache invalidation (surgical `queryClient.invalidateQueries`)
- Edge Functions for bulk operations to avoid blocking the client
- Database views for common read patterns (character timelines, event participants)

### 8.3 Database Views

Every view is declared `WITH (security_invoker = true)` — without this, views run as the view owner and silently bypass RLS on the underlying tables (Supabase docs: [Security Invoker on Views](https://supabase.com/docs/guides/database/postgres/row-level-security#security-invoker-on-views)). With it, the calling user's RLS policies on the base tables are respected.

```sql
CREATE VIEW character_timeline_view
  WITH (security_invoker = true) AS
SELECT
  c.id AS character_id, c.name AS character_name,
  e.id AS event_id, e.title AS event_title,
  e.temporal_data, e.sort_order_years,
  ec.role, ec.significance,
  t.title AS timeline_title
FROM characters c
JOIN event_characters ec ON c.id = ec.character_id
JOIN events e ON ec.event_id = e.id
LEFT JOIN timelines t ON e.timeline_id = t.id;
-- Consumers should apply their own ORDER BY (e.g., ORDER BY sort_order_years);
-- view-baked ORDER BY is not guaranteed to survive consumer WHERE/JOIN.

CREATE VIEW character_network_view
  WITH (security_invoker = true) AS
SELECT
  cr.id AS relationship_id,
  c1.id AS character_id, c1.name AS character_name,
  c2.id AS related_id, c2.name AS related_name,
  cr.relationship_type, cr.start_temporal, cr.end_temporal, cr.description
FROM character_relationships cr
JOIN characters c1 ON cr.character_id = c1.id
JOIN characters c2 ON cr.related_character_id = c2.id;

CREATE VIEW event_participants_view
  WITH (security_invoker = true) AS
SELECT
  e.id AS event_id, e.title, e.sort_order_years,
  COUNT(ec.character_id) AS participant_count,
  -- FILTER + COALESCE avoid `[null]` for events with no event_characters rows;
  -- a bare json_agg over a LEFT JOIN with no matches would emit a one-element
  -- array containing JSON null, which is awkward for consumers.
  COALESCE(
    json_agg(
      json_build_object(
        'id', c.id, 'name', c.name, 'type', c.character_type,
        'role', ec.role, 'significance', ec.significance
      ) ORDER BY ec.significance, c.name
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) AS participants
FROM events e
LEFT JOIN event_characters ec ON e.id = ec.event_id
LEFT JOIN characters c ON ec.character_id = c.id
GROUP BY e.id, e.title, e.sort_order_years;
```

---

## 9. Security & Authentication

### 9.1 Authentication

Supabase Auth (email/password, magic link, OAuth). The profile trigger below auto-creates a row in `profiles` on signup, deriving `first_name` and `last_name` from `raw_user_meta_data` first, then the email local-part, with a `'New'`/`'User'` literal fallback. Single-char results are padded so the `CHECK (char_length > 1)` constraint on `profiles.first_name`/`last_name` is always satisfied. The hardening rule from §3.2 applies: `SET search_path = ''` and fully-qualified table references.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  email_local TEXT := split_part(COALESCE(NEW.email, ''), '@', 1);
  email_first TEXT;
  email_last  TEXT;
  fn TEXT;
  ln TEXT;
BEGIN
  IF email_local ~ '[._]' THEN
    email_first := split_part(regexp_replace(email_local, '[._]', '.', 'g'), '.', 1);
    email_last  := split_part(regexp_replace(email_local, '[._]', '.', 'g'), '.', 2);
  ELSE
    email_first := email_local;
    email_last  := NULL;
  END IF;

  fn := COALESCE(
    NULLIF(meta->>'first_name', ''),
    NULLIF(meta->>'given_name', ''),
    NULLIF(email_first, ''),
    'New'
  );
  ln := COALESCE(
    NULLIF(meta->>'last_name', ''),
    NULLIF(meta->>'family_name', ''),
    NULLIF(email_last, ''),
    'User'
  );

  -- Pad single-char fallbacks to satisfy CHECK (char_length > 1)
  IF char_length(fn) < 2 THEN fn := fn || '.'; END IF;
  IF char_length(ln) < 2 THEN ln := ln || '.'; END IF;

  INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (NEW.id, fn, ln)
    ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

> `ON CONFLICT (id) DO NOTHING` keeps the trigger idempotent if a profile row already exists (manual pre-creation, retry, replay). Apps can prompt users with placeholder names (`'New'`/`'User'`) to update their profile on first login.

### 9.2 RLS Pattern

Every content table uses the same four-clause pattern for reads: published content is public, owners see their own, admins see everything, and collaborators see shared timeline content. Write policies check ownership or admin status, with collaborator editors granted write access to shared timeline content.

Policies in §9.2.1, §9.2.2, and §9.2.4 call the SECURITY DEFINER helpers introduced in §3.2 (`is_timeline_owner`, `is_timeline_collaborator`, `is_timeline_collab_editor`) instead of inlining `EXISTS (SELECT 1 FROM timeline_collaborators ...)` / `EXISTS (SELECT 1 FROM timelines ...)`. The helpers exist to break an otherwise-fatal RLS recursion cycle (see the §3.2 rationale).

**Global-read carve-out for organizational tables.** Three tables intentionally use `USING (true)` on SELECT and are reachable by `anon`: `categories` and `media` (organizational metadata — access control is enforced on the parent entity that references them), and `profiles` (public-display data such as username, avatar, bio). These carve-outs are deliberate exceptions to the "anonymous users read only published content" rule and are documented per-table below.

#### 9.2.1 Content Tables with Timeline Association (events)

Event collaborator access derives from the **containing** timeline (`events.timeline_id`) — never from the drill-down `events.detail_timeline_id` or the `timeline_events` guest junction. A sub-timeline's collaborators do not gain access to the parent event through the fractal link; access flows the other way (from the home timeline down to its events). See the event ↔ timeline model in §3.2.

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Read: published OR owner OR admin OR collaborator
CREATE POLICY "read_events" ON events FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR public.is_timeline_collaborator(events.timeline_id)
);

-- Insert: owner or admin
CREATE POLICY "insert_events" ON events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Update: owner OR admin OR collaborator-editor
CREATE POLICY "update_events" ON events FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR public.is_timeline_collab_editor(events.timeline_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin()
    OR public.is_timeline_collab_editor(events.timeline_id)
  );

-- Delete: owner or admin only (collaborators cannot delete)
CREATE POLICY "delete_events" ON events FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());
```

#### 9.2.2 Content Tables without Timeline Association (timelines, periods, stories, characters, categories, media)

Tables without a direct `timeline_id` use the owner + admin + published pattern. For periods, stories, and characters, collaborator access is derived via the junction tables that connect them to timelines.

```sql
-- Example: timelines (the parent entity for collaboration)
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_timelines" ON timelines FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR public.is_timeline_collaborator(timelines.id)
);

CREATE POLICY "insert_timelines" ON timelines FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "update_timelines" ON timelines FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "delete_timelines" ON timelines FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());
```

```sql
-- Periods: collaborator access derived via period_timelines junction
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_periods" ON periods FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM period_timelines pt
    WHERE pt.period_id = periods.id
      AND public.is_timeline_collaborator(pt.timeline_id)
  )
);

CREATE POLICY "write_periods" ON periods FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());
```

```sql
-- Characters: collaborator access derived via event_characters → events → timelines
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_characters" ON characters FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM event_characters ec
    JOIN events e ON ec.event_id = e.id
    WHERE ec.character_id = characters.id
      AND public.is_timeline_collaborator(e.timeline_id)
  )
);

CREATE POLICY "write_characters" ON characters FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());
```

```sql
-- Stories: collaborator access derived via story_events → events → timelines
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_stories" ON stories FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM story_events se
    JOIN events e ON se.event_id = e.id
    WHERE se.story_id = stories.id
      AND public.is_timeline_collaborator(e.timeline_id)
  )
);

CREATE POLICY "write_stories" ON stories FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());
```

```sql
-- Categories and Media: owner + admin + published pattern
-- (Collaborator access derived transitively when queried via junction joins)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_categories" ON categories FOR SELECT USING (true);
  -- Categories are globally readable (they are organizational metadata)
CREATE POLICY "write_categories" ON categories FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin());

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_media" ON media FOR SELECT USING (true);
  -- Media is globally readable (access control is on the parent entity)
CREATE POLICY "write_media" ON media FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin());
```

> **Key changes from prior schema:** The prior RLS allowed anonymous read of _all_ content (`USING (true)`). The greenfield design respects the `published` flag — unpublished content is visible only to the owner. Admin override (`OR is_admin()`) is included on all policies per PRD Section 4.9.2. Collaborator access extends beyond events to periods, characters, and stories via their junction table relationships to timelines.

#### 9.2.3 Junction Tables (no user_id — ownership derived from parent)

```sql
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Read: anyone can read junctions for events they can see
CREATE POLICY "read_event_categories" ON event_categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_categories.event_id
    AND (published = true OR user_id = auth.uid() OR is_admin()))
);

-- Write: event owner or admin
CREATE POLICY "write_event_categories" ON event_categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_categories.event_id
    AND (user_id = auth.uid() OR is_admin()))
);
```

> The same derived-ownership pattern applies to all junction tables: `event_media`, `event_characters`, `timeline_events`, `period_timelines`, `story_periods`, `story_characters`, `story_events`, `character_media`, and `timeline_media`. Each checks ownership of its parent entity.

#### 9.2.4 Collaborator Table

The `read_collaborators` and `write_collaborators` policies below would deadlock against `read_timelines` (§9.2.2) using inline `EXISTS (SELECT 1 FROM timelines ...)` subqueries, because each table's RLS check would re-trigger the other table's RLS, producing `infinite recursion detected in policy for relation "timeline_collaborators"` (SQLSTATE 42P17) for any non-owner non-collaborator query. The fix is to call the SECURITY DEFINER `is_timeline_owner(t_id)` helper from §3.2, which bypasses RLS inside the helper body.

```sql
ALTER TABLE timeline_collaborators ENABLE ROW LEVEL SECURITY;

-- Read: timeline owner, the collaborator themselves, or admin
CREATE POLICY "read_collaborators" ON timeline_collaborators FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin()
  OR public.is_timeline_owner(timeline_collaborators.timeline_id)
);

-- Write: timeline owner or admin only (owners manage their collaborators)
CREATE POLICY "write_collaborators" ON timeline_collaborators FOR ALL TO authenticated
  USING (
    is_admin()
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  )
  WITH CHECK (
    is_admin()
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  );
```

#### 9.2.5 Special-Case Tables

Four tables don't fit the §9.2.1/§9.2.2 patterns — they need bespoke policies that aren't derived from `published`/`owner`/`collaborator`/`admin`. Each table's RLS rule is given below; the implementation is in migration `00007_rls_policies.sql`.

**profiles** — globally readable (usernames, avatars, bios are public-display data); own-row-only update. The `handle_new_user` trigger from §9.1 is the sole INSERT path (SECURITY DEFINER bypasses RLS). No DELETE policy — CASCADE from `auth.users` handles removal.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "update_profiles" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());
```

**notifications** — own-only read and update. INSERT happens via SECURITY DEFINER paths (collaboration invites, moderation alerts) so no INSERT policy is needed. No DELETE — notifications are write-once except for `read`/`read_at`, and column-level UPDATE restriction is enforced at the service layer (a future Postgres feature could let RLS limit which columns UPDATE may touch; for now this is application-enforced).

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "update_notifications" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**content_reports** — reporter-or-admin read, any authenticated user can file a report about themselves (`WITH CHECK (reporter_id = auth.uid())` prevents spoofing), admin-only update (resolves status/admin_notes/resolved_by/at). No DELETE — reports are retained for the audit trail.

```sql
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_content_reports" ON content_reports FOR SELECT
  USING (reporter_id = auth.uid() OR is_admin());

CREATE POLICY "insert_content_reports" ON content_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "update_content_reports" ON content_reports FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

**character_relationships** — simple `user_id`-based ownership for both read and write. The table has its own `user_id` column (unlike most junction tables), so ownership is well-defined. AC also describes a "visible if either character is visible" alternative; that interpretation requires recursive RLS evaluation through the characters policy and is rejected here in favor of the cheaper, deterministic ownership check.

```sql
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_character_relationships" ON character_relationships FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "write_character_relationships" ON character_relationships FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());
```

### 9.3 Storage Policies

Same pattern as prior design: public read, authenticated upload, owner-only update/delete on `media` and `avatars` buckets. New `exports` bucket is private (owner-only read).

---

## 10. Deployment Strategy

### 10.1 Environments

| Component      | Development                             | Staging                     | Production             |
| -------------- | --------------------------------------- | --------------------------- | ---------------------- |
| Database       | `supabase start` (local)                | Supabase project (free/pro) | Supabase project (pro) |
| Frontend       | `next dev`                              | Vercel preview              | Vercel production      |
| Edge Functions | `supabase functions serve`              | Supabase hosted             | Supabase hosted        |
| Types          | `supabase gen types typescript --local` | From staging project        | From prod project      |

### 10.2 Migration Management

All migrations in `supabase/migrations/`, managed via `supabase db diff` and `supabase db push`. For a greenfield project, the initial migration is a single file creating all tables, indexes, RLS policies, functions, and views. Subsequent migrations are incremental.

### 10.3 CI/CD

GitHub Actions:

1. **PR**: TypeScript check, tests, `supabase db push` to staging, Vercel preview deploy
2. **Merge to main**: `supabase db push` to production, Vercel production deploy
3. **Type sync**: `supabase gen types typescript` runs on migration changes, committed to repo

---

## 11. Project Structure

```
time-traveler/                              # pnpm + Turborepo monorepo
├── apps/
│   ├── admin/                              # Next.js 16 admin app (port 3000)
│   │   └── src/
│   │       ├── app/                        # Next.js App Router
│   │       │   ├── (public)/               # Public routes (no auth required)
│   │       │   │   ├── timelines/[slug]/
│   │       │   │   ├── events/[slug]/
│   │       │   │   └── characters/[slug]/
│   │       │   ├── (protected)/            # Auth-required routes
│   │       │   │   ├── dashboard/
│   │       │   │   ├── timelines/create/
│   │       │   │   ├── events/create/
│   │       │   │   ├── characters/create/
│   │       │   │   ├── library/            # Curated content library browser
│   │       │   │   └── notifications/      # User notification center
│   │       │   ├── (admin)/                # Admin-only routes (is_admin() check)
│   │       │   │   ├── dashboard/          # Admin dashboard, usage metrics
│   │       │   │   ├── library/            # Manage curated content library
│   │       │   │   ├── moderation/         # Content reports and moderation
│   │       │   │   └── users/              # User management, role assignment
│   │       │   └── auth/
│   │       ├── components/
│   │       │   ├── timeline/               # Timeline, FractalView, Renderer
│   │       │   ├── event/                  # EventCard, EventDetail, EventForm
│   │       │   ├── character/              # Profile, Timeline, RelationshipNetwork
│   │       │   ├── temporal/               # TemporalInput, PrehistoricTimeline
│   │       │   ├── showcase/               # MediaGallery, Uploader
│   │       │   └── admin/                  # Admin-specific components
│   │       ├── hooks/                      # TanStack Query hooks
│   │       │   ├── useEvents.ts
│   │       │   ├── useCharacters.ts
│   │       │   ├── useTimelines.ts
│   │       │   ├── useNotifications.ts     # Notification polling/realtime
│   │       │   └── useRealtime.ts          # Realtime subscription hooks
│   │       ├── stores/                     # Zustand stores
│   │       │   ├── navigationStore.ts      # Zoom, view mode, timeline selection
│   │       │   └── uiStore.ts              # Sidebar, modal state
│   │       ├── lib/utils/                  # App-specific utilities
│   │       │   ├── slug.ts                 # Slug generation
│   │       │   └── visualization.ts        # Scale calculations
│   │       └── proxy.ts                    # Auth route protection (Next 16 edge proxy; replaces middleware.ts)
│   └── docs/                               # Next.js 16 docs app (port 3001)
├── packages/
│   ├── services/                           # @repo/services — Supabase clients, types, schemas, service modules
│   │   └── src/
│   │       ├── supabase/
│   │       │   ├── client.ts               # createBrowserClient (browser)
│   │       │   ├── server.ts               # createServerClient (cookies-aware)
│   │       │   └── types.ts                # generated by `pnpm run db:gen:types`
│   │       ├── schemas/                    # Zod schemas
│   │       │   ├── temporal.ts             # Zod schemas for TemporalData
│   │       │   ├── event.ts                # Zod schemas for event forms
│   │       │   └── character.ts
│   │       └── modules/                    # Service modules
│   │           ├── eventService.ts         # CRUD + junction management
│   │           ├── timelineService.ts
│   │           ├── characterService.ts
│   │           ├── storyService.ts
│   │           ├── temporalService.ts      # Era conversion, formatting
│   │           ├── notificationService.ts  # Create/read/mark-read notifications
│   │           └── libraryService.ts       # Curated content import logic
│   ├── ui/                                 # @repo/ui — shared React components (shadcn/ui)
│   ├── eslint-config/                      # @repo/eslint-config
│   └── typescript-config/                  # @repo/typescript-config
├── supabase/
│   ├── migrations/                         # Numbered SQL migrations (00001_*.sql, …)
│   ├── tests/database/                     # pgTAP tests, one per migration (00001_*_test.sql, …)
│   ├── functions/                          # Edge Functions (Deno)
│   │   ├── bulk-import/index.ts
│   │   ├── export-timeline/index.ts
│   │   ├── library-import/index.ts         # Curated content import
│   │   ├── geocode/index.ts                # Location → spatial_data
│   │   ├── process-media/index.ts
│   │   └── publish/index.ts
│   ├── seed.sql
│   └── config.toml
└── tests/e2e/                              # Playwright E2E tests (cross-app)
```

---

## 12. Curated Content Library

The curated content library is a reference collection of ~100 high-quality historical events organized into 10-15 thematic timelines, serving as an onboarding tool and content bootstrap per PRD Section 4.14.

### 12.1 Strategy: Admin-Owned Content (PRD Option A)

Library content is stored in the same tables as user content, owned by a dedicated admin user and identified by a metadata flag:

```json
{
  "is_library_content": true,
  "library_version": "1.0",
  "library_category": "curated"
}
```

This reuses existing tables and RLS — library content is published and publicly readable like any other published content. No separate schema required.

### 12.2 Import Mechanism

When a user imports from the library, content is duplicated to the user's account via an Edge Function:

```typescript
// supabase/functions/library-import/index.ts
serve(async (req) => {
  const { timelineId, eventIds, mode } = await req.json();
  // mode: 'customize' (editable copies) or 'readonly' (read-only reference)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Fetch selected library entities (events, characters, categories)
  // 2. Deep-copy with new UUIDs, user_id = requesting user
  // 3. Preserve relationships (event_characters, event_categories)
  // 4. Handle slug conflicts (append numeric suffix)
  // 5. Return import summary
});
```

**Import modes:**

- **Customize** (default): Creates editable copies. User can modify freely. No link to library.
- **Read-only reference**: Creates copies with `metadata.library_readonly = true`. UI prevents editing. Future enhancement: propagate library updates.

### 12.3 Relationship Preservation

During import, the Edge Function:

- Imports referenced characters if not already in the user's account (match by slug to avoid duplicates)
- Imports referenced categories (match by title to reuse existing user categories)
- Creates all junction table rows (`event_characters`, `event_categories`, `timeline_events`)
- If importing a full timeline, creates the timeline entity first, then associates events
- If cherry-picking events, user chooses an existing timeline or creates a new one

### 12.4 Admin Management

Library content is managed by admin users through the standard CRUD interface with an admin-only "Library Management" section in the dashboard. Bulk import via CSV/JSON (the same `bulk-import` Edge Function) is the primary seeding mechanism. Library content is maintained in the `supabase/seed.sql` file for reproducible bootstrapping across environments.

---

## 13. Use Cases & Applications

### 13.1 Geological & Cosmological Timelines

Paleontologist creates Mesozoic Era timeline (252–66 MYA). Logarithmic scale for overview, linear when zoomed to a stage. Characters as species with temporal birth/death as emergence/extinction dates.

### 13.2 Criminal Investigation

Private timeline, CE exact dates, spatial_data for geographic correlation. Characters as suspects/witnesses/victims. Relationship network reveals connections; comparative view shows parallel movements.

### 13.3 Mythological Storytelling

Greek mythology timeline. Characters: mythological/divine. Relationships: family, rivalry, worship. Fractal nesting: myths within narrative arcs. Spans from cosmological origin to Trojan War (c. 1200 BCE).

### 13.4 Animal Biography

Seabiscuit: character_type `animal`, species `horse`, breed `Thoroughbred`, birth 1933 CE, death 1947 CE. Events = races, appearances. Relationships = trainers, jockeys, rivals. Character-centric view as complete life timeline.

### 13.5 Journalistic Investigation

Bulk import event data via Edge Function. Characters as executives, regulators, whistleblowers. Private with selective sharing via `timeline_collaborators`.

---

## 14. Appendix A: Enumerated Values

### Character Types

`human`, `animal`, `mythological`, `fictional`, `organization`, `divine`, `artifact`

### Character Roles (in Events)

`protagonist`, `antagonist`, `witness`, `participant`, `victim`, `beneficiary`, `performer`, `competitor`, `owner`, `creator`, `observer`

### Participation Levels

`primary`, `secondary`, `minor`, `mentioned`

### Relationship Types

`family`, `professional`, `friendship`, `rivalry`, `owner_pet`, `trainer_trainee`, `creator_creation`, `worship`, `collaboration`, `enemy`, `mentor_student`

### Temporal Eras

`CE` (Common Era), `BCE` (Before Common Era), `KYA` (Thousand Years Ago), `MYA` (Million Years Ago), `BYA` (Billion Years Ago)

### Precision Levels

`exact`, `circa`, `approximate`, `estimated`, `geological`

### Display Formats

`standard`, `scientific`, `geological`, `cosmological`

### Confidence Levels

`high`, `medium`, `low`

### Significance Levels

`low`, `medium`, `high`, `critical`

### Visibility

`private`, `public`, `shared`

### Event Types

`milestone`, `period`, `incident`, `discovery`, `creation`, `destruction`, `transformation`, `migration`, `conflict`, `ceremony`

### Timeline Types

`general`, `biographical`, `comparative`

### Narrator Types

`first_person`, `third_person`, `omniscient`

### Story Character Roles

`protagonist`, `supporting`, `mentioned`, `narrator`

### Collaborator Roles

`viewer`, `editor`, `admin`

### Profile Roles

`editor`, `admin`

### Notification Types

`collaborator_invite`, `content_moderated`, `content_reported`, `library_update`, `system_message`

### Content Report Reasons

`inaccurate`, `inappropriate`, `spam`, `copyright`, `other`

### Content Report Statuses

`pending`, `reviewed`, `actioned`, `dismissed`

---

## 15. Appendix B: Design Decisions Log

This appendix documents key decisions and the reasoning behind them, for future reference.

| #   | Decision                                            | Rationale                                                                                                                             |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **UUIDs over BIGINT identity**                      | Client-side generation for optimistic updates, natural fit with Supabase Auth, no guessable IDs                                       |
| 2   | **No stored procedures for CRUD**                   | PostgREST provides typed CRUD, cascades handle deletes, TypeScript services handle multi-step operations                              |
| 3   | **SQL functions over PL/pgSQL for reads**           | SQL functions are inlineable by the query optimizer; PL/pgSQL is opaque. All read functions use `LANGUAGE sql STABLE`                 |
| 4   | **No user_id on junction tables**                   | Prevents integrity issues where junction `user_id` disagrees with parent entity ownership. RLS checks parent entity directly          |
| 5   | **Separate start/end temporal columns**             | Enables proper range-overlap queries, cleaner validation, simpler TemporalService code                                                |
| 6   | **Zod for temporal validation, not DB constraints** | JSONB CHECK constraints are verbose and hard to maintain. Zod gives typed errors shared across form/API/seed code                     |
| 7   | **Table named `events` not `historical_events`**    | Brevity. `event_id` as FK name throughout the schema rather than `historical_event_id`                                                |
| 8   | **Published flag respected in RLS**                 | Prior schema allowed anon read of all content. Greenfield respects `published` — unpublished is owner-only                            |
| 9   | **Edge Functions for orchestration only**           | Bulk import, export, image processing, geocoding, publish workflows. Not for data access that PostgREST handles                       |
| 10  | **Social links as JSONB**                           | More extensible than individual columns per platform. `{ "x": "...", "github": "..." }`                                               |
| 11  | **ON DELETE CASCADE everywhere**                    | Eliminates need for manual junction cleanup in stored functions or client code                                                        |
| 12  | **TanStack Query as server state manager**          | Provides caching, deduplication, background refresh, optimistic updates. Zustand handles UI-only state                                |
| 13  | **Collaborator model via junction table**           | `timeline_collaborators(timeline_id, user_id, role)` enables shared editing with role-based access, checked in RLS                    |
| 14  | **Single greenfield migration**                     | No legacy migration debt. One `00001_initial_schema.sql` with all tables, indexes, policies, functions, views                         |
| 15  | **Admin role on profiles, not auth metadata**       | `profiles.role` column with `is_admin()` SECURITY DEFINER function. Queryable in RLS without parsing JWT claims (PRD 4.9.2)           |
| 16  | **search_vector on timelines**                      | PRD 4.12.1 requires full-text search across events, characters, stories, AND timelines. All four types have search_vector + GIN index |
| 17  | **Curated library as admin-owned content**          | PRD 4.14.7 Option A: reuse existing tables with `metadata.is_library_content = true`. Simpler than dedicated library tables           |
| 18  | **Notifications table for system messaging**        | PRD requires collaborator invites (3.4.1), moderation alerts (3.3.2). Simple write-once table with JSONB metadata for context         |
| 19  | **Content reports with polymorphic entity ref**     | `entity_type`/`entity_id` pattern keeps schema simple vs. per-entity FK columns. Admin moderation per PRD 3.3.2                       |
| 20  | **Collaborator RLS extends to all entity types**    | PRD 4.9.5 requires shared timeline access to include associated entities. Junction table joins derive access transitively             |

---

_This document is the authoritative system design reference for the Time Traveler greenfield implementation. It supersedes the v2.1 evolutionary design and should be used as the basis for initial schema creation, service layer development, and feature implementation._
