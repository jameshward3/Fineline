import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config. Middleware runs on the Edge runtime and cannot
 * load Prisma/bcrypt, so this file must never import anything that touches
 * the database. The Credentials provider (which does) lives in `auth.ts`
 * and is only used by route handlers and server components.
 */
export const authConfig = {
  secret:
    process.env.AUTH_SECRET
    ?? (process.env.NODE_ENV !== "production" ? "fine-line-local-auth-only" : undefined),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
