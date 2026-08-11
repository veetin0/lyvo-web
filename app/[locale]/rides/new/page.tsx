// Move "use client" to the very top
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import GoogleMapRide from "@/components/GoogleMapRide";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import StopLocationInput from "@/components/StopLocationInput";
import { PlaceSelection } from "@/components/lib/places";

type RideStop = {
  city: string;
  price: string;
  place?: PlaceSelection | null;
};

type RouteLegInfo = {
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  startAddress?: string;
  endAddress?: string;
};

const translations = {
  fi: {
    title: "Lisää kyyti",
    from: "Lähtö",
    fromPlaceholder: "Kirjoita lähtöpaikka",
    to: "Määränpää",
    toPlaceholder: "Kirjoita määränpää",
    date: "Päivämäärä",
    time: "Lähtöaika",
    seats: "Vapaita paikkoja",
    price: "Pyyntihinta (€)",
  priceLimitInfo: "Suurin sallittu hinta per matkustaja ({rate} €/km / {seats}): {price} €",
  priceLimitExceeded: "Hinta ylittää sallitun enimmäishinnan per matkustaja ({price} €).",
    addRide: "Lisää kyyti",
    carBrand: "Auton merkki",
    carImage: "Auton kuva",
    selectImage: "Valitse kuva",
    features: "Kyytiominaisuudet",
    notes: "Lisätiedot kyydistä",
    recurring: "Toistuva kyyti",
    stops: "Pysähdyspaikkakavalikat",
  stopLabel: "Pysähdyspaikka {number}",
    addStop: "Lisää pysähdyspaikka",
    removeStop: "Poista pysähdyspaikka",
    stopCity: "Pysähdyskaupunki",
    stopPrice: "Hinta pysähdyspisteestä (€)",
  stopPriceSuggestion: "Suositus: {price} €",
    notificationSuccess: "Kyyti lisätty onnistuneesti!",
    notificationError: "Virhe kyytieä lisättäessä",
    loginRequired: "Kirjaudu ensin sisään lisätäksesi kyydin!",
  },
  en: {
    title: "Create New Ride",
    from: "Departure Location",
    fromPlaceholder: "Enter starting location",
    to: "Destination",
    toPlaceholder: "Enter destination",
    date: "Date",
    time: "Departure Time",
    seats: "Available Seats",
    price: "Price (€)",
  priceLimitInfo: "Maximum allowed price per passenger ({rate} €/km / {seats}): {price} €",
  priceLimitExceeded: "Price exceeds the allowed maximum per passenger ({price} €).",
    addRide: "Add Ride",
    carBrand: "Car Brand",
    carImage: "Car Image",
    selectImage: "Select Image",
    features: "Ride Features",
    notes: "Additional Notes",
    recurring: "Recurring Ride",
    stops: "Stopping Points",
  stopLabel: "Stop #{number}",
    addStop: "Add Stop",
    removeStop: "Remove Stop",
    stopCity: "Stop City",
    stopPrice: "Price from Stop (€)",
  stopPriceSuggestion: "Suggested: {price} €",
    notificationSuccess: "Ride added successfully!",
    notificationError: "Error adding ride",
    loginRequired: "Sign in to add a ride!",
  },
  sv: {
    title: "Lägg till skjuts",
    from: "Från",
    fromPlaceholder: "Skriv avgångsplats",
    to: "Till",
    toPlaceholder: "Skriv destination",
    date: "Datum",
    time: "Avgångstid",
    seats: "Lediga platser",
    price: "Pris (€)",
  priceLimitInfo: "Högsta tillåtna pris per passagerare ({rate} €/km / {seats}): {price} €",
  priceLimitExceeded: "Priset överskrider det tillåtna maxpriset per passagerare ({price} €).",
    addRide: "Lägg till skjuts",
    carBrand: "Bilmärke",
    carImage: "Bilbild",
    selectImage: "Välj bild",
    features: "Skjutsegenskaper",
    notes: "Ytterligare information",
    recurring: "Återkommande skjuts",
    stops: "Hållplatser",
  stopLabel: "Stopp #{number}",
    addStop: "Lägg till stopp",
    removeStop: "Ta bort stopp",
    stopCity: "Stoppstad",
    stopPrice: "Pris från stopp (€)",
  stopPriceSuggestion: "Förslag: {price} €",
    notificationSuccess: "Skjutsen tillagd!",
    notificationError: "Fel vid tilläggning av skjuts",
    loginRequired: "Logga in för att lägga till en skjuts!",
  },
};

const TOTAL_MAX_RATE_PER_KM = 0.15;

const formatNumberForLocale = (value: number, locale: keyof typeof translations): string => {
  if (!Number.isFinite(value)) {
    return "0.00";
  }
  return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

type SessionUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

export default function NewRide() {
  const pathname = usePathname();
  const locale = useMemo(() => {
    const rawLocale = pathname.split("/")[1] || "fi";
    return (Object.prototype.hasOwnProperty.call(translations, rawLocale) ? rawLocale : "en") as keyof typeof translations;
  }, [pathname]);
  const t = translations[locale] || translations.en;

  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = !!session;
  const sessionUser = (session?.user as SessionUser | null) ?? null;
  const sessionUserId = typeof sessionUser?.id === "string" ? sessionUser.id : null;

  const cityCountries: Record<string, string> = {
    Helsinki: "Finland", Espoo: "Finland", Vantaa: "Finland", Tampere: "Finland", Turku: "Finland",
    Oulu: "Finland", Jyväskylä: "Finland", Kuopio: "Finland", Lahti: "Finland", Pori: "Finland",
    Joensuu: "Finland", Lappeenranta: "Finland", Vaasa: "Finland", Rovaniemi: "Finland",
    Tukholma: "Sweden", Göteborg: "Sweden", Malmö: "Sweden", Uppsala: "Sweden",
    Oslo: "Norway", Bergen: "Norway", Trondheim: "Norway", Stavanger: "Norway",
    Kööpenhamina: "Denmark", Aarhus: "Denmark", Odense: "Denmark", Aalborg: "Denmark",
    Tallinna: "Estonia", Riga: "Latvia", Vilna: "Lithuania"
  };
  const [ride, setRide] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    seats: 1,
    price: "",
    options: {
      electric: false,
      van: false,
      pets: false,
      quiet: false,
      music: false,
      ac: false,
      talkative: false,
      smokeFree: false,
      wifi: false,
      charging: false,
      bikeSpot: false,
      pickUp: false,
      restStop: false,
      startTime: false,
      bag: false,
      rentCar: false,
    },
    notes: "",
  });

  // Stops state: array of stop metadata with optional place details
  const [stops, setStops] = useState<RideStop[]>([]);
  const [fromSelection, setFromSelection] = useState<PlaceSelection | null>(null);
  const [toSelection, setToSelection] = useState<PlaceSelection | null>(null);

  // Recurring ride state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [distance, setDistance] = useState<string>("");
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [duration, setDuration] = useState<string>("");
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [routeLegs, setRouteLegs] = useState<RouteLegInfo[]>([]);
  const [stopPriceSuggestions, setStopPriceSuggestions] = useState<(number | null)[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");

  const handleRouteSelected = (routeInfo: {
    distance: string;
    duration: string;
    polyline: string;
    distanceMeters: number;
    durationSeconds: number;
    legs?: RouteLegInfo[];
  }) => {
    setDistance(routeInfo.distance);
    setDuration(routeInfo.duration);
    setDistanceMeters(Number.isFinite(routeInfo.distanceMeters) ? routeInfo.distanceMeters : null);
    setDurationSeconds(Number.isFinite(routeInfo.durationSeconds) ? routeInfo.durationSeconds : null);
    setRoutePolyline(routeInfo.polyline || null);
    setRouteLegs(routeInfo.legs ?? []);
  };

  const resetRouteEstimates = useCallback(() => {
    setDistance("");
    setDuration("");
    setDistanceMeters(null);
    setDurationSeconds(null);
    setRoutePolyline(null);
    setRouteLegs([]);
    setStopPriceSuggestions([]);
  }, [setDistance, setDuration, setDistanceMeters, setDurationSeconds, setRoutePolyline, setRouteLegs, setStopPriceSuggestions]);

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");

  const seatsCount = Math.max(
    Number.isFinite(ride.seats) ? Math.floor(ride.seats) : 1,
    1
  );

  const perPassengerRate = useMemo(() => TOTAL_MAX_RATE_PER_KM / seatsCount, [seatsCount]);

  const maxPrice = useMemo(() => {
    if (distanceMeters === null || distanceMeters <= 0) {
      return null;
    }
    const distanceKm = distanceMeters / 1000;
    return Math.round(distanceKm * perPassengerRate * 100) / 100;
  }, [distanceMeters, perPassengerRate]);

  const hasPriceValue = ride.price !== "" && !Number.isNaN(Number(ride.price));
  const priceNumber = hasPriceValue ? Number(ride.price) : null;
  const isPriceOverLimit = Boolean(maxPrice !== null && priceNumber !== null && priceNumber > maxPrice);

  const maxPriceDisplay = maxPrice !== null ? formatNumberForLocale(maxPrice, locale) : null;
  const totalRateDisplay = formatNumberForLocale(TOTAL_MAX_RATE_PER_KM, locale);
  const priceLimitInfo = maxPriceDisplay
    ? t.priceLimitInfo
        .replace("{rate}", totalRateDisplay)
        .replace("{seats}", seatsCount.toString())
        .replace("{price}", maxPriceDisplay)
    : null;
  const priceLimitExceededMessage = isPriceOverLimit && maxPriceDisplay
    ? t.priceLimitExceeded.replace("{price}", maxPriceDisplay)
    : null;
  const isSubmitDisabled = isPriceOverLimit;

  // Älykkäät ehdotukset ja auton merkki/kuva -tilat
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [carBrand, setCarBrand] = useState("");
  const [carImage, setCarImage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "seats") {
      setRide({ ...ride, seats: Number(value) });
    } else {
      setRide({ ...ride, [name]: value });
    }
  };

  const handleOptionToggle = (option: keyof typeof ride.options) => {
    setRide({
      ...ride,
      options: { ...ride.options, [option]: !ride.options[option] },
    });
  };

  // Stop management handlers
  const handleAddStop = () => {
    setStops((prev) => [...prev, { city: "", price: "", place: null }]);
    resetRouteEstimates();
  };

  const handleRemoveStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    resetRouteEstimates();
  };

  const handleStopChange = useCallback((index: number, field: "city" | "price", value: string) => {
    setStops((prev) => {
      const updated = [...prev];
      const nextStop = { ...updated[index], [field]: value } as RideStop;
      if (field === "city") {
        nextStop.place = null;
      }
      updated[index] = nextStop;
      return updated;
    });
    if (field === "city") {
      resetRouteEstimates();
    }
  }, [resetRouteEstimates]);

  const handleStopSelect = useCallback((index: number, selection: PlaceSelection) => {
    setStops((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        city: selection.description,
        place: selection,
      };
      return updated;
    });
    resetRouteEstimates();
  }, [resetRouteEstimates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !sessionUserId) {
      setNotificationType("error");
      setNotificationMessage("Kirjaudu ensin sisään lisätäksesi kyydin!");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    const fromCountry = cityCountries[ride.from];
    const toCountry = cityCountries[ride.to];
    if (fromCountry && toCountry && fromCountry !== toCountry) {
      setNotificationType("error");
      setNotificationMessage("Lähtö- ja kohdekaupungin on oltava samasta maasta.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    if (maxPrice !== null && priceNumber !== null && priceNumber > maxPrice) {
      const limitMessage = t.priceLimitExceeded.replace(
        "{price}",
        maxPriceDisplay ?? formatNumberForLocale(maxPrice, locale)
      );
      setNotificationType("error");
      setNotificationMessage(limitMessage);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    // Ride creation goes through the API so ownership and the price ceiling are
    // enforced on the server. Owner, driver name and rating are derived from
    // the session there and deliberately not sent from here.
    const response = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: ride.from,
        to: ride.to,
        date: ride.date,
        time: ride.time,
        seats: ride.seats,
        price: Number(ride.price),
        car: carBrand || null,
        stops,
        distanceMeters: distanceMeters !== null ? Math.round(distanceMeters) : null,
        durationSeconds: durationSeconds !== null ? Math.round(durationSeconds) : null,
        routePolyline,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.error ?? `HTTP ${response.status}`;
      console.error("Virhe tallennuksessa:", message);
      setNotificationType("error");
      setNotificationMessage(`Virhe tallennuksessa: ${message}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else {
      setNotificationType("success");
      setNotificationMessage("Kyyti lisätty onnistuneesti!");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        router.push(`/${locale}/rides`);
      }, 1500);
    }
  };

  // Toistuvan kyydin viikonpäivien valinta
  const weekDays = [
    { key: "ma", label: "Ma" },
    { key: "ti", label: "Ti" },
    { key: "ke", label: "Ke" },
    { key: "to", label: "To" },
    { key: "pe", label: "Pe" },
    { key: "la", label: "La" },
    { key: "su", label: "Su" },
  ];
  const handleDayToggle = (day: string) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Simuloi reitti-integraatio: kun from ja to on täytetty, laske satunnaisesti etäisyys ja kesto
  useEffect(() => {
    if (!ride.from || !ride.to) {
      resetRouteEstimates();
    }
  }, [ride.from, ride.to, resetRouteEstimates]);

  useEffect(() => {
    if (!stops.length || !routeLegs.length || perPassengerRate <= 0) {
      setStopPriceSuggestions([]);
      return;
    }

    const suggestions = stops.map((_, index) => {
      const remainingLegs = routeLegs.slice(index + 1);
      if (!remainingLegs.length) {
        return null;
      }

      const distanceMetersRemaining = remainingLegs.reduce(
        (sum, leg) => sum + (Number.isFinite(leg.distanceMeters) ? leg.distanceMeters : 0),
        0
      );

      if (!Number.isFinite(distanceMetersRemaining) || distanceMetersRemaining <= 0) {
        return null;
      }

      const distanceKm = distanceMetersRemaining / 1000;
      const suggested = Math.round(distanceKm * perPassengerRate * 100) / 100;

      if (!Number.isFinite(suggested) || suggested <= 0) {
        return null;
      }

      return suggested;
    });

    setStopPriceSuggestions(suggestions);

    setStops((prev) => {
      let changed = false;

      const next = prev.map((stop, index) => {
        const suggestion = suggestions[index];

        if (stop.price && stop.price.trim() !== "") {
          return stop;
        }

        if (suggestion === null || suggestion === undefined) {
          return stop;
        }

        changed = true;
        return {
          ...stop,
          price: suggestion.toFixed(2),
        };
      });

      return changed ? next : prev;
    });
  }, [stops, routeLegs, perPassengerRate]);

  // Progressbar: laske täyttöaste
  useEffect(() => {
    let filled = 0;
    const total = 7 + (isRecurring ? 1 : 0); // kentät: from, to, date, time, seats, price, notes, (+recurrenceDays jos toistuva)
    if (ride.from) filled++;
    if (ride.to) filled++;
    if (ride.date) filled++;
    if (ride.time) filled++;
    if (ride.seats) filled++;
    if (ride.price) filled++;
    if (ride.notes) filled++;
    if (isRecurring) filled += recurrenceDays.length > 0 ? 1 : 0;
    setProgress(Math.round((filled / total) * 100));
  }, [ride, isRecurring, recurrenceDays]);

  // Ehdotukset: älykkäät vinkit käyttäjälle
  useEffect(() => {
    const newSuggestions: string[] = [];
    if (ride.options.electric) {
      if (locale === "fi") newSuggestions.push("Lisää 'Hiljainen kyyti' ja 'Latausmahdollisuus'.");
      else if (locale === "sv") newSuggestions.push("Lägg till 'Tyst skjuts' och 'Laddningsalternativ'.");
      else newSuggestions.push("Add 'Quiet ride' and 'Phone charging'.");
    }
    if (!ride.price) {
      if (locale === "fi") newSuggestions.push("Aseta pyyntihinta — tyypillinen hinta on noin 10€ / 100 km.");
      else if (locale === "sv") newSuggestions.push("Ange pris — typiskt pris är omkring 10€ / 100 km.");
      else newSuggestions.push("Set a price — typical price is around 10€ / 100 km.");
    }
    if (distance && duration) {
      if (locale === "fi") newSuggestions.push(`Matkan arvioitu kesto: ${duration}.`);
      else if (locale === "sv") newSuggestions.push(`Beräknad restid: ${duration}.`);
      else newSuggestions.push(`Estimated trip duration: ${duration}.`);
    }
    if (ride.from && ride.to && !ride.date) {
      if (locale === "fi") newSuggestions.push("Valitse päivämäärä, jotta matkustajat voivat varata kyydin.");
      else if (locale === "sv") newSuggestions.push("Välj ett datum så passagerare kan boka skjutsen.");
      else newSuggestions.push("Select a date so passengers can book the ride.");
    }
    setSuggestions(newSuggestions);
  }, [ride, distance, duration, locale]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative min-h-screen bg-gradient-to-b from-shade-100 via-shade-50 to-white py-16 px-4 text-center overflow-visible"
    >
      {/* Background animations - positioned behind all content */}
      <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
        {/* Pehmeä vihreä valoefekti yläosassa */}
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-emerald-200/30 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/3" />

        {/* Hienovarainen aalto- tai kuvioefekti */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(0,128,0,0.05) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(0,128,0,0.05) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
      {/* Ilmoituspalkki */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-shade-500 text-white px-6 py-3 rounded-xl shadow-lg transition-opacity z-50 flex flex-col items-center space-y-3">
          <p>Kyyti lisätty onnistuneesti!</p>
          <div className="flex gap-3">
            <Link href={`/${locale}`} className="bg-white text-shade-600 px-4 py-2 rounded-lg font-semibold hover:bg-shade-50 transition">
              Palaa etusivulle
            </Link>
            <Link href={`/${locale}/rides`} className="bg-shade-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-shade-700 transition">
              Näytä lisätty kyyti
            </Link>
          </div>
        </div>
      )}
      {status === "loading" ? (
        <p className="text-center mt-10 text-gray-600">Ladataan...</p>
      ) : !isLoggedIn ? (
        <p className="text-center mt-10 text-gray-600">Kirjaudu sisään lisätäksesi kyydin 🚗</p>
      ) : (
        <>
      <h1 className="text-4xl font-bold text-shade-700 mb-8">{t.title}</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto bg-white rounded-2xl shadow-soft p-8 text-left space-y-6"
      >
        {/* Progressbar */}
        <div className="mb-6">
          <div className="h-2 bg-shade-300 rounded-full overflow-hidden">
            <div
              className="bg-shade-500 h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {/* From and To Fields - Using Google Places Autocomplete */}
        <div className="flex gap-4">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <label className="label">{t.from}</label>
              <div className="relative group">
                <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                  {locale === "fi" ? "Kirjoita lähtöpaikka, esim. 'Töölö' ja valitse ehdotuksista." : locale === "sv" ? "Skriv avgångsplatsen, t.ex. 'Tölö' och välj från förslagen." : "Type the starting location, e.g. 'Töölö' and select from suggestions."}
                </div>
              </div>
            </div>
            <LocationAutocomplete
              value={ride.from}
              onChange={(value) => {
                setRide((prev) => ({ ...prev, from: value }));
                setFromSelection(null);
                resetRouteEstimates();
              }}
              onSelect={(selection) => {
                setRide((prev) => ({ ...prev, from: selection.description }));
                setFromSelection(selection);
                resetRouteEstimates();
              }}
              placeholder={t.fromPlaceholder}
              className="mt-1"
            />
          </motion.div>

          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="flex items-center gap-2">
              <label className="label">{t.to}</label>
              <div className="relative group">
                <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                  {locale === "fi" ? "Kirjoita kohdekaupunki, esim. 'Espoo' ja valitse ehdotuksista." : locale === "sv" ? "Skriv destinationsstaden, t.ex. 'Esbo' och välj från förslagen." : "Type the destination, e.g. 'Espoo' and select from suggestions."}
                </div>
              </div>
            </div>
            <LocationAutocomplete
              value={ride.to}
              onChange={(value) => {
                setRide((prev) => ({ ...prev, to: value }));
                setToSelection(null);
                resetRouteEstimates();
              }}
              onSelect={(selection) => {
                setRide((prev) => ({ ...prev, to: selection.description }));
                setToSelection(selection);
                resetRouteEstimates();
              }}
              placeholder={t.toPlaceholder}
              className="mt-1"
            />
          </motion.div>
        </div>

        {/* Stops Section - Only show after from/to are filled */}
        {ride.from && ride.to && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <label className="label">{t.stops}</label>
              <div className="relative group">
                <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                  {locale === "fi" ? "Lisää pysähdyspaikat, joista matkustajat voivat nousta kyytiin." : locale === "sv" ? "Lägg till stopp där passagerare kan kliva in." : "Add stops where passengers can board."}
                </div>
              </div>
            </div>
            
            {stops.length === 0 && (
              <div className="rounded-xl border border-dashed border-shade-200 bg-white/60 px-4 py-5 text-sm text-neutral-600">
                {locale === "fi"
                  ? "Lisää ensimmäinen pysähdyspaikka – voit määrittää kaupungin ja pysähdyshinnan."
                  : locale === "sv"
                    ? "Lägg till det första stoppet – ange stad och pris för hållplatsen."
                    : "Add your first stop – specify the city and an optional price for the pickup."}
              </div>
            )}

            {stops.map((stop, index) => (
              <div
                key={`stop-${index}`}
                className="relative mb-4 rounded-xl border border-shade-200 bg-white/90 p-4 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-shade-600">
                    {t.stopLabel.replace("{number}", String(index + 1))}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(index)}
                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <span aria-hidden>×</span>
                    {t.removeStop}
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,140px)]">
                <StopLocationInput
                  value={stop.city}
                  onChange={(value) => handleStopChange(index, "city", value)}
                  onSelect={(selection) => handleStopSelect(index, selection)}
                  placeholder={t.stopCity}
                />
                  <div className="relative">
                    <input
                      type="number"
                      value={stop.price}
                      onChange={(e) => handleStopChange(index, "price", e.target.value)}
                      placeholder={t.stopPrice}
                      className="input pr-10"
                      min="0"
                      step="0.1"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-neutral-500">€</span>
                    {stopPriceSuggestions[index] !== null && stopPriceSuggestions[index] !== undefined && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.stopPriceSuggestion.replace("{price}", stopPriceSuggestions[index]!.toFixed(2))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddStop}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-shade-300 bg-white px-4 py-2 text-sm font-semibold text-shade-600 transition hover:bg-shade-100"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-shade-500 text-white">+</span>
              {t.addStop}
            </button>
          </motion.div>
        )}

        {/* Google Maps Component - Shows below from/to fields */}
        {ride.from && ride.to && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <GoogleMapRide
              onRouteSelected={handleRouteSelected}
              from={ride.from}
              to={ride.to}
              fromPlace={fromSelection}
              toPlace={toSelection}
              stops={stops}
            />
          </motion.div>
        )}

        {/* Distance and Duration Info */}
        {distance && duration && (
          <div className="text-shade-600 text-sm">
            Matka: <span className="font-semibold">{distance}</span> &nbsp; | &nbsp; Kesto: <span className="font-semibold">{duration}</span>
          </div>
        )}

        <div className="flex gap-4">
          <motion.div
            className="w-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <label className="label">{t.date}</label>
              <div className="relative group">
                <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                  {locale === "fi" ? "Valitse matkasi päivämäärä." : locale === "sv" ? "Välj datumet för din resa." : "Select the date for your trip."}
                </div>
              </div>
            </div>
            <input
              type="date"
              name="date"
              value={ride.date}
              onChange={handleChange}
              className="input mt-1"
              required
            />
          </motion.div>

          <motion.div
            className="w-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center gap-2">
              <label className="label">{t.time}</label>
              <div className="relative group">
                <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                  {locale === "fi" ? "Mihin aikaan kyyti lähtee liikkeelle." : locale === "sv" ? "Vad är tiden för avgång?" : "What time does the ride depart?"}
                </div>
              </div>
            </div>
            <input
              type="time"
              name="time"
              value={ride.time}
              onChange={handleChange}
              className="input mt-1"
              required
            />
          </motion.div>
        </div>

        <motion.div
          className="w-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <label className="label">{t.seats}</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                {locale === "fi" ? "Kuinka monta matkustajaa mahtuu kyytiin." : locale === "sv" ? "Hur många passagerare får plats i fordonet?" : "How many passengers fit in your vehicle?"}
              </div>
            </div>
          </div>
          <input
            type="number"
            name="seats"
            value={ride.seats}
            onChange={(e) => setRide({ ...ride, seats: Number(e.target.value) })}
            min="1"
            max="10"
            className="input mt-1"
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center gap-2">
            <label className="label">{t.price}</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                {locale === "fi" ? "Paljonko pyydät kyydistä per henkilö." : locale === "sv" ? "Vad åtalar du för skjutsen per person?" : "How much do you charge per person?"}
              </div>
            </div>
          </div>
          <input
            type="number"
            name="price"
            value={ride.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            max={maxPrice ?? undefined}
            aria-invalid={isPriceOverLimit}
            className="input mt-1"
            required
          />
          {priceLimitInfo && (
            <p className="mt-1 text-xs text-neutral-500">{priceLimitInfo}</p>
          )}
          {priceLimitExceededMessage && (
            <p className="mt-1 text-xs text-red-600">{priceLimitExceededMessage}</p>
          )}
          <button
            type="button"
            onClick={() => setShowDiscount(!showDiscount)}
            className="mt-2 text-sm text-shade-600 hover:text-shade-700 underline"
          >
            {locale === "fi" ? "Lisävalinnat" : locale === "sv" ? "Ytterligare alternativ" : "More options"}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none">
              {locale === "fi" ? "Halutessasi voit tarjota alennetun hinnan, jos auto täyttyy kokonaan." : locale === "sv" ? "Du kan erbjuda ett rabatterat pris om bilen fylls." : "You can offer a discounted price if the car fills up."}
            </div>
          </button>
          {showDiscount && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <label className="label">{locale === "fi" ? "Alennettu hinta (€)" : locale === "sv" ? "Rabatterat pris (€)" : "Discounted price (€)"}</label>
                <div className="relative group">
                  <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                  <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                    {locale === "fi" ? "Halutessasi voit tarjota alennetun hinnan, jos auto täyttyy kokonaan." : locale === "sv" ? "Du kan erbjuda ett rabatterat pris om bilen fylls." : "You can offer a discounted price if the car fills up."}
                  </div>
                </div>
              </div>
              <input
                type="number"
                name="discountPrice"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                min="0"
                className="input mt-1"
              />
            </div>
          )}
        </motion.div>

        {/* Auton merkki ja kuva ennen Lisätiedot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div>
            <label className="label">{t.carBrand}</label>
            <input
              type="text"
              value={carBrand}
              onChange={(e) => setCarBrand(e.target.value)}
              placeholder={locale === "fi" ? "Esim. Tesla, Toyota..." : locale === "sv" ? "T.ex. Tesla, Toyota..." : "E.g. Tesla, Toyota..."}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="label">{t.carImage}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setCarImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="input mt-1"
            />
            {carImage && (
              <Image
                src={carImage}
                alt={locale === "fi" ? "Auton kuva" : locale === "sv" ? "Bilbild" : "Car image"}
                width={800}
                height={450}
                unoptimized
                className="mt-3 w-full rounded-xl shadow-md h-auto"
              />
            )}
          </div>
        </motion.div>

        <div>
          <div className="flex items-center gap-2 mb-2 block">
            <label className="label">{t.features}</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                {locale === "fi" ? "Lisää kyytiominaisuuksia ja erotu joukosta paremmin." : locale === "sv" ? "Lägg till skjutsegenskaper och sticka ut bättre." : "Add ride features to stand out better."}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-shade-300 scrollbar-track-shade-50 rounded-xl">
            {[
              { key: "electric", label: locale === "fi" ? "Sähköauto" : locale === "sv" ? "Elbilar" : "Electric car" },
              { key: "van", label: locale === "fi" ? "Tila-auto" : locale === "sv" ? "Skåpbil" : "Van" },
              { key: "pets", label: locale === "fi" ? "Lemmikit sallittu" : locale === "sv" ? "Husdjur tillåtna" : "Pets allowed" },
              { key: "quiet", label: locale === "fi" ? "Hiljainen kyyti" : locale === "sv" ? "Tyst skjuts" : "Quiet ride" },
              { key: "music", label: locale === "fi" ? "Musiikkia kyydissä" : locale === "sv" ? "Musik under skjutsen" : "Music during ride" },
              { key: "ac", label: locale === "fi" ? "Ilmastointi" : locale === "sv" ? "Luftkonditionering" : "Air conditioning" },
              { key: "talkative", label: locale === "fi" ? "Puhelias kuski" : locale === "sv" ? "Pratgladd förare" : "Chatty driver" },
              { key: "smokeFree", label: locale === "fi" ? "Savuton kyyti" : locale === "sv" ? "Rökfri skjuts" : "Smoke-free" },
              { key: "wifi", label: locale === "fi" ? "WiFi käytössä" : locale === "sv" ? "WiFi tillgängligt" : "WiFi available" },
              { key: "charging", label: locale === "fi" ? "Latausmahdollisuus" : locale === "sv" ? "Laddningsalternativ" : "Phone charging" },
              { key: "bikeSpot", label: locale === "fi" ? "Polkupyörän kuljetus mahdollista" : locale === "sv" ? "Cykelöverföring möjlig" : "Bike transportation" },
              { key: "pickUp", label: locale === "fi" ? "Nouto sovittavissa" : locale === "sv" ? "Hämtning möjlig" : "Pickup available" },
              { key: "restStop", label: locale === "fi" ? "Taukopysähdyksiä matkalla" : locale === "sv" ? "Rastpauser på vägen" : "Rest stops on route" },
              { key: "startTime", label: locale === "fi" ? "Joustava lähtöaika" : locale === "sv" ? "Flexibel avgångstid" : "Flexible departure" },
              { key: "bag", label: locale === "fi" ? "Tilaa laukuille" : locale === "sv" ? "Utrymme för bagage" : "Large luggage space" },
              { key: "rentCar", label: locale === "fi" ? "Vuokra- tai yhteisauto" : locale === "sv" ? "Hyrbil eller delad bil" : "Rental/shared car" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={() => handleOptionToggle(opt.key as keyof typeof ride.options)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  ride.options[opt.key as keyof typeof ride.options]
                    ? "bg-shade-500 text-white border-shade-600"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="flex items-center gap-2">
            <label className="label">{t.notes}</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                {locale === "fi" ? "Voit kertoa esimerkiksi auton mallista, pysähdyksistä tai tunnelmasta." : locale === "sv" ? "Du kan berätta om bilens modell, stopp eller atmosfär." : "You can describe the car model, stops, or atmosphere."}
              </div>
            </div>
          </div>
          <textarea
            name="notes"
            value={ride.notes}
            onChange={handleChange}
            className="input mt-1"
            rows={3}
          />
        </motion.div>

        {/* Toistuva kyyti -checkbox */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={() => setIsRecurring((v) => !v)}
            className="accent-shade-500"
          />
          <label htmlFor="recurring" className="text-shade-700 font-medium text-sm cursor-pointer">{t.recurring}</label>
        </div>
        {/* Päivien valinta */}
        {isRecurring && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {weekDays.map((d) => (
              <button
                type="button"
                key={d.key}
                onClick={() => handleDayToggle(d.key)}
                className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                  recurrenceDays.includes(d.key)
                    ? "bg-shade-500 text-white border-shade-600"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Ehdotukset-osion lisäys ennen painiketta */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-6 p-4 bg-shade-50 border border-shade-200 rounded-xl shadow-sm text-left"
          >
            <h3 className="text-shade-700 font-semibold mb-2">{locale === "fi" ? "Ehdotukset" : locale === "sv" ? "Förslag" : "Suggestions"}</h3>
            <ul className="list-disc pl-6 text-shade-600 space-y-1">
              {suggestions.map((s, i) => (
                <li key={i} className="hover:text-shade-800 transition">{s}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={isSubmitDisabled}
          aria-disabled={isSubmitDisabled}
          className={`w-full mt-6 text-white py-3 rounded-xl font-semibold shadow-md transition ${
            isSubmitDisabled
              ? "bg-shade-400 cursor-not-allowed opacity-60"
              : "bg-shade-500 hover:bg-shade-600"
          }`}
          whileHover={isSubmitDisabled ? undefined : { scale: 1.05 }}
          whileTap={isSubmitDisabled ? undefined : { scale: 0.97 }}
        >
          {t.addRide}
        </motion.button>
      </form>
        </>
      )}
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 bg-white border-2 rounded-xl shadow-lg p-4 z-50 max-w-sm"
          style={{
            borderColor: notificationType === "success" ? "#16a34a" : "#dc2626",
            backgroundColor: notificationType === "success" ? "#f0fdf4" : "#fef2f2",
          }}
        >
          <p
            className="font-medium text-sm"
            style={{
              color: notificationType === "success" ? "#16a34a" : "#dc2626",
            }}
          >
            {notificationMessage}
          </p>
        </motion.div>
      )}
      </div>
    </motion.main>
  );
}
