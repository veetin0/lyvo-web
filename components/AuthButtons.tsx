"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const translations = {
  fi: {
    hello: "Hei",
    user: "Käyttäjä",
    signOut: "Kirjaudu ulos",
    signIn: "Kirjaudu sisään",
  },
  en: {
    hello: "Hi",
    user: "User",
    signOut: "Sign Out",
    signIn: "Sign In",
  },
  sv: {
    hello: "Hej",
    user: "Användare",
    signOut: "Logga ut",
    signIn: "Logga in",
  },
};

export default function AuthButtons() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[currentLocale] || translations.en;

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">
          {t.hello}, <span className="font-semibold text-[#21a53f]">{session.user?.name || t.user}</span>
        </span>
        <button
          onClick={() => signOut()}
          className="text-sm font-medium text-white bg-[#21a53f] hover:bg-[#1d8e37] px-3 py-1 rounded-lg transition-all"
        >
          {t.signOut}
        </button>
      </div>
    );
  }

  const handleSignIn = async () => {
    router.push("/auth/login");
  };

  return (
    <button
      onClick={handleSignIn}
      className="text-sm font-medium text-white bg-[#21a53f] hover:bg-[#1d8e37] px-3 py-1 rounded-lg transition-all"
    >
      {t.signIn}
    </button>
  );
}