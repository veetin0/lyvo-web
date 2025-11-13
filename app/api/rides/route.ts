import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

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
    const session = await auth();
    if (!session?.user?.email) {
      console.error("Käyttäjä ei kirjautunut sisään.");
      return NextResponse.json({ error: "Ei kirjautunut" }, { status: 401 });
    }

    const body = await req.json();
    console.log("POST body:", body);
    console.log("Session user:", session.user);

    const { from, to, date, time, price, seats, car, options, info } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error("Käyttäjää ei löytynyt tietokannasta:", session.user.email);
      return NextResponse.json({ error: "Käyttäjää ei löytynyt" }, { status: 404 });
    }

    const newRide = await prisma.ride.create({
      data: {
        from,
        to,
        date,
        time,
        price: parseFloat(price),
        seats: parseInt(seats) || 1,
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Ei kirjautunut" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Kyydin ID puuttuu" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Käyttäjää ei löytynyt" }, { status: 404 });
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
    });

    if (!ride || ride.driverId !== user.id) {
      return NextResponse.json({ error: "Ei oikeutta poistaa tätä kyytiä" }, { status: 403 });
    }

    await prisma.ride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Virhe kyydin poistossa:", err);
    return NextResponse.json({ error: "Kyydin poistaminen epäonnistui" }, { status: 500 });
  }
}