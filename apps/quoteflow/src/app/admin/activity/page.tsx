import { UserRole } from "@prisma/client";

import { AdminSection, FilterBar, FilterInput, FilterSelect, SubmitButton, Timeline } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { getActivityFeed } from "@/features/ops/queries";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]);
  const { activities, filters } = await getActivityFeed(await searchParams);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Activity history"
        description="Operational timeline for quote submissions, AI summaries, emails, conversions, assignment changes, due dates, and ticket completion."
      />
      <FilterBar>
        <FilterInput name="query" defaultValue={filters.query} placeholder="Search title or description" />
        <FilterSelect name="entityType" defaultValue={filters.entityType}>
          <option value="">All entities</option>
          <option value="QuoteRequest">Quotes</option>
          <option value="Ticket">Tickets</option>
          <option value="IdeaPost">Idea Board</option>
          <option value="WebsiteProject">Projects</option>
        </FilterSelect>
        <div className="md:col-span-2 xl:col-span-3" />
        <SubmitButton label="Apply" />
      </FilterBar>
      <section className="app-panel rounded-[1rem] p-4">
        <Timeline items={activities} />
      </section>
    </div>
  );
}
