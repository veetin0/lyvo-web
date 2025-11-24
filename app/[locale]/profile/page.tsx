'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

const translations = {
  fi: {
    title: "Oma profiili",
    userInfo: "Käyttäjätiedot",
    name: "Nimi",
    email: "Sähköposti",
    myRides: "Omat kyydit",
    pendingBookings: "Odottavat varauskyselyt",
    noPendingBookings: "Sinulla ei ole odottavia varauskyselyjä.",
    noRides: "Et ole vielä lisännyt kyytejä.",
    bookedRides: "Varaamani kyydit",
    noBookedRides: "Et ole vielä varannut kyytejä.",
    accept: "Hyväksy",
    reject: "Hylkää",
    delete: "Poista",
    profilePicture: "Profiilikuva",
    addProfilePicture: "Lisää profiilikuva",
    selectImage: "Valitse kuva",
    uploading: "Ladataan...",
    rideDeleted: "Kyyti poistettu onnistuneesti!",
    bookingAccepted: "Varaus hyväksytty!",
    bookingRejected: "Varaus hylätty.",
    loading: "Ladataan profiilia...",
    signInRequired: "Kirjaudu sisään nähdäksesi profiilisi.",
    driver: "Kuski",
    statusPending: "Odottaa vahvistusta",
    statusAccepted: "Hyväksytty",
    statusRejected: "Hylätty",
    manageBookings: "Hallinnoi varauksia",
  },
  en: {
    title: "My Profile",
    userInfo: "User Information",
    name: "Name",
    email: "Email",
    myRides: "My Rides",
    pendingBookings: "Pending Booking Requests",
    noPendingBookings: "You have no pending booking requests.",
    noRides: "You haven't added any rides yet.",
    bookedRides: "Booked Rides",
    noBookedRides: "You haven't booked any rides yet.",
    accept: "Accept",
    reject: "Reject",
    delete: "Delete",
    profilePicture: "Profile Picture",
    addProfilePicture: "Add Profile Picture",
    selectImage: "Select Image",
    uploading: "Uploading...",
    rideDeleted: "Ride deleted successfully!",
    bookingAccepted: "Booking accepted!",
    bookingRejected: "Booking rejected.",
    loading: "Loading profile...",
    signInRequired: "Sign in to view your profile.",
    driver: "Driver",
    statusPending: "Awaiting confirmation",
    statusAccepted: "Accepted",
    statusRejected: "Rejected",
    manageBookings: "Manage bookings",
  },
  sv: {
    title: "Min Profil",
    userInfo: "Användarinformation",
    name: "Namn",
    email: "E-post",
    myRides: "Mina Skjutsar",
    pendingBookings: "Väntande Bokningsförfrågningar",
    noPendingBookings: "Du har inga väntande bokningsförfrågningar.",
    noRides: "Du har inte lagt till några skjutsar än.",
    bookedRides: "Bokade Skjutsar",
    noBookedRides: "Du har inte bokat några skjutsar än.",
    accept: "Acceptera",
    reject: "Avslå",
    delete: "Ta bort",
    profilePicture: "Profilbild",
    addProfilePicture: "Lägg till Profilbild",
    selectImage: "Välj Bild",
    uploading: "Laddar upp...",
    rideDeleted: "Skjutsen raderad!",
    bookingAccepted: "Bokning accepterad!",
    bookingRejected: "Bokning avslagna.",
    loading: "Laddar profil...",
    signInRequired: "Logga in för att se din profil.",
    driver: "Förare",
    statusPending: "Väntar på svar",
    statusAccepted: "Accepterad",
    statusRejected: "Avslagen",
    manageBookings: "Hantera bokningar",
  },
};

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
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[locale] || translations.en;

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
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);

  const bookingStatusBadges: Record<string, { label: string; className: string }> = {
    pending: {
      label: t.statusPending,
      className: "bg-amber-100/80 text-amber-800 border border-amber-200",
    },
    accepted: {
      label: t.statusAccepted,
      className: "bg-emerald-100/80 text-emerald-700 border border-emerald-200",
    },
    rejected: {
      label: t.statusRejected,
      className: "bg-rose-100/80 text-rose-700 border border-rose-200",
    },
  };

  const formatBookingDate = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString(locale);
  };

  const formatRideDateTime = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const separator = locale === "fi" ? "klo " : locale === "sv" ? "kl. " : "at ";
    const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    return `${date.toLocaleDateString(locale)} ${separator}${time}`;
  };

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

      // Load profile picture from localStorage
      if (userId) {
        const savedPicture = localStorage.getItem(`profilePicture_${userId}`);
        if (savedPicture) {
          setProfilePicture(savedPicture);
        }
      }

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

      try {
        const response = await fetch("/api/bookings");
        if (response.ok) {
          const bookingsData: any[] = await response.json();
          console.log("Bookings fetched from API:", bookingsData);
          setBookings(bookingsData);
        } else {
          const status = response.status;
          console.error("Error fetching bookings: HTTP", status);
          setBookings([]);
        }
      } catch (error: unknown) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      }

      // Fetch pending booking requests for user's rides
      try {
        const { data: userRides } = await supabase
          .from("rides")
          .select("id")
          .eq("owner", userId ?? "");

        if (userRides && userRides.length > 0) {
          const rideIds = userRides.map((r: any) => r.id);
          const { data: pendingBookingsData } = await supabase
            .from("bookings")
            .select(`
              id,
              user_email,
              ride_id,
              status,
              ride:ride_id (
                id,
                from_city,
                to_city,
                departure,
                price_eur,
                driver_name
              )
            `)
            .eq("status", "pending")
            .in("ride_id", rideIds);

          console.log("Pending bookings:", pendingBookingsData);
          setPendingBookings(pendingBookingsData || []);
        }
      } catch (error: unknown) {
        console.error("Error fetching pending bookings:", error);
        setPendingBookings([]);
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [router, session, status]);

  const handleDeleteRide = async () => {
    if (!rideToDelete) return;
    try {
      const response = await fetch(`/api/rides?id=${rideToDelete}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setRides((prev) => prev.filter((r) => r.id !== rideToDelete));
        setNotificationType("success");
        setNotificationMessage(t.rideDeleted);
        setTimeout(() => setNotificationMessage(null), 3000);
      } else {
        const error = await response.json();
        setNotificationType("error");
        setNotificationMessage(error.error || t.rideDeleted);
        setTimeout(() => setNotificationMessage(null), 3000);
      }
    } catch (err) {
      console.error("Virhe:", err);
      setNotificationType("error");
      setNotificationMessage(t.rideDeleted);
      setTimeout(() => setNotificationMessage(null), 3000);
    } finally {
      setRideToDelete(null);
    }
  };

  const handleBookingResponse = async (bookingId: string, action: "accept" | "reject") => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      });

      if (response.ok) {
        setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setNotificationType("success");
        setNotificationMessage(
          action === "accept"
            ? t.bookingAccepted
            : t.bookingRejected
        );
        setTimeout(() => setNotificationMessage(null), 3000);
      } else {
        const error = await response.json();
        setNotificationType("error");
        setNotificationMessage(error.error || "Error processing booking");
        setTimeout(() => setNotificationMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setNotificationType("error");
      setNotificationMessage("Error processing booking");
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotificationType("error");
      setNotificationMessage("Kuvatiedosto on liian suuri. Enimmäiskoko on 5 MB.");
      setNotificationMessage(null);
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setNotificationType("error");
      setNotificationMessage("Valitse kuvatiedosto (JPG, PNG, etc.).");
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

    setIsUploadingPicture(true);

    // Create a data URL for the image (store locally)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfilePicture(dataUrl);
      // Store in localStorage
      if (user?.id) {
        localStorage.setItem(`profilePicture_${user.id}`, dataUrl);
      }
      setIsUploadingPicture(false);
      setNotificationType("success");
      setNotificationMessage("Profile picture saved");
      setTimeout(() => setNotificationMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <p className="text-center text-emerald-600">{t.loading}</p>;
  }

  if (!user) {
    return <p className="text-center text-neutral-600">{t.signInRequired}</p>;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-16 px-4"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-emerald-100 p-6">
        <h1 className="text-3xl font-bold text-emerald-700 mb-6">{t.title}</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">{t.userInfo}</h2>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profiilikuva"
                    className="w-32 h-32 rounded-full object-cover border-4 border-emerald-200 shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 text-4xl font-bold shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowProfilePictureModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium text-sm"
              >
                {isUploadingPicture ? t.uploading : t.addProfilePicture}
              </button>
            </div>

            {/* Profile Picture Modal */}
            {showProfilePictureModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6"
                >
                  <h3 className="text-lg font-semibold text-emerald-700 mb-4">{t.addProfilePicture}</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    {t.profilePicture} personalisointiin käytetään.</p>
                  
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleProfilePictureChange(e);
                        setShowProfilePictureModal(false);
                      }}
                      disabled={isUploadingPicture}
                      className="hidden"
                    />
                    <span className="block w-full px-4 py-2 bg-emerald-500 text-white text-center rounded-lg hover:bg-emerald-600 transition font-medium text-sm disabled:opacity-50 cursor-pointer">
                      {isUploadingPicture ? t.uploading : t.selectImage}
                    </span>
                  </label>

                  <button
                    onClick={() => setShowProfilePictureModal(false)}
                    className="w-full mt-3 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                </motion.div>
              </div>
            )}

            {/* User Info */}
            <div className="flex-1">
              <p className="mb-3"><strong className="text-emerald-700">{t.name}:</strong> {user.name}</p>
              <p><strong className="text-emerald-700">{t.email}:</strong> {user.email}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">{t.myRides}</h2>
          {rides.length === 0 ? (
            <p className="text-neutral-600">{t.noRides}</p>
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
                    {t.delete}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">{t.pendingBookings}</h2>
          {pendingBookings.length === 0 ? (
            <p className="text-neutral-600">{t.noPendingBookings}</p>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking: any) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-emerald-700">
                        {booking.ride?.from_city} → {booking.ride?.to_city}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {new Date(booking.ride?.departure).toLocaleDateString("fi-FI")} klo{" "}
                        {new Date(booking.ride?.departure).toLocaleTimeString("fi-FI", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Rider: {booking.user_email}
                      </p>
                      <p className="text-sm text-emerald-700 font-medium">
                        {booking.ride?.price_eur} €
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBookingResponse(booking.id, "accept")}
                      className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition text-sm"
                    >
                      {t.accept}
                    </button>
                    <button
                      onClick={() => handleBookingResponse(booking.id, "reject")}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition text-sm"
                    >
                      {t.reject}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-emerald-700">{t.bookedRides}</h2>
            <Link
              href={`/${locale}/bookings`}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
            >
              {t.manageBookings}
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-neutral-600">{t.noBookedRides}</p>
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
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        bookingStatusBadges[b.status]?.className ?? bookingStatusBadges.pending.className
                      }`}
                    >
                      {bookingStatusBadges[b.status]?.label ?? bookingStatusBadges.pending.label}
                    </span>
                    <p className="text-xs text-neutral-500">
                      {formatBookingDate(b.created_at)}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-700">
                    {b.ride?.from_city} → {b.ride?.to_city}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {formatRideDateTime(b.ride?.departure)}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {t.driver}: {b.ride?.driver_name || "Unknown"}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-emerald-700 font-medium">
                      {b.ride?.price_eur} €
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {notificationMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-4 right-4 rounded-xl px-6 py-3 shadow-lg text-white ${
            notificationType === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notificationMessage}
        </motion.div>
      )}
    </motion.main>
  );
}
