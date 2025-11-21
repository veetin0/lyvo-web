"use client";

import { useState, useMemo, useEffect, ChangeEvent } from "react";
import AlertBox from "@/components/AlertBox";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
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
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [profilePictures, setProfilePictures] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;

        const formatted = data.map((r: any) => ({
          id: r.id,
          from: r.from_city,
          to: r.to_city,
          date: new Date(r.departure).toLocaleDateString("fi-FI"),
          time: new Date(r.departure).toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" }),
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
          options: r.options || [],
          seats: r.seats ?? null,
          owner: r.owner,
        }));

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
        console.error("Virhe haettaessa kyytejä Supabasesta:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, [session]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredRides = useMemo(() => {
    let results = rides.filter(
      (ride) =>
        (!filters.from || ride.from.toLowerCase().includes(filters.from.toLowerCase())) &&
        (!filters.to || ride.to.toLowerCase().includes(filters.to.toLowerCase())) &&
        (!filters.date || ride.date === filters.date) &&
        (ride.price >= filters.minPrice && ride.price <= filters.maxPrice) &&
        (filters.minSeats === 0 || (ride.seats && ride.seats >= filters.minSeats))
    );

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

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-16 px-4 text-center"
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent mb-10">
          {t.title}
        </h1>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
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
              const optionLabels: Record<string, string> = {
                electric: "Sähköauto",
                van: "Tila-auto",
                pets: "Lemmikit sallittu",
                quiet: "Hiljainen kyyti",
                music: "Musiikkia kyydissä",
                ac: "Ilmastointi",
                talkative: "Puhelias kuski",
                smokeFree: "Savuton kyyti",
                wifi: "WiFi käytössä",
                charging: "Latausmahdollisuus",
                bikeSpot: "Polkupyörän kuljetus mahdollista",
                pickUp: "Nouto sovittavissa",
                restStop: "Taukopysähdyksiä matkalla",
                startTime: "Joustava lähtöaika",
                bag: "Tilaa laukuille",
                rentCar: "Vuokra- tai yhteisauto",
                femaleDriver: "Naiskuljettaja",
                popular: "Suosittu kyyti",
              };
              return (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-emerald-100 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-5 text-left"
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
                  <p className="text-sm text-neutral-500">{ride.car || "No car specified"}</p>
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
                        <span className="text-neutral-500 text-xs italic">No ratings</span>
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
                        {optionLabels[opt] || opt}
                      </span>
                    ))}
                  </div>
                  {ride.seats === 0 ? (
                    <button
                      disabled
                      className="mt-4 w-full px-4 py-2 rounded-xl font-semibold bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"
                    >
                      Full ride
                    </button>
                  ) : userRideIds.has(ride.id) ? (
                    <button
                      disabled
                      className="mt-4 w-full px-4 py-2 rounded-xl font-semibold bg-gray-100 text-gray-600 border border-gray-300 cursor-default"
                    >
                      Your ride
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (bookedRides[ride.id]) return;
                        if (!session?.user) {
                          setShowLoginPrompt(true);
                          return;
                        }

                        // Jos ei ole paikkoja jäljellä, estetään varaus
                        if (ride.seats !== null && ride.seats <= 0) {
                          setAlertMessage("This ride is full");
                          setTimeout(() => setAlertMessage(null), 3000);
                          return;
                        }

                        setBookedRides(prev => ({ ...prev, [ride.id]: true }));
                        setRides(prevRides =>
                          prevRides.map(r =>
                            r.id === ride.id && typeof r.seats === "number"
                              ? { ...r, seats: r.seats! - 1 }
                              : r
                          )
                        );

                        await fetch("/api/bookings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ rideId: ride.id }),
                        });

                        if (typeof ride.seats === "number") {
                          await supabase
                            .from("rides")
                            .update({ seats: ride.seats - 1 })
                            .eq("id", ride.id);
                        }

                        setAlertMessage(`Booking confirmed: ${ride.from} → ${ride.to}!`);
                        setTimeout(() => setAlertMessage(null), 3000);
                      }}
                      disabled={bookedRides[ride.id]}
                      className={`mt-4 w-full px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                        bookedRides[ride.id]
                          ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02]'
                      }`}
                    >
                      {bookedRides[ride.id] ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={18} /> {t.bookedLabel}
                        </span>
                      ) : (
                        t.bookRide
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })
          ) : (
            <p className="text-neutral-500">No rides found</p>
          )}
        </div>
      </div>
      {alertMessage && (
        <AlertBox
          message={alertMessage}
          type="success"
          onClose={() => setAlertMessage(null)}
        />
      )}
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
    </motion.main>
  );
}
