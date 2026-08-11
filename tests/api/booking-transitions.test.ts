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
  return import("@/app/api/bookings/[id]/route");
};

type Filters = Record<string, { op: "eq" | "in"; value: unknown }>;

const matches = (row: Record<string, unknown>, filters: Filters) =>
  Object.entries(filters).every(([column, filter]) =>
    filter.op === "in"
      ? Array.isArray(filter.value) && (filter.value as unknown[]).includes(row[column])
      : row[column] === filter.value
  );

/**
 * Minimal stand-in for the two tables this route touches. Filters are applied
 * for real, so a conditional update or delete that should match nothing does
 * match nothing — which is exactly the behaviour under test.
 */
const createFakeDb = (booking: Record<string, unknown>, ride: Record<string, unknown>) => {
  const state = { booking: { ...booking }, ride: { ...ride } };

  const writeBuilder = (apply: (filters: Filters) => Record<string, unknown>[]) => {
    const filters: Filters = {};
    const builder = {
      eq(column: string, value: unknown) {
        filters[column] = { op: "eq", value };
        return builder;
      },
      in(column: string, value: unknown[]) {
        filters[column] = { op: "in", value };
        return builder;
      },
      select() {
        return Promise.resolve({ data: apply(filters), error: null });
      },
      // supabase-js builders are thenable, so awaiting without .select() works.
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve({ data: apply(filters), error: null }).then(resolve, reject);
      },
    };
    return builder;
  };

  const client = {
    from(table: string) {
      if (table === "bookings") {
        return {
          select(columns: string) {
            const filters: Filters = {};
            const builder = {
              eq(column: string, value: unknown) {
                filters[column] = { op: "eq", value };
                return builder;
              },
              async single() {
                if (!matches(state.booking, filters)) {
                  return { data: null, error: { message: "not found" } };
                }
                const row: Record<string, unknown> = { ...state.booking };
                if (columns.includes("ride:")) {
                  row.ride = { id: state.ride.id, owner: state.ride.owner };
                }
                return { data: row, error: null };
              },
            };
            return builder;
          },
          update(patch: Record<string, unknown>) {
            return writeBuilder((filters) => {
              if (!matches(state.booking, filters)) return [];
              state.booking = { ...state.booking, ...patch };
              return [{ id: state.booking.id }];
            });
          },
          delete() {
            return writeBuilder((filters) => {
              if (!matches(state.booking, filters)) return [];
              const removed = { id: state.booking.id };
              state.booking = { ...state.booking, deleted: true, status: "__deleted__" };
              return [removed];
            });
          },
        };
      }

      if (table === "rides") {
        return {
          select() {
            const filters: Filters = {};
            const builder = {
              eq(column: string, value: unknown) {
                filters[column] = { op: "eq", value };
                return builder;
              },
              async maybeSingle() {
                return matches(state.ride, filters)
                  ? { data: { seats: state.ride.seats }, error: null }
                  : { data: null, error: null };
              },
            };
            return builder;
          },
          update(patch: Record<string, unknown>) {
            return writeBuilder((filters) => {
              if (!matches(state.ride, filters)) return [];
              state.ride = { ...state.ride, ...patch };
              return [{ seats: state.ride.seats }];
            });
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };

  return { client, state };
};

const OWNER = { id: "driver-1", email: "driver@example.com" };
const RIDER_EMAIL = "rider@example.com";

const context = { params: Promise.resolve({ id: "booking-1" }) };

const putRequest = (action: "accept" | "reject") =>
  new Request("http://localhost/api/bookings/booking-1", {
    method: "PUT",
    body: JSON.stringify({ action }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("PUT /api/bookings/[id]", () => {
  it("rejecting a pending booking returns its seat exactly once", async () => {
    getTokenMock.mockResolvedValue(OWNER);
    const db = createFakeDb(
      { id: "booking-1", ride_id: "ride-1", status: "pending", user_email: RIDER_EMAIL },
      { id: "ride-1", owner: OWNER.id, seats: 0 }
    );
    createClientMock.mockReturnValue(db.client);

    const { PUT } = await loadModule();
    const response = await PUT(putRequest("reject") as never, context);

    expect(response.status).toBe(200);
    expect(db.state.booking.status).toBe("rejected");
    expect(db.state.ride.seats).toBe(1);
  });

  it("rejecting an already-rejected booking does not return a second seat", async () => {
    getTokenMock.mockResolvedValue(OWNER);
    const db = createFakeDb(
      { id: "booking-1", ride_id: "ride-1", status: "rejected", user_email: RIDER_EMAIL },
      { id: "ride-1", owner: OWNER.id, seats: 1 }
    );
    createClientMock.mockReturnValue(db.client);

    const { PUT } = await loadModule();
    const response = await PUT(putRequest("reject") as never, context);

    expect(response.status).toBe(409);
    expect(db.state.ride.seats).toBe(1);
  });

  it("accepting a pending booking leaves the seat count alone", async () => {
    getTokenMock.mockResolvedValue(OWNER);
    const db = createFakeDb(
      { id: "booking-1", ride_id: "ride-1", status: "pending", user_email: RIDER_EMAIL },
      { id: "ride-1", owner: OWNER.id, seats: 2 }
    );
    createClientMock.mockReturnValue(db.client);

    const { PUT } = await loadModule();
    const response = await PUT(putRequest("accept") as never, context);

    expect(response.status).toBe(200);
    expect(db.state.booking.status).toBe("accepted");
    expect(db.state.ride.seats).toBe(2);
  });

  it("refuses a decision from someone who does not own the ride", async () => {
    getTokenMock.mockResolvedValue({ id: "someone-else", email: "nope@example.com" });
    const db = createFakeDb(
      { id: "booking-1", ride_id: "ride-1", status: "pending", user_email: RIDER_EMAIL },
      { id: "ride-1", owner: OWNER.id, seats: 1 }
    );
    createClientMock.mockReturnValue(db.client);

    const { PUT } = await loadModule();
    const response = await PUT(putRequest("reject") as never, context);

    expect(response.status).toBe(403);
    expect(db.state.booking.status).toBe("pending");
    expect(db.state.ride.seats).toBe(1);
  });
});

describe("DELETE /api/bookings/[id]", () => {
  const deleteRequest = () =>
    new Request("http://localhost/api/bookings/booking-1", { method: "DELETE" });

  it("cancelling a pending booking returns its seat", async () => {
    getTokenMock.mockResolvedValue({ id: "rider-1", email: RIDER_EMAIL });
    const db = createFakeDb(
      { id: "booking-1", ride_id: "ride-1", status: "pending", user_email: RIDER_EMAIL },
      { id: "ride-1", owner: OWNER.id, seats: 0 }
    );
    createClientMock.mockReturnValue(db.client);

    const { DELETE } = await loadModule();
    const response = await DELETE(deleteRequest() as never, context);

    expect(response.status).toBe(200);
    expect(db.state.ride.seats).toBe(1);
  });

  it("cancelling an already-rejected booking does not inflate the seat count", async () => {
    // The reject already handed the seat back; cancelling afterwards must not
    // hand back another. This is the regression that let seats appear from
    // nowhere.
    getTokenMock.mockResolvedValue({ id: "rider-1", email: RIDER_EMAIL });
    const db = createFakeDb(
      { id: "booking-1", ride_id: "ride-1", status: "rejected", user_email: RIDER_EMAIL },
      { id: "ride-1", owner: OWNER.id, seats: 1 }
    );
    createClientMock.mockReturnValue(db.client);

    const { DELETE } = await loadModule();
    const response = await DELETE(deleteRequest() as never, context);

    expect(response.status).toBe(200);
    expect(db.state.ride.seats).toBe(1);
  });

  it("refuses to cancel someone else's booking", async () => {
    getTokenMock.mockResolvedValue({ id: "intruder", email: "intruder@example.com" });
    const db = createFakeDb(
      { id: "booking-1", ride_id: "ride-1", status: "pending", user_email: RIDER_EMAIL },
      { id: "ride-1", owner: OWNER.id, seats: 0 }
    );
    createClientMock.mockReturnValue(db.client);

    const { DELETE } = await loadModule();
    const response = await DELETE(deleteRequest() as never, context);

    expect(response.status).toBe(403);
    expect(db.state.ride.seats).toBe(0);
    expect(db.state.booking.status).toBe("pending");
  });
});
