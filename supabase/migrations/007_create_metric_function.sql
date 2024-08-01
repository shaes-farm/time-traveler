CREATE TYPE user_data AS (
    id UUID
);

CREATE TYPE metrics AS (
    story_count BIGINT,
    period_count BIGINT,
    timeline_count BIGINT,
    event_count BIGINT,
    category_count BIGINT,
    media_count BIGINT
);

CREATE OR REPLACE FUNCTION get_metrics(u user_data)
RETURNS metrics
AS $$
DECLARE
    story_count BIGINT;
    period_count BIGINT;
    timeline_count BIGINT;
    event_count BIGINT;
    category_count BIGINT;
    media_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO STRICT story_count FROM stories WHERE user_id = u.id;
    SELECT COUNT(*) INTO STRICT period_count FROM periods WHERE user_id = u.id;
    SELECT COUNT(*) INTO STRICT timeline_count FROM timelines WHERE user_id = u.id;
    SELECT COUNT(*) INTO STRICT event_count FROM historical_events WHERE user_id = u.id;
    SELECT COUNT(*) INTO STRICT category_count FROM categories WHERE user_id = u.id;
    SELECT COUNT(*) INTO STRICT media_count FROM media WHERE user_id = u.id;

    RETURN ROW(story_count, period_count, timeline_count, event_count, category_count, media_count);
END;
$$ LANGUAGE plpgsql;
