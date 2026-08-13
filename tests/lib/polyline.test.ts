import { describe, it, expect } from "vitest";

import { buildRouteShape, decodePolyline } from "@/lib/polyline";

describe("decodePolyline", () => {
  it("matches the reference vector from Google's specification", () => {
    // The worked example in the encoded polyline algorithm docs.
    const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");

    expect(points).toHaveLength(3);
    expect(points[0].lat).toBeCloseTo(38.5, 5);
    expect(points[0].lng).toBeCloseTo(-120.2, 5);
    expect(points[1].lat).toBeCloseTo(40.7, 5);
    expect(points[1].lng).toBeCloseTo(-120.95, 5);
    expect(points[2].lat).toBeCloseTo(43.252, 5);
    expect(points[2].lng).toBeCloseTo(-126.453, 5);
  });

  it("returns nothing for empty or non-string input", () => {
    expect(decodePolyline("")).toEqual([]);
    expect(decodePolyline(undefined as unknown as string)).toEqual([]);
    expect(decodePolyline(null as unknown as string)).toEqual([]);
  });

  it("stops cleanly on truncated input instead of looping", () => {
    const full = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const truncated = full.slice(0, 8);

    const points = decodePolyline(truncated);

    // Whatever survives must be finite; the point is that it terminates.
    expect(points.every((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))).toBe(true);
    expect(points.length).toBeLessThan(3);
  });

  it("handles a long route without losing the endpoints", () => {
    // Encode nothing exotic — just confirm a realistic Finnish route decodes to
    // plausible coordinates.
    const points = decodePolyline("o|fnJqwewCkh@uoBchAivA{_@pb@");

    expect(points.length).toBeGreaterThan(1);
    for (const p of points) {
      expect(p.lat).toBeGreaterThan(55);
      expect(p.lat).toBeLessThan(75);
      expect(p.lng).toBeGreaterThan(15);
      expect(p.lng).toBeLessThan(35);
    }
  });
});

describe("buildRouteShape", () => {
  const helsinki = { lat: 60.1699, lng: 24.9384 };
  const tampere = { lat: 61.4978, lng: 23.761 };
  const rovaniemi = { lat: 66.5039, lng: 25.7294 };

  it("returns null when there is nothing to draw", () => {
    expect(buildRouteShape([])).toBeNull();
    expect(buildRouteShape([helsinki])).toBeNull();
  });

  it("produces a path that starts with a move and stays inside the viewBox", () => {
    const shape = buildRouteShape([helsinki, tampere, rovaniemi]);
    expect(shape).not.toBeNull();
    if (!shape) return;

    expect(shape.d.startsWith("M")).toBe(true);

    const coords = [...shape.d.matchAll(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g)];
    expect(coords.length).toBe(3);
    for (const [, x, y] of coords) {
      expect(Number(x)).toBeGreaterThanOrEqual(0);
      expect(Number(x)).toBeLessThanOrEqual(shape.width);
      expect(Number(y)).toBeGreaterThanOrEqual(0);
      expect(Number(y)).toBeLessThanOrEqual(shape.height);
    }
  });

  it("puts north at the top", () => {
    const shape = buildRouteShape([helsinki, rovaniemi]);
    if (!shape) throw new Error("expected a shape");

    // Rovaniemi is far north of Helsinki, so it must sit higher on screen.
    expect(shape.end.y).toBeLessThan(shape.start.y);
  });

  it("keeps the route's real proportions rather than flattening it", () => {
    // Helsinki to Vaasa is about 325 km north and 176 km west, so the drawing
    // must be roughly twice as tall as it is wide. Projecting x in degrees while
    // y is in Mercator radians made x ~57x too large and squashed every route
    // into a horizontal line, which the ordering assertions above did not catch.
    const shape = buildRouteShape([helsinki, { lat: 63.0951, lng: 21.6165 }]);
    if (!shape) throw new Error("expected a shape");

    const dx = Math.abs(shape.end.x - shape.start.x);
    const dy = Math.abs(shape.end.y - shape.start.y);

    expect(dy).toBeGreaterThan(dx);
    expect(dy / dx).toBeGreaterThan(1.4);
    expect(dy / dx).toBeLessThan(2.6);
  });

  it("draws an east–west route wider than it is tall", () => {
    // Turku to Joensuu: mostly east, barely any northing.
    const shape = buildRouteShape([
      { lat: 60.4518, lng: 22.2666 },
      { lat: 62.6, lng: 29.7636 },
    ]);
    if (!shape) throw new Error("expected a shape");

    const dx = Math.abs(shape.end.x - shape.start.x);
    const dy = Math.abs(shape.end.y - shape.start.y);
    expect(dx).toBeGreaterThan(dy);
  });

  it("survives a route with no east–west spread", () => {
    const shape = buildRouteShape([
      { lat: 60.0, lng: 24.9384 },
      { lat: 62.0, lng: 24.9384 },
    ]);

    expect(shape).not.toBeNull();
    if (!shape) return;
    expect(Number.isFinite(shape.start.x)).toBe(true);
    expect(Number.isFinite(shape.start.y)).toBe(true);
    expect(shape.start.x).toBeCloseTo(shape.end.x, 5);
  });

  it("caps how many points end up in the DOM", () => {
    const many = Array.from({ length: 5000 }, (_, i) => ({
      lat: 60 + i * 0.001,
      lng: 24 + i * 0.0005,
    }));

    const shape = buildRouteShape(many, { maxPoints: 250 });
    if (!shape) throw new Error("expected a shape");

    const commands = shape.d.split(/(?=[ML])/).length;
    expect(commands).toBeLessThanOrEqual(250);

    // The ends must survive the sampling.
    expect(shape.start.y).toBeGreaterThan(shape.end.y);
  });
});
