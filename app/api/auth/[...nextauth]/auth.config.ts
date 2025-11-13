import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { supabase } from "@/lib/supabase";

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Sähköposti", type: "text" },
        password: { label: "Salasana", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (!user) return null;

        // ⚠ TODO: Tee oikea bcrypt-vertailu myöhemmin
        if (user.password !== credentials.password) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
    })
  ],

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
  },
};

export default authConfig;