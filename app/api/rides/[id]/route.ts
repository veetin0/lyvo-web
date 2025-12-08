import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AuthToken = (JWT & { id?: string | null; email?: string | null }) | null;

type RouteParams = { id: string };
type RouteContext = { params: Promise<RouteParams> };

interface RideOwnerRow {
  id: string;
  owner?: string | null;
  driver_id?: string | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getCurrentUserId = (token: AuthToken): string | null => token?.id ?? token?.email ?? null;

export async function DELETE(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  const token = (await getToken({ req })) as AuthToken;

  const currentUserId = getCurrentUserId(token);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, owner, driver_id")
      .eq("id", id)
      .maybeSingle();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    const typedRide = ride as RideOwnerRow;
    const ownerId = typedRide.owner ?? typedRide.driver_id ?? null;
    if (ownerId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("rides")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Virhe poistettaessa kyytiä:", deleteError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Virhe poistettaessa kyytiä:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}