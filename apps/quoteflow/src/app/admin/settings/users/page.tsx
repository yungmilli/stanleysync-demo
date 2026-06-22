import { UserRole } from "@prisma/client";

import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { DetailCard, EmptyState, StatusBadge } from "@/components/admin/ops-ui";
import { createTeamMemberAction, updateTeamMemberAction, updateTeamMemberProfileAction } from "@/features/admin/actions";
import { requireSystemOwnerSession } from "@/features/admin/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: UserRole.SYSTEM_OWNER, label: "System Owner" },
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.MANAGER, label: "Manager" },
  { value: UserRole.SALES, label: "Sales" },
  { value: UserRole.TECHNICIAN, label: "Technician" },
  { value: UserRole.DEMO_USER, label: "Demo User" },
];

export default async function UsersAndRolesPage() {
  await requireSystemOwnerSession();
  const [users, workspaces] = await Promise.all([
    db.user.findMany({ orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }], include: { activeWorkspace: true } }).catch((error) => {
      console.error("[settings:users] User list unavailable.", { error: error instanceof Error ? error.name : "UnknownError" });
      return [];
    }),
    db.businessWorkspace.findMany({ where: { isActive: true }, orderBy: { businessName: "asc" } }).catch((error) => {
      console.error("[settings:users] Workspace list unavailable.", { error: error instanceof Error ? error.name : "UnknownError" });
      return [];
    }),
  ]);

  return (
    <div className="space-y-4">
      <DetailCard title="Users & Roles">
          <p className="text-sm leading-6 text-[#64707a]">
          System Owner users can add, edit, deactivate, assign roles, set temporary passwords,
          and lock demo users to a single workspace.
        </p>
      </DetailCard>

      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <DetailCard title="Add user">
          <form action={createTeamMemberAction} className="grid gap-3">
            <Field name="name" label="Name" />
            <Field name="email" label="Email / login" type="email" />
            <Field name="password" label="Temporary password" type="password" />
            <label className="grid gap-1.5 text-sm">
              Role
              <select name="role" defaultValue={UserRole.DEMO_USER} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3">
                {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              Assigned workspace
              <select name="activeWorkspaceId" className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3">
                <option value="">No workspace assigned</option>
                {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.businessName}</option>)}
              </select>
            </label>
            <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
              Add user
            </button>
          </form>
        </DetailCard>

        <DetailCard title="Current users">
          {users.length === 0 ? (
            <EmptyState title="User records are unavailable" body="No users could be loaded. Existing access remains unchanged; try again after the database connection is restored." />
          ) : (
          <div className="overflow-hidden rounded-[1rem] border border-[#12212c]/8">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/65 text-left text-xs uppercase tracking-[0.1em] text-[#64707a]">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Workspace</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Controls</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-[#12212c]/8 bg-white/40 align-top">
                    <td className="px-3 py-3" colSpan={3}>
                      <form action={updateTeamMemberProfileAction} className="grid gap-2 lg:grid-cols-[1fr_1fr_160px_180px_170px_auto]">
                        <input type="hidden" name="userId" value={user.id} />
                        <input name="name" defaultValue={user.name} className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2" />
                        <input name="email" defaultValue={user.email} className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2" />
                        <select name="role" defaultValue={user.role} className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2">
                          {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                        </select>
                        <select name="activeWorkspaceId" defaultValue={user.activeWorkspaceId ?? ""} className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2">
                          <option value="">No workspace</option>
                          {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.businessName}</option>)}
                        </select>
                        <input name="temporaryPassword" type="password" placeholder="Temp password" className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2" />
                        <button type="submit" className="rounded-full border border-[#12212c]/10 px-3 text-xs font-medium">Save changes</button>
                      </form>
                      <p className="mt-1 text-xs text-[#64707a]">Created {formatDateTime(user.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge label={user.isActive ? "Active" : "Inactive"} tone={user.isActive ? "success" : "neutral"} />
                    </td>
                    <td className="px-3 py-3">
                      <form action={updateTeamMemberAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value={user.role} />
                        <input type="hidden" name="intent" value="toggle-active" />
                        <input type="hidden" name="isActive" value={String(!user.isActive)} />
                        <ConfirmSubmitButton
                          label={user.isActive ? "Deactivate" : "Reactivate"}
                          message={`${user.isActive ? "Deactivate" : "Reactivate"} ${user.email}?`}
                          className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <p className="mt-3 text-sm text-[#64707a]">
            Reset password placeholder: set a temporary password through the add-user flow for now; a dedicated reset email can attach to the notification provider later.
          </p>
        </DetailCard>
      </section>
    </div>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <input name={name} type={type} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
    </label>
  );
}
