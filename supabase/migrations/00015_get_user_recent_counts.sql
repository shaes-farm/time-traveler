-- ============================================================================
-- 00015_get_user_recent_counts.sql
--
-- Dashboard "▴ N new" badge support (issue #41).
--
-- Mirrors the shape of get_user_metrics (00008_database_functions.sql:88).
-- SECURITY DEFINER + search_path='' so it can be called from the dashboard
-- without RLS getting in the way of accurate counts, while keeping the
-- search-path hardening pattern established by #16 and reaffirmed by
-- 00010_function_search_path_hardening.sql.
--
-- Returns per-entity counts for rows created within the last
-- p_window_days (default 7). The dashboard hook previously derived these
-- counts from a truncated recent-activity list (LIMIT 10 per entity),
-- which silently undercounted users with bursts of activity. This RPC
-- gives an honest count instead.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_recent_counts(
  p_user_id UUID,
  p_window_days INTEGER DEFAULT 7
)
RETURNS TABLE(entity_type TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 'events'::text,     COUNT(*) FROM public.events
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_window_days || ' days')::interval
  UNION ALL
  SELECT 'timelines'::text,  COUNT(*) FROM public.timelines
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_window_days || ' days')::interval
  UNION ALL
  SELECT 'characters'::text, COUNT(*) FROM public.characters
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_window_days || ' days')::interval
  UNION ALL
  SELECT 'periods'::text,    COUNT(*) FROM public.periods
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_window_days || ' days')::interval
  UNION ALL
  SELECT 'stories'::text,    COUNT(*) FROM public.stories
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_window_days || ' days')::interval
  UNION ALL
  SELECT 'categories'::text, COUNT(*) FROM public.categories
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_window_days || ' days')::interval
  UNION ALL
  SELECT 'media'::text,      COUNT(*) FROM public.media
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_window_days || ' days')::interval;
$$;
