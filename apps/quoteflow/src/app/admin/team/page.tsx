import { UserRole } from "@prisma/client";

import { AdminSection, DetailCard, EmptyState, StatusBadge } from "@/components/admin/ops-ui";
import { createTeamMemberAction, updateTeamMemberAction } from "@/features/admin/actions";
import { requireAdminSession } from "@/features/admin/guards";
import { getTeamMembers } from "@/features/ops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await requireAdminSession();
  const members = await getTeamMembers();

  return (
    <div className="space-y-4">
      <AdminSection
        title="Team"
        description="Manage QuoteFlow team access, assign roles, deactivate users, and monitor who owns active quotes and tickets."
      />

      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <DetailCard title="Add team member">
          <form action={createTeamMemberAction} className="space-y-3">
            <Field name="name" label="Name" placeholder="Full name" />
            <Field name="email" label="Email" placeholder="name@stanleysync.app" type="email" />
            <Field name="password" label="Temporary password" placeholder="Temporary password" type="password" />
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Role</span>
              <select
                name="role"
                defaultValue={UserRole.TECHNICIAN}
                className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {sentenceCase(role)}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
              Add team member
            </button>
          </form>
        </DetailCard>

        <DetailCard title="Current team">
          {members.length === 0 ? (
            <EmptyState title="No team members yet" body="Create your first QuoteFlow user to enable role-based access." />
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{member.name}</p>
                        <StatusBadge label={sentenceCase(member.role)} tone="info" />
                        <StatusBadge
                          label={member.isActive ? "Active" : "Inactive"}
                          tone={member.isActive ? "success" : "danger"}
                        />
                      </div>
                      <p className="mt-1 text-sm text-[#64707a]">{member.email}</p>
                      <p className="mt-2 text-xs text-[#64707a]">
                        {member.assignedQuotes.length} active quotes · {member.assignedTickets.length} open tickets · Added {formatDateTime(member.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <form action={updateTeamMemberAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="userId" value={member.id} />
                        <input type="hidden" name="intent" value="update-role" />
                        <label className="text-sm">
                          <span className="mb-1 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Role</span>
                          <select
                            name="role"
                            defaultValue={member.role}
                            className="h-9 rounded-[0.75rem] border border-[#12212c]/10 bg-white/70 px-3"
                          >
                            {Object.values(UserRole).map((role) => (
                              <option key={role} value={role}>
                                {sentenceCase(role)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button type="submit" className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
                          Save role
                        </button>
                      </form>
                      <form action={updateTeamMemberAction}>
                        <input type="hidden" name="userId" value={member.id} />
                        <input type="hidden" name="role" value={member.role} />
                        <input type="hidden" name="intent" value="toggle-active" />
                        <input type="hidden" name="isActive" value={member.isActive ? "false" : "true"} />
                        <button type="submit" className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
                          {member.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailCard>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
      />
    </label>
  );
}
