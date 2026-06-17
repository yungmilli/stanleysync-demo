import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardList, MessageSquareText, PlayCircle } from "lucide-react";

const workflowCards = [
  ["Quote", "Capture a customer request with guided intake."],
  ["Track", "Convert approved quotes into assigned jobs."],
  ["Invoice", "Create invoices and export customer-ready PDFs."],
];

export default function WelcomePage() {
  return (
    <main className="px-5 py-5 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] bg-[#10212c] text-[#f7f2e8] shadow-[0_22px_72px_rgba(16,33,44,0.16)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-[0.9rem] border border-white/12 bg-white/5">
              <Image src="/brand/stanleysync-ai-logo.jpg" alt="StanleySync logo" fill sizes="48px" className="object-cover" priority />
            </div>
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#d8b28a]">StanleySync App</p>
              <p className="mt-1 text-sm text-white/65">Quote. Track. Invoice.</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/demo/start" className="rounded-full border border-white/12 px-3 py-1.5 text-[#f7f2e8] hover:bg-white/8">
              Launch Demo
            </Link>
            <Link href="/demo/quick-start" className="rounded-full border border-white/12 px-3 py-1.5 text-[#f7f2e8] hover:bg-white/8">
              Quick Start Guide
            </Link>
            <Link href="/demo/feedback" className="rounded-full bg-[#c46a29] px-3.5 py-1.5 font-medium text-white">
              Contact / Feedback
            </Link>
          </nav>
        </header>

        <div className="grid gap-7 px-5 py-7 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-8">
          <div className="max-w-2xl">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#d8b28a]">Beta tester welcome</p>
            <h1 className="mt-3 text-balance text-[2.55rem] font-semibold leading-[0.94] tracking-[-0.05em] sm:text-[3.3rem]">
              Quote. Track. Invoice.
            </h1>
            <p className="mt-4 max-w-xl text-[1rem] leading-7 text-white/75">
              StanleySync App is a service-business operating workspace for customer quotes,
              job tracking, invoices, and professional PDF documents.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/demo/start"
                className="inline-flex items-center gap-2 rounded-full bg-[#f8efe0] px-4 py-2 text-sm font-medium text-[#10212c]"
              >
                <PlayCircle className="h-4 w-4" />
                Launch Demo
              </Link>
              <Link
                href="/demo/quick-start"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/88"
              >
                <ClipboardList className="h-4 w-4" />
                Quick Start Guide
              </Link>
              <Link
                href="/demo/feedback"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/88"
              >
                <MessageSquareText className="h-4 w-4" />
                Contact / Feedback
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {workflowCards.map(([title, body], index) => (
              <div key={title} className="rounded-[1rem] border border-white/10 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{title}</p>
                  <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-white/70">0{index + 1}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/72">{body}</p>
              </div>
            ))}
            <Link
              href="/login"
              className="inline-flex items-center justify-between rounded-[1rem] border border-white/10 bg-[#f9f1e6] p-4 text-sm font-semibold text-[#10212c]"
            >
              Admin / demo login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
