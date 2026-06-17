import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="app-panel max-w-xl rounded-[1.2rem] p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync</p>
        <h1 className="mt-2 text-2xl font-semibold">Record not found.</h1>
        <p className="mt-3 text-sm leading-6 text-[#64707a]">
          This page may have been moved, deleted, or you may not have access to it.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
            Open dashboard
          </Link>
          <Link href="/" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
            Public home
          </Link>
        </div>
      </div>
    </main>
  );
}
