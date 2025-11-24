"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./lib/loadGoogleMaps";
import { PlaceSelection } from "./lib/places";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: PlaceSelection) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  restrictCountries?: string[];
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter location",
  label,
  className = "",
  restrictCountries = ["fi", "se", "no"],
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Places API on mount
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load Places API:", err);
        setError("Location service unavailable");
        setIsLoaded(false);
      });
  }, []);

  // Initialize Autocomplete when API is loaded and input is ready
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: restrictCountries.length ? { country: restrictCountries } : undefined,
      fields: ["formatted_address", "geometry", "place_id", "name"],
      types: ["geocode"],
      strictBounds: false,
    });

    // Handle place selection
    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();
      const formatted = place.formatted_address || place.name || value;
      if (formatted) {
        onChange(formatted);
      }

      if (onSelect) {
        const location = place.geometry?.location
          ? {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            }
          : undefined;

        onSelect({
          description: formatted ?? "",
          placeId: place.place_id,
          location,
        });
      }
    };

    autocomplete.addListener("place_changed", handlePlaceChanged);

    // Cleanup
    return () => {
      window.google?.maps?.event?.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, onChange]);

  return (
    <div className="relative">
      {label && <label className="label">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input mt-1 ${className}`}
        autoComplete="off"
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
