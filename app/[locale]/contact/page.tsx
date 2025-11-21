

'use client';

import { usePathname } from 'next/navigation';

const translations = {
  fi: {
    title: "Ota yhteyttä",
    subtitle: "Onko sinulla kysyttävää tai palautetta? Lähetä meille viesti — kuulemme mielellämme sinusta! 💬",
    namePlaceholder: "Nimi",
    emailPlaceholder: "Sähköposti",
    messagePlaceholder: "Viesti",
    sendButton: "Lähetä viesti",
  },
  en: {
    title: "Contact Us",
    subtitle: "Have questions? We'd love to hear from you. Send us a message!",
    namePlaceholder: "Name",
    emailPlaceholder: "Email",
    messagePlaceholder: "Message",
    sendButton: "Send Message",
  },
  sv: {
    title: "Kontakta Oss",
    subtitle: "Har du en fråga eller feedback? Skicka oss ett meddelande — vi älskar att höra från dig! 💬",
    namePlaceholder: "Namn",
    emailPlaceholder: "E-post",
    messagePlaceholder: "Meddelande",
    sendButton: "Skicka Meddelande",
  },
};

export default function Contact() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[locale] || translations.en;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-20 px-6">
      <h1 className="text-4xl font-extrabold text-emerald-700 mb-6">{t.title}</h1>
      <p className="max-w-2xl text-neutral-700 text-lg leading-relaxed mb-8">
        {t.subtitle}
      </p>
      <form className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          placeholder={t.namePlaceholder}
          className="input rounded-xl border border-emerald-200 px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        />
        <input
          type="email"
          placeholder={t.emailPlaceholder}
          className="input rounded-xl border border-emerald-200 px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        />
        <textarea
          placeholder={t.messagePlaceholder}
          rows={4}
          className="input rounded-xl border border-emerald-200 px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        ></textarea>
        <button
          type="submit"
          className="bg-emerald-500 text-white font-semibold py-2 rounded-xl hover:bg-emerald-600 transition"
        >
          {t.sendButton}
        </button>
      </form>
    </main>
  );
}

