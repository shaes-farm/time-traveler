-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text not null,
  last_name text not null,
  bio text,
  avatar_url text,
  website text,
  updated_at timestamp with time zone,

  constraint first_name_length check (char_length(first_name) > 1),
  constraint last_name_length check (char_length(last_name) > 1)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.

alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name
  )
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up user profile avatar storage
insert into storage.buckets
  (id, name)
values
  ('avatars', 'Avatars');

-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage#policy-examples for more details.

create policy "Avatar images are publicly accessible."
  on storage.objects
  for select
  using (bucket_id = 'Avatars');

create policy "Any authenticated user can upload an avatar."
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'Avatars');

create policy "Only owning user can update an avatar"
  on storage.objects
  for update
  to authenticated
  using (
    auth.uid() = owner_id::uuid and
    bucket_id = 'Avatars'
  );

create policy "Only owning user can delete an avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    auth.uid() = owner_id::uuid and
    bucket_id = 'Avatars'
  );
