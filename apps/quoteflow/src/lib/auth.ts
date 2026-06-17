import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { env } from "@/lib/env";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

function fallbackAdminUser() {
  return {
    id: "env-admin",
    name: "StanleySync Admin",
    email: env.ADMIN_EMAIL,
    role: UserRole.ADMIN,
    isActive: true,
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (user) {
          if (!user.isActive) {
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          };
        }

        if (normalizedEmail !== env.ADMIN_EMAIL.toLowerCase()) {
          return null;
        }

        if (env.ADMIN_PASSWORD_HASH) {
          const valid = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
          if (!valid) return null;
        } else if (env.ADMIN_PASSWORD !== password) {
          return null;
        }

        return {
          ...fallbackAdminUser(),
          name: "StanleySync Admin",
          email: env.ADMIN_EMAIL,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const nextUser = user as { role?: UserRole; id?: string; isActive?: boolean; name?: string };
        token.role = nextUser.role ?? UserRole.ADMIN;
        token.uid = nextUser.id ?? token.sub;
        token.isActive = nextUser.isActive ?? true;
        if (nextUser.name) {
          token.name = nextUser.name;
        }
      }

      if (token.email && !token.uid) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: {
            id: true,
            role: true,
            isActive: true,
            name: true,
          },
        });

        if (dbUser) {
          token.uid = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
          token.name = dbUser.name;
        } else if (token.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
          const fallback = fallbackAdminUser();
          token.uid = fallback.id;
          token.role = fallback.role;
          token.isActive = true;
          token.name = fallback.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.uid === "string" ? token.uid : "env-admin";
        session.user.role =
          typeof token.role === "string" ? (token.role as UserRole) : UserRole.ADMIN;
        session.user.isActive = token.isActive !== false;
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentAppUser() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });

  if (user) {
    return user;
  }

  if (session.user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
    return fallbackAdminUser();
  }

  return null;
}
