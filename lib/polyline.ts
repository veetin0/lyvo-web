/**
 * Encoded polyline handling, so route previews cost nothing to render.
 *
 * Routes are stored on the ride row in Google's encoded polyline format. Drawing
 * one previously meant loading the whole Google Maps JavaScript API — a billed
 * map load on every ride view — purely to call decodePath and draw a line over a
 * basemap nobody interacts with. Decoding is a couple of dozen lines, and a
 * route shape renders fine as plain SVG.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decode Google's encoded polyline format.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export const decodePolyline = (encoded: string): LatLng[] => {
  const points: LatLng[] = [];
  if (typeof encoded !== "string" || encoded.length === 0) {
    return points;
  }

  let index = 0;
  let lat = 0;
  let lng = 0;

  // Reads one varint-style chunk; returns null if the string ends mid-value,
  // which is how truncated or corrupt input is rejected rather than looped on.
  const readValue = (): number | null => {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      if (index >= encoded.length) {
        return null;
      }
      byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0) {
        return null;
      }
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    // The low bit flags a negative value; the rest is the magnitude.
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    const dLat = readValue();
    if (dLat === null) break;
    const dLng = readValue();
    if (dLng === null) break;

    lat += dLat;
    lng += dLng;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
};

/**
 * Web Mercator projection, in radians.
 *
 * Both axes must share units. Using raw degrees for x against the logarithmic y
 * makes x roughly 57x too large, which flattens every route into a horizontal
 * line.
 */
const mercatorX = (lng: number): number => (lng * Math.PI) / 180;

const mercatorY = (lat: number): number => {
  const clamped = Math.max(Math.min(lat, 85), -85);
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
};

/** Evenly sample a long route down to `max` points, always keeping both ends. */
const sample = (points: LatLng[], max: number): LatLng[] => {
  if (points.length <= max) {
    return points;
  }
  const step = (points.length - 1) / (max - 1);
  const out: LatLng[] = [];
  for (let i = 0; i < max - 1; i += 1) {
    out.push(points[Math.round(i * step)]);
  }
  out.push(points[points.length - 1]);
  return out;
};

export interface RouteShape {
  /** SVG path data in the returned viewBox coordinate space. */
  d: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Project a route into a fixed viewBox, preserving aspect ratio and leaving room
 * for the endpoint markers.
 */
export const buildRouteShape = (
  points: LatLng[],
  { width = 320, height = 200, padding = 18, maxPoints = 400 } = {}
): RouteShape | null => {
  const usable = sample(
    points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    maxPoints
  );

  if (usable.length < 2) {
    return null;
  }

  const xs = usable.map((p) => mercatorX(p.lng));
  const ys = usable.map((p) => mercatorY(p.lat));

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  // A straight north–south or east–west route has zero span on one axis; fall
  // back to the other so the scale stays finite.
  const scale = Math.min(
    spanX > 0 ? innerW / spanX : Number.POSITIVE_INFINITY,
    spanY > 0 ? innerH / spanY : Number.POSITIVE_INFINITY
  );
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  // Centre whichever axis has slack.
  const offsetX = padding + (innerW - spanX * safeScale) / 2;
  const offsetY = padding + (innerH - spanY * safeScale) / 2;

  const project = (p: LatLng) => ({
    x: offsetX + (mercatorX(p.lng) - minX) * safeScale,
    // SVG y grows downward; Mercator y grows northward.
    y: offsetY + (maxY - mercatorY(p.lat)) * safeScale,
  });

  const projected = usable.map(project);
  const d = projected
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return {
    d,
    start: projected[0],
    end: projected[projected.length - 1],
    width,
    height,
  };
};
