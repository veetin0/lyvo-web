"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supportedLocales = ["fi", "en", "sv"] as const;
type SupportedLocale = (typeof supportedLocales)[number];

type LoginTranslations = {
  back: string;
  title: string;
  emailLabel: string;
  passwordLabel: string;
  invalidCredentials: string;
  submitIdle: string;
  submitLoading: string;
  dividerLabel: string;
  googleCta: string;
  googleError?: string;
  noAccountPrompt: string;
  createAccountCta: string;
};

const translations: Record<SupportedLocale, LoginTranslations> = {
  fi: {
    back: "Takaisin",
    title: "Kirjaudu Lyvoon",
    emailLabel: "Sähköposti",
    passwordLabel: "Salasana",
    invalidCredentials: "Virheellinen sähköposti tai salasana",
    submitIdle: "Kirjaudu",
    submitLoading: "Kirjaudutaan...",
    dividerLabel: "tai",
    googleCta: "Kirjaudu Googlella",
    googleError: "Google-kirjautuminen epäonnistui",
    noAccountPrompt: "Eikö sinulla ole vielä tiliä?",
    createAccountCta: "Luo tili",
  },
  en: {
    back: "Back",
    title: "Sign in to Lyvo",
    emailLabel: "Email",
    passwordLabel: "Password",
    invalidCredentials: "Invalid email or password",
    submitIdle: "Sign in",
    submitLoading: "Signing in...",
    dividerLabel: "or",
    googleCta: "Continue with Google",
    googleError: "Google sign-in failed",
    noAccountPrompt: "Don't have an account yet?",
    createAccountCta: "Create account",
  },
  sv: {
    back: "Tillbaka",
    title: "Logga in i Lyvo",
    emailLabel: "E-post",
    passwordLabel: "Lösenord",
    invalidCredentials: "Ogiltig e-post eller lösenord",
    submitIdle: "Logga in",
    submitLoading: "Loggar in...",
    dividerLabel: "eller",
    googleCta: "Fortsätt med Google",
    googleError: "Google-inloggningen misslyckades",
    noAccountPrompt: "Har du inget konto ännu?",
    createAccountCta: "Skapa konto",
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

interface LoginPageContentProps {
  locale?: string;
}

export default function LoginPageContent({ locale }: LoginPageContentProps) {
  const activeLocale = normalizeLocale(locale);
  const t = useMemo(() => translations[activeLocale], [activeLocale]);

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fallbackPath, setFallbackPath] = useState(() => `/${activeLocale}`);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const defaultTarget = `/${activeLocale}`;

    try {
      const ref = document.referrer;
      if (!ref) {
        setFallbackPath(defaultTarget);
        return;
      }

      const refUrl = new URL(ref);
      if (refUrl.origin !== window.location.origin) {
        setFallbackPath(defaultTarget);
        return;
      }

      const pathWithQuery = `${refUrl.pathname}${refUrl.search}`;
      if (
        pathWithQuery.startsWith("/auth") ||
        pathWithQuery.includes("/profile") ||
        !pathWithQuery.startsWith(`/${activeLocale}`)
      ) {
        setFallbackPath(defaultTarget);
        return;
      }

      setFallbackPath(pathWithQuery || defaultTarget);
    } catch {
      setFallbackPath(defaultTarget);
    }
  }, [activeLocale]);

  const handleBackClick = () => {
    router.push(fallbackPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(t.invalidCredentials);
      setLoading(false);
    } else {
      router.push(`/${activeLocale}`);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signIn("google", { redirect: false });
      if (result?.error) {
        setError(t.googleError ?? "");
        setLoading(false);
        return;
      }
      router.push(`/${activeLocale}`);
    } catch {
      setError(t.googleError ?? "");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#eaf8ec]/40 to-white">
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-full max-w-md">
        <button
          type="button"
          onClick={handleBackClick}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#21a53f] hover:underline"
        >
          <span>{"<-"}</span>
          <span>{t.back}</span>
        </button>
        <h1 className="text-3xl font-bold text-[#21a53f] mb-6 text-center">
          {t.title}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
              required
            />
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

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t.dividerLabel}</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-80"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t.googleCta}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t.noAccountPrompt}{" "}
          <Link href={`/${activeLocale}/auth/register`} className="text-[#21a53f] hover:underline font-medium">
            {t.createAccountCta}
          </Link>
        </p>
      </div>
    </div>
  );
}
