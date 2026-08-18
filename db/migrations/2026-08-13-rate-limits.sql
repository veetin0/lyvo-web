-- Applied 2026-08-13 against the live Supabase project.
--
-- Login and registration were unauthenticated, unthrottled, public endpoints:
-- nothing stopped an attacker trying passwords or enumerating addresses as fast
-- as the network allowed.
--
-- The counter lives in Postgres rather than in process memory because Vercel
-- runs each request on whichever instance is warm. An in-memory limiter would
-- be per-instance and trivially bypassed by concurrency, while giving the
-- comforting appearance of a limit.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

-- Lets stale windows be swept periodically; nothing depends on it yet.
create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;

-- Counting and deciding happen in one statement so two concurrent attempts
-- cannot both read the same count and both be allowed through.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
as $$
declare
  v_count integer;
  v_start timestamptz;
begin
  insert into public.rate_limits as rl (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end
  returning rl.count, rl.window_start into v_count, v_start;

  return query
  select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    greatest(
      ceil(extract(epoch from (v_start + make_interval(secs => p_window_seconds)) - now()))::integer,
      0
    );
end;
$$;
