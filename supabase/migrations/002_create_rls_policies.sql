-- Turn on security for stories
alter table stories
    enable row level security;

create policy "Allow anonymous access to stories"
    on stories
    for select
    to anon
    using (true);

create policy "Allow unrestricted authenticated access to stories"
    on stories
    for select
    to authenticated
    using (true);

create policy "Authenticated users can create stories"
    on stories
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Authenticated users can update their own stories"
    on stories
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own stories"
    on stories
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- Turn on security for periods
alter table periods
    enable row level security;

create policy "Allow anonymous access to periods"
    on periods
    for select
    to anon
    using (true);

create policy "Allow unrestricted authenticated access to periods"
    on periods
    for select
    to authenticated
    using (true);

create policy "Authenticated users can create periods"
    on periods
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Authenticated users can update their own periods"
    on periods
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own periods"
    on periods
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- Turn on security for timelines
alter table timelines
    enable row level security;

create policy "Allow anonymous access to timelines"
    on timelines
    for select
    to anon
    using (true);

create policy "Allow unrestricted authenticated access to timelines"
    on timelines
    for select
    to authenticated
    using (true);

create policy "Authenticated users can create timelines"
    on timelines
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Authenticated users can update their own timelines"
    on timelines
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own timelines"
    on timelines
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- Turn on security for historical events
alter table historical_events
    enable row level security;

create policy "Allow anonymous access to historical_events"
    on historical_events
    for select
    to anon
    using (true);

create policy "Allow unrestricted authenticated access to historical_events"
    on historical_events
    for select
    to authenticated
    using (true);

create policy "Authenticated users can create historical_events"
    on historical_events
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Authenticated users can update their own historical_events"
    on historical_events
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own historical_events"
    on historical_events
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- Turn on security categories
alter table categories
    enable row level security;

create policy "Allow anonymous access to categories"
    on categories
    for select
    to anon
    using (true);

create policy "Allow unrestricted authenticated access to categories"
    on categories
    for select
    to authenticated
    using (true);

create policy "Authenticated users can create categories"
    on categories
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Authenticated users can update their own categories"
    on categories
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own categories"
    on categories
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- Turn on security for media
alter table media
    enable row level security;

create policy "Allow anonymous access to media"
    on media
    for select
    to anon
    using (true);

create policy "Allow unrestricted authenticated access to media"
    on media
    for select
    to authenticated
    using (true);

create policy "Authenticated users can create media"
    on media
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Authenticated users can update their own media"
    on media
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own media"
    on media
    for delete
    to authenticated
    using ( (select auth.uid()) = user_id );

-- Turn on security for event categories
alter table event_categories
    enable row level security;

create policy "Allow anonymous access to event_categories"
    on event_categories
    for select
    to anon
    using (true);

-- Turn on security for event media
alter table event_media
    enable row level security;

create policy "Allow anonymous access to event_media"
    on event_media
    for select
    to anon
    using (true);

-- Turn on security for timeline events
alter table timeline_events
    enable row level security;

create policy "Allow anonymous access to timeline_events"
    on timeline_events
    for select
    to anon
    using (true);

-- Turn on security for period timelines
alter table period_timelines
    enable row level security;

create policy "Allow anonymous access to period_timelines"
    on period_timelines
    for select
    to anon
    using (true);

-- Turn on security for story periods
alter table story_periods
    enable row level security;

create policy "Allow anonymous access to story_periods"
    on story_periods
    for select
    to anon
    using (true);

create policy "Allow unrestricted authenticated access to story_periods"
    on story_periods
    for select
    to authenticated
    using (true);

create policy "Authenticated users can create story_periods"
    on story_periods
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Authenticated users can update their own story_periods"
    on story_periods
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own story_periods"
    on story_periods
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);
