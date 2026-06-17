import { redirect } from "next/navigation";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function submitPilotFeedback(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const businessType = String(formData.get("businessType") ?? "").trim();
  const quoteFlowEasy = String(formData.get("quoteFlowEasy") ?? "").trim();
  const jobTrackingUseful = String(formData.get("jobTrackingUseful") ?? "").trim();
  const pdfsProfessional = String(formData.get("pdfsProfessional") ?? "").trim();
  const wouldPay = String(formData.get("wouldPay") ?? "").trim();
  const confused = String(formData.get("confused") ?? "").trim();
  const missing = String(formData.get("missing") ?? "").trim();

  await db.auditEvent.create({
    data: {
      action: "DEMO_FEEDBACK_SUBMITTED",
      entityType: "PilotFeedback",
      summary: `Pilot feedback submitted${name ? ` by ${name}` : ""}.`,
      payload: {
        name,
        businessType,
        quoteFlowEasy,
        jobTrackingUseful,
        pdfsProfessional,
        wouldPay,
        confused,
        missing,
      },
    },
  });

  redirect("/demo/feedback?submitted=true");
}

export default function DemoFeedbackPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  return <FeedbackForm searchParams={searchParams} />;
}

async function FeedbackForm({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const params = await searchParams;

  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync pilot feedback</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Tell us what worked and what was confusing.</h1>
          <p className="mt-2 text-sm leading-6 text-[#64707a]">
            Feedback is stored for the StanleySync owner to review before the next pilot release.
          </p>
        </div>

        {params.submitted === "true" ? (
          <div className="rounded-[1rem] border border-[#2b7b62]/20 bg-[#e9f5ef] p-4 text-sm text-[#25624f]">
            Feedback submitted. Thank you for testing StanleySync App.
          </div>
        ) : null}

        <form action={submitPilotFeedback} className="app-panel grid gap-4 rounded-[1rem] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              Name
              <input name="name" className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
            </label>
            <label className="grid gap-1.5 text-sm">
              Business type
              <input name="businessType" placeholder="Service business, contractor, repair shop..." className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
            </label>
          </div>

          <Choice name="quoteFlowEasy" label="Was the quote flow easy?" />
          <Choice name="jobTrackingUseful" label="Was job tracking useful?" />
          <Choice name="pdfsProfessional" label="Did the PDFs look professional?" />
          <Choice name="wouldPay" label="Would you pay for this?" />

          <label className="grid gap-1.5 text-sm">
            What confused you?
            <textarea name="confused" rows={3} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
          </label>
          <label className="grid gap-1.5 text-sm">
            What is missing?
            <textarea name="missing" rows={3} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
          </label>

          <button type="submit" className="w-fit rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
            Submit feedback
          </button>
        </form>
      </section>
    </main>
  );
}

function Choice({ name, label }: { name: string; label: string }) {
  return (
    <fieldset className="grid gap-2 text-sm">
      <legend className="font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {["Yes", "Somewhat", "No"].map((option) => (
          <label key={option} className="inline-flex items-center gap-2 rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5">
            <input type="radio" name={name} value={option} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
