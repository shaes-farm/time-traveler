-- ============================================================================
-- 00029_extend_relationship_types.sql
--
-- Extends the character_relationships.relationship_type CHECK vocabulary with
-- 21 causal / derivational / attitudinal verbs, in support of the first
-- production-quality dataset, "The Human Discovery of Time"
-- (docs/the-human-discovery-of-time.md) and recorded in
-- docs/adr/adr-0037-extend-relationship-vocabulary.md.
--
-- The original 11 types (00002_relationships_junctions.sql) describe
-- interpersonal/social ties. The Human Discovery of Time corpus needs to model
-- how people, instruments, standards bodies, and ideas relate causally — e.g.
-- one clock `superseded` another, an inventor `patented` an artifact, a body
-- `standardized` a unit, a theory `challenged` an earlier one. Modeling those
-- as first-class relationship rows (rather than free-text notes) keeps the
-- causal graph queryable via character_network_view and the relationships
-- editor.
--
-- Scope of this migration: ONLY the relationship_type CHECK is widened. The
-- two relationship_role CHECKs from 00014 are intentionally left untouched:
--   * relationship_role_valid          — sub-roles are enumerated only for
--     family/professional/collaboration, so the new types are unaffected.
--   * relationship_role_null_for_other_types — forces relationship_role IS NULL
--     for any type not in (family, professional, collaboration); the 21 new
--     types fall through to that NULL branch automatically. `typeAcceptsRole`
--     in packages/services/src/schemas/character-relationship.ts stays
--     {family, professional, collaboration}.
--
-- Verbs whose object is an *event* (observed / predicted / measured /
-- calculated, and the state verbs rediscovered / forgotten / rejected of an
-- event) are modeled via event_characters participation, not here —
-- character_relationships only links character↔character. See ADR-0037. The
-- state verbs are still added to this enum because they can also legitimately
-- describe one character's stance toward another's work.
--
-- No GRANT changes needed: this only replaces a CHECK constraint on an existing
-- table (00023_api_role_table_grants.sql already covers character_relationships).
-- No data migration needed: widening an IN-list CHECK never invalidates
-- existing rows.
-- ============================================================================

ALTER TABLE character_relationships
  DROP CONSTRAINT character_relationships_relationship_type_check;

ALTER TABLE character_relationships
  ADD CONSTRAINT character_relationships_relationship_type_check
  CHECK (relationship_type IN (
    -- Original 11 (00002_relationships_junctions.sql) — interpersonal/social.
    'family', 'professional', 'friendship', 'rivalry',
    'owner_pet', 'trainer_trainee', 'creator_creation',
    'worship', 'collaboration', 'enemy', 'mentor_student',
    -- Added in 00029 — causal / derivational / attitudinal (ADR-0037).
    'observed', 'influenced', 'improved', 'standardized', 'enabled',
    'superseded', 'derived_from', 'challenged', 'inspired', 'succeeded',
    'contradicted', 'copied', 'predicted', 'calculated', 'measured',
    'named', 'patented', 'adopted', 'rejected', 'forgotten', 'rediscovered'
  ));
