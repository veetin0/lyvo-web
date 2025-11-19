"use client";

import './globals.css';
import Link from "next/link";
import { ReactNode, useState } from 'react';

import { Inter } from "next/font/google";
import "./globals.css";
import AuthButtons from "@/components/AuthButtons";

import { SessionProvider } from "next-auth/react";

import { usePathname, useRouter } from "next/navigation";

function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const path = pathname.split("/").slice(2).join("/");
    router.push(`/${newLocale}/${path}`);
  };

  return (
    <select
      onChange={handleChange}
      defaultValue={pathname.split("/")[1] || "fi"}
      className="border border-emerald-300 rounded-md px-2 py-1 text-emerald-700 bg-white text-sm"
    >
      <option value="fi">🇫🇮 FI</option>
      <option value="sv">🇸🇪 SV</option>
      <option value="en">🇬🇧 EN</option>
    </select>
  );
}

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <html lang="fi" className={inter.className}>
      <head>
        <link rel="icon" href="/images/lyvo-logo.png" type="image/png" />
      </head>
      <body>
        <SessionProvider>
          <header className="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-100/60">
            <div className="container-max flex items-center justify-between py-3 px-4 md:px-6">
              {/* Logo ja teksti samassa flex-rivissä */}
              <div className="flex items-center gap-2 md:gap-3">
                <Link href="/" className="flex items-center group" aria-label="Lyvo etusivu">
                  <img
                    src="/images/lyvo-logo.png"
                    alt="Lyvo logo"
                    className="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-105"
                  />
                </Link>
                <p className="text-emerald-700 font-semibold text-sm md:text-lg italic select-none hidden sm:block">
                  Lift with Lyvo
                </p>
              </div>

              {/* Desktop Navigaatio */}
              <nav className="hidden md:flex items-center gap-8 text-[1rem] font-medium text-emerald-700">
                <Link href="/rides" className="hover:text-emerald-500 transition-colors">Etsi kyyti</Link>
                <Link href="/rides/new" className="hover:text-emerald-500 transition-colors">Lisää kyyti</Link>
                <Link href="/about" className="hover:text-emerald-500 transition-colors">Tietoa meistä</Link>
                <Link href="/contact" className="hover:text-emerald-500 transition-colors">Ota yhteyttä</Link>
                <Link href="/profile" className="hover:text-emerald-500 transition-colors">Profiili</Link>
                <LanguageSwitcher />
                <AuthButtons />
              </nav>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center gap-2">
                <LanguageSwitcher />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden bg-white border-t border-emerald-100">
                <nav className="flex flex-col gap-1 p-4">
                  <Link 
                    href="/rides" 
                    className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Etsi kyyti
                  </Link>
                  <Link 
                    href="/rides/new" 
                    className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Lisää kyyti
                  </Link>
                  <Link 
                    href="/about" 
                    className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tietoa meistä
                  </Link>
                  <Link 
                    href="/contact" 
                    className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Ota yhteyttä
                  </Link>
                  <Link 
                    href="/profile" 
                    className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profiili
                  </Link>
                  <div className="px-4 py-2 border-t border-emerald-100 mt-2">
                    <AuthButtons />
                  </div>
                </nav>
              </div>
            )}
          </header>
          <main className="pt-16">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
