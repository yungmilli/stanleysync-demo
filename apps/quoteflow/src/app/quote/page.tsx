import Link from "next/link";

import { QuoteAssistant } from "@/components/quote/quote-assistant";

export default function QuotePage() {
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-4 sm:px-8 lg:px-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#9e4f18]">Customer quote intake</p>
          <h1 className="mt-2.5 text-balance text-[2rem] font-semibold tracking-[-0.03em] sm:text-[2.2rem]">
            Guided quote intake for service businesses.
          </h1>
          <p className="mt-2.5 max-w-2xl text-[0.92rem] leading-6 text-[#64707a]">
            Answer a short set of questions so the team can review your request, create a quote,
            and convert approved work into a job.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-[#12212c]/10 bg-white/60 px-3.5 py-1.5 text-[0.84rem] transition hover:border-[#12212c]/20"
        >
          Back to overview
        </Link>
      </div>
      <QuoteAssistant />
    </main>
  );
}
