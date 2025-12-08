"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./lib/loadGoogleMaps";
import { PlaceSelection } from "./lib/places";

const DEFAULT_RESTRICT_COUNTRIES: string[] = ["fi", "se", "no"];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: PlaceSelection) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  restrictCountries?: string[];
}

type AutocompleteLocation = {
  lat(): number;
  lng(): number;
};

type AutocompleteGeometry = {
  location?: AutocompleteLocation;
};

type AutocompletePlace = {
  formatted_address?: string;
  name?: string;
  place_id?: string;
  geometry?: AutocompleteGeometry;
};

type AutocompleteOptions = {
  componentRestrictions?: { country: string[] };
  fields?: string[];
  types?: string[];
  strictBounds?: boolean;
};

interface AutocompleteInstance {
  getPlace(): AutocompletePlace;
  addListener(eventName: "place_changed", handler: () => void): void;
}

interface GoogleMapsPlacesNamespace {
  Autocomplete: new (input: HTMLInputElement, options?: AutocompleteOptions) => AutocompleteInstance;
}

interface GoogleMapsEventNamespace {
  clearInstanceListeners(instance: unknown): void;
}

interface GoogleMapsNamespace {
  places?: GoogleMapsPlacesNamespace;
  event?: GoogleMapsEventNamespace;
}

declare global {
  interface Window {
    google?: { maps?: GoogleMapsNamespace };
  }
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter location",
  label,
  className = "",
  restrictCountries = DEFAULT_RESTRICT_COUNTRIES,
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
    const input = inputRef.current;
    const maps = window.google?.maps;
    const places = maps?.places;

    if (!isLoaded || !input || !places?.Autocomplete) {
      return;
    }

    const autocomplete = new places.Autocomplete(input, {
      componentRestrictions: restrictCountries.length ? { country: restrictCountries } : undefined,
      fields: ["formatted_address", "geometry", "place_id", "name"],
      types: ["geocode"],
      strictBounds: false,
    });

    // Handle place selection
    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();
      const formatted = place.formatted_address || place.name || inputRef.current?.value || "";
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

    return () => {
      maps?.event?.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, onChange, onSelect, restrictCountries]);

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
