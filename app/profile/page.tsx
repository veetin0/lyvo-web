'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ProfilePage() {
  const router = useRouter();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("❌ Supabase ympäristömuuttujat puuttuvat tai ovat virheellisiä!");
  }
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [rideToDelete, setRideToDelete] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  // Hae käyttäjän tiedot ja kyydit Supabasen kautta
  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (status === "unauthenticated" && !session) {
      setTimeout(() => router.push("/auth/login"), 200);
      return;
    }

    const userId = (session?.user as any)?.id || (session?.user as any)?.email;

    console.log("Session:", session);
    console.log("Status:", status);

    const fetchProfileData = async () => {
      setLoading(true);

      setUser({
        id: userId || "tuntematon",
        name: (session?.user as any)?.name || "Tuntematon käyttäjä",
        email: (session?.user as any)?.email || "",
      });

      let rideRes;
      try {
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        rideRes = await supabase
          .from("rides")
          .select("id, from_city, to_city, departure, seats, price_eur")
          .eq("owner", userId ?? "");

        if (rideRes.error) {
          if (rideRes.error.message.includes("Failed to fetch") || rideRes.error.message.includes("Load failed")) {
            console.warn("🌐 Supabase-yhteys epäonnistui – tarkista CORS-asetukset.");
            setRides([]);
            // Remove any existing toast message
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) existingToast.remove();
            const corsWarning = document.createElement("div");
            corsWarning.className = "toast-message fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fadeIn z-50";
            corsWarning.textContent = "Ei saatu yhteyttä tietokantaan. Tarkista asetukset tai yritä uudelleen.";
            document.body.appendChild(corsWarning);
            setTimeout(() => corsWarning.remove(), 5000);
          } else {
            console.error("Virhe haettaessa kyytejä:", rideRes.error.message);
          }
        } else if (rideRes.data) {
          if (rideRes.data.length === 0) {
            setRides([]);
            // Remove any existing toast message
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) existingToast.remove();
            const noRidesWarning = document.createElement("div");
            noRidesWarning.className = "toast-message fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fadeIn z-50";
            noRidesWarning.textContent = "Ei lisättyjä kyytejä vielä";
            document.body.appendChild(noRidesWarning);
            setTimeout(() => noRidesWarning.remove(), 5000);
          } else {
            const mappedRides = rideRes.data.map((ride: any) => ({
              id: ride.id,
              from: ride.from_city,
              to: ride.to_city,
              date: new Date(ride.departure).toLocaleDateString("fi-FI"),
              time: new Date(ride.departure).toLocaleTimeString("fi-FI", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              price: ride.price_eur,
            }));
            setRides(mappedRides);
          }
        }
      } catch (err) {
        console.error("❌ Supabase-yhteysvirhe:", err);
        // Remove any existing toast message
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();
        const corsWarning = document.createElement("div");
        corsWarning.className = "toast-message fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fadeIn z-50";
        corsWarning.textContent = "Virhe muodostettaessa yhteyttä Supabaseen. Tarkista ympäristömuuttujat.";
        document.body.appendChild(corsWarning);
        setTimeout(() => corsWarning.remove(), 5000);
      }

      let bookingRes;

      if (userId && userId.match(/^[0-9a-fA-F-]{36}$/)) {
        bookingRes = await supabase
          .from("bookings")
          .select(`
            id,
            ride:ride_id (
              id,
              from_city,
              to_city,
              departure,
              price_eur,
              driver_name
            )
          `)
          .eq("user_id", userId);
      } else {
        bookingRes = await supabase
          .from("bookings")
          .select(`
            id,
            ride:ride_id (
              id,
              from_city,
              to_city,
              departure,
              price_eur,
              driver_name
            )
          `)
          .eq("user_email", (session?.user as any)?.email ?? "");
      }

      if (bookingRes.error) {
        console.error("Virhe haettaessa varauksia:", bookingRes.error.message);
      } else if (bookingRes.data) {
        setBookings(bookingRes.data);
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [router, session, status]);

  const handleDeleteRide = async () => {
    if (!rideToDelete) return;
    try {
      const res = await supabase.from("rides").delete().eq("id", rideToDelete);
      if (res.error) {
        alert("Virhe poistettaessa kyytiä.");
      } else {
        setRides((prev) => prev.filter((r) => r.id !== rideToDelete));
        alert("Kyyti poistettu onnistuneesti!");
      }
    } catch (err) {
      console.error("Virhe:", err);
    } finally {
      setRideToDelete(null);
    }
  };

  if (loading) {
    return <p className="text-center text-emerald-600">Ladataan profiilia...</p>;
  }

  if (!user) {
    return <p className="text-center text-neutral-600">Kirjaudu sisään nähdäksesi profiilisi.</p>;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-16 px-4"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-emerald-100 p-6">
        <h1 className="text-3xl font-bold text-emerald-700 mb-6">Oma profiili</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-emerald-700 mb-2">Käyttäjätiedot</h2>
          <p><strong>Nimi:</strong> {user.name}</p>
          <p><strong>Sähköposti:</strong> {user.email}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">Omat kyydit</h2>
          {rides.length === 0 ? (
            <p className="text-neutral-600">Et ole vielä lisännyt kyytejä.</p>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 border border-emerald-100 rounded-xl shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-emerald-700">{ride.from} → {ride.to}</p>
                    <p className="text-sm text-neutral-600">
                      {ride.date} klo {ride.time} – {ride.price} €
                    </p>
                  </div>
                  <button
                    onClick={() => setRideToDelete(ride.id)}
                    className="text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg hover:text-red-700 transition"
                  >
                    Poista
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">Varaamani kyydit</h2>
          {bookings.length === 0 ? (
            <p className="text-neutral-600">Et ole vielä varannut kyytejä.</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 border border-emerald-100 rounded-xl shadow-sm"
                >
                  <p className="font-semibold text-emerald-700">
                    {b.ride?.from_city} → {b.ride?.to_city}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {new Date(b.ride?.departure).toLocaleDateString("fi-FI")} klo{" "}
                    {new Date(b.ride?.departure).toLocaleTimeString("fi-FI", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-neutral-600">
                    Kuljettaja: {b.ride?.driver_name || "Tuntematon"}
                  </p>
                  <p className="text-sm text-emerald-700 font-medium">
                    {b.ride?.price_eur} €
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
      {rideToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center animate-fadeIn">
            <h2 className="text-lg font-semibold text-emerald-700 mb-3">
              Poistetaanko tämä kyyti?
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              Toimintoa ei voi peruuttaa.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDeleteRide}
                className="btn btn-primary px-4 py-2"
              >
                Kyllä, poista
              </button>
              <button
                onClick={() => setRideToDelete(null)}
                className="btn btn-ghost px-4 py-2"
              >
                Peruuta
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.main>
  );
}