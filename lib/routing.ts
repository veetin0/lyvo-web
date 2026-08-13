/**
 * Road routing for the ride form.
 *
 * Google's DirectionsService returned REQUEST_DENIED once billing was disabled
 * on the project, which left ride creation unable to compute a distance at all —
 * and with no distance the server-side price ceiling is skipped entirely. It is
 * also deprecated as of February 2026.
 *
 * OSRM needs no key and returns an encoded polyline at precision 5, the same
 * format the rides table already stores, so decodePolyline keeps working.
 *
 * The public demo server is intended for development rather than production
 * traffic. NEXT_PUBLIC_ROUTING_URL points this at a self-hosted OSRM or another
 * compatible endpoint without touching the callers.
 */

import type { LatLng } from "./polyline";

const ROUTING_BASE =
  process.env.NEXT_PUBLIC_ROUTING_URL ?? "https://router.project-osrm.org";

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  /** Encoded polyline, precision 5. */
  polyline: string;
  legs: RouteLeg[];
}

/** "850 m", "12.4 km", "150 km" — finer detail only where it is meaningful. */
export const formatDistance = (meters: number): string => {
  if (!Number.isFinite(meters) || meters < 0) {
    return "";
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return km < 100 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
};

/** "45 min", "2 h 14 min", "1 h". */
export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "";
  }
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
};

interface OsrmLeg {
  distance?: number;
  duration?: number;
}

interface OsrmRoute {
  distance?: number;
  duration?: number;
  geometry?: string;
  legs?: OsrmLeg[];
}

interface OsrmResponse {
  code?: string;
  routes?: OsrmRoute[];
}

export const parseRouteResponse = (payload: OsrmResponse): RouteResult | null => {
  if (payload?.code !== "Ok") {
    return null;
  }

  const route = payload.routes?.[0];
  if (!route || typeof route.geometry !== "string" || route.geometry.length === 0) {
    return null;
  }

  const distanceMeters = Number(route.distance);
  const durationSeconds = Number(route.duration);
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
    return null;
  }

  return {
    distanceMeters,
    durationSeconds,
    polyline: route.geometry,
    legs: (route.legs ?? []).map((leg) => ({
      distanceMeters: Number.isFinite(Number(leg.distance)) ? Number(leg.distance) : 0,
      durationSeconds: Number.isFinite(Number(leg.duration)) ? Number(leg.duration) : 0,
    })),
  };
};

/**
 * Route through the given points in order. The first and last are the endpoints;
 * anything between them is a stop, and each leg comes back separately so the
 * form can suggest per-stop prices.
 */
export const routeThrough = async (
  points: LatLng[],
  { signal }: { signal?: AbortSignal } = {}
): Promise<RouteResult | null> => {
  const usable = points.filter(
    (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );

  if (usable.length < 2) {
    return null;
  }

  // OSRM takes longitude first.
  const coordinates = usable.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${ROUTING_BASE}/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Routing service responded ${response.status}`);
  }

  return parseRouteResponse((await response.json()) as OsrmResponse);
};
