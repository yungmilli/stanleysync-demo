import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { cn, compactDateLabel, formatCurrency, formatDate, formatDateTime, formatPercent, sentenceCase } from "@/lib/utils";

type Crumb = {
  label: string;
  href?: string;
};

const toneClasses = {
  neutral: "bg-[#12212c]/7 text-[#12212c]",
  info: "bg-[#12212c] text-white",
  success: "bg-[#e9f5ef] text-[#25624f]",
  warning: "bg-[#fff0d9] text-[#8a5d12]",
  danger: "bg-[#fde8e6] text-[#9e4338]",
};

export function AdminSection({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <h1 className="text-[1.42rem] font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? (
          <p className="mt-1 text-[0.92rem] leading-6 text-[#64707a]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items, backHref }: { items: Crumb[]; backHref?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-[#64707a]">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-full border border-[#12212c]/10 bg-white/60 px-2.5 py-1.5 text-[#12212c] transition hover:border-[#12212c]/20"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="transition hover:text-[#12212c]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#12212c]">{item.label}</span>
            )}
            {index < items.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="app-panel rounded-[0.95rem] p-3.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">
        {label}
      </p>
      <p className="mt-1.5 text-[1.65rem] font-semibold leading-none tracking-[-0.03em]">{value}</p>
      {detail ? <p className="mt-1 text-[0.72rem] text-[#64707a]">{detail}</p> : null}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.69rem] font-medium",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}

export function DetailCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="app-panel rounded-[0.95rem] p-3.5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-[0.98rem] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function KeyValueGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[0.82rem] border border-[#12212c]/8 bg-white/55 p-2.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#64707a]">
            {item.label}
          </p>
          <div className="mt-1 text-[0.9rem] leading-5 text-[#12212c]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function Timeline({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    actor?: string | null;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyState title="No activity yet" body="Timeline events will appear here as the record changes." />;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn("timeline-line flex gap-3 pl-0.5", index === items.length - 1 && "before:hidden")}
        >
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#c46a29]" />
          <div className="pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <span className="text-xs text-[#64707a]">{formatDateTime(item.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#64707a]">{item.description}</p>
            {item.actor ? <p className="mt-1 text-xs text-[#8b959c]">Actor: {item.actor}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1rem] border border-dashed border-[#12212c]/14 bg-white/35 px-5 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#64707a]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function FilterBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <form className="app-panel rounded-[0.95rem] p-2.5">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">{children}</div>
    </form>
  );
}

export function FilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-8.5 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-3 text-[0.84rem] outline-none transition focus:border-[#c46a29]",
        props.className,
      )}
    />
  );
}

export function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-8.5 rounded-[0.7rem] border border-[#12212c]/10 bg-white/70 px-3 text-[0.84rem] outline-none transition focus:border-[#c46a29]",
        props.className,
      )}
    />
  );
}

export function SubmitButton({
  label,
}: {
  label: string;
}) {
  return (
    <button
      type="submit"
      className="h-8.5 rounded-[0.7rem] bg-[#12212c] px-3 text-[0.84rem] font-medium text-white transition hover:bg-[#1b3343]"
    >
      {label}
    </button>
  );
}

export function DataBars({
  rows,
}: {
  rows: Array<{ label: string; value: number; suffix?: string }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1.5">
          <div className="chart-row text-sm">
            <span className="truncate text-[#12212c]">{sentenceCase(row.label)}</span>
            <span className="text-[#64707a]">
              {row.value}
              {row.suffix ?? ""}
            </span>
          </div>
          <div className="chart-track">
            <div className="chart-fill" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FinancialBars({
  rows,
}: {
  rows: Array<{ label: string; revenue: number; cost: number; profit: number }>;
}) {
  const max = Math.max(...rows.map((row) => Math.max(row.revenue, row.cost, Math.abs(row.profit))), 1);

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{row.label}</span>
            <span className="text-[#64707a]">{formatCurrency(row.profit)} profit</span>
          </div>
          <div className="grid gap-1">
            <Bar label="Revenue" value={row.revenue} max={max} tone="bg-[#12212c]" />
            <Bar label="Cost" value={row.cost} max={max} tone="bg-[#c46a29]" />
            <Bar
              label="Profit"
              value={Math.abs(row.profit)}
              max={max}
              tone={row.profit >= 0 ? "bg-[#2b7b62]" : "bg-[#b4514b]"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr_auto] items-center gap-2 text-xs text-[#64707a]">
      <span>{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-[#12212c]/8">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

export function TableHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.72rem] text-[#64707a]">{children}</p>;
}

export function DuePill({ date }: { date?: Date | string | null }) {
  const tone =
    !date ? "neutral" : new Date(date) < new Date() ? "danger" : compactDateLabel(date) === "Today" ? "warning" : "neutral";
  return <StatusBadge label={compactDateLabel(date)} tone={tone} />;
}

export function SummaryStat({
  label,
  value,
  kind,
}: {
  label: string;
  value?: number | null;
  kind?: "currency" | "percent" | "date";
}) {
  let output = `${value ?? 0}`;

  if (kind === "currency") output = formatCurrency(value);
  if (kind === "percent") output = formatPercent(value);
  if (kind === "date") output = formatDate(value ? new Date(value) : null);

  return (
    <div className="rounded-[0.82rem] border border-[#12212c]/8 bg-white/60 p-2.5">
      <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">{label}</p>
      <p className="mt-1 text-[1rem] font-semibold">{output}</p>
    </div>
  );
}
