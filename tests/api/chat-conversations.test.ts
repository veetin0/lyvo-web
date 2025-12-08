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
  return import("@/app/api/chat/conversations/route");
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("/api/chat/conversations GET", () => {
  it("returns 401 when user is not authenticated", async () => {
    getTokenMock.mockResolvedValue(null);
    createClientMock.mockReturnValue({ from: vi.fn() });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/chat/conversations"));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns conversations enriched with partner and ride data", async () => {
    const token = { id: "user-1", email: "user@example.com" };
    getTokenMock.mockResolvedValue(token);

    const conversationOrderMock = vi
      .fn()
      .mockResolvedValue({
        data: [
          {
            id: "conv-1",
            ride_id: "ride-1",
            participant_a: "user-1",
            participant_b: "user-2",
            created_at: "2025-01-01T10:00:00Z",
            updated_at: "2025-01-02T10:00:00Z",
          },
        ],
        error: null,
      });
    const conversationOrMock = vi.fn().mockReturnValue({ order: conversationOrderMock });
    const conversationSelectMock = vi.fn().mockReturnValue({ or: conversationOrMock });

    const userInMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "user-2",
          name: "Partner",
          email: "partner@example.com",
          profile_picture_data: "data",
        },
      ],
      error: null,
    });
    const userSelectMock = vi.fn().mockReturnValue({ in: userInMock });

    const rideInMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "ride-1",
          from_city: "Helsinki",
          to_city: "Espoo",
          departure: "2025-02-01T09:00:00Z",
          price_eur: 10,
          owner: "user-3",
        },
      ],
      error: null,
    });
    const rideSelectMock = vi.fn().mockReturnValue({ in: rideInMock });

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "conversations") {
          return { select: conversationSelectMock };
        }
        if (table === "User") {
          return { select: userSelectMock };
        }
        if (table === "rides") {
          return { select: rideSelectMock };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/chat/conversations"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      {
        id: "conv-1",
        rideId: "ride-1",
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-02T10:00:00Z",
        partner: {
          id: "user-2",
          name: "Partner",
          email: "partner@example.com",
          profilePictureData: "data",
        },
        ride: {
          id: "ride-1",
          from_city: "Helsinki",
          to_city: "Espoo",
          departure: "2025-02-01T09:00:00Z",
          price_eur: 10,
          owner: "user-3",
        },
      },
    ]);

    expect(conversationSelectMock).toHaveBeenCalledWith(
      "id, ride_id, participant_a, participant_b, created_at, updated_at"
    );
    expect(conversationOrMock).toHaveBeenCalledWith("participant_a.eq.user-1,participant_b.eq.user-1");
    expect(conversationOrderMock).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(userSelectMock).toHaveBeenCalledWith("id, name, email, profile_picture_data");
  expect(userInMock).toHaveBeenCalledWith("id", ["user-2"]);
    expect(rideSelectMock).toHaveBeenCalledWith("id, from_city, to_city, departure, price_eur, owner");
  expect(rideInMock).toHaveBeenCalledWith("id", ["ride-1"]);
  });
});

describe("/api/chat/conversations POST", () => {
  it("returns 401 when not authenticated", async () => {
    getTokenMock.mockResolvedValue(null);
    createClientMock.mockReturnValue({ from: vi.fn() });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ targetUserId: "user-2" }),
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("reuses existing conversation and loads partner profile", async () => {
    const token = { id: "user-1" };
    getTokenMock.mockResolvedValue(token);

    const existingRow = {
      id: "conv-1",
      ride_id: null,
      participant_a: "user-1",
      participant_b: "user-2",
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-01-02T10:00:00Z",
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: existingRow, error: null });
    const eqMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }) });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    const insertMock = vi.fn();
    const updateMock = vi.fn();

    const userInMock = vi.fn().mockResolvedValue({
      data: [
        { id: "user-2", name: "Partner", email: "partner@example.com", profile_picture_data: null },
      ],
      error: null,
    });
    const userSelectMock = vi.fn().mockReturnValue({ in: userInMock });

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "conversations") {
          return {
            select: selectMock,
            insert: insertMock,
            update: updateMock,
          };
        }
        if (table === "User") {
          return { select: userSelectMock };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ targetUserId: "user-2" }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      id: "conv-1",
      rideId: null,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-02T10:00:00Z",
      partner: {
        id: "user-2",
        name: "Partner",
        email: "partner@example.com",
        profilePictureData: null,
      },
    });

    expect(selectMock).toHaveBeenCalledWith(
      "id, ride_id, participant_a, participant_b, created_at, updated_at"
    );
    expect(maybeSingleMock).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
