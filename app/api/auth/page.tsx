

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isRegister) {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Rekisteröinti epäonnistui");
        setLoading(false);
        return;
      }
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
    } else {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Virheellinen sähköposti tai salasana");
        setLoading(false);
        return;
      }
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#eaf8ec]/40 to-white">
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-[#21a53f] mb-6 text-center">
          {isRegister ? "Luo tili" : "Kirjaudu Lyvoon"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nimi</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#21a53f]"
                required
              />
            </div>
          )}
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
            {loading ? "Odota..." : isRegister ? "Rekisteröidy" : "Kirjaudu"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRegister ? "Onko sinulla jo tili?" : "Eikö sinulla ole vielä tiliä?"}{" "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#21a53f] hover:underline font-medium"
            >
              {isRegister ? "Kirjaudu" : "Rekisteröidy"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}