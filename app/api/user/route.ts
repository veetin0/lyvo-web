import { NextResponse } from "next/server";
import { auth } from "next-auth";

export async function GET() {
  const session = await auth();

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