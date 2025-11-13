import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

// 📌 GET – Hae kirjautuneen käyttäjän varaukset
export async function GET(req: Request): Promise<NextResponse> {
  try {
  const token = await getToken({ req: req as any });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const bookings = await prisma.booking.findMany({
      where: { user: { email: token.email as string } },
      include: { ride: true },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 📌 POST – Tee varaus
export async function POST(req: Request): Promise<NextResponse> {
  try {
  const token = await getToken({ req: req as any });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rideId } = await req.json();
    if (!rideId) {
      return NextResponse.json({ error: "Missing rideId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Estä oman kyydin varaaminen
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }
    if (ride.driverId === user.id) {
      return NextResponse.json(
        { error: "Et voi varata omaa kyytiäsi" },
        { status: 400 }
      );
    }

    // Tarkista ettei varaus ole jo olemassa
    const existing = await prisma.booking.findFirst({
      where: { userId: user.id, rideId },
    });
    if (existing) {
      return NextResponse.json({ error: "Already booked" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: { userId: user.id, rideId },
    });

    // Vähennä kyydin vapaita paikkoja
    await prisma.ride.update({
      where: { id: rideId },
      data: { seats: { decrement: 1 } },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}