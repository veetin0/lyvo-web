"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// maplibre-gl v5 has no default export.
import { Map as MapLibreMap, Marker, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { decodePolyline } from "@/lib/polyline";
import { RideMiniMap } from "./RideMiniMap";

/**
 * Route drawn over a real basemap.
 *
 * MapLibre GL is BSD-licensed and OpenFreeMap serves OpenMapTiles vector tiles
 * with no key and no account, so this stays free — the reason Google Maps was
 * removed in the first place.
 *
 * Imported dynamically by callers: MapLibre is a large dependency and should not
 * be in the bundle for pages that never draw a map.
 */

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const ROUTE_SOURCE = "lyvo-route";

interface RouteMapProps {
  /** Encoded polyline, precision 5. */
  polyline: string;
  className?: string;
}

export default function RouteMap({ polyline, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  const coordinates = useMemo(
    // GeoJSON wants [lng, lat].
    () => decodePolyline(polyline).map((p) => [p.lng, p.lat] as [number, number]),
    [polyline]
  );

  // Build the map once. Recreating it whenever the route changes tore it down
  // before it could finish loading, so it never rendered at all.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      // A preview, not something to explore; dragging it fights the form.
      interactive: false,
      attributionControl: false,
      center: [25.5, 62.5],
      zoom: 4,
    });
    mapRef.current = map;

    map.on("load", () => setReady(true));

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Feed the route in separately, so a new polyline updates the existing map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || coordinates.length < 2) {
      return;
    }

    const data = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates },
    };

    const existing = map.getSource(ROUTE_SOURCE);
    if (existing) {
      (existing as maplibregl.GeoJSONSource).setData(data);
    } else {
      map.addSource(ROUTE_SOURCE, { type: "geojson", data });
      // Casing underneath keeps the line readable over busy map detail.
      map.addLayer({
        id: `${ROUTE_SOURCE}-casing`,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: `${ROUTE_SOURCE}-line`,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#10B981", "line-width": 4 },
      });
    }

    markersRef.current.forEach((marker) => marker.remove());
    const makeMarker = (label: string, filled: boolean) => {
      const el = document.createElement("div");
      el.className = filled
        ? "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-700 text-xs font-bold text-white"
        : "flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-700 bg-white text-xs font-bold text-emerald-700";
      el.textContent = label;
      return new Marker({ element: el });
    };

    const start = makeMarker("A", false).setLngLat(coordinates[0]).addTo(map);
    const end = makeMarker("B", true)
      .setLngLat(coordinates[coordinates.length - 1])
      .addTo(map);
    markersRef.current = [start, end];

    const bounds = coordinates.reduce(
      (acc, coord) => acc.extend(coord),
      new LngLatBounds(coordinates[0], coordinates[0])
    );
    map.fitBounds(bounds, { padding: 36, animate: false });
  }, [coordinates, ready]);

  return (
    <div className={className ?? "relative h-full w-full"}>
      {/* Sized with h/w rather than inset-0: MapLibre's stylesheet forces
          position:relative onto .maplibregl-map, which cancels absolute
          positioning and collapses the container to zero height. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Until MapLibre reports itself loaded, show the dependency-free route
          shape. If the basemap never initialises the user still sees the route
          rather than an empty box. */}
      {!ready && (
        <div className="absolute inset-0">
          <RideMiniMap polyline={polyline} className="h-full w-full" />
        </div>
      )}

      {/* OpenStreetMap's licence requires visible attribution. */}
      <p className="absolute bottom-0 right-0 bg-white/75 px-1 text-[10px] leading-tight text-neutral-600">
        © OpenStreetMap contributors
      </p>
    </div>
  );
}
