import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "admin" | "user" | "viewer";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "user" | "viewer";
  }
}

/**
 * Configure providers
 */
export const authConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    signIn: async ({ user }) => {
      if (user.id) {
        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));
      }
      return true;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub ?? "",
        role: token.role as "admin" | "user" | "viewer",
      },
    }),
    jwt: async ({ token, user, trigger }) => {
      if (user || trigger === "update") {
        // Fetch fresh user data
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub!),
        });

        console.log("User data fetched:", dbUser);

        if (dbUser) {
          console.log("Updating token role...");
          token.role = dbUser.role;
        }
      }
      console.log("Token after callback:", token);
      return token;
    },
  },
} satisfies NextAuthConfig;
