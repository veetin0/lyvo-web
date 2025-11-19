import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// 📌 GET – Hae kirjautuneen käyttäjän varaukset
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = await getToken({ req: req as any });
    console.log("Token from request:", token);
    
    if (!token?.email) {
      console.error("No email in token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        created_at,
        ride_id,
        ride:ride_id (
          id,
          from_city,
          to_city,
          departure,
          price_eur,
          driver_name
        )
      `)
      .eq("user_email", token.email);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Bookings found for", token.email, ":", bookings);
    return NextResponse.json(bookings || []);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 📌 POST – Tee varaus
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = await getToken({ req: req as any });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rideId } = await req.json();
    if (!rideId) {
      return NextResponse.json({ error: "Missing rideId" }, { status: 400 });
    }

    console.log("Creating booking for user:", token.email, "ride:", rideId);

    // Check if ride exists
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, owner, seats")
      .eq("id", rideId)
      .single();

    console.log("Ride query result:", { ride, rideError });

    if (rideError || !ride) {
      console.error("Ride not found or error:", rideError);
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    // We don't need to check if user exists since we have valid JWT token
    // The user email is already verified by NextAuth
    const userEmail = token.email;
    const userId = token.id;
    console.log("User email from token:", userEmail, "User ID:", userId);

    if (ride.owner === userId) {
      return NextResponse.json(
        { error: "Et voi varata omaa kyytiäsi" },
        { status: 400 }
      );
    }

    // Check if booking already exists
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_email", token.email)
      .eq("ride_id", rideId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already booked" }, { status: 400 });
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({ user_email: token.email, ride_id: rideId })
      .select();

    if (bookingError) {
      console.error("Booking error details:", bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    console.log("Booking created:", booking);

    // Decrement seats
    const { error: updateError } = await supabase
      .from("rides")
      .update({ seats: ride.seats - 1 })
      .eq("id", rideId);

    if (updateError) {
      console.error("Error updating seats:", updateError);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}