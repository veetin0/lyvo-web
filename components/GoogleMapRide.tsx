"use client";

import { useState, useCallback, useRef } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";

interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
}

interface GoogleMapRideProps {
  onRouteSelected?: (routeInfo: RouteInfo) => void;
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

export default function GoogleMapRide({ onRouteSelected }: GoogleMapRideProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const mapRef = useRef(null);

  const handleFindRoute = async () => {
    if (!from || !to) {
      setNotificationType("error");
      setNotificationMessage("Täytä lähtö- ja päätepaikka");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });

      const data = await response.json();

      console.log("Route response:", data);

      if (!response.ok || data.error) {
        setNotificationType("error");
        setNotificationMessage(`Reitin haku epäonnistui: ${data.error || "Tuntematon virhe"}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        console.error("Error details:", data);
        return;
      }

      setDirections(data.directions);
      setRouteInfo({
        distance: data.distance,
        duration: data.duration,
        polyline: data.polyline,
      });

      if (onRouteSelected) {
        onRouteSelected({
          distance: data.distance,
          duration: data.duration,
          polyline: data.polyline,
        });
      }
    } catch (error) {
      console.error("Error finding route:", error);
      setNotificationType("error");
      setNotificationMessage(`Virhe reitin haussa: ${error instanceof Error ? error.message : "Tuntematon virhe"}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Notification Modal */}
      {showNotification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded-xl shadow-lg transition-opacity z-50 flex flex-col items-center space-y-3 ${notificationType === "error" ? "bg-red-500" : "bg-shade-500"}`}>
          <p>{notificationMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lähtöpaikka</label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Esim. Kamppi, Helsinki"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Päätepaikka</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Esim. Helsinki-Vantaa Airport"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f] transition-all"
          />
        </div>
      </div>

      <button
        onClick={handleFindRoute}
        disabled={loading}
        className="w-full bg-[#21a53f] text-white py-2.5 rounded-lg font-semibold hover:bg-[#1d8e37] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Etsitään reittiä..." : "Etsi reitti"}
      </button>

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

      {directions && (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            ref={mapRef}
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
        </LoadScript>
      )}

      {!directions && (from || to) && (
        <div className="w-full h-[400px] rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-center">
            Paina "Etsi reitti" nähdäksesi kartan ja reitin tiedot
          </p>
        </div>
      )}
    </div>
  );
}
