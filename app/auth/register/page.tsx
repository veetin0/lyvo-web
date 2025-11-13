"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#eaf8ec]/40 to-white">
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-full max-w-md">
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
            className="w-full bg-[#21a53f] text-white py-2 rounded-lg font-semibold hover:bg-[#1d8e37] transition-all duration-200"
          >
            {loading ? "Luodaan tiliä..." : "Rekisteröidy"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Onko sinulla jo tili?{" "}
          <a
            href="/auth/login"
            className="text-[#21a53f] hover:underline font-medium"
          >
            Kirjaudu sisään
          </a>
        </p>
      </div>
    </div>
  );
}