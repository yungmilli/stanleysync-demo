import Link from "next/link";
import { UserRole } from "@prisma/client";

import { requireAuthenticatedUser } from "@/features/admin/guards";
import { switchWorkspaceAction } from "@/features/workspaces/actions";
import { hasModule } from "@/features/workspaces/config";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user } = await requireAuthenticatedUser();
  const workspaceData = await getWorkspaceSwitcherData(user.id);
  const navItems = getNavItems(user.role, workspaceData.activeWorkspace?.enabledModules);
  const canSwitchWorkspace = user.role === UserRole.SYSTEM_OWNER;
  const visibleWorkspaces = user.role === UserRole.SYSTEM_OWNER
    ? workspaceData.workspaces
    : workspaceData.workspaces.filter((workspace) => !hasModule(workspace.enabledModules, "CalOps"));
  const brandColors = workspaceData.activeWorkspace?.brandColors as { primary?: string; accent?: string } | null | undefined;
  const accent = workspaceData.activeWorkspace?.themeAccent ?? brandColors?.accent ?? "#c46a29";
  const canCompleteSetup = user.role === UserRole.SYSTEM_OWNER || user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
  const setupIncomplete = canCompleteSetup && workspaceData.activeWorkspace && !workspaceData.activeWorkspace.setupCompletedAt;
  const demoUsersStillPresent = env.DEMO_MODE
    ? false
    : await db.user
        .count({
          where: {
            email: {
              in: [
                "admin@stanleysync.app",
                "manager@stanleysync.app",
                "tech@stanleysync.app",
                "sales@stanleysync.app",
              ],
            },
          },
        })
        .then((count) => count > 0)
        .catch(() => false);

  return (
    <div className="min-h-screen px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="app-panel sticky top-3 z-20 mb-4 rounded-[1.1rem] px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[0.82rem] text-sm font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                {workspaceData.activeWorkspace?.logoPlaceholder ?? "SS"}
              </div>
              <div>
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">
                StanleySync App
              </p>
              <h1 className="mt-0.5 text-[1.02rem] font-semibold tracking-[-0.02em]">
                Quote. Track. Invoice. All in one place.
              </h1>
              {workspaceData.activeWorkspace ? (
                <p className="mt-1 text-xs text-[#64707a]">
                  {workspaceData.activeWorkspace.businessName}
                </p>
              ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {canSwitchWorkspace ? (
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 transition hover:border-[#12212c]/20">
                    Product mode
                  </summary>
                  <div className="absolute right-0 mt-2 w-[320px] rounded-[1rem] border border-[#12212c]/10 bg-[#fbf7ef] p-2 shadow-xl">
                    <div className="grid gap-2">
                      {visibleWorkspaces.map((workspace) => (
                        <form key={workspace.id} action={switchWorkspaceAction}>
                          <input type="hidden" name="workspaceId" value={workspace.id} />
                          <button
                            type="submit"
                            aria-label={`Switch to ${workspace.businessName}`}
                            className={cn(
                              "w-full rounded-[0.82rem] border px-3 py-2 text-left text-[#12212c] transition hover:border-[#c46a29] hover:bg-white",
                              workspace.id === workspaceData.activeWorkspace?.id
                                ? "border-[#c46a29] bg-white"
                                : "border-[#12212c]/8 bg-white/55",
                            )}
                          >
                            <span className="block text-sm font-medium">{workspace.businessName}</span>
                          <span className="mt-0.5 block text-xs text-[#64707a]">{productModeDescription(workspace.businessName)}</span>
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                </details>
              ) : null}
              {env.DEMO_MODE ? (
                <span className="rounded-full border border-[#c46a29]/20 bg-[#fff4e6] px-3 py-1.5 text-[#9e4f18]">
                  Demo Mode
                </span>
              ) : null}
              <Link
                href="/"
                className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 transition hover:border-[#12212c]/20"
              >
                Public Home
              </Link>
              {user.role === UserRole.TECHNICIAN ? (
                <Link
                  href="/tech"
                  className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 transition hover:border-[#12212c]/20"
                >
                  Tech Dashboard
                </Link>
              ) : null}
              <span className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5">
                {session.user.email} - {formatRoleLabel(user.role)}
              </span>
              <Link
                href="/api/auth/signout"
                className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 transition hover:border-[#12212c]/20"
              >
                Sign out
              </Link>
            </div>
          </div>
          <nav className="mt-2.5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border border-[#12212c]/10 bg-white/55 px-3 py-1 text-[0.84rem] transition hover:border-[#12212c]/20",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {demoUsersStillPresent ? (
            <div className="mt-2.5 rounded-[0.85rem] border border-[#b4514b]/20 bg-[#fff1ef] px-3 py-2 text-sm text-[#9d302b]">
              Production mode warning: default demo users still exist. Disable or rotate these accounts before customer access.
            </div>
          ) : null}
          {setupIncomplete ? (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-[0.85rem] border border-[#c46a29]/20 bg-[#fff4e6] px-3 py-2 text-sm text-[#9e4f18]">
              <span>Finish first-run company setup before sending customer PDFs.</span>
              <Link href="/admin/first-run" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#12212c]">
                Open setup wizard
              </Link>
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}

function getNavItems(role: UserRole, modules: unknown) {
  if (role === UserRole.TECHNICIAN) {
    return [
      { href: "/tech", label: "Dashboard" },
      { href: "/admin/apps", label: "Apps" },
    ];
  }

  if (role === UserRole.DEMO_USER) {
    return [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/quotes", label: "Quotes" },
      { href: "/admin/tickets", label: "Jobs" },
      { href: "/admin/invoices", label: "Invoices" },
      { href: "/admin/apps", label: "Apps" },
    ];
  }

  const items = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/quotes", label: "Quotes" },
  ];

  if (hasModule(modules, "WorkFlow")) {
    items.push({ href: "/admin/tickets", label: "Jobs" });
  }

  if (role === UserRole.SYSTEM_OWNER || role === UserRole.ADMIN || role === UserRole.MANAGER) {
    items.push(
      { href: "/admin/invoices", label: "Invoices" },
    );
  }

  items.push({ href: "/admin/apps", label: "Apps" });
  items.push({ href: "/admin/settings", label: "Settings" });

  const unique = items.filter(
    (item, index, array) => array.findIndex((entry) => entry.href === item.href) === index,
  );

  return unique;
}

function productModeDescription(name: string) {
  if (name === "StanleySync Labs") return "Pro / Calibration module";
  if (name === "StanleySync Demo") return "Seeded tester environment";
  return "General business operating app";
}

function formatRoleLabel(role: UserRole) {
  return role === UserRole.SYSTEM_OWNER ? "system owner" : role.toLowerCase().replace("_", " ");
}
