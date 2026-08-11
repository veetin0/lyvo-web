import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { reserveSeat, releaseSeat } from "@/lib/seats";

/**
 * An in-memory stand-in for the `rides` table that implements real
 * compare-and-swap semantics: an update carrying a `seats` filter only applies
 * when the stored value still matches. That is the property the helpers rely on,
 * so the fake has to honour it for these tests to mean anything.
 */
const createFakeRides = (initialSeats: number | null) => {
  let seats = initialSeats;
  let reads = 0;
  let updateAttempts = 0;
  let beforeNextUpdate: (() => void) | null = null;

  const client = {
    from(table: string) {
      if (table !== "rides") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  reads += 1;
                  return { data: { seats }, error: null };
                },
              };
            },
          };
        },

        update(patch: { seats: number }) {
          const filters: Record<string, unknown> = {};
          const builder = {
            eq(column: string, value: unknown) {
              filters[column] = value;
              return builder;
            },
            async select() {
              updateAttempts += 1;

              // Lets a test simulate another request writing between our read
              // and our update.
              if (beforeNextUpdate) {
                const hook = beforeNextUpdate;
                beforeNextUpdate = null;
                hook();
              }

              if ("seats" in filters && filters.seats !== seats) {
                return { data: [], error: null };
              }

              seats = patch.seats;
              return { data: [{ seats }], error: null };
            },
          };
          return builder;
        },
      };
    },
  } as unknown as SupabaseClient;

  return {
    client,
    getSeats: () => seats,
    setSeats: (value: number) => {
      seats = value;
    },
    onNextUpdate: (hook: () => void) => {
      beforeNextUpdate = hook;
    },
    stats: () => ({ reads, updateAttempts }),
  };
};

describe("reserveSeat", () => {
  it("takes exactly one seat", async () => {
    const rides = createFakeRides(3);

    const result = await reserveSeat(rides.client, "ride-1");

    expect(result).toEqual({ ok: true, seats: 2 });
    expect(rides.getSeats()).toBe(2);
  });

  it("refuses to oversell a full ride", async () => {
    const rides = createFakeRides(0);

    const result = await reserveSeat(rides.client, "ride-1");

    expect(result).toEqual({ ok: false, reason: "sold_out" });
    expect(rides.getSeats()).toBe(0);
    expect(rides.stats().updateAttempts).toBe(0);
  });

  it("retries and still lands on the right count when another writer wins the race", async () => {
    const rides = createFakeRides(2);

    // Between our read (2) and our write, someone else books a seat.
    rides.onNextUpdate(() => rides.setSeats(1));

    const result = await reserveSeat(rides.client, "ride-1");

    expect(result).toEqual({ ok: true, seats: 0 });
    expect(rides.getSeats()).toBe(0);
    expect(rides.stats().updateAttempts).toBe(2);
  });

  it("only lets one of two riders take the last seat", async () => {
    const rides = createFakeRides(1);

    // The second rider's write lands first, taking the final seat.
    rides.onNextUpdate(() => rides.setSeats(0));

    const first = await reserveSeat(rides.client, "ride-1");

    expect(first).toEqual({ ok: false, reason: "sold_out" });
    expect(rides.getSeats()).toBe(0);
  });

  it("gives up rather than looping forever under sustained contention", async () => {
    const rides = createFakeRides(5);

    // Every attempt is beaten by a competing write.
    const client = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { seats: 5 }, error: null }) }) }),
        update: () => {
          const builder = {
            eq: () => builder,
            select: async () => ({ data: [], error: null }),
          };
          return builder;
        },
      }),
    } as unknown as SupabaseClient;

    const result = await reserveSeat(client, "ride-1");

    expect(result).toEqual({ ok: false, reason: "contended" });
    void rides;
  });

  it("reports a missing ride", async () => {
    const client = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }),
    } as unknown as SupabaseClient;

    expect(await reserveSeat(client, "nope")).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("releaseSeat", () => {
  it("returns exactly one seat", async () => {
    const rides = createFakeRides(1);

    const result = await releaseSeat(rides.client, "ride-1");

    expect(result).toEqual({ ok: true, seats: 2 });
    expect(rides.getSeats()).toBe(2);
  });

  it("is safe against a concurrent writer", async () => {
    const rides = createFakeRides(1);

    rides.onNextUpdate(() => rides.setSeats(0));

    const result = await releaseSeat(rides.client, "ride-1");

    // Re-read saw 0, so the retry adds one to that rather than clobbering it.
    expect(result).toEqual({ ok: true, seats: 1 });
    expect(rides.getSeats()).toBe(1);
  });
});
