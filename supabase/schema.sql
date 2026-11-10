-- Life Flow Supabase schema
-- Run in Supabase SQL Editor (Project → SQL → New query)

-- Profiles (optional admin flag)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Personal user data (one row per key per user)
create table if not exists public.user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists user_data_user_id_idx on public.user_data(user_id);

-- Shared content (admin-managed: recipes, exercises, overrides…)
create table if not exists public.shared_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.shared_content enable row level security;

-- Profiles: users read/update own row; no one reads others
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- user_data: only owner
drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = user_id);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own" on public.user_data
  for delete using (auth.uid() = user_id);

-- shared_content: everyone authenticated can read; only admins write
drop policy if exists "shared_select_auth" on public.shared_content;
create policy "shared_select_auth" on public.shared_content
  for select to authenticated using (true);

-- Allow anon read of shared content (catalog visible without login if desired)
drop policy if exists "shared_select_anon" on public.shared_content;
create policy "shared_select_anon" on public.shared_content
  for select to anon using (true);

drop policy if exists "shared_write_admin" on public.shared_content;
create policy "shared_write_admin" on public.shared_content
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- Storage buckets (run after creating buckets in UI, or use API)
-- Create buckets: user-images (private or public), shared-images (public)
-- Policies example for public shared-images:

-- insert into storage.buckets (id, name, public) values ('user-images', 'user-images', true)
--   on conflict (id) do nothing;
-- insert into storage.buckets (id, name, public) values ('shared-images', 'shared-images', true)
--   on conflict (id) do nothing;

-- Helper: mark yourself admin (replace email)
-- update public.profiles set is_admin = true where email = 'you@example.com';
