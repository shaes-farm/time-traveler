create table stories (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users not null,
    slug varchar(100) not null,
    title varchar(2000) not null,
    sub_title varchar(2000),
    summary text,
    detail text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table periods (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users not null,
    slug varchar(100) not null,
    title varchar(2000) not null,
    summary text,
    begin_date varchar(1000) not null,
    end_date varchar(1000) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table timelines (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users not null,
    slug varchar(100) not null,
    title varchar(2000) not null,
    summary text,
    scale varchar(2000),
    begin_date varchar(1000) not null,
    end_date varchar(1000) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table historical_events (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users not null,
    slug varchar(100) not null,
    title varchar(2000) not null,
    summary text,
    detail text,
    location varchar(2000),
    importance integer not null,
    begin_date varchar(1000) not null,
    end_date varchar(1000),
    timeline_id bigint references timelines (id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table categories (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users not null,
    slug varchar(100) not null,
    title varchar(2000) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table media (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users not null,
    slug varchar(100) not null,
    alternativetext text,
    caption text,
    url varchar(2000) not null,
    width integer,
    height integer,
    formats text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table event_categories (
    user_id uuid references auth.users not null,
    historical_event_id bigint references historical_events,
    category_id bigint references categories,
    primary key (historical_event_id, category_id)
);

create table event_media (
    user_id uuid references auth.users not null,
    historical_event_id bigint references historical_events,
    media_id bigint references media,
    primary key (historical_event_id, media_id)
);

create table timeline_events (
    user_id uuid references auth.users not null,
    timeline_id bigint references timelines,
    historical_event_id bigint references historical_events,
    primary key (timeline_id, historical_event_id)
);

create table period_timelines (
    user_id uuid references auth.users not null,
    period_id bigint references periods,
    timeline_id bigint references timelines,
    primary key (period_id, timeline_id)
);

create table story_periods (
    user_id uuid references auth.users not null,
    story_id bigint references stories,
    period_id bigint references periods,
    primary key (story_id, period_id)
);
