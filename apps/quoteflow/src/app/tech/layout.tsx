import Link from "next/link";
import { UserRole } from "@prisma/client";

import { requireRoles } from "@/features/admin/guards";

export const dynamic = "force-dynamic";

export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await requireRoles([UserRole.TECHNICIAN]);

  return (
    <div className="min-h-screen px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px]">
        <header className="app-panel sticky top-3 z-20 mb-4 rounded-[1.1rem] px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">
                StanleySync CalOps
              </p>
              <h1 className="mt-0.5 text-[1.02rem] font-semibold tracking-[-0.02em]">
                Technician calibration workflow and activity updates
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/"
                className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 transition hover:border-[#12212c]/20"
              >
                Public Home
              </Link>
              <Link
                href="/admin/ideas"
                className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 transition hover:border-[#12212c]/20"
              >
                Idea Board
              </Link>
              <span className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5">
                {session.user.email}
              </span>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
