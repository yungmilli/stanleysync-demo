import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8 sm:px-8">
      <div className="grid w-full gap-8 rounded-[1.5rem] border border-[#12212c]/10 bg-white/80 p-6 shadow-[0_20px_70px_rgba(18,33,44,0.08)] md:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-[0.9rem] border border-[#12212c]/10 bg-[#10212c]">
              <Image src="/brand/stanleysync-ai-logo.jpg" alt="StanleySync logo" fill sizes="48px" className="object-cover" priority />
            </div>
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync App</p>
              <p className="mt-1 text-sm text-[#64707a]">Quote. Track. Invoice.</p>
            </div>
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
            Sign in to the demo workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#64707a]">
            StanleySync App helps service teams quote, track, and invoice from one place. Demo users
            see the general service workflow; StanleySync Labs is available internally to admins only.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/demo/quick-start" className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 text-sm">
              Quick Start Guide
            </Link>
            <Link href="/demo/feedback" className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 text-sm">
              Feedback
            </Link>
          </div>
        </div>
        <div className="rounded-[1.1rem] bg-[#fffaf2] p-5">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
