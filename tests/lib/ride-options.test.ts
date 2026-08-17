import { describe, it, expect } from "vitest";

import {
  RIDE_OPTION_KEYS,
  getRideOptionLabel,
  isRideOptionKey,
  normalizeRideOptions,
  toRideOptionKey,
} from "@/lib/rideOptions";

describe("normalizeRideOptions", () => {
  it("passes stored option keys through", () => {
    expect(normalizeRideOptions(["electric", "pets"])).toEqual(["electric", "pets"]);
  });

  it("returns an empty list for null, undefined and non-array values", () => {
    expect(normalizeRideOptions(null)).toEqual([]);
    expect(normalizeRideOptions(undefined)).toEqual([]);
    expect(normalizeRideOptions(42)).toEqual([]);
    expect(normalizeRideOptions({ electric: true })).toEqual([]);
  });

  it("parses a JSON-encoded array written by older clients", () => {
    expect(normalizeRideOptions('["quiet","van"]')).toEqual(["van", "quiet"]);
    expect(normalizeRideOptions("not json")).toEqual([]);
  });

  it("canonicalizes legacy localized labels back to keys", () => {
    expect(normalizeRideOptions(["Sähköauto"])).toEqual(["electric"]);
    expect(normalizeRideOptions(["Quiet ride"])).toEqual(["quiet"]);
    expect(normalizeRideOptions(["Husdjur tillåtna"])).toEqual(["pets"]);
    expect(normalizeRideOptions(["Tila-auto"])).toEqual(["van"]);
  });

  it("drops values that match no known option", () => {
    expect(normalizeRideOptions(["electric", "definitely-not-an-option", "", 7, null])).toEqual([
      "electric",
    ]);
  });

  it("deduplicates and returns a stable catalog order", () => {
    // "Sähköauto" and "electric" are the same option, supplied out of order.
    expect(normalizeRideOptions(["pets", "Sähköauto", "electric"])).toEqual(["electric", "pets"]);
  });
});

describe("toRideOptionKey", () => {
  it("trims surrounding whitespace", () => {
    expect(toRideOptionKey("  electric  ")).toBe("electric");
    expect(toRideOptionKey(" Sähköauto ")).toBe("electric");
  });

  it("returns null for unknown values", () => {
    expect(toRideOptionKey("helicopter")).toBeNull();
    expect(toRideOptionKey(123)).toBeNull();
  });
});

describe("isRideOptionKey", () => {
  it("accepts catalog keys and rejects labels", () => {
    expect(isRideOptionKey("smokeFree")).toBe(true);
    expect(isRideOptionKey("Savuton kyyti")).toBe(false);
  });
});

describe("getRideOptionLabel", () => {
  it("localizes every option key", () => {
    for (const key of RIDE_OPTION_KEYS) {
      for (const locale of ["fi", "en", "sv"] as const) {
        expect(getRideOptionLabel(key, locale)).toBeTruthy();
      }
    }
  });

  it("localizes the derived search-page features", () => {
    expect(getRideOptionLabel("femaleDriver", "fi")).toBe("Naiskuljettaja");
    expect(getRideOptionLabel("popular", "en")).toBe("Popular ride");
  });

  it("falls back to the raw value when the option is unknown", () => {
    expect(getRideOptionLabel("mystery", "en")).toBe("mystery");
  });
});
