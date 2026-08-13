import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { formatPlaceLabel, searchPlaces, toSuggestion } from "@/lib/geocoding";

const feature = (properties: Record<string, unknown>, coords: [number, number] = [24.94, 60.17]) => ({
  geometry: { coordinates: coords },
  properties,
});

describe("formatPlaceLabel", () => {
  it("builds a readable label from the place hierarchy", () => {
    expect(
      formatPlaceLabel({ name: "Jyväskylä", state: "Central Finland", country: "Finland" })
    ).toBe("Jyväskylä, Central Finland, Finland");
  });

  it("collapses segments that repeat", () => {
    // Photon returns a station as name "Helsinki" inside city "Helsinki";
    // rendering both would read "Helsinki, Helsinki, Uusimaa".
    expect(
      formatPlaceLabel({ name: "Helsinki", city: "Helsinki", state: "Uusimaa", country: "Finland" })
    ).toBe("Helsinki, Uusimaa, Finland");
  });

  it("ignores casing when collapsing", () => {
    expect(formatPlaceLabel({ name: "TAMPERE", city: "Tampere", country: "Finland" })).toBe(
      "TAMPERE, Finland"
    );
  });

  it("prefers a street address over the bare feature name", () => {
    expect(
      formatPlaceLabel({
        name: "Some Building",
        street: "Mannerheimintie",
        housenumber: "1",
        city: "Helsinki",
        country: "Finland",
      })
    ).toBe("Mannerheimintie 1, Helsinki, Finland");
  });

  it("copes with a street that has no house number", () => {
    expect(formatPlaceLabel({ street: "Mannerheimintie", city: "Helsinki" })).toBe(
      "Mannerheimintie, Helsinki"
    );
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(formatPlaceLabel({})).toBe("");
  });
});

describe("toSuggestion", () => {
  it("reads GeoJSON coordinates as [lng, lat], not [lat, lng]", () => {
    const suggestion = toSuggestion(feature({ name: "Helsinki", country: "Finland" }, [24.94, 60.17]), 0);

    expect(suggestion?.location).toEqual({ lat: 60.17, lng: 24.94 });
  });

  it("rejects features without usable coordinates", () => {
    expect(toSuggestion({ properties: { name: "Nowhere" } }, 0)).toBeNull();
    expect(toSuggestion(feature({ name: "Bad" }, [NaN, 60] as [number, number]), 0)).toBeNull();
  });

  it("rejects features that produce no label", () => {
    expect(toSuggestion(feature({}), 0)).toBeNull();
  });

  it("uppercases the country code", () => {
    const suggestion = toSuggestion(feature({ name: "Oslo", countrycode: "no" }), 0);
    expect(suggestion?.countryCode).toBe("NO");
  });
});

describe("searchPlaces", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockResponse = (features: unknown[]) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  };

  it("does not call the network for very short queries", async () => {
    const fetchMock = mockResponse([]);

    expect(await searchPlaces("H")).toEqual([]);
    expect(await searchPlaces("  ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps only the requested countries", async () => {
    mockResponse([
      feature({ name: "Helsinki", countrycode: "fi", country: "Finland" }),
      feature({ name: "Helsingborg", countrycode: "se", country: "Sweden" }),
      feature({ name: "Helsington", countrycode: "gb", country: "United Kingdom" }),
    ]);

    const results = await searchPlaces("Hels", { countries: ["FI", "SE"] });

    expect(results.map((r) => r.countryCode)).toEqual(["FI", "SE"]);
  });

  it("keeps everything when no countries are given", async () => {
    mockResponse([
      feature({ name: "Helsinki", countrycode: "fi", country: "Finland" }),
      feature({ name: "Helsington", countrycode: "gb", country: "United Kingdom" }),
    ]);

    expect(await searchPlaces("Hels", { countries: [] })).toHaveLength(2);
  });

  it("drops duplicate labels, which a city and its station produce", async () => {
    mockResponse([
      feature({ name: "Tampere", city: "Tampere", state: "Pirkanmaa", country: "Finland", countrycode: "fi" }),
      feature({ name: "Tampere", state: "Pirkanmaa", country: "Finland", countrycode: "fi" }),
      feature({ name: "Tampere", city: "Nokia", state: "Pirkanmaa", country: "Finland", countrycode: "fi" }),
    ]);

    const results = await searchPlaces("Tampere", { countries: ["FI"] });

    expect(results).toHaveLength(2);
    expect(results[0].description).toBe("Tampere, Pirkanmaa, Finland");
    expect(results[1].description).toBe("Tampere, Nokia, Pirkanmaa, Finland");
  });

  it("honours the result limit", async () => {
    mockResponse(
      Array.from({ length: 15 }, (_, i) =>
        feature({ name: `Place ${i}`, countrycode: "fi", country: "Finland" })
      )
    );

    expect(await searchPlaces("Place", { limit: 4, countries: ["FI"] })).toHaveLength(4);
  });

  it("sends the query and a Finnish location bias", async () => {
    const fetchMock = mockResponse([]);

    await searchPlaces("Turku");

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("q")).toBe("Turku");
    expect(Number(url.searchParams.get("lat"))).toBeGreaterThan(55);
    expect(Number(url.searchParams.get("lon"))).toBeGreaterThan(15);
  });

  it("raises when the geocoder errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    await expect(searchPlaces("Turku")).rejects.toThrow("503");
  });
});
