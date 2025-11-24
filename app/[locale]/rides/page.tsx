"use client";

import { useState, useMemo, useEffect, ChangeEvent, useRef } from "react";
import Link from "next/link";
import AlertBox from "@/components/AlertBox";
import { RideMiniMap } from "@/components/RideMiniMap";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "next-auth/react";

const translations = {
  fi: {
    title: "Etsi kyyti",
    sort: "Järjestä",
    filters: "Lisäsuodattimet",
    from: "Lähtöpaikka",
    to: "Kohdepaikka",
    date: "Päivämäärä",
    time: "Aika",
    noSort: "Ei järjestystä",
    sortByPrice: "Hinnan mukaan",
    sortByTime: "Lähtöajan mukaan",
    sortByRating: "Arvion mukaan",
    showing: "Näytetään",
    rides: "kyytiä",
    noResults: "Ei tuloksia valituilla hakuehdoilla",
    bookRide: "Varaa paikka",
    booked: "Paikka varattu",
    fullRide: "Kyyti täynnä",
    ownRide: "Oma kyyti",
    seats: "Vapaita paikkoja",
    reservedSeats: "Vapaat paikat",
    notReserved: "Ei varauksia",
    showingCount: (count: number) => `Näytetään ${count} kyytiä`,
    noRidesFound: "Ei kyytejä löytynyt",
    price: "Hinta",
    minimumSeats: "Vähintään istumapaikat",
    seatsLabel: "Paikat",
    clearFilters: "Poista suodattimet",
    allSeats: "Kaikki paikat",
    bookedLabel: "Varattu",
    signInToBook: "Kirjaudu sisään varataksesi kyytejä",
    carNotSpecified: "Autoa ei ilmoitettu",
    detailsTitle: "Kyydin tiedot",
    distanceLabel: "Matka",
    durationLabel: "Kesto",
    stopsLabel: "Pysähdykset",
    noStops: "Ei pysähdyksiä",
    close: "Sulje",
    routePreview: "Reitin esikatselu",
    noRoutePreview: "Reittitietoja ei saatavilla",
    noRatings: "Ei arvosteluja",
    bookingInProgress: "Varataan...",
    bookingConfirmed: (from: string, to: string) => `Varaus vahvistettu: ${from} → ${to}!`,
    bookingFailed: "Varauksen tekeminen epäonnistui. Yritä uudelleen.",
    ridesLoadFailed: "Kyytien hakeminen epäonnistui. Yritä hetken kuluttua uudelleen.",
    bookingsNav: "Varaukset",
    profileNav: "Profiili",
  },
  en: {
    title: "Find a Ride",
    sort: "Sort",
    filters: "Filters",
    from: "From",
    to: "To",
    date: "Date",
    time: "Time",
    noSort: "No sort",
    sortByPrice: "By price",
    sortByTime: "By time",
    sortByRating: "By rating",
    showing: "Showing",
    rides: "rides",
    noResults: "No results found",
    bookRide: "Book Ride",
    booked: "Booked",
    fullRide: "Ride full",
    ownRide: "Your ride",
    seats: "Available seats",
    reservedSeats: "Reserved seats",
    notReserved: "Not reserved",
    showingCount: (count: number) => `Showing ${count} rides`,
    noRidesFound: "No rides found",
    price: "Price",
    minimumSeats: "Minimum seats",
    seatsLabel: "Seats",
    clearFilters: "Clear Filters",
    allSeats: "All seats",
    bookedLabel: "Booked",
    signInToBook: "Please sign in to book rides",
    carNotSpecified: "No car specified",
    detailsTitle: "Ride details",
    distanceLabel: "Distance",
    durationLabel: "Duration",
    stopsLabel: "Stops",
    noStops: "No stops",
    close: "Close",
    routePreview: "Route preview",
    noRoutePreview: "Route data unavailable",
    noRatings: "No ratings",
    bookingInProgress: "Booking...",
    bookingConfirmed: (from: string, to: string) => `Booking confirmed: ${from} → ${to}!`,
    bookingFailed: "Booking failed. Please try again.",
    ridesLoadFailed: "Failed to load rides. Please try again shortly.",
    bookingsNav: "Bookings",
    profileNav: "Profile",
  },
  sv: {
    title: "Hitta skjuts",
    sort: "Sortera",
    filters: "Filter",
    from: "Från",
    to: "Till",
    date: "Datum",
    time: "Tid",
    noSort: "Ingen sortering",
    sortByPrice: "Efter pris",
    sortByTime: "Efter tid",
    sortByRating: "Efter betyg",
    showing: "Visar",
    rides: "skjutsar",
    noResults: "Inga resultat hittades",
    bookRide: "Boka skjuts",
    booked: "Bokad",
    fullRide: "Skjutsen är full",
    ownRide: "Din skjuts",
    seats: "Lediga platser",
    reservedSeats: "Bokade platser",
    notReserved: "Inte reserverad",
    showingCount: (count: number) => `Visar ${count} skjutsar`,
    noRidesFound: "Inga skjutsar hittades",
    price: "Pris",
    minimumSeats: "Minsta platser",
    seatsLabel: "Platser",
    clearFilters: "Rensa filter",
    allSeats: "Alla platser",
    bookedLabel: "Bokad",
    signInToBook: "Logga in för att boka skjutsar",
    carNotSpecified: "Ingen bil angiven",
    detailsTitle: "Skjutsdetaljer",
    distanceLabel: "Sträcka",
    durationLabel: "Varaktighet",
    stopsLabel: "Stopp",
    noStops: "Inga stopp",
    close: "Stäng",
    routePreview: "Rutöversikt",
    noRoutePreview: "Ingen ruttinformation tillgänglig",
    noRatings: "Inga betyg",
    bookingInProgress: "Bokar...",
    bookingConfirmed: (from: string, to: string) => `Bokning bekräftad: ${from} → ${to}!`,
    bookingFailed: "Bokningen misslyckades. Försök igen.",
    ridesLoadFailed: "Det gick inte att hämta skjutsar. Försök igen senare.",
    bookingsNav: "Bokningar",
    profileNav: "Profil",
  },
};

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  car: string;
  options: string[];
  driver: {
    name: string;
    rating: number;
  };
  seats: number | null;
  owner: string;
  profilePicture?: string | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  routePolyline?: string | null;
  stops?: Array<{ city?: string; price?: string }> | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const optionLabelMap: Record<string, { fi: string; en: string; sv: string }> = {
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
  bikeSpot: { fi: "Polkupyörän kuljetus mahdollista", en: "Bike transportation", sv: "Cykeltransport möjlig" },
  pickUp: { fi: "Nouto sovittavissa", en: "Pickup available", sv: "Hämtning möjlig" },
  restStop: { fi: "Taukopysähdyksiä matkalla", en: "Rest stops on route", sv: "Raststopp längs vägen" },
  startTime: { fi: "Joustava lähtöaika", en: "Flexible departure", sv: "Flexibel avgångstid" },
  bag: { fi: "Tilaa laukuille", en: "Large luggage space", sv: "Utrymme för bagage" },
  rentCar: { fi: "Vuokra- tai yhteisauto", en: "Rental/shared car", sv: "Hyr-/delad bil" },
  femaleDriver: { fi: "Naiskuljettaja", en: "Female driver", sv: "Kvinnlig förare" },
  popular: { fi: "Suosittu kyyti", en: "Popular ride", sv: "Populär skjuts" },
};

const getOptionLabel = (option: string, locale: keyof typeof translations): string => {
  return optionLabelMap[option]?.[locale] ?? option;
};

const formatDistance = (meters?: number | null): string | null => {
  if (!Number.isFinite(meters ?? NaN) || !meters || meters <= 0) {
    return null;
  }
  const km = meters / 1000;
  if (km >= 100) {
    return `${Math.round(km)} km`;
  }
  return `${km.toFixed(1)} km`;
};

const formatDuration = (seconds?: number | null): string | null => {
  if (!Number.isFinite(seconds ?? NaN) || !seconds || seconds <= 0) {
    return null;
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  return `${minutes} min`;
};

const normalizeStops = (stops: unknown): Array<{ city?: string; price?: string }> => {
  if (!stops) {
    return [];
  }
  if (Array.isArray(stops)) {
    return stops as Array<{ city?: string; price?: string }>;
  }
  if (typeof stops === "string") {
    try {
      const parsed = JSON.parse(stops);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof stops === "object") {
    return [];
  }
  return [];
};

export default function EtsiKyyti() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[locale] || translations.en;

  const [rides, setRides] = useState<Ride[]>([]);
  const { data: session } = useSession();
  const [filters, setFilters] = useState<Record<string, any>>({
    from: "",
    to: "",
    date: "",
    time: "",
    sort: "",
    showFilters: false,
    minPrice: 0,
    maxPrice: 100,
    minSeats: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bookedRides, setBookedRides] = useState<Record<string, boolean>>({});
  const [userRideIds, setUserRideIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [profilePictures, setProfilePictures] = useState<Record<string, string | null>>({});
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [bookingRideId, setBookingRideId] = useState<string | null>(null);
  const filtersAnchorRef = useRef<HTMLDivElement | null>(null);
  const closeRideDetails = () => setSelectedRide(null);

  const confirmBooking = async (payload: { rideId: string }) => {
    // Hook for future payment flow: integrate Stripe checkout before confirming the booking.
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Booking request failed");
    }
  };

  const handleBookRide = async (ride: Ride) => {
    if (bookingRideId) {
      return;
    }

    if (bookedRides[ride.id]) {
      return;
    }

    if (!session?.user) {
      setShowLoginPrompt(true);
      return;
    }

    if (typeof ride.seats === "number" && ride.seats <= 0) {
      setAlertType("error");
      setAlertMessage(t.fullRide);
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    const initialSeats = typeof ride.seats === "number" ? ride.seats : null;

    try {
      setBookingRideId(ride.id);

      if (initialSeats !== null) {
        setRides((prevRides) =>
          prevRides.map((r) =>
            r.id === ride.id
              ? {
                  ...r,
                  seats: Math.max(
                    (typeof r.seats === "number" ? r.seats : initialSeats) - 1,
                    0
                  ),
                }
              : r
          )
        );

        setSelectedRide((current) =>
          current?.id === ride.id
            ? {
                ...current,
                seats: Math.max(
                  (typeof current.seats === "number" ? current.seats : initialSeats) - 1,
                  0
                ),
              }
            : current
        );
      }

      await confirmBooking({ rideId: ride.id });

      setBookedRides((prev) => ({ ...prev, [ride.id]: true }));
      setAlertType("success");
      setAlertMessage(t.bookingConfirmed(ride.from, ride.to));
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error("Failed to book ride:", error);

      if (initialSeats !== null) {
        setRides((prevRides) =>
          prevRides.map((r) =>
            r.id === ride.id
              ? {
                  ...r,
                  seats: initialSeats,
                }
              : r
          )
        );

        setSelectedRide((current) =>
          current?.id === ride.id
            ? {
                ...current,
                seats: initialSeats,
              }
            : current
        );
      }

      setAlertType("error");
      setAlertMessage(t.bookingFailed);
      setTimeout(() => setAlertMessage(null), 3000);
    } finally {
      setBookingRideId(null);
    }
  };

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;

        const formatted = data.map((r: any) => {
          const departureDate = new Date(r.departure);
          const stops = normalizeStops(r.stops);

          return {
            id: r.id,
            from: r.from_city,
            to: r.to_city,
            date: departureDate.toLocaleDateString("fi-FI"),
            time: departureDate.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" }),
            price: r.price_eur,
            car: r.car || t.carNotSpecified,
            driver: {
              name: r.driver_name
                ? (() => {
                    const [first, last] = r.driver_name.split(" ");
                    return last ? `${first} ${last[0]}.` : first;
                  })()
                : "Tuntematon",
              rating: r.driver_rating ?? 0,
            },
            options: Array.isArray(r.options)
              ? r.options
              : typeof r.options === "string"
                ? (() => {
                    try {
                      const parsed = JSON.parse(r.options);
                      return Array.isArray(parsed) ? parsed : [];
                    } catch {
                      return [];
                    }
                  })()
                : r.options || [],
            seats: r.seats ?? null,
            owner: r.owner,
            distanceMeters: typeof r.distance_meters === "number"
              ? r.distance_meters
              : r.distance_meters !== null && r.distance_meters !== undefined
                ? Number(r.distance_meters)
                : null,
            durationSeconds: typeof r.duration_seconds === "number"
              ? r.duration_seconds
              : r.duration_seconds !== null && r.duration_seconds !== undefined
                ? Number(r.duration_seconds)
                : null,
            routePolyline: r.route_polyline ?? null,
            stops,
          } as Ride;
        });

        // Load profile pictures from localStorage
        const pictures: Record<string, string | null> = {};
        formatted.forEach((ride: Ride) => {
          const savedPicture = localStorage.getItem(`profilePicture_${ride.owner}`);
          if (savedPicture) {
            pictures[ride.owner] = savedPicture;
          }
        });
        setProfilePictures(pictures);

        setRides(formatted);

        // Fetch user's own rides and booked rides
        if (session?.user) {
          try {
            const userId = (session.user as any).id;
            const userOwnRides = formatted.filter((ride: any) => ride.owner === userId);
            const userRideIdSet = new Set(userOwnRides.map((r: any) => r.id));
            setUserRideIds(userRideIdSet);

            // Fetch user's booked rides
            const response = await fetch("/api/bookings");
            if (response.ok) {
              const bookings = await response.json();
              const bookedRideIds: Record<string, boolean> = {};
              bookings.forEach((booking: any) => {
                const rideId = booking.ride?.id || booking.ride_id;
                if (rideId) {
                  bookedRideIds[rideId] = true;
                }
              });
              setBookedRides(bookedRideIds);
            }
          } catch (err) {
            console.error("Error fetching user rides and bookings:", err);
          }
        }
      } catch (error) {
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? (error as { message?: string }).message
            : String(error ?? "Unknown error");
        console.error("Virhe haettaessa kyytejä Supabasesta:", errorMessage);
        setAlertType("error");
        setAlertMessage(`${t.ridesLoadFailed}${errorMessage ? ` (${errorMessage})` : ""}`.trim());
        setTimeout(() => setAlertMessage(null), 4000);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, [session]);

  useEffect(() => {
    if (!selectedRide) {
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedRide(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [selectedRide]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFilters = () => {
    setFilters((prev) => ({ ...prev, showFilters: !prev.showFilters }));

    if (!filters.showFilters) {
      requestAnimationFrame(() => {
        filtersAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const filteredRides = useMemo(() => {
    const fromTerm = filters.from.trim().toLowerCase();
    const toTerm = filters.to.trim().toLowerCase();

    let results = rides.filter((ride) => {
      const stopCities = (ride.stops ?? [])
        .map((stop) => stop.city?.toLowerCase().trim())
        .filter((city): city is string => Boolean(city));

      const matchesFrom =
        !fromTerm ||
        ride.from.toLowerCase().includes(fromTerm) ||
        stopCities.some((city) => city.includes(fromTerm));

      const matchesTo =
        !toTerm ||
        ride.to.toLowerCase().includes(toTerm) ||
        stopCities.some((city) => city.includes(toTerm));

      return (
        matchesFrom &&
        matchesTo &&
        (!filters.date || ride.date === filters.date) &&
        ride.price >= filters.minPrice &&
        ride.price <= filters.maxPrice &&
        (filters.minSeats === 0 || (ride.seats && ride.seats >= filters.minSeats))
      );
    });

    // Database option values are always in Finnish
    const dbOptions = {
      electric: "Sähköauto",
      quiet: "Hiljainen kyyti",
      pets: "Lemmikit sallittu",
      van: "Tila-auto",
      femaleDriver: "Naiskuljettaja",
      popular: "Suosittu kyyti",
    };

    // Check filters by database option key (locale doesn't affect what's stored in DB)
    if (filters["electric"]) results = results.filter((r) => r.options.includes(dbOptions.electric));
    if (filters["quiet"]) results = results.filter((r) => r.options.includes(dbOptions.quiet));
    if (filters["pets"]) results = results.filter((r) => r.options.includes(dbOptions.pets));
    if (filters["van"]) results = results.filter((r) => r.options.includes(dbOptions.van));
    if (filters["femaleDriver"]) results = results.filter((r) =>
      ["Sara", "Anna", "Laura"].some((n) => r.driver.name.includes(n))
    );
    if (filters["popular"]) results = results.filter((r) => r.driver.rating > 4.5);

    if (filters.sort === "price") results.sort((a, b) => a.price - b.price);
    if (filters.sort === "time") results.sort((a, b) => a.time.localeCompare(b.time));
    if (filters.sort === "rating") results.sort((a, b) => b.driver.rating - a.driver.rating);

    return results;
  }, [filters, rides]);

  const distanceLabel = selectedRide ? formatDistance(selectedRide.distanceMeters) : null;
  const durationLabel = selectedRide ? formatDuration(selectedRide.durationSeconds) : null;
  const selectedStops = selectedRide?.stops ?? [];
  const isSelectedRideBooked = selectedRide ? Boolean(bookedRides[selectedRide.id]) : false;
  const isSelectedRideOwner = selectedRide ? userRideIds.has(selectedRide.id) : false;
  const isSelectedRideFull = selectedRide
    ? typeof selectedRide.seats === "number" && selectedRide.seats <= 0
    : false;
  const isSelectedRideBooking = selectedRide ? bookingRideId === selectedRide.id : false;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
  className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 px-4 pt-24 pb-32 text-center md:py-16"
    >
      <div className="max-w-3xl mx-auto">
  <h1 className="mb-10 bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent text-3xl font-extrabold sm:text-4xl">
          {t.title}
        </h1>

        <div
          ref={filtersAnchorRef}
          className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/95 p-4 text-left shadow-sm md:flex-row md:items-center"
        >
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-emerald-700 font-semibold text-sm">
              {t.sort}:
            </label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleInputChange}
              className="bg-white border border-emerald-300 text-emerald-700 font-medium rounded-lg px-3 py-2 shadow-sm hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
            >
              <option value="">{t.noSort}</option>
              <option value="price">{t.sortByPrice}</option>
              <option value="time">{t.sortByTime}</option>
              <option value="rating">{t.sortByRating}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, showFilters: !prev.showFilters }))}
            className={`px-4 py-2 rounded-xl font-medium shadow transition-all duration-300 ${
              filters.showFilters
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            {t.filters}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <input type="text" name="from" value={filters.from} onChange={handleInputChange} placeholder={t.from} className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
          <input type="text" name="to" value={filters.to} onChange={handleInputChange} placeholder={t.to} className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
          <input type="date" name="date" value={filters.date} onChange={handleInputChange} className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
          <input type="time" name="time" value={filters.time} onChange={handleInputChange} className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
        </div>



        {filters.showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 bg-white border border-emerald-100 rounded-xl p-4 shadow"
          >
            {/* Price Range Section */}
            <div className="mb-6 pb-6 border-b border-emerald-100">
              <label className="block text-sm font-semibold text-emerald-700 mb-3">{t.price}: {filters.minPrice}€ - {filters.maxPrice}€</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: Math.min(Number(e.target.value), prev.maxPrice) }))}
                  className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Math.max(Number(e.target.value), prev.minPrice) }))}
                  className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Minimum Seats Section */}
            <div className="mb-6 pb-6 border-b border-emerald-100">
              <label htmlFor="minSeats" className="block text-sm font-semibold text-emerald-700 mb-2">{t.seatsLabel}:</label>
              <select
                id="minSeats"
                name="minSeats"
                value={filters.minSeats}
                onChange={(e) => setFilters((prev) => ({ ...prev, minSeats: Number(e.target.value) }))}
                className="w-full bg-white border border-emerald-300 text-emerald-700 font-medium rounded-lg px-3 py-2 shadow-sm hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
              >
                <option value="0">{t.allSeats}</option>
                <option value="1">Vähintään 1</option>
                <option value="2">Vähintään 2</option>
                <option value="3">Vähintään 3</option>
                <option value="4">Vähintään 4</option>
                <option value="5">Vähintään 5</option>
              </select>
            </div>

            {/* Existing Checkboxes */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: "electric", label: locale === "fi" ? "Sähköauto" : locale === "sv" ? "Elbilar" : "Electric car" },
                { key: "quiet", label: locale === "fi" ? "Hiljainen kyyti" : locale === "sv" ? "Tyst skjuts" : "Quiet ride" },
                { key: "pets", label: locale === "fi" ? "Lemmikit sallittu" : locale === "sv" ? "Husdjur tillåtna" : "Pets allowed" },
                { key: "van", label: locale === "fi" ? "Tila-auto" : locale === "sv" ? "Skåpbil" : "Van" },
                { key: "femaleDriver", label: locale === "fi" ? "Naiskuljettaja" : locale === "sv" ? "Kvinnlig förare" : "Female driver" },
                { key: "popular", label: locale === "fi" ? "Suosittu kyyti" : locale === "sv" ? "Populär skjuts" : "Popular ride" },
              ].map(
                (opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm text-emerald-700 font-medium hover:text-emerald-600 transition">
                    <input
                      type="checkbox"
                      checked={!!filters[opt.key]}
                      onChange={(e) => setFilters((prev) => ({ ...prev, [opt.key]: e.target.checked }))}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    {opt.label}
                  </label>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Clear Filters Button */}
        {(filters.from || filters.to || filters.date || filters.minPrice !== 0 || filters.maxPrice !== 100 || filters.minSeats !== 0 || Object.keys(filters).some((key) => filters[key] === true)) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <button
              type="button"
              onClick={() => setFilters({
                from: "",
                to: "",
                date: "",
                time: "",
                sort: "",
                showFilters: false,
                minPrice: 0,
                maxPrice: 100,
                minSeats: 0,
                electric: false,
                quiet: false,
                pets: false,
                van: false,
                femaleDriver: false,
                popular: false,
              })}
              className="px-6 py-2 bg-white text-emerald-600 border border-emerald-300 rounded-lg font-medium shadow-sm hover:bg-emerald-50 transition"
            >
              {t.clearFilters}
            </button>
          </motion.div>
        )}

        <div className="mb-6 text-sm text-emerald-700 font-medium">
          {filteredRides.length > 0 ? t.showingCount(filteredRides.length) : t.noRidesFound}
        </div>

        <div className="grid gap-6">
          {filteredRides.length > 0 ? (
            filteredRides.map((ride) => {
              const seatCount = typeof ride.seats === "number" ? ride.seats : null;
              const isFull = typeof seatCount === "number" && seatCount <= 0;
              const isRideOwner = userRideIds.has(ride.id);
              const isRideBooked = Boolean(bookedRides[ride.id]);
              const isRideBooking = bookingRideId === ride.id;
              return (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRide(ride)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " " || event.key === "Space" || event.key === "Spacebar") {
                      event.preventDefault();
                      setSelectedRide(ride);
                    }
                  }}
                  className="bg-white border border-emerald-100 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-emerald-800 text-lg">
                      {ride.from} → {ride.to}
                    </h3>
                    <span className="text-emerald-600 font-semibold">{ride.price} €</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {ride.date} klo {ride.time}
                  </p>
                  <p className="text-sm text-neutral-500">{ride.car || t.carNotSpecified}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {profilePictures[ride.owner] && (
                        <img
                          src={profilePictures[ride.owner] || ""}
                          alt={ride.driver?.name}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-200"
                        />
                      )}
                      {!profilePictures[ride.owner] && (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xs font-bold">
                          {ride.driver?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <p className="text-sm text-neutral-700 font-medium">
                        {ride.driver?.name ? (() => {
                          const [first, last] = ride.driver.name.split(" ");
                          return last ? `${first} ${last[0]}.` : first;
                        })() : ""}
                      </p>
                    </div>
                    <div className="flex text-emerald-500 text-sm">
                      {ride.driver?.rating !== undefined ? (
                        <>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < Math.round(ride.driver.rating || 0) ? "★" : "☆"}</span>
                          ))}
                          <span className="ml-1 text-neutral-600 text-xs">
                            ({ride.driver.rating?.toFixed(1)})
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-500 text-xs italic">{t.noRatings}</span>
                      )}
                    </div>
                  </div>
                  {ride.seats !== undefined && ride.seats !== null ? (
                    <p className="text-sm text-neutral-600 mt-1">
                      {t.reservedSeats}: {ride.seats}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-600 mt-1">
                      {t.notReserved}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ride.options.map((opt) => (
                      <span key={opt} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
                        {getOptionLabel(opt, locale)}
                      </span>
                    ))}
                  </div>
                  {isFull ? (
                    <button
                      onClick={(event) => event.stopPropagation()}
                      disabled
                      className="mt-4 w-full px-4 py-2 rounded-xl font-semibold bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"
                    >
                      {t.fullRide}
                    </button>
                  ) : isRideOwner ? (
                    <button
                      onClick={(event) => event.stopPropagation()}
                      disabled
                      className="mt-4 w-full px-4 py-2 rounded-xl font-semibold bg-gray-100 text-gray-600 border border-gray-300 cursor-default"
                    >
                      {t.ownRide}
                    </button>
                  ) : (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleBookRide(ride);
                      }}
                      disabled={isRideBooked || isRideBooking}
                      className={`mt-4 w-full px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                        isRideBooked
                          ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                          : isRideBooking
                            ? 'bg-emerald-400 text-white border border-emerald-500 cursor-wait'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02]'
                      }`}
                    >
                      {isRideBooked ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={18} /> {t.bookedLabel}
                        </span>
                      ) : isRideBooking ? (
                        t.bookingInProgress
                      ) : (
                        t.bookRide
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })
          ) : (
            <p className="text-neutral-500">{t.noRidesFound}</p>
          )}
        </div>
      </div>
      {alertMessage && (
        <AlertBox
          message={alertMessage}
          type={alertType}
          onClose={() => setAlertMessage(null)}
        />
      )}
      <AnimatePresence>
        {selectedRide && (
          <motion.div
            key="ride-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={closeRideDetails}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.25 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ride-details-title"
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-2xl bg-white border border-emerald-100 rounded-3xl shadow-2xl p-6 md:p-8 text-left"
            >
              <button
                type="button"
                onClick={closeRideDetails}
                aria-label={t.close}
                className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-600 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col gap-4 md:gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-500">
                    {t.detailsTitle}
                  </p>
                  <h2
                    id="ride-details-title"
                    className="mt-2 text-2xl md:text-3xl font-bold text-emerald-800"
                  >
                    {selectedRide.from} → {selectedRide.to}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-medium border border-emerald-100">
                      {selectedRide.price} €
                    </span>
                    <span>
                      {selectedRide.date} • {selectedRide.time}
                    </span>
                    <span className="text-neutral-500">
                      {selectedRide.car || t.carNotSpecified}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {distanceLabel && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        {t.distanceLabel}
                      </p>
                      <p className="text-lg font-bold text-emerald-800">{distanceLabel}</p>
                    </div>
                  )}
                  {durationLabel && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        {t.durationLabel}
                      </p>
                      <p className="text-lg font-bold text-emerald-800">{durationLabel}</p>
                    </div>
                  )}
                  {typeof selectedRide.seats === "number" && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        {t.reservedSeats}
                      </p>
                      <p className="text-lg font-bold text-emerald-800">{selectedRide.seats}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                  <h3 className="text-sm font-semibold text-emerald-700 mb-3 uppercase tracking-wide">
                    {t.routePreview}
                  </h3>
                  {selectedRide.routePolyline ? (
                    <div className="h-48 w-full overflow-hidden rounded-2xl border border-emerald-100">
                      <RideMiniMap polyline={selectedRide.routePolyline} className="h-full w-full" />
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">{t.noRoutePreview}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                  <h3 className="text-sm font-semibold text-emerald-700 mb-3 uppercase tracking-wide">
                    {t.stopsLabel}
                  </h3>
                  {selectedStops.length ? (
                    <ul className="space-y-2 text-sm text-neutral-700">
                      {selectedStops.map((stop, index) => (
                        <li key={`${stop.city ?? "stop"}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-2">
                          <span className="font-medium text-emerald-800">
                            {stop.city || `${t.stopsLabel} ${index + 1}`}
                          </span>
                          {stop.price && (
                            <span className="text-emerald-600 font-semibold">{stop.price}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-neutral-500">{t.noStops}</p>
                  )}
                </div>

                {selectedRide.options.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-700 mb-2 uppercase tracking-wide">
                      {t.filters}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRide.options.map((opt) => (
                        <span
                          key={opt}
                          className="px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700"
                        >
                          {getOptionLabel(opt, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    {profilePictures[selectedRide.owner] ? (
                      <img
                        src={profilePictures[selectedRide.owner] || ""}
                        alt={selectedRide.driver?.name}
                        className="h-12 w-12 rounded-full border border-emerald-200 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full border border-emerald-200 bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600">
                        {selectedRide.driver?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        {selectedRide.driver?.name}
                      </p>
                      {typeof selectedRide.driver?.rating === "number" ? (
                        <p className="text-xs text-neutral-600">
                          {selectedRide.driver.rating.toFixed(1)} / 5 ★
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500 italic">{t.noRatings}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    {isSelectedRideOwner ? (
                      <span className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                        {t.ownRide}
                      </span>
                    ) : isSelectedRideBooked ? (
                      <span className="inline-flex items-center gap-1 rounded-xl border border-green-300 bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                        <CheckCircle2 size={16} /> {t.bookedLabel}
                      </span>
                    ) : isSelectedRideFull ? (
                      <span className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                        {t.fullRide}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (selectedRide) {
                            void handleBookRide(selectedRide);
                          }
                        }}
                        disabled={isSelectedRideBooking}
                        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                          isSelectedRideBooking
                            ? "bg-emerald-400 cursor-wait"
                            : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                      >
                        {isSelectedRideBooking ? t.bookingInProgress : t.bookRide}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        closeRideDetails();
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      {t.close}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 max-w-sm w-full text-center"
            >
              <h2 className="text-xl font-semibold text-emerald-700 mb-3">
                Sign in required
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                {t.signInToBook}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {!selectedRide && !showLoginPrompt && (
        <nav className="fixed inset-x-0 bottom-4 z-30 px-4 md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-white/95 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-900/5 backdrop-blur">
            <button
              type="button"
              onClick={toggleFilters}
              className={`flex-1 rounded-2xl px-3 py-2 transition-colors ${
                filters.showFilters
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              {filters.showFilters ? t.close : t.filters}
            </button>
            <Link
              href={`/${locale}/bookings`}
              className="flex-1 rounded-2xl bg-emerald-50 px-3 py-2 text-center transition-colors hover:bg-emerald-100"
            >
              {t.bookingsNav}
            </Link>
            <Link
              href={`/${locale}/profile`}
              className="flex-1 rounded-2xl bg-emerald-50 px-3 py-2 text-center transition-colors hover:bg-emerald-100"
            >
              {t.profileNav}
            </Link>
          </div>
        </nav>
      )}
    </motion.main>
  );
}
