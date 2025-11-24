import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const TOTAL_MAX_RATE_PER_KM = 0.15;

// --- HAE KYYDIT ---
export async function GET() {
  try {
    const rides: any[] = await prisma.ride.findMany({
      include: { driver: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const parsed = rides.map((r: any) => ({
      ...r,
      options: r.options ? JSON.parse(r.options) : [],
    }));

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Virhe kyytien haussa:", err);
    return NextResponse.json({ error: "Kyytien hakeminen epäonnistui" }, { status: 500 });
  }
}

// --- LISÄÄ KYYTI ---
export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any });
    if (!token?.email) {
      console.error("Käyttäjä ei kirjautunut sisään.");
      return NextResponse.json({ error: "Ei kirjautunut" }, { status: 401 });
    }

    const body = await req.json();
    console.log("POST body:", body);
    console.log("Token user:", token);

    const {
      from,
      to,
      date,
      time,
      price,
      seats,
      car,
      options,
      info,
      distanceMeters,
    } = body;

    const parsedSeats = Number.parseInt(seats, 10) || 1;
    const parsedPrice = Number.parseFloat(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Invalid price provided" }, { status: 400 });
    }
    const parsedDistanceMeters = typeof distanceMeters === "number"
      ? distanceMeters
      : distanceMeters !== undefined
        ? Number(distanceMeters)
        : null;

    if (parsedDistanceMeters !== null && Number.isFinite(parsedDistanceMeters) && parsedDistanceMeters > 0) {
      const distanceKm = parsedDistanceMeters / 1000;
      const priceLimit = (distanceKm * TOTAL_MAX_RATE_PER_KM) / Math.max(parsedSeats, 1);
      if (Number.isFinite(priceLimit) && priceLimit >= 0 && parsedPrice > priceLimit + 1e-2) {
        return NextResponse.json(
          {
            error: "Price exceeds the allowed ceiling",
            maxPricePerPassenger: Number(priceLimit.toFixed(2)),
          },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      console.error("Käyttäjää ei löytynyt tietokannasta:", token.email);
      return NextResponse.json({ error: "Käyttäjää ei löytynyt" }, { status: 404 });
    }

    const newRide = await prisma.ride.create({
      data: {
        from,
        to,
        date,
        time,
  price: parsedPrice,
  seats: parsedSeats,
        car: car || "Tuntematon",
        options: JSON.stringify(options || []),
        info: info || "",
        driverId: user.id,
      },
    });

    console.log("Uusi kyyti tallennettu:", newRide);

    return NextResponse.json({ success: true, ride: newRide });
  } catch (err) {
    console.error("Virhe kyydin lisäyksessä:", err);
    return NextResponse.json({ error: "Kyydin lisääminen epäonnistui" }, { status: 500 });
  }
}

// --- POISTA KYYTI ---
export async function DELETE(req: Request) {
  try {
    const token = await getToken({ req: req as any });
    if (!token?.email) {
      return NextResponse.json({ error: "Ei kirjautunut" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Kyydin ID puuttuu" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the ride to check ownership
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, owner")
      .eq("id", id)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Kyytiä ei löytynyt" }, { status: 404 });
    }

    // Check if user is the owner (use token.id since that's the user ID)
    if (ride.owner !== token.id) {
      return NextResponse.json({ error: "Ei oikeutta poistaa tätä kyytiä" }, { status: 403 });
    }

    // Delete the ride
    const { error: deleteError } = await supabase
      .from("rides")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Virhe kyydin poistossa:", deleteError);
      return NextResponse.json({ error: "Kyydin poistaminen epäonnistui" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Virhe kyydin poistossa:", err);
    return NextResponse.json({ error: "Kyydin poistaminen epäonnistui" }, { status: 500 });
  }
}