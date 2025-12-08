import { describe, it, expect, beforeEach, vi } from "vitest";

const getTokenMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("next-auth/jwt", () => ({
  getToken: getTokenMock,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const loadRoute = async () => {
  vi.resetModules();
  return import("@/app/api/chat/messages/route");
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("/api/chat/messages GET", () => {
  it("returns 401 when user is not authenticated", async () => {
    getTokenMock.mockResolvedValue(null);
    createClientMock.mockReturnValue({ from: vi.fn() });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/chat/messages?conversationId=conv-1"));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not a participant", async () => {
    getTokenMock.mockResolvedValue({ id: "user-1" });

    const conversationMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { id: "conv-1", participant_a: "other", participant_b: "another" },
      error: null,
    });
    const conversationEqMock = vi.fn().mockReturnValue({ maybeSingle: conversationMaybeSingleMock });
    const conversationSelectMock = vi.fn().mockReturnValue({ eq: conversationEqMock });

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "conversations") {
          return { select: conversationSelectMock };
        }
        if (table === "messages") {
          return { select: vi.fn() };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/chat/messages?conversationId=conv-1"));

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Not authorized");
    expect(conversationSelectMock).toHaveBeenCalledWith("id, participant_a, participant_b");
    expect(conversationEqMock).toHaveBeenCalledWith("id", "conv-1");
    expect(conversationMaybeSingleMock).toHaveBeenCalled();
  });

  it("returns messages when participant is authorized", async () => {
    getTokenMock.mockResolvedValue({ id: "user-1" });

    const conversationMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { id: "conv-1", participant_a: "user-1", participant_b: "user-2" },
      error: null,
    });
    const conversationEqMock = vi.fn().mockReturnValue({ maybeSingle: conversationMaybeSingleMock });
    const conversationSelectMock = vi.fn().mockReturnValue({ eq: conversationEqMock });

    const messagesOrderMock = vi.fn().mockResolvedValue({
      data: [
        { id: "msg-1", sender_id: "user-1", content: "Hi", created_at: "2025-03-01T10:00:00Z" },
      ],
      error: null,
    });
    const messagesEqMock = vi.fn().mockReturnValue({ order: messagesOrderMock });
    const messagesSelectMock = vi.fn().mockReturnValue({ eq: messagesEqMock });

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "conversations") {
          return { select: conversationSelectMock };
        }
        if (table === "messages") {
          return { select: messagesSelectMock };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/chat/messages?conversationId=conv-1"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      {
        id: "msg-1",
        senderId: "user-1",
        content: "Hi",
        createdAt: "2025-03-01T10:00:00Z",
      },
    ]);

    expect(messagesSelectMock).toHaveBeenCalledWith("id, sender_id, content, created_at");
    expect(messagesEqMock).toHaveBeenCalledWith("conversation_id", "conv-1");
    expect(messagesOrderMock).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});

describe("/api/chat/messages POST", () => {
  it("returns 401 when not authenticated", async () => {
    getTokenMock.mockResolvedValue(null);
    createClientMock.mockReturnValue({ from: vi.fn() });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/chat/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId: "conv-1", content: "Hello" }),
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("creates message and updates conversation timestamp", async () => {
    const token = { id: "user-1" };
    getTokenMock.mockResolvedValue(token);

    const conversationMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { id: "conv-1", participant_a: "user-1", participant_b: "user-2" },
      error: null,
    });
    const conversationEqMock = vi.fn().mockReturnValue({ maybeSingle: conversationMaybeSingleMock });
    const conversationSelectMock = vi.fn().mockReturnValue({ eq: conversationEqMock });

    const insertSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: "msg-1",
        sender_id: "user-1",
        content: "Hello",
        created_at: "2025-03-01T12:00:00Z",
      },
      error: null,
    });
    const insertSelectMock = vi.fn().mockReturnValue({ single: insertSingleMock });
    const insertMock = vi.fn().mockReturnValue({ select: insertSelectMock });

    const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "conversations") {
          return {
            select: conversationSelectMock,
            update: updateMock,
          };
        }
        if (table === "messages") {
          return {
            insert: insertMock,
            select: vi.fn(),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/chat/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId: "conv-1", content: "Hello" }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      id: "msg-1",
      senderId: "user-1",
      content: "Hello",
      createdAt: "2025-03-01T12:00:00Z",
    });

    expect(insertMock).toHaveBeenCalledWith({
      conversation_id: "conv-1",
      sender_id: token.id,
      content: "Hello",
    });
    expect(insertSelectMock).toHaveBeenCalledWith("id, sender_id, content, created_at");
    expect(insertSingleMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    expect(updateEqMock).toHaveBeenCalledWith("id", "conv-1");
  });
});
