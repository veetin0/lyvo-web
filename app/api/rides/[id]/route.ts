import { NextResponse } from "next/server";
import { auth } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ puretaan id yhdellä kertaa
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  if (!userId) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id } });

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    const ownerId = (ride as any).owner || (ride as any).driverId;

    if (ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.ride.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Virhe poistettaessa kyytiä:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}