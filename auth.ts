import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: { id: string } & import("next-auth").DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Database sessions: the cookie holds only an opaque token, the Session table is the source of truth.
  session: { strategy: "database" },
  providers: [Google],
  callbacks: {
    // With database sessions Auth.js hands us the DB user; expose its id on the session.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
