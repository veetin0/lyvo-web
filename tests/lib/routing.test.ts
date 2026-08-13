import { describe, it, expect, vi, afterEach } from "vitest";

import { formatDistance, formatDuration, parseRouteResponse, routeThrough } from "@/lib/routing";

describe("formatDistance", () => {
  it("uses metres below a kilometre", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(850)).toBe("850 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("shows one decimal for short trips and rounds long ones", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(12_400)).toBe("12.4 km");
    expect(formatDistance(149_800)).toBe("150 km");
    expect(formatDistance(540_000)).toBe("540 km");
  });

  it("returns nothing for nonsense", () => {
    expect(formatDistance(Number.NaN)).toBe("");
    expect(formatDistance(-5)).toBe("");
  });
});

describe("formatDuration", () => {
  it("stays in minutes below an hour", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(59 * 60 + 20)).toBe("59 min");
  });

  it("splits hours and minutes", () => {
    expect(formatDuration(134 * 60)).toBe("2 h 14 min");
    expect(formatDuration(60 * 60)).toBe("1 h");
    expect(formatDuration(3 * 3600)).toBe("3 h");
  });

  it("returns nothing for nonsense", () => {
    expect(formatDuration(Number.NaN)).toBe("");
    expect(formatDuration(-1)).toBe("");
  });
});

describe("parseRouteResponse", () => {
  const ok = {
    code: "Ok",
    routes: [
      {
        distance: 149_800,
        duration: 8_040,
        geometry: "}gjvJky_pCCcA",
        legs: [
          { distance: 77_700, duration: 3_360 },
          { distance: 72_100, duration: 4_680 },
        ],
      },
    ],
  };

  it("reads distance, duration, geometry and legs", () => {
    const result = parseRouteResponse(ok);

    expect(result).toEqual({
      distanceMeters: 149_800,
      durationSeconds: 8_040,
      polyline: "}gjvJky_pCCcA",
      legs: [
        { distanceMeters: 77_700, durationSeconds: 3_360 },
        { distanceMeters: 72_100, durationSeconds: 4_680 },
      ],
    });
  });

  it("rejects anything the router did not mark Ok", () => {
    expect(parseRouteResponse({ code: "NoRoute", routes: [] })).toBeNull();
    expect(parseRouteResponse({} as never)).toBeNull();
  });

  it("rejects a route with no geometry, since the preview needs one", () => {
    expect(parseRouteResponse({ code: "Ok", routes: [{ distance: 1, duration: 1 }] })).toBeNull();
    expect(
      parseRouteResponse({ code: "Ok", routes: [{ distance: 1, duration: 1, geometry: "" }] })
    ).toBeNull();
  });

  it("rejects non-numeric distances", () => {
    expect(
      parseRouteResponse({
        code: "Ok",
        routes: [{ distance: undefined, duration: 10, geometry: "abc" }],
      })
    ).toBeNull();
  });

  it("copes with a route that reports no legs", () => {
    const result = parseRouteResponse({
      code: "Ok",
      routes: [{ distance: 100, duration: 10, geometry: "abc" }],
    });
    expect(result?.legs).toEqual([]);
  });
});

describe("routeThrough", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  const helsinki = { lat: 60.1699, lng: 24.9384 };
  const tampere = { lat: 61.4978, lng: 23.761 };

  it("needs at least two usable points", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await routeThrough([])).toBeNull();
    expect(await routeThrough([helsinki])).toBeNull();
    expect(await routeThrough([helsinki, { lat: Number.NaN, lng: 1 }])).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends longitude before latitude, as the router expects", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: "Ok", routes: [{ distance: 1, duration: 1, geometry: "a", legs: [] }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await routeThrough([helsinki, tampere]);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("24.9384,60.1699;23.761,61.4978");
    expect(url).toContain("geometries=polyline");
    expect(url).toContain("overview=full");
  });

  it("passes stops through in order between the endpoints", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: "Ok", routes: [{ distance: 1, duration: 1, geometry: "a", legs: [] }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await routeThrough([helsinki, { lat: 61.0, lng: 24.5 }, tampere]);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("24.9384,60.1699;24.5,61;23.761,61.4978");
  });

  it("raises when the router errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 }) as unknown as typeof fetch;

    await expect(routeThrough([helsinki, tampere])).rejects.toThrow("502");
  });
});
