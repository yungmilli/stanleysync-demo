import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  ["1. Start with a quote", "Open the public quote form and enter a realistic service request."],
  ["2. Log in", "Use the demo account provided by the StanleySync owner."],
  ["3. Review the quote", "Open Quotes, inspect the detail page, and check the original intake answers."],
  ["4. Convert to job", "Use the conversion action to create a WorkFlow job."],
  ["5. Create invoice", "Open the invoice area and create or review an invoice."],
  ["6. Export PDFs", "Export quote, work order, and invoice PDFs and review the first impression."],
];

export default function QuickStartPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <div className="app-panel rounded-[1.2rem] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-[0.9rem] bg-[#10212c]">
                <Image src="/brand/stanleysync-ai-logo.jpg" alt="StanleySync logo" fill sizes="56px" className="object-cover" priority />
              </div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">Quick Start Guide</p>
                <h1 className="text-2xl font-semibold tracking-[-0.03em]">Test StanleySync in about 10 minutes.</h1>
              </div>
            </div>
            <Link href="/demo/start" className="rounded-full border border-[#12212c]/10 bg-white/70 px-3 py-1.5 text-sm">
              Back to demo start
            </Link>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-2">
          {steps.map(([title, body]) => (
            <div key={title} className="app-panel rounded-[1rem] p-4">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#64707a]">{body}</p>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          <Link href="/quote" className="inline-flex items-center gap-2 rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
            Start quote intake <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="rounded-full border border-[#12212c]/10 bg-white/70 px-4 py-2 text-sm font-medium">
            Log in to demo
          </Link>
          <Link href="/demo/walkthrough" className="rounded-full border border-[#12212c]/10 bg-white/70 px-4 py-2 text-sm font-medium">
            Open walkthrough
          </Link>
        </div>
      </section>
    </main>
  );
}
