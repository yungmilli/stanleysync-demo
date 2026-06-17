import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GeneratedSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await db.websiteProject.findUnique({
    where: { slug },
  });

  if (!project) {
    notFound();
  }

  const generated = project.generatedContent as {
    hero: { eyebrow: string; headline: string; subheadline: string; cta: string };
    about: { title: string; body: string };
    services: { title: string; items: string[] };
    quote: { title: string; body: string };
    testimonials: { title: string; items: Array<{ quote: string; author: string; company: string }> };
    faq: { title: string; items: Array<{ question: string; answer: string }> };
    footer: { businessName: string; contactEmail: string; contactPhone: string; address: string };
  };
  const brand = project.brandSettings as {
    primary: string;
    accent: string;
    neutral: string;
    logoText: string;
  };

  return (
    <main
      className="min-h-screen"
      style={{
        background: brand.neutral,
        color: brand.primary,
      }}
    >
      <section
        className="px-6 py-8 sm:px-10 lg:px-16"
        style={{
          background: `linear-gradient(140deg, ${brand.primary}, #18374b 60%, ${brand.accent})`,
          color: "#f8f3ea",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm uppercase tracking-[0.25em]">{brand.logoText}</div>
            <Link href="/quote" className="rounded-full border border-white/15 px-4 py-2 text-sm">
              Request quote
            </Link>
          </div>
          <div className="grid min-h-[70svh] items-end gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.25em] text-[#f0cba6]">
                {generated.hero.eyebrow}
              </p>
              <h1 className="mt-4 text-balance text-5xl font-semibold leading-[0.95] sm:text-6xl">
                {generated.hero.headline}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/78">
                {generated.hero.subheadline}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/quote"
                  className="rounded-full bg-white px-5 py-3 font-medium"
                  style={{ color: brand.primary }}
                >
                  {generated.hero.cta}
                </Link>
              </div>
            </div>
            <div
              className="rounded-[2rem] p-6"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-[#f0cba6]">Service area</p>
              <p className="mt-3 text-2xl font-semibold">{project.serviceArea}</p>
              <div className="mt-8 space-y-3 text-white/78">
                {(project.services as string[]).map((service) => (
                  <div key={service} className="rounded-full bg-white/8 px-4 py-3">
                    {service}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-divider px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.2em]" style={{ color: brand.accent }}>
              About
            </p>
            <h2 className="mt-4 text-4xl font-semibold">{generated.about.title}</h2>
          </div>
          <p className="text-lg leading-8 text-[#5f6d76]">{generated.about.body}</p>
        </div>
      </section>

      <section className="section-divider px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-[0.2em]" style={{ color: brand.accent }}>
            {generated.services.title}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {generated.services.items.map((service) => (
              <div key={service} className="rounded-[1.5rem] bg-white/80 p-6 shadow-[0_18px_50px_rgba(17,32,43,0.05)]">
                <h3 className="text-xl font-semibold">{service}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5f6d76]">
                  Replace this generated copy with client-specific detail as the project gets refined.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-divider px-6 py-20 sm:px-10 lg:px-16">
        <div
          className="mx-auto max-w-7xl rounded-[2rem] p-8 text-white"
          style={{ background: brand.primary }}
        >
          <h2 className="text-3xl font-semibold">{generated.quote.title}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-white/76">{generated.quote.body}</p>
          <Link
            href="/quote"
            className="mt-8 inline-flex rounded-full bg-white px-5 py-3 font-medium"
            style={{ color: brand.primary }}
          >
            Start a quote request
          </Link>
        </div>
      </section>

      <section className="section-divider px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.2em]" style={{ color: brand.accent }}>
              {generated.testimonials.title}
            </p>
            <div className="mt-8 space-y-4">
              {generated.testimonials.items.map((item) => (
                <blockquote key={`${item.author}-${item.company}`} className="rounded-[1.5rem] bg-white/80 p-6 shadow-[0_18px_50px_rgba(17,32,43,0.05)]">
                  <p className="text-lg leading-8">&quot;{item.quote}&quot;</p>
                  <footer className="mt-4 text-sm text-[#5f6d76]">
                    {item.author} - {item.company}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em]" style={{ color: brand.accent }}>
              {generated.faq.title}
            </p>
            <div className="mt-8 space-y-4">
              {generated.faq.items.map((item) => (
                <div key={item.question} className="rounded-[1.5rem] bg-white/80 p-6 shadow-[0_18px_50px_rgba(17,32,43,0.05)]">
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5f6d76]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="section-divider px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-[#5f6d76]">
          <div>
            <p className="font-semibold" style={{ color: brand.primary }}>
              {generated.footer.businessName}
            </p>
            <p>{generated.footer.address}</p>
          </div>
          <div className="text-right">
            <p>{generated.footer.contactEmail}</p>
            <p>{generated.footer.contactPhone}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
