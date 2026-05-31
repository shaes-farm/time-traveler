-- ============================================================================
-- 00016_story_events_sort_order.sql
--
-- Adds sort_order INTEGER column to the story_events junction table (issue #183).
--
-- A story is a NARRATIVE SEQUENCE of events and routinely tells them out of
-- chronological order (flashbacks, thematic grouping, in-media-res openings).
-- Narrative order is an editorial property of the story<->event link, so it
-- lives on the junction. This mirrors timeline_events.sort_order (migration
-- 00012, issue #122).
--
-- The default value of 0 is backward-compatible: existing rows receive
-- sort_order = 0 automatically and callers that omit the sortOrder argument
-- continue to work. When all sort_order values are equal (still unset), the
-- application layer falls back to ordering by the joined
-- events.sort_order_years (chronological order).
-- ============================================================================

ALTER TABLE story_events ADD COLUMN sort_order INTEGER DEFAULT 0;
