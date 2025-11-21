

'use client';

import { usePathname } from 'next/navigation';

const translations = {
  fi: {
    title: "Tietoa meistä",
    description: "Lyvo syntyi ideasta tehdä matkustamisesta helpompaa, ekologisempaa ja yhteisöllisempää. 🌿 Olemme pohjoismainen kimppakyytialusta, joka yhdistää kuljettajat ja matkustajat vastuullisesti.",
  },
  en: {
    title: "About Us",
    description: "Lyvo was created with the idea of making travel easier, more ecological, and community-oriented. 🌿 We are a Nordic carpooling platform that connects drivers and passengers responsibly.",
  },
  sv: {
    title: "Om Oss",
    description: "Lyvo skapades med idén att göra resor enklare, mer ekologiska och gemenskapsorienterade. 🌿 Vi är en nordisk samåkningsplattform som förbinder förare och passagerare på ett ansvarfullt sätt.",
  },
};

export default function About() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[locale] || translations.en;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-20 px-6">
      <h1 className="text-4xl font-extrabold text-emerald-700 mb-6">{t.title}</h1>
      <p className="max-w-2xl text-neutral-700 text-lg leading-relaxed">
        {t.description}
      </p>
    </main>
  );
}

