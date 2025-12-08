"use client";

import Link from "next/link";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import SplitText from "@/components/SplitText";
import Header from "@/components/header";
import { Sora } from "next/font/google";

const heroFont = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-hero",
});

const translations = {
  fi: {
    title: "Lyvo",
    subtitle: "Jaa kyydit, säästä rahaa ja suojele planeettaa yhdessä",
    tagline: "Matkusta helposti Lyvon kanssa!",
    findRide: "Etsi kyyti",
    shareRide: "Jaa kyyti",
    howItWorks: "Näin Lyvo toimii",
    ecological: "Ekologinen",
    ecologicalDesc: "Säästä päästöjä ja matkusta yhdessä – jokainen kyyti tekee hyvää luonnolle.",
    easy: "Helppo",
    easyDesc: "Löydä kyyti hetkessä intuitiivisella hakutoiminnolla. Käytä mobiilissa tai webissä.",
    community: "Yhteisöllinen",
    communityDesc: "Tee matkoista mukavampia – tapaa muita opiskelijoita ja matkustajia turvallisesti.",
    howItWorksTitle: "Näin se toimii",
    findARide: "Etsi kyyti",
    findARideDesc: "Hae saatavilla olevia kyytejä alueeltasi tai luo kyytipyyntö",
    shareYourJourney: "Jaa matka",
    shareYourJourneyDesc: "Julkaise matka ja ansaitse rahaa samalla kun autat muita",
    greenerTogether: "Vihreämpi yhdessä",
    greenerTogetherDesc: "Jokainen jaettu kyyti vähentää päästöjä ja rakentaa yhteisöä",
    byTheNumbers: "Numeroissa",
    sharedRides: "Jaetut kyydit",
    activeDrivers: "Aktiiviset kuljettajat",
    studentRides: "Opiskelijakyydit",
    userExperiences: "Käyttäjäkokemukset",
    acrossNordics: "Matka pohjoismaiden yli",
    ctaTitle: "Aloita yhteisöllinen matkustaminen jo tänään",
    ctaDesc: "Liity Lyvoon ja löydä kyyti hetkessä – edullisesti ja ekologisesti.",
    ctaButton: "Liity nyt",
    footerText: "Yhdessä vihreämpään huomiseen 🌿",
    infoSave: "Säästä luontoa ja löydä kyytisi",
    infoRides: "Kymmenet tuhannet matkat päivittäin",
  },
  en: {
    title: "Lyvo",
    subtitle: "Share rides, save money, and protect the planet together",
    tagline: "Easy travel with Lyvo!",
    findRide: "Find a Ride",
    shareRide: "Share a Ride",
    howItWorks: "How Lyvo Works",
    ecological: "Ecological",
    ecologicalDesc: "Save emissions and travel together – every ride does good for nature.",
    easy: "Easy",
    easyDesc: "Find rides instantly with intuitive search. Use on mobile or web.",
    community: "Community",
    communityDesc: "Make travel more enjoyable – meet other students and travelers safely.",
    howItWorksTitle: "How It Works",
    findARide: "Find a Ride",
    findARideDesc: "Search for available rides in your area or create a ride request",
    shareYourJourney: "Share Your Journey",
    shareYourJourneyDesc: "Publish your trip and earn money while helping others",
    greenerTogether: "Greener Together",
    greenerTogetherDesc: "Every shared ride reduces emissions and builds community",
    byTheNumbers: "By the Numbers",
    sharedRides: "Shared Rides",
    activeDrivers: "Active Drivers",
    studentRides: "Student Rides",
    userExperiences: "User Experiences",
    acrossNordics: "Across the Nordics",
    ctaTitle: "Start sharing rides today",
    ctaDesc: "Join Lyvo and find a ride instantly – affordably and eco-friendly.",
    ctaButton: "Join now",
    footerText: "Together towards a greener tomorrow 🌿",
    infoSave: "Save nature and find your ride",
    infoRides: "Tens of thousands of rides daily",
  },
  sv: {
    title: "Lyvo",
    subtitle: "Dela skjutsar, spara pengar och skydda planeten tillsammans",
    tagline: "Enkel resor med Lyvo!",
    findRide: "Hitta skjuts",
    shareRide: "Dela skjuts",
    howItWorks: "Hur Lyvo fungerar",
    ecological: "Miljövänlig",
    ecologicalDesc: "Spara utsläpp och resa tillsammans – varje skjuts gör gott för naturen.",
    easy: "Enkelt",
    easyDesc: "Hitta skjutsar direkt med intuitiv sökning. Använd på mobil eller webben.",
    community: "Gemenskap",
    communityDesc: "Gör resor trevligare – träffa andra studenter och resenärer säkert.",
    howItWorksTitle: "Hur det fungerar",
    findARide: "Hitta skjuts",
    findARideDesc: "Sök efter tillgängliga skjutsar i ditt område eller skapa en skjutsförfrågan",
    shareYourJourney: "Dela din resa",
    shareYourJourneyDesc: "Publicera din resa och tjäna pengar medan du hjälper andra",
    greenerTogether: "Grönare tillsammans",
    greenerTogetherDesc: "Varje delad skjuts minskar utsläppen och bygger gemenskap",
    byTheNumbers: "I siffror",
    sharedRides: "Delade skjutsar",
    activeDrivers: "Aktiva förare",
    studentRides: "Studentskjutsar",
    userExperiences: "Användarupplevelser",
    acrossNordics: "I hela Norden",
    ctaTitle: "Börja dela skjutsar idag",
    ctaDesc: "Gå med i Lyvo och hitta en skjuts direkt – billigt och miljövänligt.",
    ctaButton: "Gå med nu",
    footerText: "Tillsammans mot en grönare framtid 🌿",
    infoSave: "Spara naturen och hitta din skjuts",
    infoRides: "Tiotusentals skjutsar dagligen",
  },
};

export default function Home() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[locale] || translations.en;
  
  const mainControls = useAnimation();

  useEffect(() => {
    mainControls.start({ opacity: 1, y: 0 });
  }, [mainControls]);

  return (
    <>
      <Header />
      {/* Background gradient */}
  <div className="fixed inset-0 -z-20 bg-gradient-to-b from-white via-[#f7fff9] to-white" />
      
      {/* Persistent background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ overflow: 'hidden' }}>
        {/* Orb 1 - Top Left */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[110px]"
          style={{
            top: '-220px',
            left: '-120px',
            background: 'radial-gradient(circle at 30% 30%, rgba(33, 165, 63, 0.35) 0%, rgba(33, 165, 63, 0.08) 45%, transparent 75%)',
            willChange: 'transform',
          }}
        />
        
        {/* Orb 2 - Top Right */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[120px]"
          style={{
            top: '-40px',
            right: '-180px',
            background: 'radial-gradient(circle at 40% 50%, rgba(45, 207, 87, 0.28) 0%, rgba(45, 207, 87, 0.08) 42%, transparent 75%)',
            willChange: 'transform',
          }}
        />
        
        {/* Orb 3 - Bottom Left */}
        <div
          className="absolute w-[820px] h-[820px] rounded-full blur-[130px]"
          style={{
            bottom: '-320px',
            left: '-40px',
            background: 'radial-gradient(circle at 50% 50%, rgba(37, 180, 74, 0.3) 0%, rgba(37, 180, 74, 0.08) 45%, transparent 78%)',
            willChange: 'transform',
          }}
        />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={mainControls}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`relative flex flex-col items-center justify-center min-h-screen overflow-hidden pt-32 text-center px-4 ${heroFont.variable}`}
      >

      {/* Hero-tekstit */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="font-hero text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-shade-800 drop-shadow-sm"
      >
        {t.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-5 text-lg text-neutral-700 max-w-xl mx-auto"
      >
        {t.subtitle}
      </motion.p>

      <SplitText
        text={t.tagline}
        className="text-3xl font-semibold text-[#1e9239] mt-8"
        delay={100}
        duration={0.6}
        ease="power3.out"
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}
        rootMargin="-100px"
        textAlign="center"
      />

      {/* Painikkeet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6"
      >
        <Link
          href={`/${locale}/rides`}
          className="relative px-6 py-3 md:px-8 md:py-4 bg-[#1f9e3b] text-white font-semibold rounded-full shadow-[0_18px_40px_-18px_rgba(33,165,63,0.8)] overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 group"
        >
          <span className="absolute inset-0 bg-[#25b44a] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out opacity-30" />
          <span className="relative z-10">{t.findRide}</span>
        </Link>

        <Link
          href={`/${locale}/rides/new`}
          className="relative px-6 py-3 md:px-8 md:py-4 bg-white text-[#1e9239] font-semibold rounded-full shadow-[0_18px_40px_-18px_rgba(33,165,63,0.35)] border border-[#c2edca] overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 group"
        >
          <span className="absolute inset-0 bg-[#eaf8ec] translate-x-[100%] group-hover:translate-x-0 transition-transform duration-300 ease-out opacity-50" />
          <span className="relative z-10">{t.shareRide}</span>
        </Link>
      </motion.div>

      {/* Alakortit */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="mt-24 grid md:grid-cols-3 gap-6 container-max"
      >
        <div className="card p-6 text-left rounded-3xl border border-[#c2edca]/60 bg-white/80 backdrop-blur hover:shadow-xl hover:-translate-y-1 transition-all">
          <h3 className="text-xl font-semibold text-[#1e9239] mb-2">
            {t.ecological}
          </h3>
          <p>{t.ecologicalDesc}</p>
        </div>
        <div className="card p-6 text-left rounded-3xl border border-[#c2edca]/60 bg-white/80 backdrop-blur hover:shadow-xl hover:-translate-y-1 transition-all">
          <h3 className="text-xl font-semibold text-[#1e9239] mb-2">{t.easy}</h3>
          <p>{t.easyDesc}</p>
        </div>
        <div className="card p-6 text-left rounded-3xl border border-[#c2edca]/60 bg-white/80 backdrop-blur hover:shadow-xl hover:-translate-y-1 transition-all">
          <h3 className="text-xl font-semibold text-[#1e9239] mb-2">{t.community}</h3>
          <p>{t.communityDesc}</p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 container-max text-center"
      >
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">{t.howItWorksTitle}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-semibold text-[#1e9239] mb-2">{t.findARide}</h3>
            <p>{t.findARideDesc}</p>
          </div>
          <div className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-semibold text-[#1e9239] mb-2">{t.shareYourJourney}</h3>
            <p>{t.shareYourJourneyDesc}</p>
          </div>
          <div className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-semibold text-[#1e9239] mb-2">{t.greenerTogether}</h3>
            <p>{t.greenerTogetherDesc}</p>
          </div>
        </div>
      </motion.section>

      {/* Lyvo numeroina */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 container-max text-center"
      >
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">{t.byTheNumbers}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: t.sharedRides, value: "1 250+" },
            { label: t.activeDrivers, value: "450+" },
            { label: t.studentRides, value: "65%" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-lg transition"
            >
              <p className="text-4xl font-bold text-[#1e9239]">{stat.value}</p>
              <p className="mt-2 text-neutral-700">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Käyttäjien kokemuksia */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 container-max text-center"
      >
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">{t.userExperiences}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Mikko, Turku", text: "Lyvo teki viikonloppumatkoista helppoja ja edullisia!" },
            { name: "Sara, Helsinki", text: "Ystävällinen yhteisö ja turvallinen matkustuskokemus 🌿" },
            { name: "Anna, Tampere", text: "Helppo käyttää ja todella käytännöllinen sovellus!" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-lg transition"
            >
              <p className="italic text-neutral-700 mb-4">&ldquo;{item.text}&rdquo;</p>
              <p className="font-semibold text-[#1e9239]">{item.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Interaktiivinen kartta */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 container-max text-center relative z-10"
      >
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">{t.acrossNordics}</h2>
        <div className="relative w-full h-96 bg-gradient-to-br from-[#eaf8ec] to-[#f5fbf7] rounded-2xl border-2 border-[#c2edca] shadow-lg overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' }}>
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#21a53f" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#25b44a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2dcf57" stopOpacity="0.4" />
              </linearGradient>
              <style>{`
                @keyframes moveCar1 {
                  0% { offset-distance: 0%; }
                  100% { offset-distance: 100%; }
                }
                @keyframes moveCar2 {
                  0% { offset-distance: 0%; }
                  100% { offset-distance: 100%; }
                }
                @keyframes moveCar3 {
                  0% { offset-distance: 0%; }
                  100% { offset-distance: 100%; }
                }
              `}</style>
            </defs>

            {/* Reitit */}
            <path d="M50 300 Q400 100 750 200" stroke="url(#routeGradient)" strokeWidth="4" fill="none" />
            <path d="M100 250 Q400 50 700 180" stroke="url(#routeGradient)" strokeWidth="3" fill="none" />
            <path d="M70 330 Q420 180 730 240" stroke="url(#routeGradient)" strokeWidth="4" fill="none" />

            {/* Kaupunkipisteet */}
            <circle cx="50" cy="300" r="6" fill="#1e9239" />
            <circle cx="750" cy="200" r="6" fill="#1e9239" />
            <circle cx="100" cy="250" r="6" fill="#1e9239" />
            <circle cx="700" cy="180" r="6" fill="#1e9239" />
            <circle cx="70" cy="330" r="6" fill="#1e9239" />
            <circle cx="730" cy="240" r="6" fill="#1e9239" />

            {/* Auto 1 */}
            <g style={{ offsetPath: 'path("M50 300 Q400 100 750 200")', animation: 'moveCar1 12s infinite linear' }}>
              <circle cx="0" cy="0" r="8" fill="#21a53f" />
              <circle cx="0" cy="0" r="12" fill="none" stroke="#21a53f" strokeWidth="1" opacity="0.5" />
            </g>

            {/* Auto 2 */}
            <g style={{ offsetPath: 'path("M100 250 Q400 50 700 180")', animation: 'moveCar2 14s infinite linear' }}>
              <circle cx="0" cy="0" r="7" fill="#2dcf57" />
              <circle cx="0" cy="0" r="11" fill="none" stroke="#2dcf57" strokeWidth="1" opacity="0.5" />
            </g>

            {/* Auto 3 */}
            <g style={{ offsetPath: 'path("M70 330 Q420 180 730 240")', animation: 'moveCar3 10s infinite linear' }}>
              <circle cx="0" cy="0" r="8" fill="#25b44a" />
              <circle cx="0" cy="0" r="12" fill="none" stroke="#25b44a" strokeWidth="1" opacity="0.5" />
            </g>
          </svg>

          {/* Info-palkki */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent p-4 text-left z-20">
            <p className="text-sm font-semibold text-[#1e9239]">{t.infoSave}</p>
            <p className="text-xs text-neutral-600 mt-1">{t.infoRides}</p>
          </div>
        </div>
      </motion.section>

      {/* CTA-banneri */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 py-16 bg-gradient-to-r from-[#21a53f] to-[#2dcf57] text-white text-center rounded-2xl shadow-lg mx-4 md:mx-auto max-w-5xl"
      >
  <h2 className="text-3xl font-bold mb-4 max-w-2xl mx-auto leading-tight px-4 sm:px-6">{t.ctaTitle}</h2>
  <p className="mb-8 text-lg max-w-xl mx-auto leading-relaxed px-4 sm:px-6">{t.ctaDesc}</p>
        <Link
          href={`/${locale}/rides`}
          className="bg-white text-[#1e9239] px-8 py-4 font-semibold rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-300 inline-block"
        >
          {t.ctaButton}
        </Link>
      </motion.section>

      <footer className="mt-24 py-8 text-center text-sm text-neutral-600 border-t border-neutral-200">
        Lyvo © 2025 — {t.footerText}
      </footer>
    </motion.main>
    </>
  );
}