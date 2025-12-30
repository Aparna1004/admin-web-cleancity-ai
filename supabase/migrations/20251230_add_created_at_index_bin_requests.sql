-- Ensure bin_requests has a created_at column and an index for ordered pagination.
alter table public.bin_requests
add column if not exists created_at timestamptz not null default timezone('utc', now());

create index if not exists bin_requests_created_at_idx
on public.bin_requests (created_at);





