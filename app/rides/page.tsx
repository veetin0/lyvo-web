"use client";

import { useState, useMemo, useEffect, ChangeEvent } from "react";
import AlertBox from "@/components/AlertBox";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "next-auth/react";

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
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EtsiKyyti() {
  const [rides, setRides] = useState<Ride[]>([]);
  const { data: session } = useSession();
  const [filters, setFilters] = useState<Record<string, any>>({
    from: "",
    to: "",
    date: "",
    time: "",
    sort: "",
    showFilters: false,
  });
  const [loading, setLoading] = useState(true);
  const [surpriseRide, setSurpriseRide] = useState<Ride | null>(null);
  const [bookedRides, setBookedRides] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

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
          car: r.car || "Autoa ei ilmoitettu",
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
        }));

        setRides(formatted);
      } catch (error) {
        console.error("Virhe haettaessa kyytejä Supabasesta:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredRides = useMemo(() => {
    let results = rides.filter(
      (ride) =>
        (!filters.from || ride.from.toLowerCase().includes(filters.from.toLowerCase())) &&
        (!filters.to || ride.to.toLowerCase().includes(filters.to.toLowerCase())) &&
        (!filters.date || ride.date === filters.date)
    );

    if (filters["Sähköauto"]) results = results.filter((r) => r.options.includes("Sähköauto"));
    if (filters["Hiljainen kyyti"]) results = results.filter((r) => r.options.includes("Hiljainen kyyti"));
    if (filters["Lemmikit sallittu"]) results = results.filter((r) => r.options.includes("Lemmikit sallittu"));
    if (filters["Tila-auto"]) results = results.filter((r) => r.options.includes("Tila-auto"));
    if (filters["Naiskuljettaja"]) results = results.filter((r) =>
      ["Sara", "Anna", "Laura"].some((n) => r.driver.name.includes(n))
    );
    if (filters["Suosittu kyyti"]) results = results.filter((r) => r.driver.rating > 4.5);

    if (filters.sort === "price") results.sort((a, b) => a.price - b.price);
    if (filters.sort === "time") results.sort((a, b) => a.time.localeCompare(b.time));
    if (filters.sort === "rating") results.sort((a, b) => b.driver.rating - a.driver.rating);

    return results;
  }, [filters, rides]);

  const handleSurpriseMe = () => {
    if (!filters.from) {
      setAlertMessage("Valitse ensin lähtöpaikka!");
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    const possibleRides = rides.filter(
      (ride) => ride.from.toLowerCase() === filters.from.toLowerCase()
    );

    if (possibleRides.length === 0) {
      setAlertMessage("Ei löytynyt yllättäviä kyytejä tästä kaupungista 😅");
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    const random = possibleRides[Math.floor(Math.random() * possibleRides.length)];
    setSurpriseRide(random);
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-16 px-4 text-center"
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent mb-10">
          Etsi kyyti
        </h1>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-emerald-700 font-semibold text-sm">
              Järjestä:
            </label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleInputChange}
              className="bg-white border border-emerald-300 text-emerald-700 font-medium rounded-lg px-3 py-2 shadow-sm hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
            >
              <option value="">Ei järjestystä</option>
              <option value="price">Hinnan mukaan</option>
              <option value="time">Lähtöajan mukaan</option>
              <option value="rating">Arvion mukaan</option>
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
            Lisäsuodattimet
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <input type="text" name="from" value={filters.from} onChange={handleInputChange} placeholder="Lähtöpaikka" className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
          <input type="text" name="to" value={filters.to} onChange={handleInputChange} placeholder="Kohdepaikka" className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
          <input type="date" name="date" value={filters.date} onChange={handleInputChange} className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
          <input type="time" name="time" value={filters.time} onChange={handleInputChange} className="input rounded-xl shadow-inner focus:ring-emerald-300 focus:outline-none transition" />
        </div>

        <div className="mt-4 mb-8 flex justify-center">
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-2 rounded-xl shadow-md overflow-hidden group transition-transform duration-300 hover:scale-105"
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            Yllätä minut!
          </button>
        </div>

        {filters.showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 bg-white border border-emerald-100 rounded-xl p-4 shadow"
          >
            {["Sähköauto", "Hiljainen kyyti", "Lemmikit sallittu", "Tila-auto", "Naiskuljettaja", "Suosittu kyyti"].map(
              (opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-emerald-700 font-medium hover:text-emerald-600 transition">
                  <input
                    type="checkbox"
                    checked={!!filters[opt]}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [opt]: e.target.checked }))}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  {opt}
                </label>
              )
            )}
          </motion.div>
        )}

        {surpriseRide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl shadow-lg p-6 mb-8 text-left"
          >
            <h3 className="font-bold text-emerald-700 mb-2">🎉 Suositeltu seikkailu sinulle!</h3>
            <p className="text-emerald-800 font-medium text-lg mb-1">
              {surpriseRide.from} → {surpriseRide.to}
            </p>
            <p className="text-sm text-neutral-600">
              {surpriseRide.date} klo {surpriseRide.time} – {surpriseRide.price} €
            </p>
            <p className="text-sm text-neutral-500">{surpriseRide.car || "Autoa ei ilmoitettu"}</p>
            <p className="text-sm text-neutral-600 mt-1">
              {surpriseRide.driver?.name ? (() => {
                const [first, last] = surpriseRide.driver.name.split(" ");
                return last ? `${first} ${last[0]}.` : first;
              })() : ""}
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              Vapaita paikkoja: {surpriseRide.seats ?? "ei ilmoitettu"}
            </p>
          </motion.div>
        )}

        <div className="mb-6 text-sm text-emerald-700 font-medium">
          {filteredRides.length > 0 ? `Näytetään ${filteredRides.length} kyytiä` : "Ei tuloksia valituilla hakuehdoilla"}
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
                  <p className="text-sm text-neutral-500">{ride.car || "Autoa ei ilmoitettu"}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-neutral-700 font-medium">
                      {ride.driver?.name ? (() => {
                        const [first, last] = ride.driver.name.split(" ");
                        return last ? `${first} ${last[0]}.` : first;
                      })() : ""}
                    </p>
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
                        <span className="text-neutral-500 text-xs italic">Ei vielä arvioita</span>
                      )}
                    </div>
                  </div>
                  {ride.seats !== undefined && ride.seats !== null ? (
                    <p className="text-sm text-neutral-600 mt-1">
                      Vapaita paikkoja: {ride.seats}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-600 mt-1">
                      Vapaita paikkoja: ei ilmoitettu
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
                      Kyyti täynnä
                    </button>
                  ) : ride.driver?.name === (session?.user as any)?.name ? (
                    <button
                      disabled
                      className="mt-4 w-full px-4 py-2 rounded-xl font-semibold bg-gray-100 text-gray-600 border border-gray-300 cursor-default"
                    >
                      Oma kyyti
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
                          setAlertMessage("Kyyti on jo täynnä!");
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

                        setAlertMessage(`Paikka varattu kyytiin ${ride.from} → ${ride.to}!`);
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
                          <CheckCircle2 size={18} /> Paikka varattu
                        </span>
                      ) : (
                        "Varaa paikka"
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })
          ) : (
            <p className="text-neutral-500">Ei löytynyt kyytejä valituilla hakuehdoilla.</p>
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
                Kirjaudu sisään
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                Sinun täytyy olla kirjautunut sisään varataksesi paikan kyydistä.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
                >
                  Kirjaudu sisään
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition"
                >
                  Peruuta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}