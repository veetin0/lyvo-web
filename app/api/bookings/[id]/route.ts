import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

export async function PUT(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = await getToken({ req: req as any });
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId: bodyBookingId, action } = await req.json();
    const bookingId = bodyBookingId ?? params.id;

    if (!bookingId || !action) {
      return NextResponse.json({ error: "Missing bookingId or action" }, { status: 400 });
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the booking and verify it belongs to a ride owned by the current user
    const { data: booking, error: bookingError } = await supabase
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

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify the current user is the ride owner
    const rideData = (booking as any).ride;
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
      const { data: ride } = await supabase
        .from("rides")
        .select("seats")
        .eq("id", (booking as any).ride_id)
        .single();

      if (ride && typeof ride.seats === "number") {
        await supabase
          .from("rides")
          .update({ seats: ride.seats + 1 })
          .eq("id", (booking as any).ride_id);
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = await getToken({ req: req as any });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `id, user_email, status, ride_id, ride:ride_id ( id, seats )`
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_email !== token.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const rideData = (booking as any).ride;
    if (rideData && typeof rideData.seats === "number") {
      await supabase
        .from("rides")
        .update({ seats: rideData.seats + 1 })
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
