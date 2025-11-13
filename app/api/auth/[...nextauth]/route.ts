import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Nimi", type: "text", placeholder: "Etunimi Sukunimi" },
        email: { label: "Sähköposti", type: "email", placeholder: "esim@shade.com" },
        password: { label: "Salasana", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Syötä sähköposti ja salasana");
        }

        // Tarkistetaan löytyykö käyttäjä
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Jos käyttäjää ei ole, luodaan uusi
        if (!user) {
          if (!credentials.name) {
            throw new Error("Rekisteröityessä vaaditaan nimi");
          }

          const hashedPassword = await bcrypt.hash(credentials.password, 10);

          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name,
              passwordHash: hashedPassword,
            },
          });
        } else {
          // Jos käyttäjä löytyy, tarkistetaan salasana
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            throw new Error("Virheellinen salasana");
          }
        }

        return { id: user.id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        (session.user as any).id = (token as any).id;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };