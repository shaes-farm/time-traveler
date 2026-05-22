-- ============================================================================
-- 00006_database_views.sql
--
-- Read-only database views for common multi-table query patterns (issue #18).
-- See docs/system-design.md §8.3.
-- ============================================================================

CREATE VIEW character_timeline_view AS
SELECT
  c.id AS character_id,
  c.name AS character_name,
  e.id AS event_id,
  e.title AS event_title,
  e.temporal_data,
  e.sort_order_years,
  ec.role,
  ec.significance,
  t.title AS timeline_title
FROM characters c
JOIN event_characters ec ON c.id = ec.character_id
JOIN events e ON ec.event_id = e.id
LEFT JOIN timelines t ON e.timeline_id = t.id
ORDER BY c.id, e.sort_order_years;

CREATE VIEW character_network_view AS
SELECT
  cr.id AS relationship_id,
  c1.id AS character_id,
  c1.name AS character_name,
  c2.id AS related_id,
  c2.name AS related_name,
  cr.relationship_type,
  cr.start_temporal,
  cr.end_temporal,
  cr.description
FROM character_relationships cr
JOIN characters c1 ON cr.character_id = c1.id
JOIN characters c2 ON cr.related_character_id = c2.id;

CREATE VIEW event_participants_view AS
SELECT
  e.id AS event_id,
  e.title,
  e.sort_order_years,
  COUNT(ec.character_id) AS participant_count,
  COALESCE(
    json_agg(
      json_build_object(
        'id', c.id,
        'name', c.name,
        'type', c.character_type,
        'role', ec.role,
        'significance', ec.significance
      ) ORDER BY ec.significance, c.name
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) AS participants
FROM events e
LEFT JOIN event_characters ec ON e.id = ec.event_id
LEFT JOIN characters c ON ec.character_id = c.id
GROUP BY e.id, e.title, e.sort_order_years;
