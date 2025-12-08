import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AuthToken = (JWT & { id?: string | null; email?: string | null }) | null;

interface ConversationParticipants {
  id: string;
  participant_a: string;
  participant_b: string;
}

interface MessageRow {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getCurrentUserId = (token: AuthToken): string | null =>
  token?.id ?? token?.email ?? null;

const ensureConversationParticipant = async (
  conversationId: string,
  currentUserId: string
) => {
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load conversation");
  }

  if (!conversation) {
    return { status: 404 as const, error: "Conversation not found" };
  }

  const { participant_a: participantA, participant_b: participantB } = conversation as ConversationParticipants;
  const isParticipant = participantA === currentUserId || participantB === currentUserId;

  if (!isParticipant) {
    return { status: 403 as const, error: "Not authorized" };
  }

  return { status: 200 as const };
};

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    const currentUserId = getCurrentUserId(token);

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const participantCheck = await ensureConversationParticipant(conversationId, currentUserId);
    if (participantCheck.status !== 200) {
      return NextResponse.json({ error: participantCheck.error }, { status: participantCheck.status });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }

    const formatted = (messages ?? []).map((message) => {
      const typedMessage = message as MessageRow;
      return {
        id: typedMessage.id,
        senderId: typedMessage.sender_id,
        content: typedMessage.content,
        createdAt: typedMessage.created_at,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Unexpected messages fetch error:", error);
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

    const { conversationId, content } = (await req.json()) as {
      conversationId?: string;
      content?: string;
    };

    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (!trimmedContent) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    if (trimmedContent.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const participantCheck = await ensureConversationParticipant(conversationId, currentUserId);
    if (participantCheck.status !== 200) {
      return NextResponse.json({ error: participantCheck.error }, { status: participantCheck.status });
    }

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmedContent,
      })
      .select("id, sender_id, content, created_at")
      .single();

    if (error || !inserted) {
      console.error("Error sending message:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    const typedInserted = inserted as MessageRow;

    return NextResponse.json({
      id: typedInserted.id,
      senderId: typedInserted.sender_id,
      content: typedInserted.content,
      createdAt: typedInserted.created_at,
    });
  } catch (error) {
    console.error("Unexpected message send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
