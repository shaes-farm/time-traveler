-- ============================================================================
-- 00005_performance_indexes.sql
--
-- Performance indexes (issue #17). See docs/system-design.md §8.1.
--
-- Slug indexes (per-table unique on user_id+slug) are already created by
-- 00001 and 00002 and are not recreated here. This migration adds:
--   - Temporal sort/range indexes on events and periods
--   - GIN indexes on the four search_vector columns
--   - GIN index on characters.aliases (array)
--   - BTREE index on characters.character_type for type-filtering
--   - Junction-table reverse FK indexes (for queries that filter by the
--     non-leading column of a composite PK)
--   - Parent self-reference indexes for fractal nesting traversal
--
-- Note: idx_event_chars_event is redundant with the event_characters PK
-- (event_id, character_id) whose leading column already indexes event_id.
-- Included per spec §8.1 literal for AC compliance; flagged in #73.
-- ============================================================================

-- Temporal ordering and range
CREATE INDEX idx_events_sort           ON events (sort_order_years);
CREATE INDEX idx_events_timeline_sort  ON events (timeline_id, sort_order_years);
CREATE INDEX idx_events_range          ON events (sort_order_years, sort_order_end);
CREATE INDEX idx_periods_sort          ON periods (sort_order_start);

-- Full-text search (GIN on tsvector)
CREATE INDEX idx_events_search     ON events     USING GIN (search_vector);
CREATE INDEX idx_timelines_search  ON timelines  USING GIN (search_vector);
CREATE INDEX idx_characters_search ON characters USING GIN (search_vector);
CREATE INDEX idx_stories_search    ON stories    USING GIN (search_vector);

-- Character lookups
CREATE INDEX idx_characters_type    ON characters (character_type);
CREATE INDEX idx_characters_aliases ON characters USING GIN (aliases);

-- Junction table reverse FK lookups
CREATE INDEX idx_event_chars_char       ON event_characters (character_id);
CREATE INDEX idx_event_chars_event      ON event_characters (event_id);
CREATE INDEX idx_char_rels_char         ON character_relationships (character_id);
CREATE INDEX idx_char_rels_related      ON character_relationships (related_character_id);
CREATE INDEX idx_timeline_events_event  ON timeline_events (event_id);

-- Parent self-reference lookups (fractal nesting traversal)
CREATE INDEX idx_events_parent     ON events (parent_event_id);
CREATE INDEX idx_periods_parent    ON periods (parent_period_id);
CREATE INDEX idx_categories_parent ON categories (parent_category_id);
