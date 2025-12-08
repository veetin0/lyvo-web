import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";
import type { JWT } from "next-auth/jwt";

type AuthToken = (JWT & { id?: string | null; email?: string | null }) | null;

interface BookingWithRideOwner {
  id: string;
  ride_id?: string | null;
  status: string;
  ride?: {
    id: string;
    owner?: string | null;
  } | null;
}

interface RideSeatInfo {
  seats?: number | null;
}

interface BookingWithRideSeats {
  id: string;
  user_email?: string | null;
  status: string;
  ride_id?: string | null;
  ride?: {
    id: string;
    seats?: number | null;
  } | null;
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
    ride,
  };
};

const parseRideSeatInfo = (data: unknown): RideSeatInfo | null => {
  if (!data || typeof data !== "object") {
    return null;
  }
  const record = data as Record<string, unknown>;
  const seats = typeof record.seats === "number" ? record.seats : null;
  return { seats };
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

  let ride: BookingWithRideSeats["ride"] = null;
  const rideRaw = record.ride;
  if (rideRaw && typeof rideRaw === "object") {
    const rideRecord = rideRaw as Record<string, unknown>;
    const nestedRideId = typeof rideRecord.id === "string" ? rideRecord.id : null;
    if (nestedRideId) {
      ride = {
        id: nestedRideId,
        seats: typeof rideRecord.seats === "number" ? rideRecord.seats : null,
      };
    }
  }

  return {
    id,
    user_email: userEmail,
    status,
    ride_id: rideId,
    ride,
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

    // Update booking status
    const newStatus = action === "accept" ? "accepted" : "rejected";
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (action === "reject") {
      if (booking.ride_id) {
        const { data: rideData } = await supabase
          .from("rides")
          .select("seats")
          .eq("id", booking.ride_id)
          .single();

        const ride = parseRideSeatInfo(rideData);

        if (ride && typeof ride.seats === "number") {
          await supabase
            .from("rides")
            .update({ seats: ride.seats + 1 })
            .eq("id", booking.ride_id);
        }
      }
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
        `id, user_email, status, ride_id, ride:ride_id ( id, seats )`
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

    if (booking.ride && typeof booking.ride.seats === "number" && booking.ride_id) {
      await supabase
        .from("rides")
        .update({ seats: booking.ride.seats + 1 })
        .eq("id", booking.ride_id);
    }

    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
