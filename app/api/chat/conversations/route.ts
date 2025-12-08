import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AuthToken = (JWT & { id?: string | null; email?: string | null }) | null;

interface ConversationRow {
  id: string;
  ride_id: string | null;
  participant_a: string;
  participant_b: string;
  created_at: string;
  updated_at: string;
}

interface PartnerProfileRow {
  id: string;
  name?: string | null;
  email?: string | null;
  profile_picture_data?: string | null;
}

interface RideSummaryRow {
  id: string;
  from_city?: string | null;
  to_city?: string | null;
  departure?: string | null;
  price_eur?: number | null;
  owner?: string | null;
}

type PartnerProfileMap = Record<string, PartnerProfileRow>;
type RideSummaryMap = Record<string, RideSummaryRow>;

const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(...args);
  }
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getCurrentUserId = (token: AuthToken): string | null =>
  token?.id ?? token?.email ?? null;

const buildPartnerMap = async (userIds: string[]): Promise<PartnerProfileMap> => {
  if (userIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("User")
    .select("id, name, email, profile_picture_data")
    .in("id", userIds);

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("Error loading user profiles for chat:", error);
    }
    return {};
  }

  return data.reduce<PartnerProfileMap>((acc, profile) => {
    if (profile && typeof profile.id === "string" && profile.id.length > 0) {
      acc[profile.id] = profile;
    }
    return acc;
  }, {});
};

const buildRideMap = async (rideIds: string[]): Promise<RideSummaryMap> => {
  if (rideIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("rides")
    .select("id, from_city, to_city, departure, price_eur, owner")
    .in("id", rideIds);

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("Error loading rides for chat:", error);
    }
    return {};
  }

  return data.reduce<RideSummaryMap>((acc, ride) => {
    if (ride && typeof ride.id === "string" && ride.id.length > 0) {
      acc[ride.id] = ride;
    }
    return acc;
  }, {});
};

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    const currentUserId = getCurrentUserId(token);

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("id, ride_id, participant_a, participant_b, created_at, updated_at")
      .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json([]);
    }

    const partnerIds = new Set<string>();
    const rideIds = new Set<string>();

    const typedConversations: ConversationRow[] = Array.isArray(conversations)
      ? (conversations as ConversationRow[])
      : [];

    typedConversations.forEach((conversation) => {
      if (!conversation) {
        return;
      }
      const { participant_a: participantA, participant_b: participantB, ride_id: rideId } = conversation;
      const partnerId = participantA === currentUserId ? participantB : participantA;
      if (partnerId) {
        partnerIds.add(partnerId);
      }
      if (rideId) {
        rideIds.add(rideId);
      }
    });

    const partnerMap = await buildPartnerMap(Array.from(partnerIds));
    const rideMap = await buildRideMap(Array.from(rideIds));

    const payload = typedConversations.map((conversation) => {
      const partnerId = conversation.participant_a === currentUserId
        ? conversation.participant_b
        : conversation.participant_a;

      const partnerProfile = partnerId ? partnerMap[partnerId] ?? null : null;

      return {
        id: conversation.id,
        rideId: conversation.ride_id ?? null,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        partner: partnerProfile
          ? {
              id: partnerProfile.id,
              name: partnerProfile.name ?? "",
              email: partnerProfile.email ?? null,
              profilePictureData: partnerProfile.profile_picture_data ?? null,
            }
          : partnerId
          ? {
              id: partnerId,
              name: "",
              email: null,
              profilePictureData: null,
            }
          : null,
        ride: conversation.ride_id ? rideMap[conversation.ride_id] ?? null : null,
      };
    });

    debugLog("Conversations fetched for", currentUserId, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Unexpected conversation fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    const currentUserId = getCurrentUserId(token);

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, rideId } = (await req.json()) as {
      targetUserId?: string;
      rideId?: string | null;
    };

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });
    }

    const [participantA, participantB] = [currentUserId, targetUserId].sort((a, b) => a.localeCompare(b));

    const { data: existingConversation, error: lookupError } = await supabase
      .from("conversations")
      .select("id, ride_id, participant_a, participant_b, created_at, updated_at")
      .eq("participant_a", participantA)
      .eq("participant_b", participantB)
      .maybeSingle();

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("Error looking up conversation:", lookupError);
      return NextResponse.json({ error: "Failed to open conversation" }, { status: 500 });
    }

    let conversationRow = existingConversation as ConversationRow | null;

    if (!conversationRow) {
      const { data: inserted, error: insertError } = await supabase
        .from("conversations")
        .insert({
          participant_a: participantA,
          participant_b: participantB,
          ride_id: rideId ?? null,
        })
        .select("id, ride_id, participant_a, participant_b, created_at, updated_at")
        .single();

      if (insertError || !inserted) {
        console.error("Error creating conversation:", insertError);
        return NextResponse.json({ error: "Failed to open conversation" }, { status: 500 });
      }

      conversationRow = inserted as ConversationRow;
    } else if (rideId && !conversationRow.ride_id) {
      const { data: updated, error: updateError } = await supabase
        .from("conversations")
        .update({ ride_id: rideId })
        .eq("id", conversationRow.id)
        .select("id, ride_id, participant_a, participant_b, created_at, updated_at")
        .single();

      if (!updateError && updated) {
        conversationRow = updated as ConversationRow;
      }
    }

    const partnerId = conversationRow.participant_a === currentUserId
      ? conversationRow.participant_b
      : conversationRow.participant_a;

    const partnerProfiles = await buildPartnerMap(partnerId ? [partnerId] : []);
    const partnerProfile = partnerId ? partnerProfiles[partnerId] ?? null : null;

    const responsePayload = {
      id: conversationRow.id,
      rideId: conversationRow.ride_id ?? null,
      createdAt: conversationRow.created_at,
      updatedAt: conversationRow.updated_at,
      partner: partnerProfile
        ? {
            id: partnerProfile.id,
            name: partnerProfile.name ?? "",
            email: partnerProfile.email ?? null,
            profilePictureData: partnerProfile.profile_picture_data ?? null,
          }
        : partnerId
        ? {
            id: partnerId,
            name: "",
            email: null,
            profilePictureData: null,
          }
        : null,
    };

    debugLog("Conversation opened for", currentUserId, responsePayload);
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Unexpected conversation creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
