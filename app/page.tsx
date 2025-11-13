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
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={mainControls}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden pt-32 bg-gradient-to-b from-[#eaf8ec]/30 via-white/20 to-white/40 text-center px-4"
    >
      {/* Taustallinen blur-hehku */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#25b44a] opacity-40 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-300px] right-[-200px] w-[600px] h-[600px] bg-[#2dcf57] opacity-50 blur-[100px] rounded-full"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/3 w-96 h-96 bg-[#25b44a]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#2dcf57]/20 rounded-full blur-3xl animate-ping"></div>
      </div>

      {/* Hitaasti liikkuvat taustaelementit */}
      <div className="absolute inset-0 overflow-visible z-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-[#25b44a]/20 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-[#2dcf57]/20 rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/2 left-10 w-40 h-40 bg-[#25b44a]/20 rounded-full blur-2xl animate-[float_14s_ease-in-out_infinite]" />
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>

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
        className="mt-32 container-max text-center"
      >
        <h2 className="text-3xl font-bold text-[#1e9239] mb-8">Matkusta ympäri Pohjoismaita</h2>
        <div className="relative w-full h-96 bg-[#eaf8ec] rounded-2xl border border-[#c2edca] shadow-inner overflow-hidden">
          <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full">
            {/* Reitit */}
            <motion.path d="M100 300 Q400 150 700 200" stroke="#21a53f" strokeWidth="3" fill="none" opacity="0.6" />
            <motion.path d="M150 250 Q400 80 650 180" stroke="#21a53f" strokeWidth="2" fill="none" opacity="0.5" />
            <motion.path d="M120 320 Q420 200 720 240" stroke="#21a53f" strokeWidth="4" fill="none" opacity="0.4" />

            {/* Liikkuvat pisteet (autot) */}
            <motion.circle cx="100" cy="300" r="6" fill="#21a53f" animate={{ x: [0, 600, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
            <motion.circle cx="150" cy="250" r="5" fill="#21a53f" animate={{ x: [0, 500, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
            <motion.circle cx="120" cy="320" r="7" fill="#21a53f" animate={{ x: [0, 580, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
          </svg>
        </div>
      </motion.section>

      {/* CTA-banneri */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="mt-32 py-16 bg-gradient-to-r from-[#21a53f] to-[#2dcf57] text-white text-center rounded-2xl shadow-lg mx-4 md:mx-auto max-w-5xl"
      >
        <h2 className="text-3xl font-bold mb-4">Aloita yhteisöllinen matkustaminen jo tänään 🌱</h2>
        <p className="mb-8 text-lg">Liity Lyvoon ja löydä kyyti hetkessä – edullisesti ja ekologisesti.</p>
        <Link
          href="/rides"
          className="bg-white text-[#1e9239] px-8 py-4 font-semibold rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-300 inline-block"
        >
          Liity nyt
        </Link>
      </motion.section>

      <footer className="mt-24 py-8 text-center text-sm text-neutral-600 border-t border-neutral-200">
        Lyvo © 2025 — Yhdessä vihreämpään huomiseen 🌿
      </footer>
    </motion.main>
  );
}