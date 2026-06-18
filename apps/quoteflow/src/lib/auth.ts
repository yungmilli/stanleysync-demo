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

function logLoginAttempt(details: {
  attemptedEmail: string;
  userFound: boolean;
  envAdminFallbackUsed: boolean;
  passwordMatch: boolean;
  role: UserRole | null;
}) {
  if (process.env.NODE_ENV === "production") {
    console.info("[auth:login]", details);
  }
}

async function matchesEnvironmentAdminPassword(password: string) {
  const hashMatches = env.ADMIN_PASSWORD_HASH
    ? await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH)
    : false;
  const plainPasswordMatches = Boolean(env.ADMIN_PASSWORD) && env.ADMIN_PASSWORD === password;

  return hashMatches || plainPasswordMatches;
}

async function upsertEnvironmentOwner(password: string) {
  const primaryWorkspace = await db.businessWorkspace.findFirst({
    where: { isActive: true },
    orderBy: [{ workspaceKey: "asc" }],
    select: { id: true },
  });
  const passwordHash = await bcrypt.hash(password, 12);

  return db.user.upsert({
    where: { email: env.ADMIN_EMAIL.toLowerCase() },
    update: {
      name: "Mason Stanley",
      passwordHash,
      role: UserRole.SYSTEM_OWNER,
      isActive: true,
      activeWorkspaceId: primaryWorkspace?.id ?? undefined,
    },
    create: {
      name: "Mason Stanley",
      email: env.ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: UserRole.SYSTEM_OWNER,
      isActive: true,
      activeWorkspaceId: primaryWorkspace?.id,
    },
  });
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
          logLoginAttempt({
            attemptedEmail:
              typeof credentials?.email === "string" ? credentials.email.toLowerCase() : "invalid",
            userFound: false,
            envAdminFallbackUsed: false,
            passwordMatch: false,
            role: null,
          });
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();
        const isEnvironmentAdmin = normalizedEmail === env.ADMIN_EMAIL.toLowerCase();
        let databaseLookupSucceeded = true;
        let user: User | null = null;

        try {
          user = await db.user.findUnique({
            where: { email: normalizedEmail },
          });
        } catch (error) {
          databaseLookupSucceeded = false;
          console.error("[auth] Database user lookup failed.", {
            attemptedEmail: normalizedEmail,
            error: error instanceof Error ? error.name : "UnknownError",
          });
        }

        if (user) {
          if (user.isActive) {
            const valid = await bcrypt.compare(password, user.passwordHash);
            if (valid) {
              logLoginAttempt({
                attemptedEmail: normalizedEmail,
                userFound: true,
                envAdminFallbackUsed: false,
                passwordMatch: true,
                role: user.role,
              });

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
            logLoginAttempt({
              attemptedEmail: normalizedEmail,
              userFound: true,
              envAdminFallbackUsed: false,
              passwordMatch: false,
              role: user.role,
            });
            return null;
          }
        }

        if (!isEnvironmentAdmin) {
          logLoginAttempt({
            attemptedEmail: normalizedEmail,
            userFound: Boolean(user),
            envAdminFallbackUsed: false,
            passwordMatch: false,
            role: user?.role ?? null,
          });
          return null;
        }

        const environmentPasswordValid = await matchesEnvironmentAdminPassword(password);
        if (!environmentPasswordValid) {
          logLoginAttempt({
            attemptedEmail: normalizedEmail,
            userFound: Boolean(user),
            envAdminFallbackUsed: true,
            passwordMatch: false,
            role: user?.role ?? UserRole.SYSTEM_OWNER,
          });
          return null;
        }

        let repairedOwner: User | null = null;
        if (databaseLookupSucceeded) {
          try {
            repairedOwner = await upsertEnvironmentOwner(password);
          } catch (error) {
            console.error("[auth] Owner database repair failed.", {
              attemptedEmail: normalizedEmail,
              error: error instanceof Error ? error.name : "UnknownError",
            });
          }
        }

        logLoginAttempt({
          attemptedEmail: normalizedEmail,
          userFound: Boolean(user),
          envAdminFallbackUsed: true,
          passwordMatch: true,
          role: UserRole.SYSTEM_OWNER,
        });

        if (repairedOwner) {
          return {
            id: repairedOwner.id,
            name: repairedOwner.name,
            email: repairedOwner.email,
            role: UserRole.SYSTEM_OWNER,
            isActive: true,
          };
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

  let user: User | null = null;

  try {
    user = await db.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });
  } catch (error) {
    if (session.user.email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
      throw error;
    }

    console.error("[auth] Current owner database lookup failed.", {
      attemptedEmail: session.user.email.toLowerCase(),
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }

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
