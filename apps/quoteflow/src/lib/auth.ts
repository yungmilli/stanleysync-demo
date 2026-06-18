import bcrypt from "bcryptjs";
import { UserRole, type User } from "@prisma/client";
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
    name: "Mason Stanley",
    email: env.ADMIN_EMAIL,
    role: UserRole.SYSTEM_OWNER,
    isActive: true,
  };
}

function logOwnerAuthDiagnostic(
  result: string,
  details: {
    databaseLookupSucceeded: boolean;
    databaseUserExists: boolean;
    databaseUserActive: boolean | null;
  },
) {
  console.info("[auth:owner-diagnostic]", {
    result,
    hasAdminEmail: Boolean(process.env.ADMIN_EMAIL),
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasAdminPasswordHash: Boolean(process.env.ADMIN_PASSWORD_HASH),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    ...details,
  });
}

async function matchesEnvironmentAdminPassword(password: string) {
  const hashMatches = env.ADMIN_PASSWORD_HASH
    ? await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH)
    : false;
  const plainPasswordMatches = Boolean(env.ADMIN_PASSWORD) && env.ADMIN_PASSWORD === password;

  return hashMatches || plainPasswordMatches;
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
        const isEnvironmentAdmin = normalizedEmail === env.ADMIN_EMAIL.toLowerCase();
        const isIntendedOwner = normalizedEmail === "masonstanley@stanleysync.com";
        let databaseLookupSucceeded = true;
        let user: User | null = null;

        try {
          user = await db.user.findUnique({
            where: { email: normalizedEmail },
          });
        } catch (error) {
          databaseLookupSucceeded = false;
          console.error("[auth] Database user lookup failed.", {
            attemptedOwnerLogin: isIntendedOwner,
            error: error instanceof Error ? error.name : "UnknownError",
          });
        }

        if (user) {
          if (user.isActive) {
            const valid = await bcrypt.compare(password, user.passwordHash);
            if (valid) {
              if (isIntendedOwner) {
                logOwnerAuthDiagnostic("database_password_valid", {
                  databaseLookupSucceeded,
                  databaseUserExists: true,
                  databaseUserActive: true,
                });
              }

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
              };
            }
          }

          // A configured owner credential is the recovery path for a stale or
          // inactive database owner record. Other users remain database-only.
          if (!isEnvironmentAdmin) {
            if (isIntendedOwner) {
              logOwnerAuthDiagnostic(user.isActive ? "database_password_invalid" : "database_user_inactive", {
                databaseLookupSucceeded,
                databaseUserExists: true,
                databaseUserActive: user.isActive,
              });
            }
            return null;
          }
        }

        if (!isEnvironmentAdmin) {
          if (isIntendedOwner) {
            logOwnerAuthDiagnostic("owner_email_not_configured", {
              databaseLookupSucceeded,
              databaseUserExists: Boolean(user),
              databaseUserActive: user?.isActive ?? null,
            });
          }
          return null;
        }

        const environmentPasswordValid = await matchesEnvironmentAdminPassword(password);
        if (!environmentPasswordValid) {
          if (isIntendedOwner) {
            logOwnerAuthDiagnostic("environment_password_invalid", {
              databaseLookupSucceeded,
              databaseUserExists: Boolean(user),
              databaseUserActive: user?.isActive ?? null,
            });
          }
          return null;
        }

        if (isIntendedOwner) {
          logOwnerAuthDiagnostic("environment_password_valid", {
            databaseLookupSucceeded,
            databaseUserExists: Boolean(user),
            databaseUserActive: user?.isActive ?? null,
          });
        }

        return {
          ...fallbackAdminUser(),
          name: "Mason Stanley",
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
    if (
      user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase() &&
      session.user.role === UserRole.SYSTEM_OWNER
    ) {
      return {
        ...user,
        role: UserRole.SYSTEM_OWNER,
        isActive: true,
      };
    }

    return user;
  }

  if (session.user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
    return fallbackAdminUser();
  }

  return null;
}
