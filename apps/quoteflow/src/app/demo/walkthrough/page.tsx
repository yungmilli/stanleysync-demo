import Link from "next/link";

const walkthrough = [
  {
    title: "Customer quote request",
    detail: "Open the quote form, choose a general service request, enter contact details, describe the work, and submit.",
    href: "/quote",
    cta: "Open quote form",
  },
  {
    title: "Admin quote review",
    detail: "Log in, open Quotes, review the customer information, original answers, status, and quoted amount.",
    href: "/admin/quotes",
    cta: "Open quotes",
  },
  {
    title: "Convert quote to job",
    detail: "From quote detail, convert the approved request into a job. This shows how a customer request becomes operational work.",
    href: "/admin/tickets",
    cta: "Open jobs",
  },
  {
    title: "Track work",
    detail: "Open a job, review due date, assignment, notes, status, and work order PDF output.",
    href: "/admin/tickets",
    cta: "Review jobs",
  },
  {
    title: "Create invoice",
    detail: "Open Invoices, review invoice status, line items, payment instructions, and payment link placeholder.",
    href: "/admin/invoices",
    cta: "Open invoices",
  },
  {
    title: "Export documents",
    detail: "Export quote, work order, and invoice PDFs. Judge whether they look professional enough for a customer.",
    href: "/demo/feedback",
    cta: "Give feedback",
  },
];

export default function DemoWalkthroughPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9e4f18]">Demo Walkthrough</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Follow the complete quote-to-invoice story.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64707a]">
            This walkthrough is designed for beta testers and business owners evaluating whether StanleySync App fits a service business.
          </p>
        </div>

        <div className="space-y-3">
          {walkthrough.map((item, index) => (
            <div key={item.title} className="app-panel flex flex-wrap items-center justify-between gap-4 rounded-[1rem] p-4">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12212c] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64707a]">{item.detail}</p>
                </div>
              </div>
              <Link href={item.href} className="rounded-full border border-[#12212c]/10 bg-white/70 px-3 py-1.5 text-sm font-medium">
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
