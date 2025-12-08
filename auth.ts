import Credentials from "next-auth/providers/credentials";

const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        return {
          id: "placeholder",
          email: credentials.email,
        };
      },
    }),
  ],
};

export default authOptions;