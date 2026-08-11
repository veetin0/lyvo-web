import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Seat accounting for rides.
 *
 * Seats live in a single counter column, so a plain read-then-write is unsafe:
 * two riders booking the last seat can both read `seats = 1` and both write
 * `seats = 0`, overselling the ride. PostgREST cannot express `seats = seats - 1`
 * directly, so these helpers use compare-and-swap instead — the update carries
 * the value we read as a filter, and matches zero rows if anyone changed the
 * count in between. Losing that race is not an error; we re-read and retry.
 *
 * Callers must only release a seat when a booking genuinely stopped holding one.
 * See the status transitions in app/api/bookings/[id]/route.ts.
 */

const MAX_ATTEMPTS = 5;

/** Booking states that hold a seat. Anything else has already released it. */
export const SEAT_HOLDING_STATUSES = ["pending", "accepted"] as const;

export type SeatAdjustment =
  | { ok: true; seats: number }
  | { ok: false; reason: "not_found" | "sold_out" | "contended" | "error" };

interface RideSeatRow {
  seats: number | null;
}

const adjustSeats = async (
  supabase: SupabaseClient,
  rideId: string,
  delta: 1 | -1
): Promise<SeatAdjustment> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const { data: ride, error } = await supabase
      .from("rides")
      .select("seats")
      .eq("id", rideId)
      .maybeSingle();

    if (error) {
      console.error("Error reading seats:", error);
      return { ok: false, reason: "error" };
    }

    if (!ride) {
      return { ok: false, reason: "not_found" };
    }

    const current = (ride as RideSeatRow).seats;
    if (typeof current !== "number" || !Number.isFinite(current)) {
      return { ok: false, reason: "error" };
    }

    if (delta === -1 && current <= 0) {
      return { ok: false, reason: "sold_out" };
    }

    // Compare-and-swap: `.eq("seats", current)` makes this a no-op if another
    // request changed the count since the read above.
    const { data: updated, error: updateError } = await supabase
      .from("rides")
      .update({ seats: current + delta })
      .eq("id", rideId)
      .eq("seats", current)
      .select("seats");

    if (updateError) {
      console.error("Error updating seats:", updateError);
      return { ok: false, reason: "error" };
    }

    if (Array.isArray(updated) && updated.length > 0) {
      const next = (updated[0] as RideSeatRow).seats;
      return { ok: true, seats: typeof next === "number" ? next : current + delta };
    }

    // Zero rows matched: someone else won. Loop and read the new value.
  }

  return { ok: false, reason: "contended" };
};

/** Take one seat, refusing to go below zero. */
export const reserveSeat = (supabase: SupabaseClient, rideId: string): Promise<SeatAdjustment> =>
  adjustSeats(supabase, rideId, -1);

/** Give one seat back. Only call this when a booking stopped holding one. */
export const releaseSeat = (supabase: SupabaseClient, rideId: string): Promise<SeatAdjustment> =>
  adjustSeats(supabase, rideId, 1);
