-- ============================================================================
-- 00014_relationship_role.sql
--
-- Adds nullable `relationship_role` column to character_relationships and
-- extends the unique index to include it (issue #119).
--
-- The `relationship_type` enum (defined in 00002_relationships_junctions.sql)
-- collapses semantically distinct sub-roles into a single value for three
-- types: `family` (spouse / parent / child / sibling / ...), `professional`
-- (employer / employee / colleague / ...), and `collaboration` (co_author /
-- co_founder / research_partner / ...). The other 8 types are already
-- specific or have direction encoded by type pairing.
--
-- This migration adopts Option A from #119: a single nullable column with
-- type-conditional CHECK constraints. Backwards-compatible — existing rows
-- get `relationship_role = NULL` automatically.
--
-- The unique index is extended to include `relationship_role` so that rare
-- but real cases (e.g., adoptive + biological parent of the same child) can
-- coexist as multiple rows for the same (character_id, related_character_id,
-- type) triple. The index uses NULLS NOT DISTINCT (PostgreSQL 15+) so that
-- two NULL-role rows for the same pair+type are still treated as duplicates
-- — preserving the original "one of each (pair, type)" guarantee for legacy
-- data — while a NULL-role row and a specific-role row remain distinct
-- (NULL ≠ "parent" regardless of the option).
--
-- Sub-role taxonomy: see #119 comment and
-- docs/design/admin/02-wireframes/06-relationships-editor.md.
-- ============================================================================

ALTER TABLE character_relationships
  ADD COLUMN relationship_role VARCHAR(100);

-- Sub-roles are constrained per-type. NULL role is always allowed.
ALTER TABLE character_relationships
  ADD CONSTRAINT relationship_role_valid CHECK (
    relationship_role IS NULL
    OR (relationship_type = 'family' AND relationship_role IN (
      'spouse', 'parent', 'child', 'sibling', 'grandparent', 'grandchild',
      'aunt_uncle', 'niece_nephew', 'cousin', 'in_law',
      'step_parent', 'step_child', 'step_sibling',
      'adoptive_parent', 'adoptive_child', 'other'
    ))
    OR (relationship_type = 'professional' AND relationship_role IN (
      'employer', 'employee', 'colleague', 'supervisor', 'subordinate',
      'business_partner', 'client', 'vendor', 'other'
    ))
    OR (relationship_type = 'collaboration' AND relationship_role IN (
      'co_author', 'co_founder', 'research_partner', 'performance_partner',
      'band_member', 'creative_partner', 'other'
    ))
  );

-- Non-sub-roled types (friendship, rivalry, enemy, mentor_student, owner_pet,
-- trainer_trainee, creator_creation, worship) must have NULL role.
ALTER TABLE character_relationships
  ADD CONSTRAINT relationship_role_null_for_other_types CHECK (
    relationship_type IN ('family', 'professional', 'collaboration')
    OR relationship_role IS NULL
  );

-- Extend the unique index to include relationship_role.
-- NULLS NOT DISTINCT keeps duplicate NULL-role rows blocked while still
-- letting a NULL-role row coexist with a specific-role row for the same
-- pair+type (legacy compat).
DROP INDEX char_rels_unique;
CREATE UNIQUE INDEX char_rels_unique
  ON character_relationships
  (character_id, related_character_id, relationship_type, relationship_role)
  NULLS NOT DISTINCT;

-- Refresh character_network_view to expose relationship_role. CREATE OR REPLACE
-- VIEW requires the existing column list to remain in the same position; new
-- columns can only be appended, so relationship_role lands at the end.
CREATE OR REPLACE VIEW character_network_view
  WITH (security_invoker = true) AS
SELECT
  cr.id AS relationship_id,
  c1.id AS character_id,
  c1.name AS character_name,
  c2.id AS related_id,
  c2.name AS related_name,
  cr.relationship_type,
  cr.start_temporal,
  cr.end_temporal,
  cr.description,
  cr.relationship_role
FROM character_relationships cr
JOIN characters c1 ON cr.character_id = c1.id
JOIN characters c2 ON cr.related_character_id = c2.id;
