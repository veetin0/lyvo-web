import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ puretaan id yhdellä kertaa
  const token = await getToken({ req: req as any });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (token as any).id as string | undefined;

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