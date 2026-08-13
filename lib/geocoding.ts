/**
 * Place lookup for the ride form.
 *
 * Google Places Autocomplete billed a session plus a Place Details fetch for
 * every location a driver typed. Photon is an OpenStreetMap geocoder that needs
 * no key and no account, and it returns coordinates directly — which is all the
 * downstream routing actually uses, since routing prefers `location` over
 * `placeId`.
 *
 * The endpoint is a constant so this can be pointed at a self-hosted Photon, or
 * proxied through an API route for caching, without touching the component.
 */

const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";

// Bias results toward central Finland rather than wherever the query happens to
// match best globally.
const BIAS = { lat: 62.5, lon: 25.5 };

export interface PlaceSuggestion {
  /** Stable key for React lists and aria-activedescendant. */
  id: string;
  /** Human-readable label shown in the dropdown and written into the field. */
  description: string;
  location: { lat: number; lng: number };
  countryCode?: string;
}

interface PhotonProperties {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  osm_id?: number;
  osm_type?: string;
  osm_value?: string;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
}

/**
 * Build a readable one-line label.
 *
 * Photon repeats values across fields — a railway station in Helsinki comes back
 * with name "Helsinki" and city "Helsinki" — so identical segments are collapsed
 * rather than rendered as "Helsinki, Helsinki, Uusimaa".
 */
export const formatPlaceLabel = (properties: PhotonProperties): string => {
  const { name, housenumber, street, city, state, country } = properties;

  // A street address is more useful than the bare feature name when present.
  const primary = street ? [street, housenumber].filter(Boolean).join(" ") : name;

  const segments = [primary, city, state, country]
    .map((segment) => (typeof segment === "string" ? segment.trim() : ""))
    .filter((segment) => segment.length > 0);

  const seen = new Set<string>();
  const unique = segments.filter((segment) => {
    const key = segment.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.join(", ");
};

export const toSuggestion = (feature: PhotonFeature, index: number): PlaceSuggestion | null => {
  const coords = feature.geometry?.coordinates;
  const properties = feature.properties;

  if (!properties || !Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  // GeoJSON is [longitude, latitude].
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const description = formatPlaceLabel(properties);
  if (!description) {
    return null;
  }

  return {
    id: `${properties.osm_type ?? "x"}${properties.osm_id ?? index}-${index}`,
    description,
    location: { lat, lng },
    countryCode: properties.countrycode?.toUpperCase(),
  };
};

export interface SearchOptions {
  limit?: number;
  /** Uppercase ISO country codes to keep. Empty means no filtering. */
  countries?: string[];
  signal?: AbortSignal;
}

export const searchPlaces = async (
  query: string,
  { limit = 6, countries = [], signal }: SearchOptions = {}
): Promise<PlaceSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL(PHOTON_ENDPOINT);
  url.searchParams.set("q", trimmed);
  // Ask for extra rows because country filtering happens client-side; Photon has
  // no country parameter.
  url.searchParams.set("limit", String(Math.min(limit * 3, 20)));
  url.searchParams.set("lat", String(BIAS.lat));
  url.searchParams.set("lon", String(BIAS.lon));

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Geocoder responded ${response.status}`);
  }

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const wanted = countries.map((code) => code.toUpperCase());

  const suggestions = (payload.features ?? [])
    .map(toSuggestion)
    .filter((entry): entry is PlaceSuggestion => entry !== null)
    .filter((entry) => wanted.length === 0 || (entry.countryCode ? wanted.includes(entry.countryCode) : false));

  // Collapse duplicate labels — a city and its railway station often format the
  // same way.
  const seen = new Set<string>();
  const deduped = suggestions.filter((entry) => {
    const key = entry.description.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.slice(0, limit);
};
