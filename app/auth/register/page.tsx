"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
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
      setError("Anna kelvollinen sähköpostiosoite (esim. nimi@domain.fi)");
      return;
    }

    if (!isSecurePassword(password)) {
      setError("Salasanan on oltava vähintään 12 merkkiä ja sisällettävä iso ja pieni kirjain, numero ja erikoismerkki.");
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
      setError(data.error || "Rekisteröinti epäonnistui");
      setLoading(false);
      return;
    }

    router.push("/auth/login");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#eaf8ec]/40 to-white">
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#21a53f] transition hover:text-[#1d8e37] hover:underline"
          >
            <span>{"<-"}</span>
            <span>Takaisin</span>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-[#21a53f] mb-6 text-center">
          Luo uusi Lyvo-tili
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Etunimi</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Sukunimi</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Sukunimi (valinnainen)"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Sähköposti</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Salasana</label>
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
                aria-label={showPassword ? "Piilota salasana" : "Näytä salasana"}
              >
                {showPassword ? "Piilota" : "Näytä"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Vähintään 12 merkkiä, sisältää isot ja pienet kirjaimet, numeron ja erikoismerkin.
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#21a53f] text-white py-2 rounded-lg font-semibold hover:bg-[#1d8e37] transition-all duration-200"
          >
            {loading ? "Luodaan tiliä..." : "Rekisteröidy"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Onko sinulla jo tili?{" "}
          <Link
            href="/auth/login"
            className="text-[#21a53f] hover:underline font-medium"
          >
            Kirjaudu sisään
          </Link>
        </p>
      </div>
    </div>
  );
}