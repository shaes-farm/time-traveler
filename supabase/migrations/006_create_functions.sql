CREATE TYPE historical_event_data AS (
    user_id text,
    slug varchar(100),
    title varchar(2000),
    summary text,
    detail text,
    location varchar(2000),
    importance integer,
    begin_date varchar(1000),
    end_date varchar(1000),
    timeline_slug text,
    media text[]
);

CREATE OR REPLACE FUNCTION create_event(event historical_event_data)
RETURNS BIGINT
AS $$
DECLARE
    event_id BIGINT;
    media_slug TEXT;
    media_id BIGINT;
BEGIN
    INSERT INTO historical_events (user_id, slug, title, summary, detail, location, importance, begin_date, end_date)
        VALUES (event.user_id::uuid, event.slug, event.title, event.summary, event.detail, event.location, event.importance, event.begin_date, event.end_date)
        RETURNING id INTO event_id;

    FOREACH media_slug IN ARRAY event.media
    LOOP
        RAISE NOTICE 'Media Slug: %', media_slug;

        SELECT id INTO STRICT media_id FROM media where slug = media_slug;

        INSERT INTO event_media (user_id, event_id, media_id)
            VALUES (event.user_id::uuid, event_id, media_id);
    END LOOP;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_event(event historical_event_data)
RETURNS BIGINT
AS $$
DECLARE
    event_id BIGINT;
    timeline_id BIGINT;
    media_slug TEXT;
    media_id BIGINT;
BEGIN
    SELECT id INTO STRICT event_id FROM historical_events WHERE slug = event.slug;
    -- SELECT id INTO STRICT timeline_id FROM timelines WHERE slug = event.timeline_slug;

    UPDATE historical_events SET
        user_id = event.user_id::uuid,
        slug = event.slug,
        title = event.title,
        summary = event.summary,
        detail = event.detail,
        location = event.location,
        importance = event.importance,
        begin_date = event.begin_date,
        end_date = event.end_date,
        updated_at = now()
    WHERE user_id = event.user_id::uuid AND slug = event.slug;

    DELETE FROM event_media WHERE user_id = event.user_id::uuid AND historical_event_id = event_id;

    FOREACH media_slug IN ARRAY event.media
    LOOP
        RAISE NOTICE 'Media Slug: %', media_slug;

        SELECT id INTO STRICT media_id FROM media where slug = media_slug;

        INSERT INTO event_media (user_id, historical_event_id, media_id)
            VALUES (event.user_id::uuid, historical_event_id, media_id);
    END LOOP;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_event(event historical_event_data)
RETURNS BIGINT
AS $$
DECLARE
    eid BIGINT;
BEGIN
    SELECT id INTO STRICT eid FROM historical_events WHERE user_id = event.user_id::uuid AND slug = event.slug;

    DELETE FROM event_categories WHERE user_id = event.user_id::uuid AND historical_event_id = eid;
    DELETE FROM event_media WHERE user_id = event.user_id::uuid AND historical_event_id = eid;
    DELETE FROM historical_events WHERE id = eid;

    RETURN eid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION publish_event(user_id TEXT, slug TEXT, published BOOLEAN)
RETURNS BOOLEAN
AS $$
DECLARE
    eid BIGINT;
    isPublished BOOLEAN;
BEGIN
    SELECT id, published INTO STRICT eid, isPublished FROM historical_events WHERE user_id = user_id::uuid AND slug = slug;

    IF published = FALSE AND isPublished = TRUE THEN
        UPDATE historical_events SET
            published = FALSE,
            published_at = NULL;
    ELSIF published = TRUE AND isPublished = FALSE THEN
        UPDATE historical_events SET
            published = TRUE,
            published_at = NOW();
    END IF;

    RETURN isPublished;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE category_data AS (
    user_id text,
    slug varchar(100),
    title varchar(2000),
    historical_events text[]
);

CREATE OR REPLACE FUNCTION create_category(category category_data)
RETURNS BIGINT
AS $$
DECLARE
    event_slug TEXT;
    event_id BIGINT;
    category_id BIGINT;
BEGIN
    INSERT INTO categories (user_id, slug, title)
        VALUES (category.user_id::uuid, category.slug, category.title)
        RETURNING id INTO category_id;

    FOREACH event_slug IN ARRAY category.historical_events
    LOOP
        RAISE NOTICE 'Event Slug: %', event_slug;

        SELECT id INTO STRICT event_id FROM historical_events where slug = event_slug;

        INSERT INTO event_categories (user_id, historical_event_id, category_id)
            VALUES (category.user_id::uuid, event_id, category_id);
    END LOOP;

    RETURN category_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_category(category category_data)
RETURNS BIGINT
AS $$
DECLARE
    cid BIGINT;
    event_slug TEXT;
    event_id BIGINT;
BEGIN
    SELECT id INTO STRICT cid FROM categories WHERE slug = category.slug;

    UPDATE categories SET
        user_id = category.user_id::uuid,
        slug = category.slug,
        title = category.title,
        updated_at = now()
    WHERE user_id = category.user_id::uuid AND slug = category.slug;

    DELETE FROM event_categories WHERE user_id = category.user_id::uuid AND category_id = cid;

    FOREACH event_slug IN ARRAY category.historical_events
    LOOP
        RAISE NOTICE 'Event Slug: %', event_slug;

        SELECT id INTO STRICT event_id FROM historical_events where slug = event_slug;

        INSERT INTO event_categories (user_id, historical_event_id, category_id)
            VALUES (category.user_id::uuid, event_id, cid);
    END LOOP;

    RETURN cid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_category(category category_data)
RETURNS BIGINT
AS $$
DECLARE
    cid BIGINT;
BEGIN
    SELECT id INTO STRICT cid FROM categories WHERE user_id = category.user_id::uuid AND slug = category.slug;

    DELETE FROM event_categories WHERE user_id = category.user_id::uuid AND category_id = cid;
    DELETE FROM categories WHERE id = cid;

    RETURN cid;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE timeline_data AS (
    user_id text,
    slug varchar(100),
    title varchar(2000),
    summary text,
    detail text,
    scale varchar(2000),
    begin_date varchar(1000),
    end_date varchar(1000),
    historical_events text[]
);

CREATE OR REPLACE FUNCTION create_timeline(timeline timeline_data)
RETURNS BIGINT
AS $$
DECLARE
    timeline_id BIGINT;
    event_slug TEXT;
    event_id BIGINT;
BEGIN
    INSERT INTO timelines (user_id, slug, title, summary, detail, scale, begin_date, end_date)
        VALUES (timeline.user_id::uuid, timeline.slug, timeline.title, timeline.summary, timeline.detail, timeline.scale, timeline.begin_date, timeline.end_date)
        RETURNING id INTO timeline_id;

    FOREACH event_slug IN ARRAY timeline.historical_events
    LOOP
        RAISE NOTICE 'Event Slug: %', event_slug;

        SELECT id INTO STRICT event_id FROM historical_events where slug = event_slug;

        INSERT INTO timeline_events (user_id, timeline_id, historical_event_id)
            VALUES (timeline.user_id::uuid, timeline_id, event_id);
    END LOOP;

    RETURN timeline_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_timeline(timeline timeline_data)
RETURNS BIGINT
AS $$
DECLARE
    tid BIGINT;
    event_slug TEXT;
    event_id BIGINT;
BEGIN
    SELECT id INTO STRICT tid FROM timelines WHERE slug = timeline.slug;

    UPDATE timelines SET
        user_id = timeline.user_id::uuid,
        slug = timeline.slug,
        title = timeline.title,
        summary = timeline.summary,
        detail = timeline.detail,
        scale = timeline.scale,
        begin_date = timeline.begin_date,
        end_date = timeline.end_date,
        updated_at = now()
    WHERE user_id = timeline.user_id::uuid AND slug = timeline.slug RETURNING id INTO tid;

    DELETE FROM timeline_events WHERE user_id = timeline.user_id::uuid AND timeline_id = tid;

    FOREACH event_slug IN ARRAY timeline.historical_events
    LOOP
        RAISE NOTICE 'Event Slug: %', event_slug;

        SELECT id INTO STRICT event_id FROM historical_events where slug = event_slug;

        INSERT INTO timeline_events (user_id, timeline_id, historical_event_id)
            VALUES (timeline.user_id::uuid, tid, event_id);
    END LOOP;

    RETURN tid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_timeline(timeline timeline_data)
RETURNS BIGINT
AS $$
DECLARE
    tid BIGINT;
BEGIN
    SELECT id INTO STRICT tid FROM timelines WHERE user_id = timeline.user_id::uuid AND slug = timeline.slug;

    DELETE FROM timeline_events WHERE user_id = timeline.user_id::uuid AND timeline_id = tid;
    DELETE FROM timelines WHERE id = tid;

    RETURN tid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION publish_timeline(user_id TEXT, slug TEXT, published BOOLEAN)
RETURNS BOOLEAN
AS $$
DECLARE
    eid BIGINT;
    isPublished BOOLEAN;
BEGIN
    SELECT id, published INTO STRICT eid, isPublished FROM timelines WHERE user_id = user_id::uuid AND slug = slug;

    IF published = FALSE AND isPublished = TRUE THEN
        UPDATE timelines SET
            published = FALSE,
            published_at = NULL;
    ELSIF published = TRUE AND isPublished = FALSE THEN
        UPDATE timelines SET
            published = TRUE,
            published_at = NOW();
    END IF;

    RETURN isPublished;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE period_data AS (
    user_id text,
    slug varchar(100),
    title varchar(2000),
    summary text,
    detail text,
    begin_date varchar(1000),
    end_date varchar(1000),
    timelines text[]
);

CREATE OR REPLACE FUNCTION create_period(period period_data)
RETURNS BIGINT
AS $$
DECLARE
    period_id BIGINT;
    timeline_slug TEXT;
    timeline_id BIGINT;
BEGIN
    INSERT INTO periods (user_id, slug, title, summary, detail, begin_date, end_date)
        VALUES (period.user_id::uuid, period.slug, period.title, period.summary, period.detail, period.begin_date, period.end_date)
        RETURNING id INTO period_id;

    FOREACH timeline_slug IN ARRAY period.timelines
    LOOP
        RAISE NOTICE 'Timeline Slug: %', timeline_slug;

        SELECT id INTO STRICT timeline_id FROM timelines where slug = timeline_slug;

        INSERT INTO period_timelines (user_id, period_id, timeline_id)
            VALUES (period.user_id::uuid, period_id, timeline_id);
    END LOOP;
    
    RETURN period_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_period(period period_data)
RETURNS BIGINT
AS $$
DECLARE
    pid BIGINT;
    timeline_slug TEXT;
    timeline_id BIGINT;
BEGIN
    SELECT id INTO STRICT pid FROM periods WHERE slug = period.slug;

    UPDATE periods SET
        user_id = period.user_id::uuid,
        slug = period.slug,
        title = period.title,
        summary = period.summary,
        detail = period.detail,
        begin_date = period.begin_date,
        end_date = period.end_date,
        updated_at = now()
    WHERE user_id = period.user_id::uuid AND slug = period.slug RETURNING id INTO pid;

    DELETE FROM period_timelines WHERE user_id = period.user_id::uuid AND period_id = pid;

    FOREACH timeline_slug IN ARRAY period.timelines
    LOOP
        RAISE NOTICE 'Timeline Slug: %', timeline_slug;

        SELECT id INTO STRICT timeline_id FROM timelines where slug = timeline_slug;

        INSERT INTO period_timelines (user_id, period_id, timeline_id)
            VALUES (period.user_id::uuid, pid, timeline_id);
    END LOOP;

    RETURN pid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_period(period period_data)
RETURNS BIGINT
AS $$
DECLARE
    pid BIGINT;
BEGIN
    SELECT id INTO STRICT pid FROM periods WHERE user_id = period.user_id::uuid AND slug = period.slug;

    DELETE FROM period_timelines WHERE user_id = period.user_id::uuid AND period_id = pid;
    DELETE FROM periods WHERE id = pid;

    RETURN pid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION publish_period(user_id TEXT, slug TEXT, published BOOLEAN)
RETURNS BOOLEAN
AS $$
DECLARE
    eid BIGINT;
    isPublished BOOLEAN;
BEGIN
    SELECT id, published INTO STRICT eid, isPublished FROM periods WHERE user_id = user_id::uuid AND slug = slug;

    IF published = FALSE AND isPublished = TRUE THEN
        UPDATE periods SET
            published = FALSE,
            published_at = NULL;
    ELSIF published = TRUE AND isPublished = FALSE THEN
        UPDATE periods SET
            published = TRUE,
            published_at = NOW();
    END IF;

    RETURN isPublished;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE story_data AS (
    user_id text,
    slug varchar(100),
    title varchar(2000),
    sub_title varchar(2000),
    summary text,
    detail text,
    periods text[]
);

CREATE OR REPLACE FUNCTION create_story(story story_data)
RETURNS BIGINT
AS $$
DECLARE
    story_id BIGINT;
    period_slug TEXT;
    period_id BIGINT;
BEGIN
    INSERT INTO stories (user_id, slug, title, sub_title, summary, detail)
        VALUES (story.user_id::uuid, story.slug, story.title, story.sub_title, story.summary, story.detail)
        RETURNING id INTO story_id;

    FOREACH period_slug IN ARRAY story.periods
    LOOP
        RAISE NOTICE 'Period Slug: %', period_slug;

        SELECT id INTO STRICT period_id FROM periods where slug = period_slug;

        INSERT INTO story_periods (user_id, story_id, period_id)
            VALUES (story.user_id::uuid, story_id, period_id);
    END LOOP;

    RETURN story_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_story(story story_data)
RETURNS BIGINT
AS $$
DECLARE
    sid BIGINT;
    period_slug TEXT;
    period_id BIGINT;
BEGIN
    SELECT id INTO STRICT sid FROM stories WHERE slug = story.slug;

    UPDATE stories SET
        user_id = story.user_id::uuid,
        slug = story.slug,
        title = story.title,
        sub_title = story.sub_title,
        summary = story.summary,
        detail = story.detail,
        updated_at = now()
    WHERE user_id = story.user_id::uuid AND slug = story.slug;

    DELETE FROM story_periods WHERE user_id = story.user_id::uuid AND story_id = sid;

    FOREACH period_slug IN ARRAY story.periods
    LOOP
        RAISE NOTICE 'Period Slug: %', period_slug;

        SELECT id INTO STRICT period_id FROM periods where slug = period_slug;

        INSERT INTO story_periods (user_id, story_id, period_id)
            VALUES (story.user_id::uuid, sid, period_id);
    END LOOP;

    RETURN sid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_story(story story_data)
RETURNS BIGINT
AS $$
DECLARE
    sid BIGINT;
BEGIN
    SELECT id INTO STRICT sid FROM stories WHERE user_id = story.user_id::uuid AND slug = story.slug;

    DELETE FROM story_periods WHERE user_id = story.user_id::uuid AND story_id = sid;
    DELETE FROM stories WHERE id = sid;

    RETURN sid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION publish_story(user_id TEXT, slug TEXT, published BOOLEAN)
RETURNS BOOLEAN
AS $$
DECLARE
    eid BIGINT;
    isPublished BOOLEAN;
BEGIN
    SELECT id, published INTO STRICT eid, isPublished FROM stories WHERE user_id = user_id::uuid AND slug = slug;

    IF published = FALSE AND isPublished = TRUE THEN
        UPDATE stories SET
            published = FALSE,
            published_at = NULL;
    ELSIF published = TRUE AND isPublished = FALSE THEN
        UPDATE stories SET
            published = TRUE,
            published_at = NOW();
    END IF;

    RETURN isPublished;
END;
$$ LANGUAGE plpgsql;
