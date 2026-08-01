import { UserRole } from "@prisma/client";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { DetailCard, EmptyState, StatusBadge } from "@/components/admin/ops-ui";
import { createTeamMemberAction, updateTeamMemberAction, updateTeamMemberProfileAction } from "@/features/admin/actions";
import { requireAuthenticatedUser } from "@/features/admin/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const allRoleOptions: Array<{ value: UserRole; label: string }> = [
  { value: UserRole.SYSTEM_OWNER, label: "System Owner" },
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.MANAGER, label: "Manager" },
  { value: UserRole.SALES, label: "Sales" },
  { value: UserRole.TECHNICIAN, label: "Technician" },
  { value: UserRole.DEMO_USER, label: "Demo User" },
];

const workspaceAdminRoles: UserRole[] = [UserRole.MANAGER, UserRole.SALES, UserRole.TECHNICIAN, UserRole.DEMO_USER];
const workspaceAdminRoleOptions = allRoleOptions.filter((role) =>
  workspaceAdminRoles.includes(role.value),
);

type UsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersAndRolesPage({ searchParams }: UsersPageProps) {
  const { user } = await requireAuthenticatedUser();
  const params = await searchParams;
  const isSystemOwner = user.role === UserRole.SYSTEM_OWNER;
  const canManageUsers = isSystemOwner || user.role === UserRole.ADMIN;
  const roleOptions = isSystemOwner ? allRoleOptions : workspaceAdminRoleOptions;
  const saved = params?.userSaved === "1";

  if (!canManageUsers) {
    return (
      <div className="space-y-4">
        <DetailCard title="Access denied">
          <p className="text-sm leading-6 text-[#64707a]">
            Users & Roles is limited to System Owner and Admin accounts. Demo users cannot view users,
            edit roles, reset passwords, or change workspace permissions.
          </p>
          <Link href="/admin" className="mt-4 inline-flex rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
            Back to Dashboard
          </Link>
        </DetailCard>
      </div>
    );
  }

  const [users, workspaces] = await Promise.all([
    db.user.findMany({
      where: isSystemOwner
        ? undefined
        : {
            activeWorkspaceId: user.activeWorkspaceId ?? "__none__",
            role: { not: UserRole.SYSTEM_OWNER },
          },
      orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
      include: { activeWorkspace: true },
    }).catch((error) => {
      console.error("[settings:users] User list unavailable.", { error: error instanceof Error ? error.name : "UnknownError" });
      return [];
    }),
    db.businessWorkspace.findMany({
      where: isSystemOwner ? { isActive: true } : { id: user.activeWorkspaceId ?? "__none__", isActive: true },
      orderBy: { businessName: "asc" },
    }).catch((error) => {
      console.error("[settings:users] Workspace list unavailable.", { error: error instanceof Error ? error.name : "UnknownError" });
      return [];
    }),
  ]);

  const defaultWorkspaceId = isSystemOwner ? "" : user.activeWorkspaceId ?? "";

  return (
    <div className="space-y-4">
      <DetailCard title="Users & Roles">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-3xl text-sm leading-6 text-[#64707a]">
            {isSystemOwner
              ? "System Owner users can manage every workspace, assign roles, reset temporary passwords, and deactivate users safely."
              : "Admins can create and manage team members inside their assigned workspace. System Owner roles and cross-workspace access stay locked."}
          </p>
          <StatusBadge label={isSystemOwner ? "System Owner controls" : "Workspace Admin controls"} tone={isSystemOwner ? "info" : "neutral"} />
        </div>
        {saved ? (
          <div className="mt-3 rounded-[0.85rem] border border-emerald-500/20 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            Saved user changes.
          </div>
        ) : null}
        {!isSystemOwner ? (
          <div className="mt-3 rounded-[0.85rem] border border-[#12212c]/10 bg-white/60 px-3 py-2 text-sm text-[#64707a]">
            Workspace users only. System Owner accounts and cross-workspace admin controls are hidden.
          </div>
        ) : null}
      </DetailCard>

      {!isSystemOwner && !user.activeWorkspaceId ? (
        <EmptyState
          title="No workspace assigned"
          body="Your admin account needs an assigned workspace before it can manage a team. Ask a System Owner to assign one."
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <DetailCard title="Add user">
            <form action={createTeamMemberAction} className="grid gap-3">
              <Field name="name" label="Name" required />
              <Field name="email" label="Email / login" type="email" required />
              <Field name="password" label="Temporary password" type="password" required />
              <label className="grid gap-1.5 text-sm">
                Role
                <select name="role" defaultValue={UserRole.DEMO_USER} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 text-[#12212c]">
                  {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                Assigned workspace
                <select
                  name="activeWorkspaceId"
                  defaultValue={defaultWorkspaceId}
                  disabled={!isSystemOwner}
                  className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 text-[#12212c] disabled:bg-[#f2eee8] disabled:text-[#64707a]"
                >
                  {isSystemOwner ? <option value="">No workspace assigned</option> : null}
                  {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.businessName}</option>)}
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-[#12212c]">
                <input type="hidden" name="isActive" value="false" />
                <input name="isActive" type="checkbox" value="true" defaultChecked className="h-4 w-4 rounded border-[#12212c]/20" />
                Active user
              </label>
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
                Add user
              </button>
              {!isSystemOwner ? (
                <p className="text-xs leading-5 text-[#64707a]">Workspace Admins can create Manager, Sales, Technician, and Demo User accounts only.</p>
              ) : null}
            </form>
          </DetailCard>

          <DetailCard title="Current users">
            {users.length === 0 ? (
              <EmptyState title="No team users found" body="Add a user to this workspace to start building the test team." />
            ) : (
              <div className="grid gap-3">
                {users.map((teamUser) => {
                  const isSelfSystemOwner = teamUser.id === user.id && teamUser.role === UserRole.SYSTEM_OWNER;
                  const rowRoleOptions = isSystemOwner ? allRoleOptions : workspaceAdminRoleOptions;
                  return (
                    <div key={teamUser.id} className="rounded-[1rem] border border-[#12212c]/8 bg-white/50 p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#12212c]">{teamUser.name}</p>
                          <p className="break-all text-xs text-[#64707a]">{teamUser.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={formatRoleLabel(teamUser.role)} tone={teamUser.role === UserRole.SYSTEM_OWNER ? "info" : "neutral"} />
                          <StatusBadge label={teamUser.isActive ? "Active" : "Inactive"} tone={teamUser.isActive ? "success" : "neutral"} />
                        </div>
                      </div>

                      <form action={updateTeamMemberProfileAction} className="grid gap-3 2xl:grid-cols-[1fr_1fr_170px_220px_170px_130px_auto]">
                        <input type="hidden" name="userId" value={teamUser.id} />
                        {isSelfSystemOwner ? (
                          <>
                            <input type="hidden" name="role" value={teamUser.role} />
                            <input type="hidden" name="isActive" value={String(teamUser.isActive)} />
                          </>
                        ) : null}
                        <Field name="name" label="Name" defaultValue={teamUser.name} required compact />
                        <Field name="email" label="Email / login" type="email" defaultValue={teamUser.email} required compact />
                        <label className="grid gap-1 text-xs font-medium text-[#64707a]">
                          Role
                          <select
                            name="role"
                            defaultValue={teamUser.role}
                            disabled={isSelfSystemOwner}
                            className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2 text-sm text-[#12212c] disabled:bg-[#f2eee8] disabled:text-[#64707a]"
                          >
                            {rowRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-[#64707a]">
                          Workspace
                          <select
                            name="activeWorkspaceId"
                            defaultValue={teamUser.activeWorkspaceId ?? ""}
                            disabled={!isSystemOwner}
                            className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2 text-sm text-[#12212c] disabled:bg-[#f2eee8] disabled:text-[#64707a]"
                          >
                            {isSystemOwner ? <option value="">No workspace</option> : null}
                            {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.businessName}</option>)}
                          </select>
                        </label>
                        <Field name="temporaryPassword" label="Temp password" type="password" placeholder="Reset password" compact />
                        <label className="grid gap-1 text-xs font-medium text-[#64707a]">
                          Status
                          <select
                            name="isActive"
                            defaultValue={String(teamUser.isActive)}
                            disabled={isSelfSystemOwner}
                            className="h-9 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-2 text-sm text-[#12212c] disabled:bg-[#f2eee8] disabled:text-[#64707a]"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </label>
                        <button type="submit" className="self-end rounded-full border border-[#12212c]/10 bg-white px-3 py-2 text-xs font-semibold text-[#12212c] hover:bg-[#f7f1e8]">
                          Save changes
                        </button>
                      </form>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#12212c]/8 pt-3">
                        <p className="text-xs text-[#64707a]">
                          Workspace: {teamUser.activeWorkspace?.businessName ?? "No workspace"} · Created {formatDateTime(teamUser.createdAt)}
                        </p>
                        <form action={updateTeamMemberAction}>
                          <input type="hidden" name="userId" value={teamUser.id} />
                          <input type="hidden" name="role" value={teamUser.role} />
                          <input type="hidden" name="intent" value="toggle-active" />
                          <input type="hidden" name="isActive" value={String(!teamUser.isActive)} />
                          <ConfirmSubmitButton
                            label={teamUser.isActive ? "Deactivate" : "Reactivate"}
                            message={`${teamUser.isActive ? "Deactivate" : "Reactivate"} ${teamUser.email}?`}
                            className="text-xs"
                          />
                        </form>
                      </div>
                      {isSelfSystemOwner ? (
                        <p className="mt-2 text-xs text-[#64707a]">Your own System Owner role and active status are locked to prevent losing owner access.</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </DetailCard>
        </section>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  placeholder,
  required,
  compact,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  compact?: boolean;
}) {
  return (
    <label className={`grid gap-1 ${compact ? "text-xs font-medium text-[#64707a]" : "text-sm"}`}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={`${compact ? "h-9 rounded-[0.7rem] px-2 text-sm" : "h-10 rounded-[0.78rem] px-3"} border border-[#12212c]/10 bg-white/70 text-[#12212c] placeholder:text-[#8b949b]`}
      />
    </label>
  );
}

function formatRoleLabel(role: UserRole) {
  return role === UserRole.SYSTEM_OWNER ? "System Owner" : role.replace("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
