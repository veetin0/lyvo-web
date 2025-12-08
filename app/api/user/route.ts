import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

type UserToken = JWT & {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

const DEFAULT_USER_RESPONSE = {
  id: "unknown",
  name: "Tuntematon käyttäjä",
  email: "Ei sähköpostia",
};

const normalizeToken = (token: UserToken | null) => ({
  id: token?.id ?? DEFAULT_USER_RESPONSE.id,
  name: token?.name ?? DEFAULT_USER_RESPONSE.name,
  email: token?.email ?? DEFAULT_USER_RESPONSE.email,
});

export async function GET(req: NextRequest) {
  const token = (await getToken({ req })) as UserToken | null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(normalizeToken(token));
}