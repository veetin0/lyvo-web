// Move "use client" to the very top
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import GoogleMapRide from "@/components/GoogleMapRide";

const translations = {
  fi: {
    title: "Lisää kyyti",
    from: "Lähtöpaikka",
    fromPlaceholder: "Esim. Helsinki",
    to: "Kohdepaikka",
    toPlaceholder: "Esim. Tampere",
    date: "Päivämäärä",
    time: "Lähtöaika",
    seats: "Vapaita paikkoja",
    price: "Pyyntihinta (€)",
    addRide: "Lisää kyyti",
    carBrand: "Auton merkki",
    carImage: "Auton kuva",
    selectImage: "Valitse kuva",
    features: "Kyytiominaisuudet",
    notes: "Lisätiedot kyydistä",
    recurring: "Toistuva kyyti",
    notificationSuccess: "Kyyti lisätty onnistuneesti!",
    notificationError: "Virhe kyytieä lisättäessä",
    loginRequired: "Kirjaudu ensin sisään lisätäksesi kyydin!",
  },
  en: {
    title: "Create New Ride",
    from: "Departure Location",
    fromPlaceholder: "E.g. Helsinki",
    to: "Destination",
    toPlaceholder: "E.g. Tampere",
    date: "Date",
    time: "Departure Time",
    seats: "Available Seats",
    price: "Price (€)",
    addRide: "Add Ride",
    carBrand: "Car Brand",
    carImage: "Car Image",
    selectImage: "Select Image",
    features: "Ride Features",
    notes: "Additional Notes",
    recurring: "Recurring Ride",
    notificationSuccess: "Ride added successfully!",
    notificationError: "Error adding ride",
    loginRequired: "Sign in to add a ride!",
  },
  sv: {
    title: "Lägg till skjuts",
    from: "Avgångsplats",
    fromPlaceholder: "T.ex. Helsinki",
    to: "Destination",
    toPlaceholder: "T.ex. Tampere",
    date: "Datum",
    time: "Avgångstid",
    seats: "Lediga platser",
    price: "Pris (€)",
    addRide: "Lägg till skjuts",
    carBrand: "Bilmärke",
    carImage: "Bilbild",
    selectImage: "Välj bild",
    features: "Skjutsegenskaper",
    notes: "Ytterligare information",
    recurring: "Återkommande skjuts",
    notificationSuccess: "Skjutsen tillagd!",
    notificationError: "Fel vid tilläggning av skjuts",
    loginRequired: "Logga in för att lägga till en skjuts!",
  },
};

const cities = [
  "Helsinki", "Espoo", "Vantaa", "Tampere", "Turku", "Oulu", "Jyväskylä", "Kuopio", "Lahti", "Pori",
  "Joensuu", "Lappeenranta", "Vaasa", "Rovaniemi", "Seinäjoki", "Kokkola", "Kajaani", "Mikkeli",
  "Tukholma", "Göteborg", "Malmö", "Uppsala", "Linköping", "Västerås", "Örebro",
  "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen",
  "Kööpenhamina", "Aarhus", "Odense", "Aalborg",
  "Tallinna", "Riga", "Vilna", "Reykjavik", "Amsterdam", "Berlin", "Warszawa", "Praha", "Budapest"
];

export default function NewRide() {
  const pathname = usePathname();
  const locale = useMemo(() => (pathname.split('/')[1] || 'fi') as keyof typeof translations, [pathname]);
  const t = translations[locale] || translations.en;

  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = !!session;

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
      studentDiscount: false,
      bikeSpot: false,
      pickUp: false,
      restStop: false,
      startTime: false,
      bag: false,
      rentCar: false,
    },
    notes: "",
  });

  // Uudet tilat
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");

  const handleRouteSelected = (routeInfo: { distance: string; duration: string; polyline: string }) => {
    setDistance(routeInfo.distance);
    setDuration(routeInfo.duration);
  };

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");

  // Älykkäät ehdotukset ja auton merkki/kuva -tilat
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [carBrand, setCarBrand] = useState("");
  const [carImage, setCarImage] = useState<string | null>(null);

  // Kaupunkiehdotukset
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>, type: "from" | "to") => {
    const value = e.target.value;
    setRide({ ...ride, [type]: value });

    const matches = cities.filter(city =>
      city.toLowerCase().includes(value.toLowerCase())
    );
    if (type === "from") setFromSuggestions(matches);
    else setToSuggestions(matches);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Session:", session);
    console.log("Lisäysdata:", {
      owner: (session?.user as any)?.id,
      from_city: ride.from,
      to_city: ride.to,
      departure: new Date(`${ride.date}T${ride.time}`).toISOString(),
      seats: ride.seats,
      price_eur: ride.price,
    });
    if (!isLoggedIn || !session?.user) {
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

    const { error } = await supabase.from("rides").insert([
      {
        owner: (session?.user as any)?.id,
        from_city: ride.from,
        to_city: ride.to,
        departure: new Date(`${ride.date}T${ride.time}`).toISOString(),
        seats: ride.seats,
        price_eur: Number(ride.price),
        car: carBrand || null,
        driver_name: (session.user as any)?.name || "Tuntematon",
        driver_rating: 0,
      },
    ]);

    if (error) {
      console.error("Virhe tallennuksessa:", error.message || error);
      setNotificationType("error");
      setNotificationMessage(`Virhe tallennuksessa: ${error.message || JSON.stringify(error)}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else {
      setNotificationType("success");
      setNotificationMessage("Kyyti lisätty onnistuneesti!");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        router.push("/rides");
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
    if (ride.from && ride.to) {
      // Simuloidaan etäisyys ja kesto
      const km = Math.floor(80 + Math.random() * 120); // 80-200 km
      const min = Math.floor(60 + Math.random() * 120); // 1h - 3h
      const h = Math.floor(min / 60);
      const m = min % 60;
      setDistance(`${km} km`);
      setDuration(`${h} h ${m} min`);
    } else {
      setDistance("");
      setDuration("");
    }
  }, [ride.from, ride.to]);

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
            <Link href="/" className="bg-white text-shade-600 px-4 py-2 rounded-lg font-semibold hover:bg-shade-50 transition">
              Palaa etusivulle
            </Link>
            <Link href="/rides" className="bg-shade-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-shade-700 transition">
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
        {/* From and To Fields - Side by Side */}
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
                  {locale === "fi" ? "Lisää lähtöpaikka — esim. kaupunki tai tarkempi osoite." : locale === "sv" ? "Lägg till avgångsplats — t.ex. stad eller exaktare adress." : "Add departure location — e.g. city or specific address."}
                </div>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                name="from"
                value={ride.from}
                onChange={(e) => handleCityInput(e, "from")}
                placeholder={t.fromPlaceholder}
                className="input mt-1"
                required
                autoComplete="off"
              />
              {fromSuggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-neutral-200 rounded-lg shadow-lg mt-1 w-full text-left">
                  {fromSuggestions.map((city, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        setRide({ ...ride, from: city });
                        setFromSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-shade-50 cursor-pointer"
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                  {locale === "fi" ? "Minne olet menossa? Kirjoita kohdekaupunki tai osoite." : locale === "sv" ? "Var ska du? Skriv destinationsstaden eller adressen." : "Where are you going? Write the destination city or address."}
                </div>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                name="to"
                value={ride.to}
                onChange={(e) => handleCityInput(e, "to")}
                placeholder={t.toPlaceholder}
                className="input mt-1"
                required
                autoComplete="off"
              />
              {toSuggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-neutral-200 rounded-lg shadow-lg mt-1 w-full text-left">
                  {toSuggestions.map((city, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        setRide({ ...ride, to: city });
                        setToSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-shade-50 cursor-pointer"
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>

        {/* Google Maps Component - Shows below from/to fields */}
        {ride.from && ride.to && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <GoogleMapRide onRouteSelected={handleRouteSelected} />
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
            className="input mt-1"
            required
          />
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
              <img src={carImage} alt="Auton kuva" className="mt-3 w-full rounded-xl shadow-md" />
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
          className="w-full mt-6 bg-shade-500 hover:bg-shade-600 text-white py-3 rounded-xl font-semibold shadow-md transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
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
