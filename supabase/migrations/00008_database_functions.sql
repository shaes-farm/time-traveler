-- ============================================================================
-- 00008_database_functions.sql
--
-- Read-only database functions exposed via supabase.rpc() (issue #20).
-- See docs/system-design.md §5.4.
--
-- All four functions are LANGUAGE sql STABLE — inlineable by the optimizer.
-- Three run with the caller's privileges (RLS on base tables applies);
-- get_user_metrics is SECURITY DEFINER for arbitrary-user lookup, with
-- search_path='' hardening (matches the is_admin pattern from #16).
-- ============================================================================

-- Temporal range query (uses computed sort column)
CREATE OR REPLACE FUNCTION public.events_in_temporal_range(
  p_start_years BIGINT,
  p_end_years BIGINT,
  p_timeline_id UUID DEFAULT NULL
) RETURNS SETOF public.events
LANGUAGE sql STABLE
AS $$
  SELECT * FROM public.events
  WHERE sort_order_years >= p_start_years
    AND sort_order_years <= p_end_years
    AND (p_timeline_id IS NULL OR timeline_id = p_timeline_id)
  ORDER BY sort_order_years;
$$;

-- Recursive character relationship network (depth-bounded)
CREATE OR REPLACE FUNCTION public.character_network(
  p_character_id UUID,
  p_depth INT DEFAULT 2
) RETURNS TABLE(
  source_id UUID,
  target_id UUID,
  rel_type TEXT,
  source_name TEXT,
  target_name TEXT,
  depth INT
)
LANGUAGE sql STABLE
AS $$
  WITH RECURSIVE network AS (
    SELECT cr.character_id,
           cr.related_character_id,
           cr.relationship_type,
           1 AS depth
    FROM public.character_relationships cr
    WHERE cr.character_id = p_character_id
    UNION ALL
    SELECT cr.character_id,
           cr.related_character_id,
           cr.relationship_type,
           n.depth + 1
    FROM public.character_relationships cr
    JOIN network n ON cr.character_id = n.related_character_id
    WHERE n.depth < p_depth
  )
  SELECT n.character_id,
         n.related_character_id,
         n.relationship_type::text,
         c1.name::text,
         c2.name::text,
         n.depth
  FROM network n
  JOIN public.characters c1 ON n.character_id = c1.id
  JOIN public.characters c2 ON n.related_character_id = c2.id;
$$;

-- Events where ALL specified characters participated
CREATE OR REPLACE FUNCTION public.events_shared_by_characters(
  p_character_ids UUID[]
) RETURNS SETOF public.events
LANGUAGE sql STABLE
AS $$
  SELECT e.* FROM public.events e
  WHERE (
    SELECT COUNT(DISTINCT ec.character_id)
    FROM public.event_characters ec
    WHERE ec.event_id = e.id
      AND ec.character_id = ANY(p_character_ids)
  ) = array_length(p_character_ids, 1)
  ORDER BY e.sort_order_years;
$$;

-- User metrics dashboard. SECURITY DEFINER so any caller (e.g. a public
-- profile page) can request counts for any user; bypasses RLS to keep counts
-- accurate. search_path='' + fully-qualified refs prevent search-path attacks.
CREATE OR REPLACE FUNCTION public.get_user_metrics(p_user_id UUID)
RETURNS TABLE(entity_type TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 'events'::text,     COUNT(*) FROM public.events     WHERE user_id = p_user_id
  UNION ALL
  SELECT 'timelines'::text,  COUNT(*) FROM public.timelines  WHERE user_id = p_user_id
  UNION ALL
  SELECT 'periods'::text,    COUNT(*) FROM public.periods    WHERE user_id = p_user_id
  UNION ALL
  SELECT 'stories'::text,    COUNT(*) FROM public.stories    WHERE user_id = p_user_id
  UNION ALL
  SELECT 'characters'::text, COUNT(*) FROM public.characters WHERE user_id = p_user_id
  UNION ALL
  SELECT 'categories'::text, COUNT(*) FROM public.categories WHERE user_id = p_user_id
  UNION ALL
  SELECT 'media'::text,      COUNT(*) FROM public.media      WHERE user_id = p_user_id;
$$;
