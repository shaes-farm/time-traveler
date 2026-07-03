-- ============================================================================
-- 00025_characters_sort_order_years.sql
--
-- Adds a sort_order_years generated column to characters (issue #326).
--
-- The characters-list wireframe (docs/design/admin/02-wireframes/
-- 03-characters-list.md, "Primary actions") requires sorting by birth date.
-- Unlike timelines/periods/events, characters had no generated sort_order
-- column to sort on safely across BCE/CE/KYA/MYA/BYA eras — ad hoc JSONB
-- comparison doesn't work because the scaled era ranges overlap. This
-- mirrors the era conversion formula documented in docs/system-design.md
-- §4.4 and used by events.sort_order_years (00001_initial_schema.sql),
-- applied here to characters.birth_temporal.
--
-- Tie-break: characters are keyed off birth_temporal first. If a character
-- has no birth_temporal but does have death_temporal (e.g. a historical
-- figure recorded only by date of death), that is used instead. If neither
-- is present (mythological/divine characters, which the wireframe says
-- should render "—"), sort_order_years is NULL. Unlike events.temporal_data
-- (NOT NULL), characters.birth_temporal/death_temporal are both nullable, so
-- NULL is an intentional, expected value here — callers must sort with
-- NULLS LAST regardless of direction so undated characters sort to the end.
--
-- No GRANT changes needed: 00023_api_role_table_grants.sql grants
-- ALL TABLES IN SCHEMA public, which already covers this column (GRANTs are
-- table-level, not column-level).
-- ============================================================================

ALTER TABLE characters ADD COLUMN sort_order_years BIGINT GENERATED ALWAYS AS (
  CASE
    WHEN (birth_temporal->>'era') = 'CE'  THEN  (birth_temporal->>'year')::BIGINT
    WHEN (birth_temporal->>'era') = 'BCE' THEN -(birth_temporal->>'year')::BIGINT
    WHEN (birth_temporal->>'era') = 'KYA' THEN -(birth_temporal->>'year')::BIGINT * 1000
    WHEN (birth_temporal->>'era') = 'MYA' THEN -(birth_temporal->>'year')::BIGINT * 1000000
    WHEN (birth_temporal->>'era') = 'BYA' THEN -(birth_temporal->>'year')::BIGINT * 1000000000
    WHEN (death_temporal->>'era') = 'CE'  THEN  (death_temporal->>'year')::BIGINT
    WHEN (death_temporal->>'era') = 'BCE' THEN -(death_temporal->>'year')::BIGINT
    WHEN (death_temporal->>'era') = 'KYA' THEN -(death_temporal->>'year')::BIGINT * 1000
    WHEN (death_temporal->>'era') = 'MYA' THEN -(death_temporal->>'year')::BIGINT * 1000000
    WHEN (death_temporal->>'era') = 'BYA' THEN -(death_temporal->>'year')::BIGINT * 1000000000
    ELSE NULL
  END
) STORED;

CREATE INDEX idx_characters_sort ON characters (sort_order_years);
