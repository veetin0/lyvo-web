import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    console.log("Request body:", { name, email, password }); // Debug log
    console.log("DATABASE_URL:", process.env.DATABASE_URL); // Debug log to verify environment variable

    if (!email || !password) {
      return NextResponse.json({ error: "Täytä kaikki kentät" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Sähköposti on jo käytössä" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    console.log("User created:", user); // Debug log

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error during registration:", err); // Debug log
    return NextResponse.json({ error: "Rekisteröinti epäonnistui" }, { status: 500 });
  }
}