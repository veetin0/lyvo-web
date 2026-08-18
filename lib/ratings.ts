import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Driver ratings.
 *
 * Ratings live one row per booking in `ratings`, so several passengers on the
 * same ride each get a say and nobody can rate twice. A driver's score is the
 * average across every rating their rides received.
 *
 * `driver_id` is denormalised onto the row at write time, so aggregating is a
 * single query with no join back to rides.
 */

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export interface DriverRating {
  average: number;
  count: number;
}

/** Whole numbers 1..5 only; anything else is rejected before it reaches the database. */
export const isValidRating = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= MIN_RATING &&
  value <= MAX_RATING;

/**
 * Average rating per driver, keyed by `rides.owner`.
 *
 * Drivers with no ratings are absent from the map rather than present with a
 * zero — "not yet rated" and "rated badly" must not look the same.
 */
export const getDriverRatings = async (
  supabase: SupabaseClient,
  driverIds: string[]
): Promise<Map<string, DriverRating>> => {
  const wanted = Array.from(new Set(driverIds.filter((id) => typeof id === "string" && id.length > 0)));
  const result = new Map<string, DriverRating>();

  if (wanted.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from("ratings")
    .select("driver_id, rating")
    .in("driver_id", wanted);

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("Error loading driver ratings:", error);
    }
    return result;
  }

  const totals = new Map<string, { total: number; count: number }>();
  for (const row of data) {
    const driverId = (row as { driver_id?: unknown }).driver_id;
    const rating = Number((row as { rating?: unknown }).rating);
    if (typeof driverId !== "string" || !Number.isFinite(rating)) {
      continue;
    }
    const current = totals.get(driverId) ?? { total: 0, count: 0 };
    totals.set(driverId, { total: current.total + rating, count: current.count + 1 });
  }

  for (const [driverId, { total, count }] of totals) {
    if (count > 0) {
      result.set(driverId, {
        average: Number((total / count).toFixed(1)),
        count,
      });
    }
  }

  return result;
};

/** Ratings the given rater has already left, so the UI can hide the prompt. */
export const getRatedBookingIds = async (
  supabase: SupabaseClient,
  raterEmail: string | null | undefined
): Promise<Set<string>> => {
  const email = typeof raterEmail === "string" ? raterEmail.trim().toLowerCase() : "";
  if (!email) {
    return new Set();
  }

  const { data, error } = await supabase
    .from("ratings")
    .select("booking_id")
    .eq("rater_email", email);

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("Error loading rated bookings:", error);
    }
    return new Set();
  }

  return new Set(
    data
      .map((row) => (row as { booking_id?: unknown }).booking_id)
      .filter((id): id is string => typeof id === "string")
  );
};
