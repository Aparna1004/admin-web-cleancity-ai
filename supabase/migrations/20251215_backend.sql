-- =====================================================
-- CleanCity Database Schema (Supabase / PostgreSQL)
-- =====================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
DO $$
BEGIN
  IF NOT EXISTS (select 1 from pg_type where typname = 'user_role') THEN
    create type user_role as enum ('citizen', 'worker', 'admin');
  END IF;

  IF NOT EXISTS (select 1 from pg_type where typname = 'report_severity') THEN
    create type report_severity as enum ('low', 'medium', 'high');
  END IF;

  IF NOT EXISTS (select 1 from pg_type where typname = 'report_status') THEN
    create type report_status as enum ('pending', 'assigned', 'cleaned');
  END IF;

  IF NOT EXISTS (select 1 from pg_type where typname = 'route_status') THEN
    create type route_status as enum ('planned', 'in_progress', 'completed');
  END IF;

  IF NOT EXISTS (select 1 from pg_type where typname = 'bin_request_status') THEN
    create type bin_request_status as enum ('requested', 'approved', 'installed');
  END IF;
END$$;

-- =====================================================
-- TABLES
-- =====================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  role user_role not null default 'citizen',
  created_at timestamptz not null default now()
);

-- ---------- WORKERS ----------
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists workers_user_unique on public.workers(user_id);

-- ---------- REPORTS ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  image_url text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  severity report_severity not null default 'medium',
  status report_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists reports_user_idx on public.reports(user_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_created_idx on public.reports(created_at desc);

-- ---------- ROUTES ----------
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  worker_id uuid references public.workers(id) on delete set null,
  date date not null,
  status route_status not null default 'planned',
  created_at timestamptz not null default now()
);

create index if not exists routes_worker_idx on public.routes(worker_id);
create index if not exists routes_date_idx on public.routes(date desc);

-- ---------- ROUTE_REPORTS (JUNCTION) ----------
create table if not exists public.route_reports (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  unique (route_id, report_id)
);

create index if not exists route_reports_route_idx on public.route_reports(route_id);
create index if not exists route_reports_report_idx on public.route_reports(report_id);

-- ---------- BIN REQUESTS ----------
create table if not exists public.bin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  address text not null,
  status bin_request_status not null default 'requested',
  created_at timestamptz not null default now()
);

create index if not exists bin_requests_user_idx on public.bin_requests(user_id);
create index if not exists bin_requests_status_idx on public.bin_requests(status);
create index if not exists bin_requests_created_idx on public.bin_requests(created_at desc);

-- ---------- AUDIT LOGS ----------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_admin_idx on public.audit_logs(admin_id);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

-- =====================================================
-- AUTO PROFILE CREATION ON SIGNUP
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
