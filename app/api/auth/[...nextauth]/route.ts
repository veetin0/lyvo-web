import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

import { authorizeWithSupabase, ensureOAuthUser, findUserIdByEmail } from "./authorize";

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
        const userId = await ensureOAuthUser(user.email, user.name);

        // Refuse the sign-in rather than admit someone we cannot tie to a User
        // row — every ownership check in the app keys off that id.
        if (!userId) {
          console.error("Google sign-in rejected: could not resolve a User row");
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      const mutableToken = token as JWT & { id?: string };

      // `user` is only set on the initial sign-in; later calls just carry the
      // token forward.
      if (user) {
        // Always resolve the id from our own User table. NextAuth sets
        // `user.id` to the provider's subject for OAuth, which is not our row
        // id, so trusting it would give the same person one identifier through
        // Google and another through email — and ownership checks compare ids.
        const resolvedId = await findUserIdByEmail(user.email ?? token.email);

        // Fail closed. An unset id makes protected routes answer 401, which is
        // far better than writing rides and messages under an identifier that
        // resolves to nobody.
        mutableToken.id = resolvedId ?? undefined;
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