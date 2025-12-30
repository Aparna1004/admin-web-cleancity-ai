-- Seed data using existing auth.users by email (no hardcoded UUIDs).
-- Before running this, create three auth users (via UI or Admin API):
--   admin@example.com, worker@example.com, citizen@example.com

with admin_user as (
  select id from auth.users where email = 'admin@example.com' limit 1
), worker_user as (
  select id from auth.users where email = 'worker@example.com' limit 1
), citizen_user as (
  select id from auth.users where email = 'citizen@example.com' limit 1
)
-- USERS
insert into public.users (id, name, email, role, phone)
select id, 'Alice Admin', 'admin@example.com', 'admin'::public.user_role, '+10000000001' from admin_user
union all
select id, 'Wally Worker', 'worker@example.com', 'worker'::public.user_role, '+10000000002' from worker_user
union all
select id, 'Cathy Citizen', 'citizen@example.com', 'citizen'::public.user_role, '+10000000003' from citizen_user
on conflict (id) do nothing;

-- WORKER
insert into public.workers (user_id, active)
select id, true from public.users where email = 'worker@example.com'
on conflict (user_id) do nothing;

-- REPORTS by citizen
insert into public.reports (user_id, image_url, latitude, longitude, address, severity, status)
select u.id, null, 12.9716, 77.5946, 'MG Road, Bengaluru', 'medium'::public.report_severity, 'pending'::public.report_status
from public.users u where u.email = 'citizen@example.com'
union all
select u.id, null, 12.9352, 77.6245, 'Koramangala, Bengaluru', 'high'::public.report_severity, 'pending'::public.report_status
from public.users u where u.email = 'citizen@example.com';

-- ROUTE assigned to worker
insert into public.routes (name, worker_id, date, status)
select
  'Bengaluru Central Route',
  w.id,
  current_date,
  'planned'::public.route_status
from public.workers w
join public.users u on u.id = w.user_id
where u.email = 'worker@example.com'
limit 1;

-- Map the first citizen report to the route
insert into public.route_reports (route_id, report_id)
select r.id, rep.id
from public.routes r
join public.workers w on w.id = r.worker_id
join public.users wu on wu.id = w.user_id and wu.email = 'worker@example.com'
join public.reports rep on rep.user_id = (select id from public.users where email = 'citizen@example.com' limit 1)
order by rep.created_at asc
limit 1;

-- BIN REQUEST by citizen
insert into public.bin_requests (user_id, latitude, longitude, address, status)
select u.id, 12.9883, 77.5948, 'Church Street, Bengaluru', 'requested'::public.bin_request_status
from public.users u where u.email = 'citizen@example.com';