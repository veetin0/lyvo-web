import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AuthToken = (JWT & { id?: string | null; email?: string | null }) | null;

interface UserProfileRow {
  id: string;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  profile_picture_data?: string | null;
}

interface RideRatingRow {
  driver_rating?: number | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedEmail = searchParams.get("email");
    const requestedUserId = searchParams.get("userId");

    const identifierField = requestedEmail ? "email" : "id";
    const identifierValue = requestedEmail ?? requestedUserId ?? token.id ?? token.email;

    if (!identifierValue) {
      return NextResponse.json({ error: "Profile identifier missing" }, { status: 400 });
    }

    const { data: userResult, error: userError } = await supabase
      .from("User")
      .select("id, name, email, bio, profile_picture_data")
      .eq(identifierField, identifierValue)
      .single();

    if (userError) {
      if (userError.code === "PGRST116" || userError.message?.includes("Results contain 0 rows")) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      console.error("Error fetching profile:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

  const userRow = userResult as UserProfileRow;
    let driverRating: number | null = null;
    let driverRatingCount = 0;

    if (userRow?.id) {
      const { data: ratingRows, error: ratingError } = await supabase
        .from("rides")
        .select("driver_rating")
        .eq("owner", userRow.id)
        .not("driver_rating", "is", null);

      if (!ratingError && Array.isArray(ratingRows)) {
        const rated = ratingRows
          .map((row) => (row as RideRatingRow).driver_rating)
          .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);

        if (rated.length > 0) {
          const total = rated.reduce((acc: number, value: number) => acc + value, 0);
          driverRating = Number((total / rated.length).toFixed(1));
          driverRatingCount = rated.length;
        }
      }
    }

    return NextResponse.json({
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      bio: userRow.bio ?? "",
      profilePictureData: userRow.profile_picture_data ?? null,
      driverRating,
      driverRatingCount,
    });
  } catch (error) {
    console.error("Unexpected profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bio, profilePictureData } = (await req.json()) as {
      bio?: string | null;
      profilePictureData?: string | null;
    };

    const updates: Partial<{ bio: string | null; profile_picture_data: string | null }> = {};

    if (typeof bio === "string") {
      const trimmedBio = bio.trim();
      updates.bio = trimmedBio.length > 0 ? trimmedBio : null;
    } else if (bio === null) {
      updates.bio = null;
    }

    if (typeof profilePictureData === "string") {
      updates.profile_picture_data = profilePictureData.length > 0 ? profilePictureData : null;
    } else if (profilePictureData === null) {
      updates.profile_picture_data = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No profile fields provided" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("User")
      .update(updates)
      .eq("id", token.id)
      .select("id")
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
