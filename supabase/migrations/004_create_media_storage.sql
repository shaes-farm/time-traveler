insert into storage.buckets
  (id, name, public)
values
  ('media', 'media', true);

create policy "Public Access to Media Library"
  on storage.objects
  for select
  using ( bucket_id = 'media' );

create policy "Any authenticated user can upload media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'media'
  );

create policy "Restrict Modifications to Media Library"
  on storage.objects
  for update
  to authenticated
  using (
    auth.uid() = owner_id::uuid and
    bucket_id = 'media'
  );

create policy "Restrict Deletions from Media Library"
  on storage.objects
  for delete
  to authenticated
  using (
    auth.uid() = owner_id::uuid and
    bucket_id = 'media'
  );
