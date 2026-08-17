import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";
import type { JWT } from "next-auth/jwt";

import { releaseSeat, SEAT_HOLDING_STATUSES } from "@/lib/seats";
import { notifyBookingEvent } from "@/lib/bookingNotifications";

type AuthToken = (JWT & { id?: string | null; email?: string | null }) | null;

interface BookingWithRideOwner {
  id: string;
  ride_id?: string | null;
  status: string;
  user_email?: string | null;
  ride?: {
    id: string;
    owner?: string | null;
  } | null;
}

interface BookingWithRideSeats {
  id: string;
  user_email?: string | null;
  status: string;
  ride_id?: string | null;
}

interface UpdateBookingBody {
  bookingId?: string;
  action?: "accept" | "reject";
}

const getAuthToken = async (req: NextRequest): Promise<AuthToken> =>
  (await getToken({ req })) as AuthToken;

const parseBookingWithRideOwner = (data: unknown): BookingWithRideOwner | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  const status = typeof record.status === "string" ? record.status : null;

  if (!id || !status) {
    return null;
  }

  const rideId = typeof record.ride_id === "string" ? record.ride_id : null;
  const rideRaw = record.ride;

  let ride: BookingWithRideOwner["ride"] = null;
  if (rideRaw && typeof rideRaw === "object") {
    const rideRecord = rideRaw as Record<string, unknown>;
    const nestedRideId = typeof rideRecord.id === "string" ? rideRecord.id : null;
    if (nestedRideId) {
      ride = {
        id: nestedRideId,
        owner: typeof rideRecord.owner === "string" ? rideRecord.owner : null,
      };
    }
  }

  return {
    id,
    ride_id: rideId,
    status,
    user_email: typeof record.user_email === "string" ? record.user_email : null,
    ride,
  };
};

const parseBookingWithRideSeats = (data: unknown): BookingWithRideSeats | null => {
  if (!data || typeof data !== "object") {
    return null;
  }
  const record = data as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  if (!id) {
    return null;
  }

  const rideId = typeof record.ride_id === "string" ? record.ride_id : null;
  const status = typeof record.status === "string" ? record.status : "";
  const userEmail = typeof record.user_email === "string" ? record.user_email : null;

  return {
    id,
    user_email: userEmail,
    status,
    ride_id: rideId,
  };
};

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = await getAuthToken(req);
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const payload = (await req.json()) as UpdateBookingBody;
  const params = await context.params;
  const bookingId = payload.bookingId ?? params.id;
    const action = payload.action;

    if (!bookingId || !action) {
      return NextResponse.json({ error: "Missing bookingId or action" }, { status: 400 });
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the booking and verify it belongs to a ride owned by the current user
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        ride_id,
        status,
        user_email,
        ride:ride_id (
          id,
          owner
        )
      `)
      .eq("id", bookingId)
      .single();

    const booking = parseBookingWithRideOwner(bookingData);

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify the current user is the ride owner
    const rideData = booking.ride ?? null;
    if (!rideData || rideData.owner !== token.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Transition atomically. Filtering on the current status means a repeated or
    // concurrent call matches zero rows rather than applying the change twice —
    // that double-apply is what previously let one seat be returned repeatedly.
    const newStatus = action === "accept" ? "accepted" : "rejected";
    const allowedFrom = action === "accept" ? ["pending"] : [...SEAT_HOLDING_STATUSES];

    const { data: transitioned, error: updateError } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId)
      .in("status", allowedFrom)
      .select("id");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!Array.isArray(transitioned) || transitioned.length === 0) {
      return NextResponse.json(
        { error: "Booking is no longer awaiting a decision" },
        { status: 409 }
      );
    }

    // Safe to release: the transition above genuinely happened, and it came from
    // a state that was still holding a seat.
    if (action === "reject" && booking.ride_id) {
      await releaseSeat(supabase, booking.ride_id);
    }

    // Sent only because the transition above actually applied, so a repeated
    // decision cannot email the passenger twice.
    if (booking.ride_id) {
      await notifyBookingEvent(supabase, {
        event: action === "accept" ? "accepted" : "rejected",
        rideId: booking.ride_id,
        passengerEmail: booking.user_email,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = await getAuthToken(req);
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { id: bookingId } = await context.params;
    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `id, user_email, status, ride_id`
      )
      .eq("id", bookingId)
      .single();

    const booking = parseBookingWithRideSeats(bookingData);

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.user_email || booking.user_email !== token.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete the row and learn whether it was still holding a seat in a single
    // step. A rejected booking already gave its seat back when it was rejected,
    // so cancelling it afterwards must not hand back a second one.
    const { data: removedHolding, error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .in("status", [...SEAT_HOLDING_STATUSES])
      .select("id");

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (Array.isArray(removedHolding) && removedHolding.length > 0) {
      if (booking.ride_id) {
        await releaseSeat(supabase, booking.ride_id);
      }
      return NextResponse.json({ success: true });
    }

    // Nothing seat-holding matched: the booking was already rejected, or already
    // gone. Remove it without touching the seat count.
    const { error: fallbackError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
