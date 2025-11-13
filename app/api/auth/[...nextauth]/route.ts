import NextAuth from "next-auth/next";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Sähköposti", type: "email" },
        password: { label: "Salasana", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Haetaan käyttäjä Prismasta
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // Tarkistetaan salasana
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // Palautetaan NextAuthille kevyempi user-olio
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // kun käyttäjä kirjautuu, talletetaan id tokeniin
      if (user) {
        (token as any).id = (user as any).id;
      }
      return token;
    },

    async session({ session, token }) {
      // lisätään session.user.id, jotta voit käyttää sitä frontissa
      if (token && session.user) {
        (session.user as any).id = (token as any).id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };