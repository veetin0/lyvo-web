import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { v4 as uuidv4 } from "uuid";
import type { JWT } from "next-auth/jwt";

import { authorizeWithSupabase, adminSupabase } from "./authorize";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Sähköposti", type: "email" },
        password: { label: "Salasana", type: "password" },
      },
      async authorize(credentials) {
        return authorizeWithSupabase(credentials);
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const { data: existingUser } = await adminSupabase
            .from("User")
            .select("*")
            .eq("email", user.email!)
            .single();

          if (!existingUser) {
            // Create new user from Google
            const { error } = await adminSupabase
              .from("User")
              .insert([{
                id: uuidv4(),
                name: user.name || "",
                email: user.email!,
                passwordHash: "", // Google users don't have password hash
              }]);

            if (error) throw error;
          }
        } catch (err) {
          console.error("Google sign-in error:", err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      const mutableToken = token as JWT & { id?: string };
      if (user && typeof user === "object" && "id" in user && typeof user.id === "string") {
        mutableToken.id = user.id;
      }
      return mutableToken;
    },

    async session({ session, token }) {
      const tokenWithId = token as JWT & { id?: unknown };
      if (session.user && typeof tokenWithId.id === "string") {
        (session.user as typeof session.user & { id?: string }).id = tokenWithId.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
});

export { handler as GET, handler as POST };