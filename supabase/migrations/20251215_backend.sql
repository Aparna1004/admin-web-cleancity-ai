-- =========================
-- CleanCity Database Setup
-- =========================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
create type if not exists public.user_role as enum ('citizen', 'worker', 'admin');
create type if not exists public.report_severity as enum ('low', 'medium', 'high');
create type if not exists public.report_status as enum ('pending', 'assigned', 'cleaned');
create type if not exists public.bin_request_status as enum ('requested', 'approved', 'installed');

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  role public.user_role not null default 'citizen',
  created_at timestamptz default now()
);

-- ---------- REPORTS ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  description text not null,
  image_url text,
  latitude double precision not null,
  longitude double precision not null,
  severity public.report_severity default 'medium',
  status public.report_status default 'pending',
  created_at timestamptz default now()
);

alter table public.reports
add constraint reports_user_id_fkey
foreign key (user_id)
references public.profiles(id)
on delete cascade;

-- ---------- BIN REQUESTS ----------
create table if not exists public.bin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  status public.bin_request_status default 'requested',
  created_at timestamptz default now()
);

alter table public.bin_requests
add constraint bin_requests_user_id_fkey
foreign key (user_id)
references public.profiles(id)
on delete cascade;

-- ---------- ENABLE RLS ----------
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.bin_requests enable row level security;

-- =========================
-- RLS POLICIES
-- =========================

-- ---------- PROFILES ----------
create policy profiles_read_self
on public.profiles
for select
using (id = auth.uid());

create policy profiles_update_self
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_admin_all
on public.profiles
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

-- ---------- REPORTS ----------
create policy reports_insert_self
on public.reports
for insert
with check (true);

create policy reports_read_own
on public.reports
for select
using (user_id = auth.uid());

create policy reports_admin_all
on public.reports
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

-- ---------- BIN REQUESTS ----------
create policy bin_requests_insert_self
on public.bin_requests
for insert
with check (true);

create policy bin_requests_read_own
on public.bin_requests
for select
using (user_id = auth.uid());

create policy bin_requests_admin_all
on public.bin_requests
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

-- =========================
-- PROFILE AUTO-CREATION
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- =========================
-- BACKFILL OLD USERS (RUN ONCE)
-- =========================
insert into public.profiles (id, email, name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', u.email)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
