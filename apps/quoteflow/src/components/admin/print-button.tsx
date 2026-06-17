"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white"
    >
      Print / Save PDF
    </button>
  );
}
