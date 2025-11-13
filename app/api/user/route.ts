import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  const token = await getToken({ req: req as any });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, email } = token as {
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