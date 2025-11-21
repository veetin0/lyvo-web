"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import AuthButtons from "@/components/AuthButtons";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1] || 'fi';

  // Function to switch language
  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    return segments.join('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-100/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link href={`/${currentLocale}`} className="flex items-center group" aria-label="Lyvo home">
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-[1rem] font-medium text-emerald-700">
          <Link href={`/${currentLocale}/rides`} className="hover:text-emerald-500 transition-colors">
            Find a Ride
          </Link>
          <Link href={`/${currentLocale}/rides/new`} className="hover:text-emerald-500 transition-colors">
            Share a Ride
          </Link>
          <Link href={`/${currentLocale}/about`} className="hover:text-emerald-500 transition-colors">
            About
          </Link>
          <Link href={`/${currentLocale}/contact`} className="hover:text-emerald-500 transition-colors">
            Contact
          </Link>
          <Link href={`/${currentLocale}/profile`} className="hover:text-emerald-500 transition-colors">
            Profile
          </Link>
          
          {/* Language Switcher */}
          <div className="flex items-center gap-2 border-l border-emerald-200 pl-8">
            <Link 
              href={switchLanguage('fi')}
              className={`px-2 py-1 rounded text-sm font-semibold transition-colors ${
                currentLocale === 'fi' 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              FI
            </Link>
            <Link 
              href={switchLanguage('en')}
              className={`px-2 py-1 rounded text-sm font-semibold transition-colors ${
                currentLocale === 'en' 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              EN
            </Link>
            <Link 
              href={switchLanguage('sv')}
              className={`px-2 py-1 rounded text-sm font-semibold transition-colors ${
                currentLocale === 'sv' 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              SV
            </Link>
          </div>

          <AuthButtons />
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-emerald-50 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100">
          <nav className="flex flex-col gap-1 p-4">
            <Link 
              href={`/${currentLocale}/rides`}
              className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find a Ride
            </Link>
            <Link 
              href={`/${currentLocale}/rides/new`}
              className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Share a Ride
            </Link>
            <Link 
              href={`/${currentLocale}/about`}
              className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href={`/${currentLocale}/contact`}
              className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link 
              href={`/${currentLocale}/profile`}
              className="px-4 py-2 hover:bg-emerald-50 rounded-lg text-emerald-700 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
            
            {/* Language Switcher Mobile */}
            <div className="px-4 py-2 border-t border-emerald-100 mt-2">
              <p className="text-xs font-semibold text-emerald-600 mb-2">Language</p>
              <div className="flex gap-2">
                <Link 
                  href={switchLanguage('fi')}
                  className={`flex-1 px-2 py-1 rounded text-sm font-semibold text-center transition-colors ${
                    currentLocale === 'fi' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FI
                </Link>
                <Link 
                  href={switchLanguage('en')}
                  className={`flex-1 px-2 py-1 rounded text-sm font-semibold text-center transition-colors ${
                    currentLocale === 'en' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  EN
                </Link>
                <Link 
                  href={switchLanguage('sv')}
                  className={`flex-1 px-2 py-1 rounded text-sm font-semibold text-center transition-colors ${
                    currentLocale === 'sv' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  SV
                </Link>
              </div>
            </div>

            <div className="px-4 py-2 border-t border-emerald-100 mt-2">
              <AuthButtons />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
