"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AlertBox from "@/components/AlertBox";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const translations = {
  fi: {
    title: "Varaushallinta",
    description: "Näet ja hallitset kaikki kyytivarauksesi yhdestä näkymästä.",
    summaryPending: "Odottaa vahvistusta",
    summaryAccepted: "Hyväksytyt",
    summaryRejected: "Hylätyt",
    statusLabels: {
      pending: "Odottaa vahvistusta",
      accepted: "Hyväksytty",
      rejected: "Hylätty",
    },
    statusShort: {
      pending: "Odottaa",
      accepted: "Hyväksytty",
      rejected: "Hylätty",
    },
    upcomingTitle: "Tulevat kyydit",
    upcomingEmpty: "Ei tulevia varauksia juuri nyt.",
    pastTitle: "Menneet kyydit",
    pastEmpty: "Ei menneitä varauksia vielä.",
    cancel: "Peru varaus",
    cancelling: "Perutaan...",
    cancelledSuccess: "Varaus peruttu.",
    cancelledError: "Varauksen peruminen epäonnistui. Yritä uudelleen.",
    loginRequired: "Kirjaudu sisään nähdäksesi varauksesi.",
    loading: "Ladataan varauksia...",
    rideRemoved: "Kyyti on poistettu eikä sitä voi enää tarkastella.",
    priceLabel: "Hinta",
    driverLabel: "Kuljettaja",
    requestedOn: "Varattu",
    loadError: "Varauksia ei voitu ladata. Yritä uudelleen myöhemmin.",
  },
  en: {
    title: "Booking Manager",
    description: "Review and manage every ride you have reserved in one place.",
    summaryPending: "Awaiting confirmation",
    summaryAccepted: "Accepted",
    summaryRejected: "Rejected",
    statusLabels: {
      pending: "Awaiting confirmation",
      accepted: "Accepted",
      rejected: "Rejected",
    },
    statusShort: {
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
    },
    upcomingTitle: "Upcoming rides",
    upcomingEmpty: "No upcoming bookings right now.",
    pastTitle: "Past rides",
    pastEmpty: "No past bookings yet.",
    cancel: "Cancel booking",
    cancelling: "Cancelling...",
    cancelledSuccess: "Booking cancelled.",
    cancelledError: "Could not cancel the booking. Try again.",
    loginRequired: "Please sign in to view your bookings.",
    loading: "Loading bookings...",
    rideRemoved: "This ride is no longer available.",
    priceLabel: "Price",
    driverLabel: "Driver",
    requestedOn: "Requested",
    loadError: "We couldn't load your bookings. Please try again shortly.",
  },
  sv: {
    title: "Bokningsöversikt",
    description: "Visa och hantera alla dina skjutsbokningar på ett ställe.",
    summaryPending: "Väntar på svar",
    summaryAccepted: "Accepterade",
    summaryRejected: "Avslagna",
    statusLabels: {
      pending: "Väntar på svar",
      accepted: "Accepterad",
      rejected: "Avslagen",
    },
    statusShort: {
      pending: "Väntar",
      accepted: "Accepterad",
      rejected: "Avslagen",
    },
    upcomingTitle: "Kommande resor",
    upcomingEmpty: "Inga kommande bokningar just nu.",
    pastTitle: "Tidigare resor",
    pastEmpty: "Inga tidigare bokningar ännu.",
    cancel: "Avbryt bokning",
    cancelling: "Avbryter...",
    cancelledSuccess: "Bokningen avbröts.",
    cancelledError: "Det gick inte att avbryta bokningen. Försök igen.",
    loginRequired: "Logga in för att visa dina bokningar.",
    loading: "Laddar bokningar...",
    rideRemoved: "Skjutsen finns inte längre.",
    priceLabel: "Pris",
    driverLabel: "Förare",
    requestedOn: "Bokad",
    loadError: "Bokningar kunde inte hämtas. Försök igen senare.",
  },
};

type BookingStatus = "pending" | "accepted" | "rejected";

type RideSummary = {
  id: string;
  from_city: string;
  to_city: string;
  departure: string;
  price_eur: number | null;
  driver_name: string | null;
};

type Booking = {
  id: string;
  created_at?: string;
  status: BookingStatus;
  ride?: RideSummary | null;
};

const statusArtifacts: Record<BookingStatus, { color: string; icon: ReactNode }> = {
  pending: {
    color: "bg-amber-100/80 text-amber-800 border border-amber-200",
    icon: <Clock className="h-4 w-4" />,
  },
  accepted: {
    color: "bg-emerald-100/80 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  rejected: {
    color: "bg-rose-100/80 text-rose-700 border border-rose-200",
    icon: <XCircle className="h-4 w-4" />,
  },
};

export default function BookingsPage() {
  const pathname = usePathname();
  const locale = (pathname.split("/")[1] || "fi") as keyof typeof translations;
  const t = translations[locale] ?? translations.en;

  const router = useRouter();
  const { data: session, status } = useSession();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    const loadBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/bookings");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data: Booking[] = await response.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
  console.error("Failed to load bookings:", error);
  setAlertType("error");
  setAlertMessage(t.loadError);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [session, status, router, t.loadError]);

  const statusCounts = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      { pending: 0, accepted: 0, rejected: 0 } as Record<BookingStatus, number>
    );
  }, [bookings]);

  const [upcomingBookings, pastBookings] = useMemo(() => {
    const now = new Date();

    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    bookings.forEach((booking) => {
      const departureRaw = booking.ride?.departure;
      if (!departureRaw) {
        past.push(booking);
        return;
      }
      const departure = new Date(departureRaw);
      if (Number.isNaN(departure.getTime())) {
        past.push(booking);
        return;
      }
      if (departure >= now) {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    });

    upcoming.sort((a, b) => {
      const aTime = a.ride?.departure ? new Date(a.ride.departure).getTime() : 0;
      const bTime = b.ride?.departure ? new Date(b.ride.departure).getTime() : 0;
      return aTime - bTime;
    });

    past.sort((a, b) => {
      const aTime = a.ride?.departure ? new Date(a.ride.departure).getTime() : 0;
      const bTime = b.ride?.departure ? new Date(b.ride.departure).getTime() : 0;
      return bTime - aTime;
    });

    return [upcoming, past];
  }, [bookings]);

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return `${date.toLocaleDateString(locale)} • ${date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const canCancel = (booking: Booking) => {
    if (!booking.ride?.departure) {
      return false;
    }
    const departure = new Date(booking.ride.departure);
    return (
      departure.getTime() > Date.now() &&
      (booking.status === "pending" || booking.status === "accepted")
    );
  };

  const handleCancel = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      setAlertType("success");
      setAlertMessage(t.cancelledSuccess);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      setAlertType("error");
      setAlertMessage(t.cancelledError);
    } finally {
      setCancellingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100"
      >
        <p className="text-emerald-600 font-medium">{t.loading}</p>
      </motion.main>
    );
  }

  if (!session?.user) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100"
      >
        <p className="text-neutral-600 font-medium">{t.loginRequired}</p>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-20 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="bg-white border border-emerald-100 shadow-sm rounded-3xl p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-3">{t.title}</h1>
          <p className="text-neutral-600 text-sm md:text-base">{t.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {([
              { key: "pending", label: t.summaryPending },
              { key: "accepted", label: t.summaryAccepted },
              { key: "rejected", label: t.summaryRejected },
            ] as const).map(({ key, label }) => (
              <div
                key={key}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  {label}
                </p>
                <p className="text-2xl font-bold text-emerald-800">
                  {statusCounts[key] || 0}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-emerald-800">{t.upcomingTitle}</h2>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="text-neutral-600 text-sm">{t.upcomingEmpty}</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const ride = booking.ride;
                const statusInfo = statusArtifacts[booking.status];
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-emerald-100 rounded-3xl shadow-sm p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
                          >
                            {statusInfo.icon}
                            {t.statusShort[booking.status]}
                          </span>
                          <p className="text-sm text-neutral-500">
                            {t.requestedOn}: {formatDateTime(booking.created_at)}
                          </p>
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-800">
                          {ride ? `${ride.from_city} → ${ride.to_city}` : t.rideRemoved}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {formatDateTime(ride?.departure) || ""}
                        </p>
                        {ride?.driver_name && (
                          <p className="text-sm text-neutral-600">
                            {t.driverLabel}: {ride.driver_name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 items-start md:items-end">
                        <p className="text-base font-semibold text-emerald-700">
                          {t.priceLabel}: {ride?.price_eur != null ? `${ride.price_eur} €` : "—"}
                        </p>
                        {canCancel(booking) && (
                          <button
                            type="button"
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow transition-colors ${
                              cancellingId === booking.id
                                ? "bg-emerald-400 text-white cursor-wait"
                                : "bg-emerald-500 text-white hover:bg-emerald-600"
                            }`}
                          >
                            {cancellingId === booking.id ? t.cancelling : t.cancel}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-emerald-800">{t.pastTitle}</h2>
          {pastBookings.length === 0 ? (
            <p className="text-neutral-600 text-sm">{t.pastEmpty}</p>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((booking) => {
                const ride = booking.ride;
                const statusInfo = statusArtifacts[booking.status];
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-emerald-100 rounded-3xl shadow-sm p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          {t.statusLabels[booking.status]}
                        </span>
                        <h3 className="text-lg font-semibold text-emerald-800">
                          {ride ? `${ride.from_city} → ${ride.to_city}` : t.rideRemoved}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {formatDateTime(ride?.departure) || ""}
                        </p>
                        {ride?.driver_name && (
                          <p className="text-sm text-neutral-600">
                            {t.driverLabel}: {ride.driver_name}
                          </p>
                        )}
                      </div>
                      <p className="text-base font-semibold text-emerald-700">
                        {t.priceLabel}: {ride?.price_eur != null ? `${ride.price_eur} €` : "—"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {alertMessage && (
          <AlertBox
            message={alertMessage}
            type={alertType}
            onClose={() => setAlertMessage(null)}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
