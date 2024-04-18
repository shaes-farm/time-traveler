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
    timeline_id bigint,
    media text[]
);

CREATE OR REPLACE PROCEDURE create_event(data historical_event_data)
AS $$
DECLARE
    event_id BIGINT;
    media_slug TEXT;
    media_id BIGINT;
BEGIN
    INSERT INTO historical_events (user_id, slug, title, summary, detail, location, importance, begin_date, end_date)
        VALUES (data.user_id::uuid, data.slug, data.title, data.summary, data.detail, data.location, data.importance, data.begin_date, data.end_date)
        RETURNING id INTO event_id;

    FOREACH media_slug IN ARRAY data.media
    LOOP
        RAISE NOTICE 'Media Slug: %', media_slug;

        SELECT id INTO STRICT media_id FROM media where slug = media_slug;

        INSERT INTO event_media (user_id, event_id, media_id)
            VALUES (data.user_id::uuid, event_id, media_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE category_data AS (
    user_id text,
    slug varchar(100),
    title varchar(2000),
    historical_events text[]
);

CREATE OR REPLACE PROCEDURE create_category(data category_data)
AS $$
DECLARE
    event_slug TEXT;
    event_id BIGINT;
    category_id BIGINT;
BEGIN
    INSERT INTO categories (user_id, slug, title)
        VALUES (data.user_id::uuid, data.slug, data.title)
        RETURNING id INTO category_id;

    FOREACH event_slug IN ARRAY data.historical_events
    LOOP
        RAISE NOTICE 'Event Slug: %', event_slug;

        SELECT id INTO STRICT event_id FROM historical_events where slug = event_slug;

        INSERT INTO category_events (user_id, category_id, event_id)
            VALUES (data.user_id::uuid, category_id, event_id);
    END LOOP;
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

CREATE OR REPLACE PROCEDURE create_timeline(data timeline_data)
AS $$
DECLARE
    event_slug TEXT;
    event_id BIGINT;
    timeline_id BIGINT;
BEGIN
    INSERT INTO timelines (user_id, slug, title, summary, detail, scale, begin_date, end_date)
        VALUES (data.user_id::uuid, data.slug, data.title, data.summary, data.detail, data.scale, data.begin_date, data.end_date)
        RETURNING id INTO timeline_id;

    FOREACH event_slug IN ARRAY data.historical_events
    LOOP
        RAISE NOTICE 'Event Slug: %', event_slug;

        SELECT id INTO STRICT event_id FROM historical_events where slug = event_slug;

        INSERT INTO timeline_events (user_id, timeline_id, event_id)
            VALUES (data.user_id::uuid, timeline_id, event_id);
    END LOOP;
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

CREATE OR REPLACE PROCEDURE create_period(data period_data)
AS $$
DECLARE
    timeline_slug TEXT;
    timeline_id BIGINT;
    period_id BIGINT;
BEGIN
    INSERT INTO periods (user_id, slug, title, sub_title, summary, detail, begin_date, end_date)
        VALUES (data.user_id::uuid, data.slug, data.title, data.summary, data.detail, data.begin_date, data.end_date)
        RETURNING id INTO period_id;

    FOREACH timeline_slug IN ARRAY data.timelines
    LOOP
        RAISE NOTICE 'Timeline Slug: %', timeline_slug;

        SELECT id INTO STRICT timeline_id FROM timelines where slug = timeline_slug;

        INSERT INTO period_timelines (user_id, period_id, timeline_id)
            VALUES (data.user_id::uuid, period_id, timeline_id);
    END LOOP;
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

CREATE OR REPLACE PROCEDURE create_story(data story_data)
AS $$
DECLARE
    period_slug TEXT;
    period_id BIGINT;
    story_id BIGINT;
BEGIN
    INSERT INTO stories (user_id, slug, title, sub_title, summary, detail)
        VALUES (data.user_id::uuid, data.slug, data.title, data.sub_title, data.summary, data.detail)
        RETURNING id INTO story_id;

    FOREACH period_slug IN ARRAY data.periods
    LOOP
        RAISE NOTICE 'Period Slug: %', period_slug;

        SELECT id INTO STRICT period_id FROM periods where slug = period_slug;

        INSERT INTO story_periods (user_id, story_id, period_id)
            VALUES (data.user_id::uuid, story_id, period_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
