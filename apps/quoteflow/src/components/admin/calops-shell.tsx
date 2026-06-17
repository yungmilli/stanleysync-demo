import Link from "next/link";

const CALOPS_LINKS = [
  { href: "/admin/calops", label: "Dashboard" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/procedures", label: "Procedures" },
  { href: "/admin/standards", label: "Standards" },
  { href: "/admin/work-orders", label: "Work Orders" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/integrations/calops", label: "CalOps I/O" },
  { href: "/admin/calops/audit", label: "Audit / Traceability" },
];

export function CalOpsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[230px_1fr]">
      <aside className="app-panel h-fit rounded-[0.95rem] p-2.5">
        <div className="px-2 py-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">
            CalOps workspace
          </p>
          <p className="mt-1 text-sm font-medium">Calibration execution</p>
        </div>
        <nav className="mt-2 grid gap-1">
          {CALOPS_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[0.78rem] px-3 py-2 text-sm text-[#12212c] transition hover:bg-white/70"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
