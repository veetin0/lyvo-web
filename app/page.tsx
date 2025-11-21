"use client";

import Link from "next/link";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import SplitText from "@/components/SplitText";
import GlareHover from "@/components/GlareHover";

export default function Home() {
  const mainControls = useAnimation();
  const btn1Ref = useRef<HTMLDivElement>(null);
  const btn2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainControls.start({ opacity: 1, y: 0 });
  }, [mainControls]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--x", `${x}px`);
    target.style.setProperty("--y", `${y}px`);
  };

  return (
    <>
      {/* Background gradient */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-white via-[#f8fffa] to-white" />
      
      {/* Persistent background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ overflow: 'hidden' }}>
        {/* Orb 1 - Top Left */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            top: '-200px',
            left: '-100px',
            background: 'radial-gradient(circle at 30% 30%, rgba(33, 165, 63, 0.5) 0%, rgba(33, 165, 63, 0.15) 40%, transparent 70%)',
            willChange: 'transform',
          }}
        />
        
        {/* Orb 2 - Top Right */}
        <div 
          className="absolute w-[700px] h-[700px] rounded-full blur-3xl"
          style={{
            top: '0px',
            right: '-150px',
            background: 'radial-gradient(circle at 40% 50%, rgba(45, 207, 87, 0.4) 0%, rgba(45, 207, 87, 0.1) 40%, transparent 70%)',
            willChange: 'transform',
          }}
        />
        
        {/* Orb 3 - Bottom Left */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl"
          style={{
            bottom: '-300px',
            left: '0px',
            background: 'radial-gradient(circle at 50% 50%, rgba(37, 180, 74, 0.45) 0%, rgba(37, 180, 74, 0.1) 40%, transparent 70%)',
            willChange: 'transform',
          }}
        />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={mainControls}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden pt-32 text-center px-4"
      >

      {/* Hero-tekstit */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-6xl md:text-7xl font-extrabold tracking-tight text-shade-800 drop-shadow-sm"
      >
        Lyvo
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-5 text-lg text-neutral-700 max-w-2xl mx-auto"
      >
        Ekologiset ja edulliset kimppakyydit. Löydä tai lisää kyyti hetkessä.
      </motion.p>

      <SplitText
        text="Easy travel with Lyvo!"
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
        onLetterAnimationComplete={() => console.log('Animaatio valmis!')}
      />

      {/* Painikkeet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-10 flex justify-center gap-8"
      >
        <Link
          href="/rides"
          className="relative px-8 py-4 bg-[#21a53f] text-white font-semibold rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg group"
        >
          <span className="absolute inset-0 bg-[#25b44a] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out opacity-30" />
          <span className="relative z-10">Etsi kyyti</span>
        </Link>

        <Link
          href="/rides/new"
          className="relative px-8 py-4 bg-white text-[#1e9239] font-semibold rounded-xl shadow-md border border-[#c2edca] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg group"
        >
          <span className="absolute inset-0 bg-[#eaf8ec] translate-x-[100%] group-hover:translate-x-0 transition-transform duration-300 ease-out opacity-50" />
          <span className="relative z-10">Lisää kyyti</span>
        </Link>
      </motion.div>

      {/* Alakortit */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="mt-24 grid md:grid-cols-3 gap-6 container-max"
      >
        <div className="card p-6 text-left hover:shadow-lg hover:-translate-y-1 transition">
          <h3 className="text-xl font-semibold text-[#1e9239] mb-2">
            Ekologinen
          </h3>
          <p>Säästä päästöjä ja matkusta yhdessä – jokainen kyyti tekee hyvää luonnolle.</p>
        </div>
        <div className="card p-6 text-left hover:shadow-lg hover:-translate-y-1 transition">
          <h3 className="text-xl font-semibold text-[#1e9239] mb-2">Helppo</h3>
          <p>Löydä kyyti hetkessä intuitiivisella hakutoiminnolla. Käytä mobiilissa tai webissä.</p>
        </div>
        <div className="card p-6 text-left hover:shadow-lg hover:-translate-y-1 transition">
          <h3 className="text-xl font-semibold text-[#1e9239] mb-2">Yhteisöllinen</h3>
          <p>Tee matkoista mukavampia – tapaa muita opiskelijoita ja matkustajia turvallisesti.</p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 container-max text-center"
      >
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">Näin Lyvo toimii</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-semibold text-[#1e9239] mb-2">🕒 Löydä kyyti hetkessä</h3>
            <p>Selaa tarjolla olevia kyytejä helposti ja varaa paikka muutamassa sekunnissa.</p>
          </div>
          <div className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-semibold text-[#1e9239] mb-2">🚙 Lisää oma matkasi</h3>
            <p>Tarjoa paikka autossasi ja ansaitse samalla. Lyvo tekee matkustamisesta yhteistä.</p>
          </div>
          <div className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-semibold text-[#1e9239] mb-2">🌍 Yhdessä vihreämmin</h3>
            <p>Vähennä päästöjä ja tapaa uusia ihmisiä. Lyvo tekee hyvää sinulle ja luonnolle.</p>
          </div>
        </div>
      </motion.section>

      {/* Shade numeroina */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 container-max text-center"
      >
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">Lyvo numeroina</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Jaettua kyytiä", value: "1 250+" },
            { label: "Aktiivista kuljettajaa", value: "450+" },
            { label: "Opiskelijamatkaa", value: "65%" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
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
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">Käyttäjien kokemuksia</h2>
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
              className="bg-[#eaf8ec]/70 backdrop-blur-lg border border-[#c2edca] rounded-2xl p-6 shadow-md hover:shadow-lg transition"
            >
              <p className="italic text-neutral-700 mb-4">“{item.text}”</p>
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
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">Matkusta ympäri Pohjoismaita</h2>
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
            <p className="text-sm font-semibold text-[#1e9239]">Save nature and find your ride</p>
            <p className="text-xs text-neutral-600 mt-1">Tens of thousands of rides daily</p>
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
        <h2 className="text-3xl font-bold mb-4">Start sharing rides today</h2>
        <p className="mb-8 text-lg">Join Lyvo and find a ride instantly – affordably and eco-friendly.</p>
        <Link
          href="/rides"
          className="bg-white text-[#1e9239] px-8 py-4 font-semibold rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-300 inline-block"
        >
          Join now
        </Link>
      </motion.section>

      <footer className="mt-24 py-8 text-center text-sm text-neutral-600 border-t border-neutral-200">
        Lyvo © 2025 — Together towards a greener tomorrow 🌿
      </footer>
    </motion.main>
    </>
  );
}