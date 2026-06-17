"use client";

export function CopyButton({ value, label = "Copy payment link" }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value)}
      className="rounded-full border border-[#12212c]/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#12212c] hover:bg-white"
    >
      {label}
    </button>
  );
}
