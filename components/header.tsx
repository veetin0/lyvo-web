"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import lyvoLogo from "@/public/images/lyvo-logo.png";
import AuthButtons from "@/components/AuthButtons";

const translations = {
  fi: {
    findRide: "Etsi kyyti",
    shareRide: "Jaa kyyti",
    about: "Tietoa meistä",
    contact: "Ota yhteyttä",
    profile: "Profiili",
    bookings: "Varaukset",
    language: "Kieli",
  },
  en: {
    findRide: "Find a Ride",
    shareRide: "Share a Ride",
    about: "About",
    contact: "Contact",
    profile: "Profile",
    bookings: "Bookings",
    language: "Language",
  },
  sv: {
    findRide: "Hitta skjuts",
    shareRide: "Dela skjuts",
    about: "Om oss",
    contact: "Kontakta oss",
    profile: "Profil",
    bookings: "Bokningar",
    language: "Språk",
  },
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[currentLocale] || translations.en;

  const navItems = useMemo(
    () => [
      { href: `/${currentLocale}/rides`, label: t.findRide },
      { href: `/${currentLocale}/rides/new`, label: t.shareRide },
      { href: `/${currentLocale}/bookings`, label: t.bookings },
      { href: `/${currentLocale}/profile`, label: t.profile },
      { href: `/${currentLocale}/about`, label: t.about },
      { href: `/${currentLocale}/contact`, label: t.contact },
    ],
    [currentLocale, t]
  );

  const languageOptions = useMemo(
    () => [
      { code: "fi", label: "FI" },
      { code: "en", label: "EN" },
      { code: "sv", label: "SV" },
    ],
    []
  );

  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    return segments.join('/');
  };

  const isActive = (href: string) => {
    if (href === `/${currentLocale}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-emerald-100 bg-white/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:gap-6 lg:py-4">
        <div className="flex items-center gap-4 shrink-0">
          <Link href={`/${currentLocale}`} className="flex items-center shrink-0" aria-label="Lyvo home">
            <Image
              src={lyvoLogo}
              alt="Lyvo logo"
              className="h-10 w-auto object-contain sm:h-11"
              priority
              sizes="(max-width: 768px) 128px, 176px"
            />
          </Link>
          <p className="hidden text-sm font-semibold text-emerald-700 sm:block">
            Lift with Lyvo
          </p>
        </div>

        <nav className="hidden items-center gap-2 rounded-full bg-emerald-50/70 px-3 py-2 text-sm font-medium text-emerald-700 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition-colors ${
                isActive(item.href)
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "hover:bg-emerald-100/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold">
            {languageOptions.map((option) => (
              <Link
                key={option.code}
                href={switchLanguage(option.code)}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  currentLocale === option.code
                    ? "bg-emerald-500 text-white"
                    : "text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <div className="shrink-0">
            <AuthButtons />
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-100 text-emerald-700 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-emerald-100 bg-white lg:hidden">
          <div className="space-y-6 px-4 py-6">
            <nav className="space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {t.language}
              </p>
              <div className="flex gap-3">
                {languageOptions.map((option) => (
                  <Link
                    key={option.code}
                    href={switchLanguage(option.code)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex-1 rounded-lg px-3.5 py-2.5 text-center text-sm font-semibold transition-colors ${
                      currentLocale === option.code
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-emerald-100 pt-4">
              <AuthButtons />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
