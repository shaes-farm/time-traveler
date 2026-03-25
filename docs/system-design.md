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

**Fractal Time Navigation.** Events can contain nested sub-events, creating a multi-dimensional temporal hierarchy where users zoom seamlessly from billion-year geological scales to individual seconds.

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
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;
```

> **SECURITY DEFINER** is required here because the function needs to read `profiles` regardless of the calling user's RLS context. The function is `STABLE` (no side effects) and returns a simple boolean used in RLS policy clauses.

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
    to_tsvector('english',
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
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
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
> - Added `parent_event_id` self-reference for fractal nesting.
> - Added `event_type` with CHECK constraint.
> - Added `spatial_data JSONB` alongside the free-form `location` string.
> - Added `search_vector` as a generated column.
> - `importance` is now a 1–10 integer with CHECK constraint rather than unconstrained.
> - Temporal data is JSONB from day one — no VARCHAR date columns.
> - Both start and end dates have their own `temporal_data`/`sort_order` pair, rather than embedding end dates inside the start temporal JSONB. This is cleaner for range queries.

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
    to_tsvector('english',
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
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(biography, '') || ' ' ||
      coalesce(array_to_string(aliases, ' '), ''))
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

-- Timelines ↔ Events
CREATE TABLE timeline_events (
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
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
> - Added `character_media` for character profile images.
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
| BYA | year: 13.8 | −13,800,000,000  |

### 4.5 Computed TIMESTAMPTZ for Modern Dates

For CE dates within PostgreSQL's range, a generated TIMESTAMPTZ column enables native date operations:

```sql
computed_start_date TIMESTAMPTZ GENERATED ALWAYS AS (
  CASE
    WHEN (temporal_data->>'era') = 'CE'
      AND (temporal_data->>'year')::BIGINT > -4712
    THEN make_timestamptz(
      (temporal_data->>'year')::INT,
      COALESCE((temporal_data->>'month')::INT, 1),
      COALESCE((temporal_data->>'day')::INT, 1),
      COALESCE((temporal_data->>'hour')::INT, 0),
      COALESCE((temporal_data->>'minute')::INT, 0),
      COALESCE((temporal_data->>'second')::NUMERIC, 0)
    )
    ELSE NULL
  END
) STORED
```

### 4.6 JSONB Validation

Temporal data validation is enforced at the application layer (TypeScript) via Zod schemas, not via PostgreSQL CHECK constraints on JSONB. This is because JSONB CHECK constraints are verbose and hard to maintain, Zod provides much better developer experience with typed errors, and validation can be shared between form input, API calls, and seed scripts.

```typescript
// lib/schemas/temporal.ts
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
// lib/services/eventService.ts
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
CREATE OR REPLACE FUNCTION get_user_metrics(p_user_id UUID)
RETURNS TABLE(
  entity_type TEXT, count BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT 'events', COUNT(*) FROM events WHERE user_id = p_user_id
  UNION ALL
  SELECT 'timelines', COUNT(*) FROM timelines WHERE user_id = p_user_id
  UNION ALL
  SELECT 'periods', COUNT(*) FROM periods WHERE user_id = p_user_id
  UNION ALL
  SELECT 'stories', COUNT(*) FROM stories WHERE user_id = p_user_id
  UNION ALL
  SELECT 'characters', COUNT(*) FROM characters WHERE user_id = p_user_id
  UNION ALL
  SELECT 'categories', COUNT(*) FROM categories WHERE user_id = p_user_id
  UNION ALL
  SELECT 'media', COUNT(*) FROM media WHERE user_id = p_user_id;
$$;
```

> **Note:** All functions are `LANGUAGE sql` with `STABLE` volatility, not `plpgsql`. SQL functions are inlineable by the PostgreSQL optimizer, meaning they can be folded into the calling query plan. PL/pgSQL functions are always executed as opaque blocks. For read-only queries, SQL functions are strictly better.

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
  const { sourceTimelineId, eventIds, mode, targetTimelineId } = await req.json();
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
// lib/services/temporalService.ts
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

| Input                                   | Format       | Output                 |
| --------------------------------------- | ------------ | ---------------------- |
| year: 2024, month: 8, day: 11, era: CE  | standard     | August 11, 2024        |
| year: 44, month: 3, day: 15, era: BCE   | standard     | March 15, 44 BCE       |
| year: 66, era: MYA, geol: "K-Pg"        | geological   | 66 MYA (K-Pg boundary) |
| year: 4.54, era: BYA, ±50M              | scientific   | 4.54 ± 0.05 BYA        |
| year: 13.8, era: BYA, epoch: "Big Bang" | cosmological | Big Bang (13.8 BYA)    |

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

-- Full-text search (all four searchable entity types per PRD Section 4.12.1)
CREATE INDEX idx_events_search ON events USING GIN (search_vector);
CREATE INDEX idx_timelines_search ON timelines USING GIN (search_vector);
CREATE INDEX idx_characters_search ON characters USING GIN (search_vector);
CREATE INDEX idx_stories_search ON stories USING GIN (search_vector);

-- Character lookups
CREATE INDEX idx_characters_type ON characters (character_type);
CREATE INDEX idx_characters_aliases ON characters USING GIN (aliases);

-- Junction table performance
CREATE INDEX idx_event_chars_char ON event_characters (character_id);
CREATE INDEX idx_event_chars_event ON event_characters (event_id);
CREATE INDEX idx_char_rels_char ON character_relationships (character_id);
CREATE INDEX idx_char_rels_related ON character_relationships (related_character_id);
CREATE INDEX idx_timeline_events_event ON timeline_events (event_id);

-- Parent lookups (fractal nesting)
CREATE INDEX idx_events_parent ON events (parent_event_id);
CREATE INDEX idx_periods_parent ON periods (parent_period_id);
CREATE INDEX idx_categories_parent ON categories (parent_category_id);
```

### 8.2 Performance Strategies

- Cursor-based pagination on `sort_order_years` for large event sets
- TanStack Query with `staleTime: 5 * 60 * 1000` for entity data
- Supabase Realtime for cache invalidation (surgical `queryClient.invalidateQueries`)
- Edge Functions for bulk operations to avoid blocking the client
- Database views for common read patterns (character timelines, event participants)

### 8.3 Database Views

```sql
CREATE VIEW character_timeline_view AS
SELECT
  c.id AS character_id, c.name AS character_name,
  e.id AS event_id, e.title AS event_title,
  e.temporal_data, e.sort_order_years,
  ec.role, ec.significance,
  t.title AS timeline_title
FROM characters c
JOIN event_characters ec ON c.id = ec.character_id
JOIN events e ON ec.event_id = e.id
LEFT JOIN timelines t ON e.timeline_id = t.id
ORDER BY c.id, e.sort_order_years;

CREATE VIEW character_network_view AS
SELECT
  cr.id AS relationship_id,
  c1.id AS character_id, c1.name AS character_name,
  c2.id AS related_id, c2.name AS related_name,
  cr.relationship_type, cr.start_temporal, cr.end_temporal, cr.description
FROM character_relationships cr
JOIN characters c1 ON cr.character_id = c1.id
JOIN characters c2 ON cr.related_character_id = c2.id;

CREATE VIEW event_participants_view AS
SELECT
  e.id AS event_id, e.title, e.sort_order_years,
  COUNT(ec.character_id) AS participant_count,
  json_agg(json_build_object(
    'id', c.id, 'name', c.name, 'type', c.character_type,
    'role', ec.role, 'significance', ec.significance
  ) ORDER BY ec.significance, c.name) AS participants
FROM events e
LEFT JOIN event_characters ec ON e.id = ec.event_id
LEFT JOIN characters c ON ec.character_id = c.id
GROUP BY e.id, e.title, e.sort_order_years;
```

---

## 9. Security & Authentication

### 9.1 Authentication

Supabase Auth (email/password, magic link, OAuth). Profile trigger auto-creates a row in `profiles` on signup.

### 9.2 RLS Pattern

Every content table uses the same four-clause pattern for reads: published content is public, owners see their own, admins see everything, and collaborators see shared timeline content. Write policies check ownership or admin status, with collaborator editors granted write access to shared timeline content.

#### 9.2.1 Content Tables with Timeline Association (events)

Tables that have a `timeline_id` column benefit from direct collaborator checks:

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Read: published OR owner OR admin OR collaborator
CREATE POLICY "read_events" ON events FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM timeline_collaborators tc
    WHERE tc.timeline_id = events.timeline_id
      AND tc.user_id = auth.uid()
  )
);

-- Insert: owner or admin
CREATE POLICY "insert_events" ON events FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin()
  );

-- Update: owner OR admin OR collaborator-editor
CREATE POLICY "update_events" ON events FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM timeline_collaborators tc
      WHERE tc.timeline_id = events.timeline_id
        AND tc.user_id = auth.uid()
        AND tc.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM timeline_collaborators tc
      WHERE tc.timeline_id = events.timeline_id
        AND tc.user_id = auth.uid()
        AND tc.role IN ('editor', 'admin')
    )
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
  OR EXISTS (
    SELECT 1 FROM timeline_collaborators tc
    WHERE tc.timeline_id = timelines.id
      AND tc.user_id = auth.uid()
  )
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
    JOIN timeline_collaborators tc ON tc.timeline_id = pt.timeline_id
    WHERE pt.period_id = periods.id
      AND tc.user_id = auth.uid()
  )
);

CREATE POLICY "write_periods" ON periods FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin());
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
    JOIN timeline_collaborators tc ON tc.timeline_id = e.timeline_id
    WHERE ec.character_id = characters.id
      AND tc.user_id = auth.uid()
  )
);

CREATE POLICY "write_characters" ON characters FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin());
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
    JOIN timeline_collaborators tc ON tc.timeline_id = e.timeline_id
    WHERE se.story_id = stories.id
      AND tc.user_id = auth.uid()
  )
);

CREATE POLICY "write_stories" ON stories FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin());
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

```sql
ALTER TABLE timeline_collaborators ENABLE ROW LEVEL SECURITY;

-- Read: timeline owner, the collaborator themselves, or admin
CREATE POLICY "read_collaborators" ON timeline_collaborators FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM timelines WHERE id = timeline_collaborators.timeline_id
      AND user_id = auth.uid()
  )
);

-- Write: timeline owner or admin only (owners manage their collaborators)
CREATE POLICY "write_collaborators" ON timeline_collaborators FOR ALL TO authenticated USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM timelines WHERE id = timeline_collaborators.timeline_id
      AND user_id = auth.uid()
  )
);
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
time-traveler/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (public)/                     # Public routes (no auth required)
│   │   │   ├── timelines/[slug]/
│   │   │   ├── events/[slug]/
│   │   │   └── characters/[slug]/
│   │   ├── (protected)/                  # Auth-required routes
│   │   │   ├── dashboard/
│   │   │   ├── timelines/create/
│   │   │   ├── events/create/
│   │   │   ├── characters/create/
│   │   │   ├── library/                  # Curated content library browser
│   │   │   └── notifications/            # User notification center
│   │   ├── (admin)/                      # Admin-only routes (is_admin() check)
│   │   │   ├── dashboard/                # Admin dashboard, usage metrics
│   │   │   ├── library/                  # Manage curated content library
│   │   │   ├── moderation/               # Content reports and moderation
│   │   │   └── users/                    # User management, role assignment
│   │   └── auth/
│   ├── components/
│   │   ├── timeline/                     # Timeline, FractalView, Renderer
│   │   ├── event/                        # EventCard, EventDetail, EventForm
│   │   ├── character/                    # Profile, Timeline, RelationshipNetwork
│   │   ├── temporal/                     # TemporalInput, PrehistoricTimeline
│   │   ├── showcase/                     # MediaGallery, Uploader
│   │   ├── admin/                        # Admin-specific components
│   │   └── ui/                           # shadcn/ui
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   ├── server.ts                 # Server component client
│   │   │   └── types.ts                  # Generated database types
│   │   ├── services/
│   │   │   ├── eventService.ts           # CRUD + junction management
│   │   │   ├── timelineService.ts
│   │   │   ├── characterService.ts
│   │   │   ├── storyService.ts
│   │   │   ├── temporalService.ts        # Era conversion, formatting
│   │   │   ├── notificationService.ts    # Create/read/mark-read notifications
│   │   │   └── libraryService.ts         # Curated content import logic
│   │   ├── schemas/
│   │   │   ├── temporal.ts               # Zod schemas for TemporalData
│   │   │   ├── event.ts                  # Zod schemas for event forms
│   │   │   └── character.ts
│   │   └── utils/
│   │       ├── slug.ts                   # Slug generation
│   │       └── visualization.ts          # Scale calculations
│   ├── hooks/
│   │   ├── useEvents.ts                  # TanStack Query hooks
│   │   ├── useCharacters.ts
│   │   ├── useTimelines.ts
│   │   ├── useNotifications.ts           # Notification polling/realtime
│   │   └── useRealtime.ts               # Realtime subscription hooks
│   ├── stores/
│   │   ├── navigationStore.ts            # Zoom, view mode, timeline selection
│   │   └── uiStore.ts                    # Sidebar, modal state
│   └── types/
│       └── index.ts                      # App-level type augmentations
├── supabase/
│   ├── migrations/
│   │   └── 00001_initial_schema.sql      # Single greenfield migration
│   ├── functions/
│   │   ├── bulk-import/index.ts
│   │   ├── export-timeline/index.ts
│   │   ├── library-import/index.ts       # Curated content import
│   │   ├── geocode/index.ts              # Location → spatial_data
│   │   ├── process-media/index.ts
│   │   └── publish/index.ts
│   ├── seed.sql
│   └── config.toml
├── tests/
│   ├── services/                         # Unit tests for service layer
│   ├── schemas/                          # Zod schema tests
│   └── e2e/                              # Playwright E2E tests
└── middleware.ts                          # Auth route protection
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
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | **UUIDs over BIGINT identity** | Client-side generation for optimistic updates, natural fit with Supabase Auth, no guessable IDs |
| 2 | **No stored procedures for CRUD** | PostgREST provides typed CRUD, cascades handle deletes, TypeScript services handle multi-step operations |
| 3 | **SQL functions over PL/pgSQL for reads** | SQL functions are inlineable by the query optimizer; PL/pgSQL is opaque. All read functions use `LANGUAGE sql STABLE` |
| 4 | **No user_id on junction tables** | Prevents integrity issues where junction `user_id` disagrees with parent entity ownership. RLS checks parent entity directly |
| 5 | **Separate start/end temporal columns** | Enables proper range-overlap queries, cleaner validation, simpler TemporalService code |
| 6 | **Zod for temporal validation, not DB constraints** | JSONB CHECK constraints are verbose and hard to maintain. Zod gives typed errors shared across form/API/seed code |
| 7 | **Table named `events` not `historical_events`** | Brevity. `event_id` as FK name throughout the schema rather than `historical_event_id` |
| 8 | **Published flag respected in RLS** | Prior schema allowed anon read of all content. Greenfield respects `published` — unpublished is owner-only |
| 9 | **Edge Functions for orchestration only** | Bulk import, export, image processing, geocoding, publish workflows. Not for data access that PostgREST handles |
| 10 | **Social links as JSONB** | More extensible than individual columns per platform. `{ "x": "...", "github": "..." }` |
| 11 | **ON DELETE CASCADE everywhere** | Eliminates need for manual junction cleanup in stored functions or client code |
| 12 | **TanStack Query as server state manager** | Provides caching, deduplication, background refresh, optimistic updates. Zustand handles UI-only state |
| 13 | **Collaborator model via junction table** | `timeline_collaborators(timeline_id, user_id, role)` enables shared editing with role-based access, checked in RLS |
| 14 | **Single greenfield migration** | No legacy migration debt. One `00001_initial_schema.sql` with all tables, indexes, policies, functions, views |
| 15 | **Admin role on profiles, not auth metadata** | `profiles.role` column with `is_admin()` SECURITY DEFINER function. Queryable in RLS without parsing JWT claims (PRD 4.9.2) |
| 16 | **search_vector on timelines** | PRD 4.12.1 requires full-text search across events, characters, stories, AND timelines. All four types have search_vector + GIN index |
| 17 | **Curated library as admin-owned content** | PRD 4.14.7 Option A: reuse existing tables with `metadata.is_library_content = true`. Simpler than dedicated library tables |
| 18 | **Notifications table for system messaging** | PRD requires collaborator invites (3.4.1), moderation alerts (3.3.2). Simple write-once table with JSONB metadata for context |
| 19 | **Content reports with polymorphic entity ref** | `entity_type`/`entity_id` pattern keeps schema simple vs. per-entity FK columns. Admin moderation per PRD 3.3.2 |
| 20 | **Collaborator RLS extends to all entity types** | PRD 4.9.5 requires shared timeline access to include associated entities. Junction table joins derive access transitively |

---

_This document is the authoritative system design reference for the Time Traveler greenfield implementation. It supersedes the v2.1 evolutionary design and should be used as the basis for initial schema creation, service layer development, and feature implementation._
