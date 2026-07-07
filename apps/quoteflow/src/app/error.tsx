"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="app-panel max-w-xl rounded-[1.2rem] p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync</p>
        <h1 className="mt-2 text-2xl font-semibold">This page needs a retry.</h1>
        <p className="mt-3 text-sm leading-6 text-[#64707a]">
          StanleySync could not finish this request. Your session should still be active, and you can retry or return
          to the dashboard.
        </p>
        {error.digest ? <p className="mt-2 text-xs text-[#64707a]">Error reference: {error.digest}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
          <Link href="/" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
            Public home
          </Link>
          <Link href="/admin" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
