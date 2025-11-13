"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButtons() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">
          Hei, <span className="font-semibold text-[#21a53f]">{session.user?.name || "Käyttäjä"}</span>
        </span>
        <button
          onClick={() => signOut()}
          className="text-sm font-medium text-white bg-[#21a53f] hover:bg-[#1d8e37] px-3 py-1 rounded-lg transition-all"
        >
          Kirjaudu ulos
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="text-sm font-medium text-white bg-[#21a53f] hover:bg-[#1d8e37] px-3 py-1 rounded-lg transition-all"
    >
      Kirjaudu sisään
    </button>
  );
}