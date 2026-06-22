import { requireSystemOwnerSession } from "@/features/admin/guards";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const { session, user } = await requireSystemOwnerSession();
  let databaseConnected = false;

  try {
    await db.$queryRawUnsafe("SELECT 1");
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const health = [
    ["Session exists", Boolean(session.user)],
    ["User email", session.user.email ?? "Unavailable"],
    ["Role", user.role],
    ["Workspace count", workspaceState.workspaces.length],
    ["Active workspace", workspaceState.activeWorkspace?.businessName ?? "None"],
    ["Database connected", databaseConnected],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-[#9e4f18]">System health</p>
        <h2 className="mt-1 text-2xl font-semibold">Owner session and workspace status</h2>
      </div>
      <dl className="grid gap-3 md:grid-cols-2">
        {health.map(([label, value]) => (
          <div key={label} className="rounded-[0.85rem] border border-[#12212c]/10 bg-white/60 p-4">
            <dt className="text-xs font-semibold uppercase text-[#64707a]">{label}</dt>
            <dd className="mt-2 text-base font-medium">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
