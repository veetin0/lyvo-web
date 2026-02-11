"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supportedLocales = ["fi", "en", "sv"] as const;
type SupportedLocale = (typeof supportedLocales)[number];

type RegisterTranslations = {
  back: string;
  title: string;
  firstName: string;
  lastName: string;
  lastNameOptional: string;
  email: string;
  password: string;
  showPassword: string;
  hidePassword: string;
  showPasswordAria: string;
  hidePasswordAria: string;
  passwordHint: string;
  invalidEmail: string;
  weakPassword: string;
  submitIdle: string;
  submitLoading: string;
  genericError: string;
  hasAccountPrompt: string;
  signInCta: string;
};

const translations: Record<SupportedLocale, RegisterTranslations> = {
  fi: {
    back: "Takaisin",
    title: "Luo uusi Lyvo-tili",
    firstName: "Etunimi",
    lastName: "Sukunimi",
    lastNameOptional: "Sukunimi (valinnainen)",
    email: "Sähköposti",
    password: "Salasana",
    showPassword: "Näytä",
    hidePassword: "Piilota",
    showPasswordAria: "Näytä salasana",
    hidePasswordAria: "Piilota salasana",
    passwordHint: "Vähintään 12 merkkiä, sisältää isot ja pienet kirjaimet, numeron ja erikoismerkin.",
    invalidEmail: "Anna kelvollinen sähköpostiosoite (esim. nimi@domain.fi)",
    weakPassword: "Salasanan on oltava vähintään 12 merkkiä ja sisällettävä iso ja pieni kirjain, numero ja erikoismerkki.",
    submitIdle: "Rekisteröidy",
    submitLoading: "Luodaan tiliä...",
    genericError: "Rekisteröinti epäonnistui",
    hasAccountPrompt: "Onko sinulla jo tili?",
    signInCta: "Kirjaudu sisään",
  },
  en: {
    back: "Back",
    title: "Create a Lyvo account",
    firstName: "First name",
    lastName: "Last name",
    lastNameOptional: "Last name (optional)",
    email: "Email",
    password: "Password",
    showPassword: "Show",
    hidePassword: "Hide",
    showPasswordAria: "Show password",
    hidePasswordAria: "Hide password",
    passwordHint: "At least 12 characters, including uppercase, lowercase, a number, and a special character.",
    invalidEmail: "Enter a valid email address (e.g. name@domain.com)",
    weakPassword: "Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.",
    submitIdle: "Register",
    submitLoading: "Creating account...",
    genericError: "Registration failed",
    hasAccountPrompt: "Already have an account?",
    signInCta: "Sign in",
  },
  sv: {
    back: "Tillbaka",
    title: "Skapa ett Lyvo-konto",
    firstName: "Förnamn",
    lastName: "Efternamn",
    lastNameOptional: "Efternamn (valfritt)",
    email: "E-post",
    password: "Lösenord",
    showPassword: "Visa",
    hidePassword: "Dölj",
    showPasswordAria: "Visa lösenord",
    hidePasswordAria: "Dölj lösenord",
    passwordHint: "Minst 12 tecken och innehåller stora och små bokstäver, en siffra och ett specialtecken.",
    invalidEmail: "Ange en giltig e-postadress (t.ex. namn@domain.se)",
    weakPassword: "Lösenordet måste vara minst 12 tecken och innehålla stora och små bokstäver, en siffra och ett specialtecken.",
    submitIdle: "Registrera dig",
    submitLoading: "Skapar konto...",
    genericError: "Registreringen misslyckades",
    hasAccountPrompt: "Har du redan ett konto?",
    signInCta: "Logga in",
  },
};

const normalizeLocale = (value?: string): SupportedLocale => {
  if (!value) {
    return "fi";
  }
  return supportedLocales.includes(value as SupportedLocale)
    ? (value as SupportedLocale)
    : "fi";
};

interface RegisterPageContentProps {
  locale?: string;
}

export default function RegisterPageContent({ locale }: RegisterPageContentProps) {
  const activeLocale = normalizeLocale(locale);
  const t = useMemo(() => translations[activeLocale], [activeLocale]);

  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const isSecurePassword = (value: string) => {
    if (value.length < 12) {
      return false;
    }
    const hasUpper = /[A-ZÅÄÖ]/.test(value);
    const hasLower = /[a-zåäö]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);
    return hasUpper && hasLower && hasNumber && hasSymbol;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError(t.invalidEmail);
      return;
    }

    if (!isSecurePassword(password)) {
      setError(t.weakPassword);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lastName ? `${firstName} ${lastName}` : firstName,
        email,
        password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || t.genericError);
      setLoading(false);
      return;
    }

    router.push(`/${activeLocale}/auth/login`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#eaf8ec]/40 to-white">
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="mb-6">
          <Link
            href={`/${activeLocale}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#21a53f] transition hover:text-[#1d8e37] hover:underline"
          >
            <span>{"<-"}</span>
            <span>{t.back}</span>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-[#21a53f] mb-6 text-center">
          {t.title}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.firstName}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.lastName}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t.lastNameOptional}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.password}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 rounded-md px-3 text-sm font-medium text-[#21a53f] transition hover:bg-emerald-50"
                aria-label={showPassword ? t.hidePasswordAria : t.showPasswordAria}
              >
                {showPassword ? t.hidePassword : t.showPassword}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">{t.passwordHint}</p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#21a53f] text-white py-2 rounded-lg font-semibold hover:bg-[#1d8e37] transition-all duration-200 disabled:opacity-80"
          >
            {loading ? t.submitLoading : t.submitIdle}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t.hasAccountPrompt}{" "}
          <Link
            href={`/${activeLocale}/auth/login`}
            className="text-[#21a53f] hover:underline font-medium"
          >
            {t.signInCta}
          </Link>
        </p>
      </div>
    </div>
  );
}
