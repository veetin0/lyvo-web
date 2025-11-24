"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./lib/loadGoogleMaps";

interface RideMiniMapProps {
  polyline: string;
  className?: string;
}

export function RideMiniMap({ polyline, className }: RideMiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!polyline || !containerRef.current) {
        setStatus("idle");
        return;
      }

      if (!cancelled) {
        setStatus("loading");
      }

      try {
        await loadGoogleMaps();
        if (cancelled || !containerRef.current || !polyline) {
          return;
        }

        if (!window.google?.maps?.geometry?.encoding) {
          throw new Error("Google Maps geometry encoding is unavailable");
        }

        const path = window.google.maps.geometry.encoding.decodePath(polyline);
        if (!path.length) {
          if (!cancelled) {
            setStatus("error");
          }
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(containerRef.current, {
            disableDefaultUI: true,
            gestureHandling: "none",
            zoomControl: false,
            mapTypeControl: false,
            clickableIcons: false,
            backgroundColor: "#ecfdf5",
          });
        }

        const map = mapRef.current;
        if (!map) {
          if (!cancelled) {
            setStatus("error");
          }
          return;
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((point: google.maps.LatLng) => bounds.extend(point));
        map.fitBounds(bounds, 32);

        const routeLine = new window.google.maps.Polyline({
          path,
          strokeColor: "#10B981",
          strokeOpacity: 0.85,
          strokeWeight: 4,
          geodesic: true,
        });
        routeLine.setMap(map);
        polylineRef.current = routeLine;

        const startMarker = new window.google.maps.Marker({
          position: path[0],
          map,
          label: {
            text: "A",
            color: "#047857",
            fontWeight: "bold",
          },
        });
        const endMarker = new window.google.maps.Marker({
          position: path[path.length - 1],
          map,
          label: {
            text: "B",
            color: "#047857",
            fontWeight: "bold",
          },
        });

        markersRef.current = [startMarker, endMarker];

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (error) {
        console.error("Failed to initialise ride minimap:", error);
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [polyline]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  const wrapperClassName = className
    ? `relative ${className}`
    : "relative h-full w-full";

  const overlayClassName = `absolute inset-0 flex items-center justify-center text-sm font-medium text-emerald-700 ${status === "error" ? "bg-emerald-100/80" : "bg-emerald-100/60 animate-pulse"}`;

  return (
    <div className={wrapperClassName}>
      <div ref={containerRef} className="absolute inset-0" />
      {status !== "ready" && (
        <div className={overlayClassName} aria-live="polite">
          {status === "error" ? "Map preview unavailable" : "Loading map…"}
        </div>
      )}
    </div>
  );
}
