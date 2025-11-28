"use client";

import { useState, useEffect } from "react";
import { GoogleMap, DirectionsRenderer } from "@react-google-maps/api";
import { loadGoogleMaps } from "./lib/loadGoogleMaps";
import { PlaceSelection } from "./lib/places";

interface RouteLegInfo {
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  startAddress?: string;
  endAddress?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
  legs?: RouteLegInfo[];
}

const COUNTRY_LABELS: Record<string, string> = {
  fi: "Finland",
  se: "Sweden",
  no: "Norway",
  dk: "Denmark",
  ee: "Estonia",
  lv: "Latvia",
  lt: "Lithuania",
};

const DEFAULT_COUNTRY_BIASES = ["fi", "se", "no"] as const;

const appendCountryHint = (query: string, countryCode: string): string => {
  const trimmed = query.trim();
  if (!trimmed) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  const label = COUNTRY_LABELS[countryCode.toLowerCase()] ?? countryCode.toUpperCase();

  if (lower.includes(label.toLowerCase())) {
    return trimmed;
  }

  if (trimmed.includes(",")) {
    return trimmed;
  }

  return `${trimmed}, ${label}`;
};

const geocodeAddress = (
  geocoder: google.maps.Geocoder,
  address: string,
  region?: string
): Promise<google.maps.LatLngLiteral | null> => {
  return new Promise((resolve) => {
    if (!address.trim()) {
      resolve(null);
      return;
    }

    geocoder.geocode({ address, region }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const location = results[0]?.geometry?.location;
        if (location) {
          resolve({ lat: location.lat(), lng: location.lng() });
          return;
        }
      }

      resolve(null);
    });
  });
};

const geocodePlaceId = (
  geocoder: google.maps.Geocoder,
  placeId: string
): Promise<google.maps.LatLngLiteral | null> => {
  return new Promise((resolve) => {
    geocoder.geocode({ placeId }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const location = results[0]?.geometry?.location;
        if (location) {
          resolve({ lat: location.lat(), lng: location.lng() });
          return;
        }
      }

      resolve(null);
    });
  });
};

const formatDistance = (meters: number): string => {
  if (!Number.isFinite(meters) || meters <= 0) {
    return "";
  }
  if (meters >= 1000) {
    const km = meters / 1000;
    return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  return `${minutes} min`;
};

interface GoogleMapRideProps {
  onRouteSelected?: (routeInfo: RouteInfo) => void;
  from?: string;
  to?: string;
  fromPlace?: PlaceSelection | null;
  toPlace?: PlaceSelection | null;
  stops?: Array<{ place?: PlaceSelection | null; city?: string; price?: string } | null>;
  countryBiases?: ReadonlyArray<string>;
}

const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#c9e4e8",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#ffffff",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#d0d0d0",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#fafafa",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
];

export default function GoogleMapRide({
  onRouteSelected,
  from = "",
  to = "",
  fromPlace = null,
  toPlace = null,
  stops = [],
  countryBiases = DEFAULT_COUNTRY_BIASES,
}: GoogleMapRideProps) {
  const [directions, setDirections] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [isScriptReady, setIsScriptReady] = useState<boolean>(
    typeof window !== "undefined" && !!window.google?.maps
  );

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        setIsScriptReady(true);
      })
      .catch((err) => {
        console.error("Google Maps script load failed", err);
        setNotificationType("error");
        setNotificationMessage("Google Maps -kirjaston lataaminen epäonnistui.");
        setShowNotification(true);
      });
  }, []);

  useEffect(() => {
    if (!isScriptReady) {
      setDirections(null);
      setRouteInfo(null);
      setLoading(false);
      return;
    }

    const waypointCandidates: google.maps.DirectionsWaypoint[] = [];
    (stops ?? []).forEach((stop) => {
      if (!stop) return;
      const selection = stop.place ?? null;
      if (selection?.placeId) {
        waypointCandidates.push({
          location: { placeId: selection.placeId } as any,
          stopover: true,
        });
        return;
      }

      if (selection?.location) {
        waypointCandidates.push({
          location: selection.location,
          stopover: true,
        });
        return;
      }

      // Skip stops without resolvable place information to avoid ambiguous routing
    });
    const hasText = (value: string | undefined | null) =>
      typeof value === "string" && value.trim().length > 0;

    if (!fromPlace && !hasText(from)) {
      setDirections(null);
      setRouteInfo(null);
      setLoading(false);
      return;
    }

    if (!toPlace && !hasText(to)) {
      setDirections(null);
      setRouteInfo(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const normalizedBiases = (countryBiases || []).filter(Boolean).map((code) => code.toLowerCase());
    const geocoderAvailable = window.google?.maps?.Geocoder;

    if (!geocoderAvailable) {
      setDirections(null);
      setRouteInfo(null);
      setLoading(false);
      setNotificationType("error");
      setNotificationMessage("Geokoodaus ei ole käytettävissä tällä hetkellä.");
      setShowNotification(true);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();

    const resolveWaypoint = async (
      selection: PlaceSelection | null,
      fallback: string
    ): Promise<google.maps.LatLngLiteral | { placeId: string } | null> => {
      if (selection?.location) {
        return selection.location;
      }

      if (selection?.placeId) {
        const placeResult = await geocodePlaceId(geocoder, selection.placeId);
        if (placeResult) {
          return placeResult;
        }

        return { placeId: selection.placeId };
      }

      const candidate = (selection?.description ?? fallback ?? "").trim();
      if (!candidate) {
        return null;
      }

      const biasList = normalizedBiases.length ? normalizedBiases : DEFAULT_COUNTRY_BIASES;

      for (const bias of biasList) {
        const hintedQuery = appendCountryHint(candidate, bias);
        const result = await geocodeAddress(geocoder, hintedQuery, bias);
        if (result) {
          return result;
        }
      }

      const fallbackResult = await geocodeAddress(geocoder, candidate);
      if (fallbackResult) {
        return fallbackResult;
      }

      return null;
    };

    const fetchDirections = async () => {
      setLoading(true);
      setShowNotification(false);

      try {
        const [originResolved, destinationResolved] = await Promise.all([
          resolveWaypoint(fromPlace, from),
          resolveWaypoint(toPlace, to),
        ]);

        if (isCancelled) {
          return;
        }

        if (!originResolved || !destinationResolved) {
          setDirections(null);
          setRouteInfo(null);
          setLoading(false);
          setNotificationType("error");
          setNotificationMessage("Valitse lähtö- ja määränpää paikkalistasta tai tarkenna osoitteita.");
          setShowNotification(true);
          return;
        }

        const directionsService = new window.google.maps.DirectionsService();

        directionsService.route(
          {
            origin: originResolved as any,
            destination: destinationResolved as any,
            travelMode: window.google.maps.TravelMode.DRIVING,
            waypoints: waypointCandidates.length ? waypointCandidates : undefined,
            optimizeWaypoints: false,
          },
          (result: any, status: string) => {
            if (isCancelled) {
              return;
            }

            setLoading(false);

            if (status === "OK" && result?.routes?.length) {
              const route = result.routes[0];
              const legs = (route?.legs ?? []) as google.maps.DirectionsLeg[];

              if (!legs.length) {
                setDirections(null);
                setRouteInfo(null);
                setNotificationType("error");
                setNotificationMessage("Reittiä ei voitu muodostaa valituille sijainneille.");
                setShowNotification(true);
                return;
              }

              let polyline = "";
              if (window.google?.maps?.geometry?.encoding && route.overview_path) {
                polyline = window.google.maps.geometry.encoding.encodePath(route.overview_path);
              }

              const totalDistanceMeters = legs.reduce<number>(
                (sum, current) => sum + (current.distance?.value ?? 0),
                0
              );
              const totalDurationSeconds = legs.reduce<number>(
                (sum, current) => sum + (current.duration?.value ?? 0),
                0
              );

              const primaryLeg = legs[0];
              const distanceText = legs.length > 1
                ? formatDistance(totalDistanceMeters) || primaryLeg?.distance?.text || ""
                : primaryLeg?.distance?.text || formatDistance(totalDistanceMeters);
              const durationText = legs.length > 1
                ? formatDuration(totalDurationSeconds) || primaryLeg?.duration?.text || ""
                : primaryLeg?.duration?.text || formatDuration(totalDurationSeconds);

              const info: RouteInfo = {
                distance: distanceText,
                duration: durationText,
                polyline,
                distanceMeters: totalDistanceMeters,
                durationSeconds: totalDurationSeconds,
                legs: legs.map((leg) => {
                  const legDistanceValue = leg.distance?.value;
                  const legDurationValue = leg.duration?.value;
                  const legDistanceMeters = typeof legDistanceValue === "number" ? legDistanceValue : 0;
                  const legDurationSeconds = typeof legDurationValue === "number" ? legDurationValue : 0;

                  return {
                    distanceMeters: legDistanceMeters,
                    durationSeconds: legDurationSeconds,
                    distanceText: leg.distance?.text || formatDistance(legDistanceMeters),
                    durationText: leg.duration?.text || formatDuration(legDurationSeconds),
                    startAddress: leg.start_address ?? undefined,
                    endAddress: leg.end_address ?? undefined,
                  } as RouteLegInfo;
                }),
              };

              setDirections(result);
              setRouteInfo(info);
              setShowNotification(false);

              if (onRouteSelected) {
                onRouteSelected(info);
              }
            } else {
              setDirections(null);
              setRouteInfo(null);
              setNotificationType("error");
              if (status === "ZERO_RESULTS") {
                setNotificationMessage("Reittiä ei löydy valitulla reitillä ja pysähdyspaikoilla.");
              } else if (status === "NOT_FOUND") {
                setNotificationMessage("Yksi valituista pysähdyspaikoista tai osoitteista ei löytynyt.");
              } else {
                setNotificationMessage(`Reitin haku epäonnistui: ${status}`);
              }
              setShowNotification(true);
            }
          }
        );
      } catch (err) {
        if (isCancelled) {
          return;
        }

        console.error("Directions fetch failed", err);
        setDirections(null);
        setRouteInfo(null);
        setLoading(false);
        setNotificationType("error");
        setNotificationMessage("Reitin hakeminen epäonnistui odottamattoman virheen vuoksi.");
        setShowNotification(true);
      }
    };

    fetchDirections();

    return () => {
      isCancelled = true;
    };
  }, [isScriptReady, from, to, fromPlace, toPlace, stops, onRouteSelected, countryBiases]);

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
    borderRadius: "12px",
    overflow: "hidden",
  };

  const defaultCenter = {
    lat: 60.1699,
    lng: 24.9384,
  };

  const placeholderText = !isScriptReady
    ? "Ladataan karttaa..."
    : !from && !to
      ? "Syötä lähtö- ja määränpää nähdäksesi reitin."
      : "Reitti päivittyy automaattisesti, kun lähtö- ja määränpäätiedot on valittu.";

  const placeholderNode = (
    <div className="w-full h-[400px] rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 px-6 text-center">
      <p className="text-gray-500">{placeholderText}</p>
      {loading && isScriptReady && <p className="text-sm text-gray-400">Haetaan reittiä...</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Notification Modal */}
      {showNotification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded-xl shadow-lg transition-opacity z-50 flex flex-col items-center space-y-3 ${notificationType === "error" ? "bg-red-500" : "bg-shade-500"}`}>
          <p>{notificationMessage}</p>
        </div>
      )}



      {routeInfo && (
        <div className="bg-gradient-to-r from-[#eaf8ec] to-[#f0fdf4] border-l-4 border-[#21a53f] rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Etäisyys</p>
              <p className="text-2xl font-bold text-[#21a53f] mt-1">{routeInfo.distance}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Arvioitu aika</p>
              <p className="text-2xl font-bold text-[#21a53f] mt-1">{routeInfo.duration}</p>
            </div>
          </div>
        </div>
      )}

      {isScriptReady && directions ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          <DirectionsRenderer directions={directions} />
        </GoogleMap>
      ) : (
        placeholderNode
      )}
    </div>
  );
}
