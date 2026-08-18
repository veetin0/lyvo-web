import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";

import { isValidRating } from "@/lib/ratings";

type AuthToken = (JWT & { id?: string | null; email?: string | null }) | null;

interface RatingBody {
  bookingId?: string;
  rating?: number;
}

/**
 * A passenger rates the driver of a ride they actually travelled on.
 *
 * Every condition is checked server-side: the booking must belong to the caller,
 * it must have been accepted, and the ride must already have departed. Rating a
 * ride that has not happened yet, or one you were never accepted onto, is not a
 * UI concern.
 *
 * One rating per booking is enforced by a unique constraint, so two concurrent
 * submissions cannot both land.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RatingBody;
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : null;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    if (!isValidRating(body.rating)) {
      return NextResponse.json({ error: "Rating must be a whole number from 1 to 5" }, { status: 400 });
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_email, status, ride_id, ride:ride_id ( id, owner, departure )")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !bookingData) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingData as unknown as {
      id: string;
      user_email?: string | null;
      status?: string | null;
      ride_id?: string | null;
      ride?: { id?: string; owner?: string | null; departure?: string | null } | null;
    };

    if (
      !booking.user_email ||
      booking.user_email.toLowerCase() !== token.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (booking.status !== "accepted") {
      return NextResponse.json(
        { error: "Only an accepted booking can be rated" },
        { status: 409 }
      );
    }

    const ride = booking.ride ?? null;
    const departure = ride?.departure ? new Date(ride.departure) : null;

    if (!ride?.owner || !departure || Number.isNaN(departure.getTime())) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    if (departure.getTime() > Date.now()) {
      return NextResponse.json(
        { error: "The ride has not departed yet" },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabase.from("ratings").insert({
      booking_id: booking.id,
      ride_id: ride.id ?? booking.ride_id,
      driver_id: ride.owner,
      rater_email: token.email.toLowerCase(),
      rating: body.rating,
    });

    if (insertError) {
      // 23505 is the unique violation on booking_id: already rated.
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "This ride has already been rated" }, { status: 409 });
      }
      console.error("Error saving rating:", insertError);
      return NextResponse.json({ error: "Could not save rating" }, { status: 500 });
    }

    return NextResponse.json({ success: true, rating: body.rating });
  } catch (error) {
    console.error("Error creating rating:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
