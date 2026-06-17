import { IdeaStatus, Priority } from "@prisma/client";

import { AdminSection, DetailCard, EmptyState, FilterBar, FilterInput, FilterSelect, StatusBadge, SubmitButton } from "@/components/admin/ops-ui";
import { addIdeaCommentAction, createIdeaPostAction, updateIdeaPostAction } from "@/features/admin/actions";
import { requireIdeaBoardAccess } from "@/features/admin/guards";
import { getAssignableUsers, getIdeaBoardData } from "@/features/ops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IdeaBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireIdeaBoardAccess();
  const resolvedSearchParams = await searchParams;
  const [{ ideas, categories, filters }, users] = await Promise.all([
    getIdeaBoardData(resolvedSearchParams),
    getAssignableUsers(),
  ]);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Idea Board"
        description="Internal collaboration space for shop and remote teams to share blockers, process ideas, workflow improvements, and product suggestions."
      />

      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <DetailCard title="Post a new idea">
          <form action={createIdeaPostAction} className="space-y-3">
            <Field name="title" label="Title" placeholder="Short idea title" />
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Description</span>
              <textarea
                name="description"
                placeholder="Describe the idea, blocker, or workflow improvement."
                className="min-h-28 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3"
              />
            </label>
            <Field name="category" label="Category" placeholder="Workflow, Operations, Product, Shop floor" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Priority</span>
                <select name="priority" defaultValue={Priority.NORMAL} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                  {Object.values(Priority).map((priority) => (
                    <option key={priority} value={priority}>
                      {sentenceCase(priority)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Owner (optional)</span>
                <select name="ownerUserId" defaultValue="" className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
              Create idea
            </button>
          </form>
        </DetailCard>

        <div className="space-y-4">
          <FilterBar>
            <FilterInput name="query" defaultValue={filters.query} placeholder="Search idea title or description" />
            <FilterSelect name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {Object.values(IdeaStatus).map((status) => (
                <option key={status} value={status}>
                  {sentenceCase(status)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="category" defaultValue={filters.category}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </FilterSelect>
            <div className="md:col-span-2 xl:col-span-2" />
            <SubmitButton label="Apply" />
          </FilterBar>

          {ideas.length === 0 ? (
            <EmptyState title="No ideas matched the current filters" body="Post a new idea or clear the filters to view all collaboration items." />
          ) : (
            ideas.map((idea) => (
              <DetailCard
                key={idea.id}
                title={idea.title}
                action={
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={sentenceCase(idea.status)} tone="neutral" />
                    <StatusBadge
                      label={sentenceCase(idea.priority)}
                      tone={idea.priority === Priority.HIGH || idea.priority === Priority.URGENT ? "warning" : "info"}
                    />
                  </div>
                }
              >
                <p className="text-sm leading-6 text-[#64707a]">{idea.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#64707a]">
                  <span>Category: {idea.category}</span>
                  <span>Created by {idea.createdBy.name}</span>
                  <span>Owner: {idea.owner?.name ?? "Unassigned"}</span>
                  <span>Updated {formatDateTime(idea.updatedAt)}</span>
                </div>

                <form action={updateIdeaPostAction} className="mt-4 grid gap-3 rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="ideaId" value={idea.id} />
                  <label className="text-sm">
                    <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Status</span>
                    <select name="status" defaultValue={idea.status} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                      {Object.values(IdeaStatus).map((status) => (
                        <option key={status} value={status}>
                          {sentenceCase(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Owner</span>
                    <select name="ownerUserId" defaultValue={idea.ownerUserId ?? ""} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="self-end">
                    <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                      Save
                    </button>
                  </div>
                </form>

                <div className="mt-4 space-y-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Comments</p>
                  {idea.comments.length === 0 ? (
                    <p className="text-sm text-[#64707a]">No comments yet.</p>
                  ) : (
                    idea.comments.map((comment) => (
                      <div key={comment.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                        <p className="text-sm leading-6">{comment.body}</p>
                        <p className="mt-1 text-xs text-[#64707a]">
                          {comment.author.name} · {formatDateTime(comment.createdAt)}
                        </p>
                      </div>
                    ))
                  )}

                  <form action={addIdeaCommentAction} className="space-y-3 rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                    <input type="hidden" name="ideaId" value={idea.id} />
                    <textarea
                      name="body"
                      placeholder="Add a comment, blocker, or follow-up."
                      className="min-h-20 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3"
                    />
                    <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                      Add comment
                    </button>
                  </form>
                </div>
              </DetailCard>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
      />
    </label>
  );
}
