"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { searchPlaces } from "@/lib/geocoding";
import type { LatLng } from "@/lib/polyline";
import { formatDistance, formatDuration, routeThrough } from "@/lib/routing";
import { PlaceSelection } from "./lib/places";

// MapLibre is heavy and touches window on import, so it is loaded only when a
// route is actually ready to draw.
const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-emerald-50 text-sm text-emerald-700">
      Ladataan karttaa…
    </div>
  ),
});

interface RouteLegInfo {
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
  legs?: RouteLegInfo[];
}

interface RoutePreviewProps {
  onRouteSelected?: (routeInfo: RouteInfo) => void;
  from?: string;
  to?: string;
  fromPlace?: PlaceSelection | null;
  toPlace?: PlaceSelection | null;
  stops?: Array<{ place?: PlaceSelection | null; city?: string; price?: string } | null>;
  countryBiases?: ReadonlyArray<string>;
}

const DEFAULT_COUNTRY_BIASES = ["fi", "se", "no"] as const;

/**
 * Resolve one endpoint to coordinates.
 *
 * The autocomplete supplies coordinates whenever a suggestion was picked, so the
 * geocoding fallback only runs for text typed and left unconfirmed.
 */
const resolvePoint = async (
  place: PlaceSelection | null | undefined,
  text: string | undefined,
  countries: ReadonlyArray<string>,
  signal: AbortSignal
): Promise<LatLng | null> => {
  if (place?.location && Number.isFinite(place.location.lat) && Number.isFinite(place.location.lng)) {
    return place.location;
  }

  const query = (text ?? "").trim();
  if (query.length < 2) {
    return null;
  }

  const [best] = await searchPlaces(query, { limit: 1, countries: [...countries], signal });
  return best?.location ?? null;
};

/**
 * Route preview for the ride form.
 *
 * Replaces the Google map: routing comes from OSRM and the basemap from
 * OpenFreeMap via MapLibre, so nothing here needs an API key or a billing
 * account. Distance and duration are reported to the parent, which renders
 * them itself — this component must not print them too.
 */
export default function RoutePreview({
  onRouteSelected,
  from,
  to,
  fromPlace,
  toPlace,
  stops = [],
  countryBiases = DEFAULT_COUNTRY_BIASES,
}: RoutePreviewProps) {
  const [polyline, setPolyline] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const abortRef = useRef<AbortController | null>(null);
  // Keeping the callback in a ref stops an inline parent function from
  // retriggering routing on every render.
  const callbackRef = useRef(onRouteSelected);
  callbackRef.current = onRouteSelected;

  const stopsKey = JSON.stringify(
    (stops ?? []).map((stop) => stop?.place?.location ?? stop?.city ?? null)
  );
  const countriesKey = countryBiases.join(",");
  const fromKey = fromPlace?.location ? `${fromPlace.location.lat},${fromPlace.location.lng}` : (from ?? "");
  const toKey = toPlace?.location ? `${toPlace.location.lat},${toPlace.location.lng}` : (to ?? "");

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      const countries = countriesKey ? countriesKey.split(",") : [];

      const origin = await resolvePoint(fromPlace, from, countries, controller.signal);
      const destination = await resolvePoint(toPlace, to, countries, controller.signal);

      if (controller.signal.aborted) return;
      if (!origin || !destination) {
        setPolyline(null);
        setStatus("idle");
        return;
      }

      const waypoints: LatLng[] = [];
      for (const stop of stops ?? []) {
        const point = await resolvePoint(stop?.place, stop?.city, countries, controller.signal);
        if (point) waypoints.push(point);
      }
      if (controller.signal.aborted) return;

      setStatus("loading");

      try {
        const result = await routeThrough([origin, ...waypoints, destination], {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        if (!result) {
          setPolyline(null);
          setStatus("error");
          return;
        }

        const distanceText = formatDistance(result.distanceMeters);
        const durationText = formatDuration(result.durationSeconds);

        setPolyline(result.polyline);
        setStatus("idle");

        callbackRef.current?.({
          distance: distanceText,
          duration: durationText,
          polyline: result.polyline,
          distanceMeters: result.distanceMeters,
          durationSeconds: result.durationSeconds,
          legs: result.legs.map((leg) => ({
            distanceMeters: leg.distanceMeters,
            durationSeconds: leg.durationSeconds,
            distanceText: formatDistance(leg.distanceMeters),
            durationText: formatDuration(leg.durationSeconds),
          })),
        });
      } catch (error) {
        if (controller.signal.aborted || (error as Error)?.name === "AbortError") return;
        console.error("Route lookup failed:", error);
        setPolyline(null);
        setStatus("error");
      }
    };

    // A superseded lookup rejects with AbortError. That is the intended outcome
    // of aborting, not a failure, but it still has to be caught: run() was
    // invoked bare, so the rejection escaped as an unhandled promise rejection.
    run().catch((error: unknown) => {
      if (controller.signal.aborted || (error as Error)?.name === "AbortError") {
        return;
      }
      console.error("Route preview failed:", error);
      setPolyline(null);
      setStatus("error");
    });

    return () => controller.abort();
    // fromPlace/toPlace/stops are covered by the derived keys below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey, toKey, stopsKey, countriesKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="w-full">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-emerald-100">
        {polyline ? (
          <RouteMap polyline={polyline} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-50 px-4 text-center text-sm text-emerald-700">
            {status === "loading"
              ? "Lasketaan reittiä…"
              : status === "error"
                ? "Reitin laskeminen ei onnistunut"
                : "Valitse lähtöpaikka ja määränpää nähdäksesi reitin"}
          </div>
        )}
      </div>

    </div>
  );
}
