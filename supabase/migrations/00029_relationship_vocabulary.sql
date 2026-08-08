-- ============================================================================
-- 00029_relationship_vocabulary.sql
--
-- Replace the hard-coded `relationship_type` CHECK vocabulary with reference
-- tables, so adding a relationship type becomes an INSERT rather than a
-- migration. Recorded in docs/adr/adr-0040-relationship-vocabulary-reference-data.md
-- (issue #419).
--
-- Why
-- ---
-- The vocabulary was defined in five places that had to be edited in lockstep:
-- the CHECK in 00002, `relationshipTypeEnum` (Zod), `TYPE_FAMILIES` (selector),
-- `ASYMMETRIC_TYPES` (service), and the verb/noun maps in the admin detail
-- helpers. Relationship vocabulary grows continuously as the corpus of
-- characters and character types expands, and DDL-gated growth does not scale.
--
-- Shape
-- -----
-- Three tables, natural text primary keys, so the keys ARE the strings already
-- stored in character_relationships. Nothing about existing rows, views
-- (character_network_view, 00006/00014), functions (get_character_network,
-- 00008), or PostgREST filters (?relationship_type=eq.family) changes.
--
--   relationship_categories  — selector grouping; orders the groups
--     +-- relationship_types — the vocabulary; orders types within a group
--           +-- relationship_roles — the ADR-0009 sub-role taxonomy
--
-- Constraint mapping (3 CHECKs collapse into 2 FKs):
--   character_relationships_relationship_type_check (00002)
--       -> FK relationship_type -> relationship_types(key)
--   relationship_role_valid (00014)
--       -> composite FK, non-NULL branch
--   relationship_role_null_for_other_types (00014)
--       -> composite FK, MATCH SIMPLE NULL-skip
--
-- The composite FK follows the pattern established by
-- 00027_categories_same_owner_parent.sql and 00028_periods_same_owner_parent.sql:
-- under the default MATCH SIMPLE a NULL in any referencing column skips the
-- check entirely, which is exactly the "role may always be NULL" semantics the
-- dropped CHECK provided — with no trigger. Postgres requires a unique key on
-- the referenced columns; relationship_roles' composite PK satisfies that
-- natively.
--
-- Deliberately seeds NO rows. The vocabulary content is reference data with its
-- own lifecycle and ships in 00030_seed_relationship_vocabulary.sql. Note that
-- this migration and 00030 are NOT independently deployable: between them,
-- relationship_types is empty and no relationship can be created. Deploy them
-- together.
-- ============================================================================

-- ============================================================================
-- 1. Reference tables
-- ============================================================================

-- Selector grouping. `sort_order` orders the GROUPS; relationship_types.sort_order
-- orders types within a group. Two levels of ordering live in data so no
-- ordering knowledge is hard-coded in the UI.
CREATE TABLE public.relationship_categories (
  key         VARCHAR(50) PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.relationship_types (
  key            VARCHAR(100) PRIMARY KEY,
  label          TEXT NOT NULL,
  category_key   VARCHAR(50) NOT NULL
                   REFERENCES public.relationship_categories(key)
                   ON UPDATE CASCADE ON DELETE RESTRICT,
  sort_order     INTEGER NOT NULL DEFAULT 0,

  -- Reciprocal-edge metadata (ADR-0008 application-layer symmetry). Three-way:
  --   is_symmetric        -> reciprocal row carries the SAME type
  --   inverse_key set     -> reciprocal row carries THAT type
  --   neither             -> no reciprocal row; single directed assertion
  -- Replaces the ASYMMETRIC_TYPES set previously hard-coded in the service.
  is_symmetric   BOOLEAN NOT NULL DEFAULT true,
  inverse_key    VARCHAR(100)
                   REFERENCES public.relationship_types(key)
                   ON UPDATE CASCADE ON DELETE SET NULL,

  -- Display strings, previously hard-coded in the admin detail helpers.
  direction_verb TEXT,
  symmetric_noun TEXT,

  description    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),

  -- A type cannot both be its own reciprocal and name a different one.
  CONSTRAINT relationship_types_symmetric_has_no_inverse
    CHECK (NOT (is_symmetric AND inverse_key IS NOT NULL))
);

-- The ADR-0009 sub-role taxonomy. "Which types accept a sub-role" is now
-- derived data: a type accepts one iff it has rows here.
CREATE TABLE public.relationship_roles (
  type_key    VARCHAR(100) NOT NULL
                REFERENCES public.relationship_types(key)
                ON UPDATE CASCADE ON DELETE CASCADE,
  key         VARCHAR(100) NOT NULL,
  label       TEXT NOT NULL,
  -- Role the reciprocal row should carry (parent <-> child, spouse <-> spouse).
  -- Replaces the ROLE_INVERSE map previously hard-coded in the service.
  inverse_key VARCHAR(100),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (type_key, key)
);

-- ============================================================================
-- 2. character_relationships: CHECKs -> FKs
-- ============================================================================

ALTER TABLE public.character_relationships
  DROP CONSTRAINT character_relationships_relationship_type_check;

ALTER TABLE public.character_relationships
  ADD CONSTRAINT character_relationships_relationship_type_fkey
  FOREIGN KEY (relationship_type)
  REFERENCES public.relationship_types(key)
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- Both role CHECKs from 00014 are replaced by a single composite FK. NULL
-- relationship_role skips the check (MATCH SIMPLE), preserving
-- relationship_role_null_for_other_types; a non-NULL role must exist for the
-- given type, preserving relationship_role_valid.
ALTER TABLE public.character_relationships
  DROP CONSTRAINT relationship_role_valid,
  DROP CONSTRAINT relationship_role_null_for_other_types;

ALTER TABLE public.character_relationships
  ADD CONSTRAINT character_relationships_role_fkey
  FOREIGN KEY (relationship_type, relationship_role)
  REFERENCES public.relationship_roles(type_key, key)
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- ON DELETE RESTRICT on the type FK needs to look up referencing rows by
-- relationship_type; char_rels_unique leads with character_id and cannot serve
-- that probe.
CREATE INDEX character_relationships_relationship_type_idx
  ON public.character_relationships (relationship_type);

-- ============================================================================
-- 3. updated_at triggers
-- ============================================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.relationship_categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.relationship_types
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- 4. RLS — globally readable, admin-managed
--
-- Mirrors the `categories` precedent (00007): reference data everyone reads and
-- only admins write. Policies are split per action rather than FOR ALL, and
-- is_admin() is wrapped in a scalar subquery, per 00011_rls_performance_hardening.
-- ============================================================================

ALTER TABLE public.relationship_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_roles      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_relationship_categories" ON public.relationship_categories
  FOR SELECT USING (true);
CREATE POLICY "insert_relationship_categories" ON public.relationship_categories
  FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "update_relationship_categories" ON public.relationship_categories
  FOR UPDATE TO authenticated
  USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "delete_relationship_categories" ON public.relationship_categories
  FOR DELETE TO authenticated USING ((select is_admin()));

CREATE POLICY "read_relationship_types" ON public.relationship_types
  FOR SELECT USING (true);
CREATE POLICY "insert_relationship_types" ON public.relationship_types
  FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "update_relationship_types" ON public.relationship_types
  FOR UPDATE TO authenticated
  USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "delete_relationship_types" ON public.relationship_types
  FOR DELETE TO authenticated USING ((select is_admin()));

CREATE POLICY "read_relationship_roles" ON public.relationship_roles
  FOR SELECT USING (true);
CREATE POLICY "insert_relationship_roles" ON public.relationship_roles
  FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "update_relationship_roles" ON public.relationship_roles
  FOR UPDATE TO authenticated
  USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "delete_relationship_roles" ON public.relationship_roles
  FOR DELETE TO authenticated USING ((select is_admin()));

-- ============================================================================
-- 5. Data API GRANTs (ADR-0034 / 00023 convention)
--
-- Tables in `public` are not auto-exposed; a role needs an explicit GRANT or
-- PostgREST returns 42501. GRANT controls table access, RLS controls rows.
-- anon is read-only (the reader app is anonymous).
-- ============================================================================

GRANT SELECT ON public.relationship_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_categories
  TO authenticated, service_role;

GRANT SELECT ON public.relationship_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_types
  TO authenticated, service_role;

GRANT SELECT ON public.relationship_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_roles
  TO authenticated, service_role;
