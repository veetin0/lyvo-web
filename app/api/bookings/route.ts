import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

// 📌 GET – Hae kirjautuneen käyttäjän varaukset
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");
    const statusFilter = searchParams.get("status");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = await getToken({ req: req as any });
    console.log("Token from request:", token);

    if (view === "owner") {
      if (!token?.id) {
        console.error("No user id in token for owner view");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const ownerStatus = statusFilter ?? "pending";
      const { data: userRides, error: ridesError } = await supabase
        .from("rides")
        .select("id")
        .eq("owner", token.id);

      if (ridesError) {
        console.error("Error fetching owner rides:", ridesError);
        return NextResponse.json({ error: ridesError.message }, { status: 500 });
      }

      const rideIds = (userRides || []).map((ride: any) => ride.id);
      if (rideIds.length === 0) {
        return NextResponse.json([]);
      }

      const { data: ownerBookings, error: ownerError } = await supabase
        .from("bookings")
        .select(`
          id,
          created_at,
          ride_id,
          status,
          user_email,
          ride:ride_id (
            id,
            from_city,
            to_city,
            departure,
            price_eur,
            driver_name
          )
        `)
        .eq("status", ownerStatus)
        .in("ride_id", rideIds)
        .order("created_at", { ascending: false });

      if (ownerError) {
        console.error("Supabase owner bookings error:", ownerError);
        return NextResponse.json({ error: ownerError.message }, { status: 500 });
      }

      const bookingsList = ownerBookings || [];
      const riderEmails = Array.from(
        new Set(
          bookingsList
            .map((booking: any) => booking?.user_email)
            .filter((email: any): email is string => typeof email === "string" && email.length > 0)
        )
      );

      let riderProfilesByEmail: Record<string, any> = {};

      if (riderEmails.length > 0) {
        const { data: riderProfiles, error: riderError } = await supabase
          .from("User")
          .select("id, name, email, bio, profile_picture_data")
          .in("email", riderEmails);

        if (riderError) {
          console.error("Error fetching rider profiles:", riderError);
        } else if (Array.isArray(riderProfiles)) {
          riderProfilesByEmail = riderProfiles.reduce((acc: Record<string, any>, profile: any) => {
            if (profile?.email) {
              acc[profile.email.toLowerCase()] = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                bio: profile.bio ?? "",
                profilePictureData: profile.profile_picture_data ?? null,
              };
            }
            return acc;
          }, {});

          const riderIds = riderProfiles
            .map((profile: any) => profile?.id)
            .filter((id: any): id is string => typeof id === "string" && id.length > 0);

          if (riderIds.length > 0) {
            const { data: ratingRows, error: ratingError } = await supabase
              .from("rides")
              .select("owner, driver_rating")
              .in("owner", riderIds)
              .not("driver_rating", "is", null);

            if (ratingError) {
              console.error("Error fetching rider ratings:", ratingError);
            } else if (Array.isArray(ratingRows)) {
              const ratingAccumulator = new Map<string, { total: number; count: number }>();

              ratingRows.forEach((row: any) => {
                const ownerId = row?.owner;
                const ratingValue = row?.driver_rating;
                if (typeof ownerId === "string" && typeof ratingValue === "number" && ratingValue > 0) {
                  const current = ratingAccumulator.get(ownerId) ?? { total: 0, count: 0 };
                  ratingAccumulator.set(ownerId, {
                    total: current.total + ratingValue,
                    count: current.count + 1,
                  });
                }
              });

              for (const profile of riderProfiles) {
                const stats = ratingAccumulator.get(profile.id);
                if (stats && stats.count > 0) {
                  const emailKey = profile.email?.toLowerCase();
                  if (emailKey && riderProfilesByEmail[emailKey]) {
                    riderProfilesByEmail[emailKey] = {
                      ...riderProfilesByEmail[emailKey],
                      driverRating: Number((stats.total / stats.count).toFixed(1)),
                      driverRatingCount: stats.count,
                    };
                  }
                }
              }
            }
          }
        }
      }

      const enrichedBookings = bookingsList.map((booking: any) => {
        const emailKey = booking?.user_email?.toLowerCase();
        const riderProfile = emailKey ? riderProfilesByEmail[emailKey] ?? null : null;
        return {
          ...booking,
          rider: riderProfile,
        };
      });

      console.log("Owner pending bookings for", token.id, ":", enrichedBookings);
      return NextResponse.json(enrichedBookings);
    }

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
        status,
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

    if (typeof ride.seats !== "number" || ride.seats <= 0) {
      return NextResponse.json({ error: "Ride is full" }, { status: 400 });
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

    // Create booking with pending status
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({ user_email: token.email, ride_id: rideId, status: "pending" })
      .select();

    if (bookingError) {
      console.error("Booking error details:", bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    console.log("Booking created:", booking);

    // Decrement seats
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ seats: ride.seats - 1 })
      .eq("id", rideId)
      .select("seats")
      .single();

    if (updateError || !updatedRide) {
      console.error("Error updating seats:", updateError);
      const bookingId = Array.isArray(booking) ? booking[0]?.id : (booking as any)?.id;
      if (bookingId) {
        await supabase.from("bookings").delete().eq("id", bookingId);
      }
      return NextResponse.json({ error: "Unable to reserve seat" }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}