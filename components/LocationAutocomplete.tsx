"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { searchPlaces, type PlaceSuggestion } from "@/lib/geocoding";
import { PlaceSelection } from "./lib/places";

const DEFAULT_RESTRICT_COUNTRIES: string[] = ["fi", "se", "no"];
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: PlaceSelection) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  restrictCountries?: string[];
}

/**
 * Location field backed by Photon (OpenStreetMap) rather than Google Places.
 *
 * Google's widget attached itself to the input and supplied the dropdown and
 * keyboard handling, so replacing it means owning both. This implements the
 * combobox pattern directly: the input owns aria-activedescendant while focus
 * stays put, and the list is a real listbox.
 *
 * Requests are debounced and superseded ones aborted, so a public, unmetered
 * geocoder is not hit on every keystroke.
 */
export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter location",
  label,
  className = "",
  restrictCountries = DEFAULT_RESTRICT_COUNTRIES,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Picking a suggestion updates `value`, which would otherwise immediately
  // trigger a fresh search for the text we just inserted.
  const skipNextSearchRef = useRef(false);

  const reactId = useId();
  const inputId = `location-${reactId}`;
  const listId = `location-list-${reactId}`;

  const countries = restrictCountries.map((code) => code.toUpperCase());
  const countriesKey = countries.join(",");

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setSuggestions([]);
      setLoading(false);
      setError(null);
      close();
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      searchPlaces(query, { countries: countriesKey ? countriesKey.split(",") : [], signal: controller.signal })
        .then((results) => {
          if (controller.signal.aborted) return;
          setSuggestions(results);
          setActiveIndex(-1);
          setOpen(results.length > 0);
          setError(null);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || (err as Error)?.name === "AbortError") return;
          console.error("Location lookup failed:", err);
          setSuggestions([]);
          setError("Paikkahaku ei juuri nyt vastaa");
          setOpen(false);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, countriesKey, close]);

  // Abort any request still in flight when the field unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close]);

  const choose = (suggestion: PlaceSuggestion) => {
    skipNextSearchRef.current = true;
    onChange(suggestion.description);
    onSelect?.({
      description: suggestion.description,
      location: suggestion.location,
    });
    setSuggestions([]);
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open && suggestions.length > 0) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((i) => (suggestions.length === 0 ? -1 : (i + 1) % suggestions.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (suggestions.length === 0 ? -1 : (i - 1 + suggestions.length) % suggestions.length));
      return;
    }

    if (event.key === "Enter") {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        // The field sits inside the ride form; without this Enter would submit
        // it instead of accepting the highlighted suggestion.
        event.preventDefault();
        choose(suggestions[activeIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key === "Tab") {
      close();
    }
  };

  const activeId = open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={`input mt-1 ${className}`}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-label={label ? undefined : placeholder}
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-emerald-100 bg-white py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-4 py-2 text-sm ${
                index === activeIndex ? "bg-emerald-50 text-emerald-900" : "text-neutral-700"
              }`}
              // mousedown fires before the input's blur, so the click is not lost.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}

      {loading && !error && (
        <p className="mt-1 text-xs text-neutral-500" aria-live="polite">
          Haetaan…
        </p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Attribution is required when using OpenStreetMap data. */}
      {open && suggestions.length > 0 && (
        <p className="absolute right-2 top-full mt-1 text-[10px] text-neutral-400">© OpenStreetMap</p>
      )}
    </div>
  );
}
