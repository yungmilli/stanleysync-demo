import { UserRole, type User } from "@prisma/client";

type ExportUser = Pick<User, "role" | "email" | "activeWorkspaceId"> | {
  role: UserRole;
  email: string;
  activeWorkspaceId?: string | null;
};

export const quotePdfExportRoles: UserRole[] = [
  UserRole.SYSTEM_OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.SALES,
  UserRole.DEMO_USER,
];

export const ticketPdfExportRoles: UserRole[] = [
  UserRole.SYSTEM_OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.TECHNICIAN,
  UserRole.DEMO_USER,
];

export const invoicePdfExportRoles: UserRole[] = [
  UserRole.SYSTEM_OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.SALES,
  UserRole.DEMO_USER,
];

export const workOrderDraftExportRoles: UserRole[] = [
  UserRole.SYSTEM_OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
];

export function canExportForRole(user: ExportUser | null | undefined, roles: UserRole[]) {
  return Boolean(user?.email && roles.includes(user.role));
}

export function canExportWorkspaceRecord(user: ExportUser, recordWorkspaceId?: string | null) {
  if (user.role !== UserRole.DEMO_USER) return true;
  return Boolean(recordWorkspaceId && user.activeWorkspaceId === recordWorkspaceId);
}

export function exportErrorResponse(request: Request, message: string, status: number) {
  const wantsHtml = request.headers.get("accept")?.includes("text/html");

  if (!wantsHtml) {
    return Response.json({ error: message }, { status });
  }

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Export unavailable</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f7f2e8; color: #12212c; }
      main { width: min(520px, calc(100vw - 32px)); border: 1px solid rgba(18, 33, 44, 0.12); border-radius: 18px; background: rgba(255,255,255,0.82); padding: 28px; box-shadow: 0 18px 50px rgba(18,33,44,0.12); }
      h1 { margin: 0; font-size: 24px; }
      p { line-height: 1.6; color: #64707a; }
      a { display: inline-flex; margin-top: 10px; border-radius: 999px; padding: 10px 14px; background: #12212c; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Export unavailable</h1>
      <p>${message}</p>
      <a href="/admin">Back to dashboard</a>
    </main>
  </body>
</html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
