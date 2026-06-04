-- ============================================================================
-- 00020_end_temporal_data_nullable.sql
--
-- Fixes issue #215 by making "no end date" representable as SQL NULL instead
-- of an empty JSON object.
--
-- Changes:
--   1) Drop end_temporal_data defaults on timelines/events/periods so creates
--      without an end value persist NULL.
--   2) Backfill legacy '{}'::jsonb values to NULL.
-- ============================================================================

ALTER TABLE timelines
  ALTER COLUMN end_temporal_data DROP DEFAULT;

ALTER TABLE events
  ALTER COLUMN end_temporal_data DROP DEFAULT;

ALTER TABLE periods
  ALTER COLUMN end_temporal_data DROP DEFAULT;

UPDATE timelines
SET end_temporal_data = NULL
WHERE end_temporal_data = '{}'::jsonb;

UPDATE events
SET end_temporal_data = NULL
WHERE end_temporal_data = '{}'::jsonb;

UPDATE periods
SET end_temporal_data = NULL
WHERE end_temporal_data = '{}'::jsonb;
