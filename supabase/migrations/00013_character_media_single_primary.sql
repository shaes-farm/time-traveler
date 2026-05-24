-- Migration: 00012_character_media_single_primary.sql
-- Issue: #125 — enforce single-primary on character_media via partial unique index
--
-- The character_media junction table has no created_at column. Cleanup tiebreaker
-- is media_id ASC (UUID lexicographic order) — the lowest media_id survives as
-- the primary for each character_id group with duplicate is_primary = true rows.

-- Step 1: Clean up any existing rows where multiple is_primary = true per character_id.
--         Retain the row with the lowest media_id per character_id group;
--         set all others to false.
WITH ranked AS (
  SELECT
    character_id,
    media_id,
    ROW_NUMBER() OVER (
      PARTITION BY character_id
      ORDER BY media_id ASC
    ) AS rn
  FROM public.character_media
  WHERE is_primary = true
)
UPDATE public.character_media cm
SET is_primary = false
FROM ranked r
WHERE cm.character_id = r.character_id
  AND cm.media_id     = r.media_id
  AND r.rn > 1;

-- Step 2: Enforce the invariant going forward.
--         At most one row per character_id may have is_primary = true.
CREATE UNIQUE INDEX IF NOT EXISTS character_media_one_primary
  ON public.character_media (character_id)
  WHERE is_primary = true;
