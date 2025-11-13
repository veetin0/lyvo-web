import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

export async function GET() {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, email } = session.user as {
    id?: string;
    name?: string;
    email?: string;
  };

  return NextResponse.json({
    id: id ?? "unknown",
    name: name ?? "Tuntematon käyttäjä",
    email: email ?? "Ei sähköpostia",
  });
}