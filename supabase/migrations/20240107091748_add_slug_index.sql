-- Add indices for slug lookup

create unique index periods_slug_idx on periods (user_id, slug);
create unique index timelines_slug_idx on timelines (user_id, slug);
create unique index historical_events_slug_idx on historical_events (user_id, slug);
create unique index categories_slug_idx on categories (user_id, slug);
create unique index media_slug_idx on media (user_id, slug);
