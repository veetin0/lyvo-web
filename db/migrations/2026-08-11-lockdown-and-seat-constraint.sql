-- Applied 2026-08-11 against the live Supabase project.
--
-- This project has no migration tooling: prisma/ is stale and unused, and the
-- schema had already drifted from the code (a `rides.info` column referenced in
-- queries never existed). Recording applied SQL here so the database state is
-- reproducible and reviewable.

-- ---------------------------------------------------------------------------
-- 1. Row level security: deny by default.
-- ---------------------------------------------------------------------------
-- Authentication is NextAuth, not Supabase Auth, so auth.uid() is always NULL
-- and no policy can identify the caller. Every policy that referenced it was
-- dead; the only ones with effect granted blanket public access, which made the
-- anon key -- shipped in the public JS bundle -- a read/write API for the
-- rides table. All application access now goes through API routes on the
-- service role key, which bypasses RLS, so no anon policy is needed.

alter table public.messages enable row level security;
alter table public.conversations enable row level security;

drop policy if exists "insert_all_rides" on public.rides;
drop policy if exists "read_all_rides" on public.rides;
drop policy if exists "read_own_rides" on public.rides;
drop policy if exists "update_own_rides" on public.rides;
drop policy if exists "delete_own_rides" on public.rides;

-- These never granted anything: they filter on auth.uid() = user_id, but the
-- table stores user_email and auth.uid() is always NULL here.
drop policy if exists "read_own_bookings" on public.bookings;
drop policy if exists "insert_own_bookings" on public.bookings;
drop policy if exists "delete_own_booking" on public.bookings;

-- ---------------------------------------------------------------------------
-- 2. Allow a ride to sell out.
-- ---------------------------------------------------------------------------
-- `seats` means seats still available: it is decremented on booking and
-- incremented when a booking is rejected or cancelled. The old constraint
-- required seats > 0, so the count could never reach zero -- the last seat of
-- any ride was unbookable, and a ride posted with one seat could never be
-- booked at all. Negative values stay forbidden.

alter table public.rides
  drop constraint rides_seats_check,
  add constraint rides_seats_check check (seats >= 0);

-- ---------------------------------------------------------------------------
-- 3. Data: remove one ride left behind by the Prisma era.
-- ---------------------------------------------------------------------------
-- Its owner was a Prisma cuid matching no User row, so nobody could manage or
-- delete it through the app, yet it still appeared in the public ride list.
-- Departure had passed nine months earlier and it had no bookings. Deleted on
-- the owner's instruction. Every remaining rides.owner resolves to a User row.

delete from public.rides where owner = 'cmgv4ai2s0000p45kn6u8an26';
