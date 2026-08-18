import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getDriverRatings, getRatedBookingIds, isValidRating } from "@/lib/ratings";

const clientReturning = (rows: unknown[] | null, error: unknown = null) => {
  const inMock = vi.fn().mockResolvedValue({ data: rows, error });
  const eqMock = vi.fn().mockResolvedValue({ data: rows, error });
  const selectMock = vi.fn().mockReturnValue({ in: inMock, eq: eqMock });
  const client = { from: vi.fn().mockReturnValue({ select: selectMock }) };
  return { client: client as unknown as SupabaseClient, selectMock, inMock, eqMock, from: client.from };
};

describe("isValidRating", () => {
  it("accepts whole numbers one to five", () => {
    expect([1, 2, 3, 4, 5].every(isValidRating)).toBe(true);
  });

  it("rejects anything outside that", () => {
    for (const value of [0, 6, -1, 3.5, "4", null, undefined, Number.NaN, Infinity]) {
      expect(isValidRating(value)).toBe(false);
    }
  });
});

describe("getDriverRatings", () => {
  it("averages per driver and counts the ratings", async () => {
    const { client } = clientReturning([
      { driver_id: "a", rating: 5 },
      { driver_id: "a", rating: 4 },
      { driver_id: "b", rating: 3 },
    ]);

    const result = await getDriverRatings(client, ["a", "b"]);

    expect(result.get("a")).toEqual({ average: 4.5, count: 2 });
    expect(result.get("b")).toEqual({ average: 3, count: 1 });
  });

  it("rounds to one decimal", async () => {
    const { client } = clientReturning([
      { driver_id: "a", rating: 5 },
      { driver_id: "a", rating: 4 },
      { driver_id: "a", rating: 4 },
    ]);

    expect((await getDriverRatings(client, ["a"])).get("a")?.average).toBe(4.3);
  });

  it("omits drivers with no ratings rather than reporting zero", async () => {
    // "Not yet rated" and "rated badly" must not look the same.
    const { client } = clientReturning([{ driver_id: "a", rating: 5 }]);

    const result = await getDriverRatings(client, ["a", "unrated"]);

    expect(result.has("a")).toBe(true);
    expect(result.has("unrated")).toBe(false);
  });

  it("does not query for an empty driver list", async () => {
    const { client, from } = clientReturning([]);
    expect((await getDriverRatings(client, [])).size).toBe(0);
    expect((await getDriverRatings(client, ["", ""])).size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });

  it("de-duplicates the ids it asks for", async () => {
    const { client, inMock } = clientReturning([]);
    await getDriverRatings(client, ["a", "a", "b"]);
    expect(inMock).toHaveBeenCalledWith("driver_id", ["a", "b"]);
  });

  it("returns an empty map when the query fails", async () => {
    const { client } = clientReturning(null, { message: "boom" });
    expect((await getDriverRatings(client, ["a"])).size).toBe(0);
  });

  it("skips malformed rows", async () => {
    const { client } = clientReturning([
      { driver_id: "a", rating: 5 },
      { driver_id: null, rating: 5 },
      { driver_id: "a", rating: "nonsense" },
    ]);

    expect((await getDriverRatings(client, ["a"])).get("a")).toEqual({ average: 5, count: 1 });
  });
});

describe("getRatedBookingIds", () => {
  it("returns the bookings this rater already scored", async () => {
    const { client, eqMock } = clientReturning([{ booking_id: "b1" }, { booking_id: "b2" }]);

    const result = await getRatedBookingIds(client, "Rider@Example.com ");

    expect([...result].sort()).toEqual(["b1", "b2"]);
    // Addresses are stored lowercase.
    expect(eqMock).toHaveBeenCalledWith("rater_email", "rider@example.com");
  });

  it("does not query without an address", async () => {
    const { client, from } = clientReturning([]);
    expect((await getRatedBookingIds(client, null)).size).toBe(0);
    expect((await getRatedBookingIds(client, "  ")).size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });
});
