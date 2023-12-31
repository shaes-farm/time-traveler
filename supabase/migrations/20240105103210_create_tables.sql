create table periods (
    id bigint primary key generated always as identity,
    slug varchar(100) not null,
    title varchar(2000) not null,
    summary text,
    begin_date varchar(1000) not null,
    end_date varchar(1000) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Turn on security
alter table periods
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to periods"
    on periods
    for select
    to anon
    using (true);

create table timelines (
    id bigint primary key generated always as identity,
    slug varchar(100) not null,
    title varchar(2000) not null,
    summary text,
    scale varchar(2000),
    begin_date varchar(1000) not null,
    end_date varchar(1000) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Turn on security
alter table timelines
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to timelines"
    on timelines
    for select
    to anon
    using (true);

create table historical_events (
    id bigint primary key generated always as identity,
    slug varchar(100) not null,
    title varchar(2000) not null,
    summary text,
    detail text,
    location varchar(2000),
    importance integer not null,
    begin_date varchar(1000) not null,
    end_date varchar(1000) not null,
    timeline_id bigint references timelines (id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Turn on security
alter table historical_events
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to historical_events"
    on historical_events
    for select
    to anon
    using (true);

create table categories (
    id bigint primary key generated always as identity,
    slug varchar(100) not null,
    title varchar(2000) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Turn on security
alter table categories
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to categories"
    on categories
    for select
    to anon
    using (true);

create table media (
    id bigint primary key generated always as identity,
    slug varchar(100) not null,
    alternativeText text,
    caption text,
    url varchar(2000),
    width integer,
    height integer,
    formats text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Turn on security
alter table media
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to media"
    on media
    for select
    to anon
    using (true);

create table event_categories (
    historical_event_id bigint references historical_events,
    category_id bigint references categories,
    primary key (historical_event_id, category_id)
);

-- Turn on security
alter table event_categories
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to event_categories"
    on event_categories
    for select
    to anon
    using (true);

create table event_media (
    historical_event_id bigint references historical_events,
    media_id bigint references media,
    primary key (historical_event_id, media_id)
);

-- Turn on security
alter table event_media
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to event_media"
    on event_media
    for select
    to anon
    using (true);

create table timeline_events (
    timeline_id bigint references timelines,
    historical_event_id bigint references historical_events,
    primary key (timeline_id, historical_event_id)
);

-- Turn on security
alter table timeline_events
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to timeline_events"
    on timeline_events
    for select
    to anon
    using (true);

create table period_timelines (
    period_id bigint references periods,
    timeline_id bigint references timelines,
    primary key (period_id, timeline_id)
);

-- Turn on security
alter table period_timelines
    enable row level security;

-- Allow anonymous access
create policy "Allow anonymous access to period_timelines"
    on period_timelines
    for select
    to anon
    using (true);
