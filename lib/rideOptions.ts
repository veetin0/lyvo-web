// Single source of truth for ride option values.
//
// Rides store stable option KEYS (e.g. "electric") in the `rides.options` text[]
// column, never localized labels — labels differ per locale, so a ride created in
// the English UI would never match a filter built from the Finnish label.

export type RideOptionLocale = "fi" | "en" | "sv";

/** Options a driver can toggle when creating a ride, in display order. */
export const RIDE_OPTION_KEYS = [
  "electric",
  "van",
  "pets",
  "quiet",
  "music",
  "ac",
  "talkative",
  "smokeFree",
  "wifi",
  "charging",
  "bikeSpot",
  "pickUp",
  "restStop",
  "startTime",
  "bag",
  "rentCar",
] as const;

export type RideOptionKey = (typeof RIDE_OPTION_KEYS)[number];

/**
 * Derived ride attributes that are not stored in `rides.options` but are shown
 * as filters on the search page.
 */
export const DERIVED_RIDE_FEATURE_KEYS = ["femaleDriver", "popular"] as const;

export type DerivedRideFeatureKey = (typeof DERIVED_RIDE_FEATURE_KEYS)[number];

export const rideOptionLabels: Record<
  RideOptionKey | DerivedRideFeatureKey,
  Record<RideOptionLocale, string>
> = {
  electric: { fi: "Sähköauto", en: "Electric car", sv: "Elbil" },
  van: { fi: "Tila-auto", en: "Van", sv: "Skåpbil" },
  pets: { fi: "Lemmikit sallittu", en: "Pets allowed", sv: "Husdjur tillåtna" },
  quiet: { fi: "Hiljainen kyyti", en: "Quiet ride", sv: "Tyst skjuts" },
  music: { fi: "Musiikkia kyydissä", en: "Music during ride", sv: "Musik under skjutsen" },
  ac: { fi: "Ilmastointi", en: "Air conditioning", sv: "Luftkonditionering" },
  talkative: { fi: "Puhelias kuski", en: "Chatty driver", sv: "Pratglad förare" },
  smokeFree: { fi: "Savuton kyyti", en: "Smoke-free", sv: "Rökfri skjuts" },
  wifi: { fi: "WiFi käytössä", en: "WiFi available", sv: "WiFi tillgängligt" },
  charging: { fi: "Latausmahdollisuus", en: "Phone charging", sv: "Laddningsalternativ" },
  bikeSpot: {
    fi: "Polkupyörän kuljetus mahdollista",
    en: "Bike transportation",
    sv: "Cykeltransport möjlig",
  },
  pickUp: { fi: "Nouto sovittavissa", en: "Pickup available", sv: "Hämtning möjlig" },
  restStop: { fi: "Taukopysähdyksiä matkalla", en: "Rest stops on route", sv: "Raststopp längs vägen" },
  startTime: { fi: "Joustava lähtöaika", en: "Flexible departure", sv: "Flexibel avgångstid" },
  bag: { fi: "Tilaa laukuille", en: "Large luggage space", sv: "Utrymme för bagage" },
  rentCar: { fi: "Vuokra- tai yhteisauto", en: "Rental/shared car", sv: "Hyr-/delad bil" },
  femaleDriver: { fi: "Naiskuljettaja", en: "Female driver", sv: "Kvinnlig förare" },
  popular: { fi: "Suosittu kyyti", en: "Popular ride", sv: "Populär skjuts" },
};

const rideOptionKeySet = new Set<string>(RIDE_OPTION_KEYS);

export const isRideOptionKey = (value: unknown): value is RideOptionKey =>
  typeof value === "string" && rideOptionKeySet.has(value);

/**
 * Localized labels that older clients wrote into `rides.options` before the
 * switch to keys, mapped back to their key so those rows keep filtering and
 * rendering correctly.
 */
const legacyLabelToKey: Map<string, RideOptionKey> = new Map(
  RIDE_OPTION_KEYS.flatMap((key) =>
    (Object.values(rideOptionLabels[key]) as string[]).map(
      (label) => [label.toLowerCase(), key] as [string, RideOptionKey]
    )
  )
);

/** Resolves a stored option value to a canonical key, or null if unrecognized. */
export const toRideOptionKey = (value: unknown): RideOptionKey | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (isRideOptionKey(trimmed)) {
    return trimmed;
  }
  return legacyLabelToKey.get(trimmed.toLowerCase()) ?? null;
};

/**
 * Normalizes a raw `rides.options` value (text[], or a JSON string from older
 * writes) into a deduplicated list of canonical option keys.
 */
export const normalizeRideOptions = (value: unknown): RideOptionKey[] => {
  let entries: unknown[];

  if (Array.isArray(value)) {
    entries = value;
  } else if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      entries = Array.isArray(parsed) ? parsed : [];
    } catch {
      entries = [];
    }
  } else {
    entries = [];
  }

  const seen = new Set<RideOptionKey>();
  for (const entry of entries) {
    const key = toRideOptionKey(entry);
    if (key) {
      seen.add(key);
    }
  }

  // Keep a stable, catalog-defined order regardless of how the row was written.
  return RIDE_OPTION_KEYS.filter((key) => seen.has(key));
};

export const getRideOptionLabel = (option: string, locale: RideOptionLocale): string => {
  const labels = rideOptionLabels[option as RideOptionKey | DerivedRideFeatureKey];
  return labels ? labels[locale] : option;
};
