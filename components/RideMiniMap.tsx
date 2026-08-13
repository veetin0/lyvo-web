"use client";

import { useMemo } from "react";
import { buildRouteShape, decodePolyline } from "@/lib/polyline";

interface RideMiniMapProps {
  polyline: string;
  className?: string;
}

/**
 * Route preview drawn straight from the stored polyline.
 *
 * This used to load the Google Maps JavaScript API — a billed map load every
 * time a ride was opened — to decode a polyline already sitting in the database
 * and draw it over a basemap the user cannot pan or zoom. The shape is the
 * useful part, and it renders as inline SVG with no key, no network request and
 * no cost.
 */
export function RideMiniMap({ polyline, className }: RideMiniMapProps) {
  const shape = useMemo(() => {
    if (!polyline) return null;
    return buildRouteShape(decodePolyline(polyline));
  }, [polyline]);

  const wrapperClassName = className ? `relative ${className}` : "relative h-full w-full";

  if (!shape) {
    return (
      <div className={wrapperClassName}>
        <div
          className="absolute inset-0 flex items-center justify-center bg-emerald-100/60 text-sm font-medium text-emerald-700"
          aria-live="polite"
        >
          Reittiä ei voi näyttää
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <svg
        viewBox={`0 0 ${shape.width} ${shape.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full bg-emerald-50"
        role="img"
        aria-label="Kyydin reitti"
      >
        {/* Soft under-stroke so the line stays legible against the background. */}
        <path
          d={shape.d}
          fill="none"
          stroke="#A7F3D0"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={shape.d}
          fill="none"
          stroke="#10B981"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g>
          <circle cx={shape.start.x} cy={shape.start.y} r={7} fill="#ffffff" stroke="#047857" strokeWidth={2} />
          <text
            x={shape.start.x}
            y={shape.start.y + 3.5}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill="#047857"
          >
            A
          </text>
        </g>
        <g>
          <circle cx={shape.end.x} cy={shape.end.y} r={7} fill="#047857" stroke="#ffffff" strokeWidth={2} />
          <text
            x={shape.end.x}
            y={shape.end.y + 3.5}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill="#ffffff"
          >
            B
          </text>
        </g>
      </svg>
    </div>
  );
}
