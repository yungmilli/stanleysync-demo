import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { getAuthSession, getCurrentAppUser } from "@/lib/auth";

export async function requireAuthenticatedUser() {
  const session = await getAuthSession();

  if (!session?.user?.email || session.user.isActive === false) {
    redirect("/login");
  }

  const appUser = await getCurrentAppUser();

  if (!appUser || appUser.isActive === false) {
    redirect("/login");
  }

  return {
    session,
    user: appUser,
  };
}

export async function requireRoles(roles: UserRole[]) {
  const auth = await requireAuthenticatedUser();

  if (!roles.includes(auth.user.role) && auth.user.role !== UserRole.SYSTEM_OWNER) {
    if (auth.user.role === UserRole.TECHNICIAN) {
      redirect("/tech");
    }

    redirect("/admin");
  }

  return auth;
}

export async function requireOpsSession() {
  return requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.DEMO_USER]);
}

export async function requireSystemOwnerSession() {
  return requireRoles([UserRole.SYSTEM_OWNER]);
}

export async function requireAdminSession() {
  return requireRoles([UserRole.SYSTEM_OWNER, UserRole.ADMIN]);
}

export async function requireManagerSession() {
  return requireRoles([UserRole.SYSTEM_OWNER, UserRole.ADMIN, UserRole.MANAGER]);
}

export async function requireQuoteAccess() {
  return requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.DEMO_USER]);
}

export async function requireTicketAccess() {
  return requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.DEMO_USER]);
}

export async function requireIdeaBoardAccess() {
  return requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.SALES]);
}

export async function requireCalOpsAccess() {
  return requireRoles([UserRole.SYSTEM_OWNER]);
}
