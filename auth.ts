import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {},
        password: {}
      },
      authorize: async (credentials) => {
        // You can enhance this later if needed
        if (!credentials?.email || !credentials?.password) return null;

        return {
          id: "placeholder",
          email: credentials.email
        };
      }
    })
  ],
});