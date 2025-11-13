import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  // Extend the default Session interface to include the user id
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}