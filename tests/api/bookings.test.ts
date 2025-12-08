import { describe, it, expect, beforeEach, vi } from "vitest";

const getTokenMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("next-auth/jwt", () => ({
  getToken: getTokenMock,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const loadModule = async () => {
  vi.resetModules();
  return import("@/app/api/bookings/route");
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("/api/bookings GET", () => {
  it("returns 401 when user token missing for rider view", async () => {
    getTokenMock.mockResolvedValue(null);
    createClientMock.mockReturnValue({ from: vi.fn() });

    const { GET } = await loadModule();
    const response = await GET(new Request("http://localhost/api/bookings"));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns empty list when owner has no rides", async () => {
    getTokenMock.mockResolvedValue({ id: "owner-id", email: "owner@example.com" });

    const ridesEqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const ridesSelectMock = vi.fn().mockReturnValue({ eq: ridesEqMock });

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "rides") {
          return { select: ridesSelectMock };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { GET } = await loadModule();
    const response = await GET(new Request("http://localhost/api/bookings?view=owner"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
    expect(supabaseStub.from).toHaveBeenCalledWith("rides");
    expect(ridesSelectMock).toHaveBeenCalledWith("id");
    expect(ridesEqMock).toHaveBeenCalledWith("owner", "owner-id");
  });
});

describe("/api/bookings POST", () => {
  it("returns 401 when user token missing", async () => {
    getTokenMock.mockResolvedValue(null);
    createClientMock.mockReturnValue({ from: vi.fn() });

    const { POST } = await loadModule();
    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({ rideId: "ride-1" }),
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("prevents booking own ride", async () => {
    const rideId = "ride-1";
    const token = { id: "owner-id", email: "owner@example.com" };
    getTokenMock.mockResolvedValue(token);

    const rideSingleMock = vi.fn().mockResolvedValue({
      data: { id: rideId, owner: token.id, seats: 3 },
      error: null,
    });
    const rideEqMock = vi.fn().mockReturnValue({ single: rideSingleMock });
    const rideSelectMock = vi.fn().mockReturnValue({ eq: rideEqMock });

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "rides") {
          return { select: rideSelectMock };
        }
        return { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { POST } = await loadModule();
    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({ rideId }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Et voi varata omaa kyytiäsi");
  });

  it("creates booking and decrements seats when data is valid", async () => {
    const rideId = "ride-1";
    const token = { id: "rider-id", email: "rider@example.com" };
    getTokenMock.mockResolvedValue(token);

    let ridesCall = 0;

    const initialRide = { id: rideId, owner: "driver-id", seats: 2 };
    const rideSingleMock = vi.fn().mockResolvedValue({ data: initialRide, error: null });
    const rideEqMock = vi.fn().mockReturnValue({ single: rideSingleMock });
    const rideSelectMock = vi.fn().mockReturnValue({ eq: rideEqMock });

    const updateSingleMock = vi.fn().mockResolvedValue({ data: { seats: 1 }, error: null });
    const updateSelectMock = vi.fn().mockReturnValue({ single: updateSingleMock });
    const updateEqMock = vi.fn().mockReturnValue({ select: updateSelectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    const bookingsSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const bookingsEqSecondMock = vi.fn().mockReturnValue({ single: bookingsSingleMock });
    const bookingsEqFirstMock = vi.fn().mockReturnValue({ eq: bookingsEqSecondMock });
    const bookingsSelectMock = vi.fn().mockReturnValue({ eq: bookingsEqFirstMock });

    const insertSelectMock = vi.fn().mockResolvedValue({ data: [{ id: "booking-1" }], error: null });
    const insertMock = vi.fn().mockImplementation(() => {
      return { select: insertSelectMock };
    });
    const deleteMock = vi.fn();

    const supabaseStub = {
      from: vi.fn((table: string) => {
        if (table === "rides") {
          if (ridesCall++ === 0) {
            return { select: rideSelectMock };
          }
          return { update: updateMock };
        }
        if (table === "bookings") {
          return {
            select: bookingsSelectMock,
            insert: insertMock,
            delete: deleteMock,
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    createClientMock.mockReturnValue(supabaseStub);

    const { POST } = await loadModule();
    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({ rideId }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.booking).toEqual([{ id: "booking-1" }]);

    expect(rideSelectMock).toHaveBeenCalledWith("id, owner, seats");
    expect(rideEqMock).toHaveBeenCalledWith("id", rideId);

    expect(bookingsSelectMock).toHaveBeenCalledWith("id");
    expect(bookingsEqFirstMock).toHaveBeenCalledWith("user_email", token.email);
    expect(bookingsEqSecondMock).toHaveBeenCalledWith("ride_id", rideId);

    expect(insertMock).toHaveBeenCalledWith({ user_email: token.email, ride_id: rideId, status: "pending" });
    expect(insertSelectMock).toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();

    expect(updateMock).toHaveBeenCalledWith({ seats: initialRide.seats - 1 });
    expect(updateEqMock).toHaveBeenCalledWith("id", rideId);
    expect(updateSelectMock).toHaveBeenCalledWith("seats");
    expect(updateSingleMock).toHaveBeenCalled();
  });
});
