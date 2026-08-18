-- Applied 2026-08-13 against the live Supabase project.
--
-- Driver ratings were displayed everywhere but never written. The only storage
-- was rides.driver_rating: a single number on the ride, which cannot hold more
-- than one passenger's opinion and offers no way to tell who rated or to stop
-- somebody rating twice. Every driver therefore read 0.0 forever.
--
-- Ratings now live in their own table, one row per booking.

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),

  -- One rating per booking, enforced here rather than in application code so a
  -- double submission cannot slip through a race.
  booking_id uuid not null unique references public.bookings (id) on delete cascade,

  ride_id uuid not null references public.rides (id) on delete cascade,

  -- Denormalised from the ride so the driver's average is a single query with
  -- no join. rides.owner is text, not uuid.
  driver_id text not null,

  rater_email text not null,

  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists ratings_driver_id_idx on public.ratings (driver_id);
create index if not exists ratings_ride_id_idx on public.ratings (ride_id);

-- Deny by default, like every other table: all access goes through API routes
-- on the service role key, which bypasses RLS. No anon policy is wanted.
alter table public.ratings enable row level security;
