import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import type { UserRole } from "@/app/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      organizationId: string;
    };
  }
}

interface AppJwtClaims {
  role?: UserRole;
  organizationId?: string;
  uid?: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      const claims = token as typeof token & AppJwtClaims;
      if (user) {
        claims.uid = user.id;
        claims.role = (user as { role: UserRole }).role;
        claims.organizationId = (user as { organizationId: string }).organizationId;
      }
      return claims;
    },
    session: async ({ session, token }) => {
      const claims = token as typeof token & AppJwtClaims;
      if (claims.uid) session.user.id = claims.uid;
      if (claims.role) session.user.role = claims.role;
      if (claims.organizationId) session.user.organizationId = claims.organizationId;
      return session;
    },
  },
});
