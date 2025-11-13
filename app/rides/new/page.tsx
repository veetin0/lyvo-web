// Move "use client" to the very top
"use client";

import { useSession } from "next-auth/react";

import Link from "next/link";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const cities = [
  "Helsinki", "Espoo", "Vantaa", "Tampere", "Turku", "Oulu", "Jyväskylä", "Kuopio", "Lahti", "Pori",
  "Joensuu", "Lappeenranta", "Vaasa", "Rovaniemi", "Seinäjoki", "Kokkola", "Kajaani", "Mikkeli",
  "Tukholma", "Göteborg", "Malmö", "Uppsala", "Linköping", "Västerås", "Örebro",
  "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen",
  "Kööpenhamina", "Aarhus", "Odense", "Aalborg",
  "Tallinna", "Riga", "Vilna", "Reykjavik", "Amsterdam", "Berlin", "Warszawa", "Praha", "Budapest"
];

export default function NewRide() {
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
      alert("Kirjaudu ensin sisään lisätäksesi kyydin!");
      return;
    }

    const fromCountry = cityCountries[ride.from];
    const toCountry = cityCountries[ride.to];
    if (fromCountry && toCountry && fromCountry !== toCountry) {
      alert("Lähtö- ja kohdekaupungin on oltava samasta maasta.");
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
      alert(`Virhe tallennuksessa: ${error.message || JSON.stringify(error)}`);
    } else {
      alert("Kyyti lisätty onnistuneesti!");
      router.push("/rides");
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
    if (ride.options.electric) newSuggestions.push("Lisää 'Hiljainen kyyti' ja 'Latausmahdollisuus'.");
    if (!ride.price) newSuggestions.push("Aseta pyyntihinta — tyypillinen hinta on noin 10€ / 100 km.");
    if (distance && duration) newSuggestions.push(`Matkan arvioitu kesto: ${duration}.`);
    if (ride.from && ride.to && !ride.date) newSuggestions.push("Valitse päivämäärä, jotta matkustajat voivat varata kyydin.");
    setSuggestions(newSuggestions);
  }, [ride, distance, duration]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative min-h-screen bg-gradient-to-b from-shade-100 via-shade-50 to-white py-16 px-4 text-center overflow-hidden"
    >
      {/* Taustaelementit */}

      {/* Pehmeä vihreä valoefekti yläosassa */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-emerald-200/30 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/3 pointer-events-none" />

      {/* Hienovarainen aalto- tai kuvioefekti */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(0,128,0,0.05) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(0,128,0,0.05) 0%, transparent 60%)",
        }}
      />
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
      <h1 className="text-4xl font-bold text-shade-700 mb-8">Lisää kyyti</h1>

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <label className="label">Lähtöpaikka</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                Lisää lähtöpaikka — esim. kaupunki tai tarkempi osoite.
              </div>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              name="from"
              value={ride.from}
              onChange={(e) => handleCityInput(e, "from")}
              placeholder="Esim. Helsinki"
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="flex items-center gap-2">
            <label className="label">Kohdepaikka</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                Minne olet menossa? Kirjoita kohdekaupunki tai osoite.
              </div>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              name="to"
              value={ride.to}
              onChange={(e) => handleCityInput(e, "to")}
              placeholder="Esim. Tampere"
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

        {/* Reitti- ja sijaintitiedot */}
        {distance && duration && (
          <div className="mt-4 text-shade-600 text-sm">
            Matka: <span className="font-semibold">{distance}</span> &nbsp; | &nbsp; Kesto: <span className="font-semibold">{duration}</span>
          </div>
        )}
        {/* Simuloitu karttanäkymä */}
        {ride.from && ride.to && (
          <div className="mt-4 relative bg-gradient-to-br from-shade-50 to-white border border-shade-200 rounded-xl p-4 shadow-inner">
            <h3 className="text-shade-700 font-semibold mb-2 text-sm">Reittikartta (simuloitu)</h3>
            <div className="relative h-48 bg-white rounded-lg border border-shade-100 overflow-hidden">
              <div className="absolute top-1/2 left-6 w-[calc(100%-3rem)] h-1 bg-shade-300 rounded-full" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-shade-500 rounded-full shadow" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-shade-600 rounded-full shadow" />
              <div className="absolute top-[55%] left-[20%] w-5 h-3 bg-shade-400 rounded-full animate-bounce shadow" />
              <p className="absolute top-[65%] left-4 text-xs text-shade-600">{ride.from}</p>
              <p className="absolute top-[65%] right-4 text-xs text-shade-600">{ride.to}</p>
            </div>
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
              <label className="label">Päivämäärä</label>
              <div className="relative group">
                <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                  Valitse matkasi päivämäärä.
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
              <label className="label">Lähtöaika</label>
              <div className="relative group">
                <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                  Mihin aikaan kyyti lähtee liikkeelle.
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
            <label className="label">Vapaita paikkoja</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                Kuinka monta matkustajaa mahtuu kyytiin.
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
            <label className="label">Pyyntihinta (€)</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                Paljonko pyydät kyydistä per henkilö.
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
            Lisävalinnat
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none">
              Halutessasi voit tarjota alennetun hinnan, jos auto täyttyy kokonaan.
            </div>
          </button>
          {showDiscount && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <label className="label">Alennettu hinta (€)</label>
                <div className="relative group">
                  <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
                  <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                    Halutessasi voit tarjota alennetun hinnan, jos auto täyttyy kokonaan.
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
            <label className="label">Auton merkki</label>
            <input
              type="text"
              value={carBrand}
              onChange={(e) => setCarBrand(e.target.value)}
              placeholder="Esim. Tesla, Toyota..."
              className="input mt-1"
            />
          </div>
          <div>
            <label className="label">Auton kuva</label>
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
            <label className="label">Kyytiominaisuudet</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute z-50 left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                Lisää kyytiominaisuuksia ja erotu joukosta paremmin.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-shade-300 scrollbar-track-shade-50 rounded-xl">
            {[
              { key: "electric", label: "Sähköauto" },
              { key: "van", label: "Tila-auto" },
              { key: "pets", label: "Lemmikit sallittu" },
              { key: "quiet", label: "Hiljainen kyyti" },
              { key: "music", label: "Musiikkia kyydissä" },
              { key: "ac", label: "Ilmastointi" },
              { key: "talkative", label: "Puhelias kuski" },
              { key: "smokeFree", label: "Savuton kyyti" },
              { key: "wifi", label: "WiFi käytössä" },
              { key: "charging", label: "Latausmahdollisuus" },
              { key: "bikeSpot", label: "Polkupyörän kuljetus mahdollista" },
              { key: "pickUp", label: "Nouto sovittavissa" },
              { key: "restStop", label: "Taukopysähdyksiä matkalla" },
              { key: "startTime", label: "Joustava lähtöaika" },
              { key: "bag", label: "Tilaa laukuille" },
              { key: "rentCar", label: "Vuokra- tai yhteisauto" },
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
            <label className="label">Lisätiedot kyydistä</label>
            <div className="relative group">
              <button type="button" className="text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-shade-300 bg-shade-100 text-shade-600">i</button>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 p-2 bg-white border border-shade-200 text-sm text-neutral-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
                Voit kertoa esimerkiksi auton mallista, pysähdyksistä tai tunnelmasta.
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
          <label htmlFor="recurring" className="text-shade-700 font-medium text-sm cursor-pointer">Toistuva kyyti</label>
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
            <h3 className="text-shade-700 font-semibold mb-2">Ehdotukset</h3>
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
          Lisää kyyti
        </motion.button>
      </form>
        </>
      )}
    </motion.main>
  );
}