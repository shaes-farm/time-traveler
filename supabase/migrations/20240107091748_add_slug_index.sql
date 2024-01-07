-- Add indices for slug lookup

create unique index periods_slug_idx on periods (slug);
create unique index timelines_slug_idx on timelines (slug);
create unique index historical_events_slug_idx on historical_events (slug);
create unique index categories_slug_idx on categories (slug);
create unique index media_slug_idx on media (slug);
