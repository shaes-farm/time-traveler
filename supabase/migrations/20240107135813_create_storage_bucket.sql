insert into storage.buckets
  (id, name, public)
values
  ('media', 'Media Library', true);

create policy "Public Access to Media Library"
  on storage.objects for select
  using ( bucket_id = 'public' );

create policy "Restrict Insert Into Media Library"
    on storage.objects
    for insert with check (
        true
    );

create policy "Restrict Modifications to Media Library"
    on storage.objects
    for insert to authenticated with check (
        bucket_id = 'media'
    );
