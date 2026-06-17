import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, ReceiptText } from "lucide-react";

import { env } from "@/lib/env";

const workflow = [
  ["1. Create a quote", "Open the public quote intake and submit a realistic service request."],
  ["2. Review the quote", "Log in, open Quotes, and inspect the structured quote details."],
  ["3. Convert to job", "Convert the quote into a WorkFlow job and update the job status."],
  ["4. Create invoice", "Create an invoice from the quote or job and add a payment link if available."],
  ["5. Export PDFs", "Export the quote PDF, work order PDF, and invoice PDF."],
];

export default function DemoStartPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[1.35rem] bg-[#10212c] p-6 text-[#f7f2e8] shadow-[0_22px_72px_rgba(16,33,44,0.16)]">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#d8b28a]">StanleySync App pilot</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.05em]">
            Test quote, job, invoice, and PDF workflow in one clean demo.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">
            StanleySync App helps service businesses collect customer quote requests, convert approved work into jobs,
            create invoices, and send customer-ready documents.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/quote" className="inline-flex items-center gap-2 rounded-full bg-[#f8efe0] px-4 py-2 text-sm font-medium text-[#10212c]">
              Create test quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90">
              Log in to demo
            </Link>
            <Link href="/demo/quick-start" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90">
              Quick Start Guide
            </Link>
            <Link href="/demo/walkthrough" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90">
              Demo Walkthrough
            </Link>
            <Link href="/demo/feedback" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90">
              Send feedback
            </Link>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="app-panel rounded-[1rem] p-4">
            <h2 className="text-lg font-semibold">Demo login</h2>
            <div className="mt-3 space-y-2 text-sm text-[#64707a]">
              <p><span className="font-medium text-[#12212c]">Email:</span> demo@stanleysync.app</p>
              <p><span className="font-medium text-[#12212c]">Password:</span> provided by the StanleySync owner</p>
              <p>Demo users are locked to StanleySync Demo and cannot switch workspaces or access system settings.</p>
              {env.PILOT_MODE ? <p className="rounded-[0.75rem] bg-[#fff4e6] px-3 py-2 text-[#9e4f18]">Pilot Mode is enabled.</p> : null}
            </div>
          </div>

          <div className="app-panel rounded-[1rem] p-4">
            <h2 className="text-lg font-semibold">What to test</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {workflow.map(([title, body]) => (
                <div key={title} className="rounded-[0.85rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-[#64707a]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <PilotCard icon={<ClipboardCheck className="h-5 w-5" />} title="Quote intake" body="Check whether the guided intake asks enough, but not too much." />
          <PilotCard icon={<FileText className="h-5 w-5" />} title="Work orders" body="Confirm job details, status, and PDF output are useful." />
          <PilotCard icon={<ReceiptText className="h-5 w-5" />} title="Invoices" body="Review invoice details, payment link fields, and PDF polish." />
        </section>
      </section>
    </main>
  );
}

function PilotCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="app-panel rounded-[1rem] p-4">
      <div className="flex items-center gap-2 text-[#9e4f18]">{icon}<span className="text-sm font-semibold text-[#12212c]">{title}</span></div>
      <p className="mt-2 text-sm leading-6 text-[#64707a]">{body}</p>
    </div>
  );
}
