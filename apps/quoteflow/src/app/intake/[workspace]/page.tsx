import Link from "next/link";
import { notFound } from "next/navigation";

import { QuoteAssistant } from "@/components/quote/quote-assistant";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function modeForBusinessType(type: string) {
  if (type === "AUTO_REPAIR") return { initialMode: "AUTO" as const, initialServiceType: "REPAIR" as const };
  if (type === "CALIBRATION_LAB") return { initialMode: "CALIBRATION" as const, initialServiceType: "CALIBRATION" as const };
  if (type === "CONTRACTOR_FIELD_SERVICE") return { initialMode: "FIELD" as const, initialServiceType: "CUSTOM_SERVICE" as const };
  return { initialMode: "GENERAL" as const, initialServiceType: "CUSTOM_SERVICE" as const };
}

export default async function PublicWorkspaceIntakePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceKey } = await params;
  const session = await getAuthSession();
  const workspace = await db.businessWorkspace.findUnique({
    where: { workspaceKey },
  });

  if (!workspace || !workspace.isActive) {
    notFound();
  }

  await db.auditEvent.create({
    data: {
      workspaceId: workspace.id,
      action: "PUBLIC_INTAKE_VIEW",
      entityType: "BusinessWorkspace",
      entityId: workspace.id,
      summary: `Public intake portal viewed for ${workspace.businessName}.`,
      payload: { workspaceKey },
    },
  }).catch(() => undefined);

  const brandColors = workspace.brandColors as { accent?: string; primary?: string } | null;
  const mode = modeForBusinessType(workspace.businessType);

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-4 sm:px-8 lg:px-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#9e4f18]">Public quote portal</p>
          <h1 className="mt-2.5 text-balance text-[2rem] font-semibold tracking-[-0.03em] sm:text-[2.2rem]">
            Request a quote from {workspace.businessName}.
          </h1>
          <p className="mt-2.5 max-w-2xl text-[0.92rem] leading-6 text-[#64707a]">
            Answer a short set of questions and your request will go straight into StanleySync for review.
          </p>
        </div>
        <Link
          href={session ? "/dashboard" : "/"}
          className="rounded-full border border-[#12212c]/10 bg-white/60 px-3.5 py-1.5 text-[0.84rem] transition hover:border-[#12212c]/20"
        >
          {session ? "Back to dashboard" : "StanleySync App"}
        </Link>
      </div>
      <QuoteAssistant
        workspaceKey={workspace.workspaceKey}
        initialMode={mode.initialMode}
        initialServiceType={mode.initialServiceType}
        portalBrand={{
          businessName: workspace.businessName,
          logoPlaceholder: workspace.logoPlaceholder,
          accent: workspace.themeAccent ?? brandColors?.accent,
        }}
      />
    </main>
  );
}
