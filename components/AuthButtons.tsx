"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthButtons() {
  const { data: session } = useSession();
  const router = useRouter();

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

  const handleSignIn = async () => {
    const res = await signIn("credentials", { redirect: false });
    if (res?.error) {
      console.error("Sign-in error:", res.error);
      alert("Kirjautuminen epäonnistui. Tarkista sähköposti ja salasana.");
    } else {
      router.push("/");
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className="text-sm font-medium text-white bg-[#21a53f] hover:bg-[#1d8e37] px-3 py-1 rounded-lg transition-all"
    >
      Kirjaudu sisään
    </button>
  );
}