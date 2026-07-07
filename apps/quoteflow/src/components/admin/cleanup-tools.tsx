"use client";

import { useMemo, useState } from "react";

import { clearDemoWorkflowRecordsAction, deleteSelectedDemoRecordsAction } from "@/features/admin/actions";

type CleanupRecord = {
  id: string;
  recordKey: string;
  type: "quote" | "ticket" | "invoice";
  number: string;
  customer: string;
  status: string;
  amount: string;
  updatedAt: string;
};

export function CleanupTools({ records }: { records: CleanupRecord[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [dialogMode, setDialogMode] = useState<"selected" | "all" | null>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allSelected = records.length > 0 && selected.length === records.length;

  function toggleRecord(recordKey: string) {
    setSelected((current) =>
      current.includes(recordKey)
        ? current.filter((item) => item !== recordKey)
        : [...current, recordKey],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : records.map((record) => record.recordKey));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{selected.length} selected</p>
          <p className="mt-1 text-xs text-[#64707a]">Only demo workspace quotes, jobs, and invoices are listed here.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDialogMode("selected")}
            disabled={selected.length === 0}
            className="rounded-full border border-[#b4514b]/25 bg-white px-4 py-2 text-sm font-semibold text-[#7f2d27] disabled:border-[#12212c]/10 disabled:text-[#8b959c]"
          >
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setDialogMode("all")}
            disabled={records.length === 0}
            className="rounded-full bg-[#7f2d27] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#8b959c] disabled:text-white"
          >
            Clear demo quotes/jobs/invoices
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1rem] border border-[#12212c]/8 bg-white/55">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/75 text-left text-xs uppercase tracking-[0.1em] text-[#64707a]">
            <tr>
              <th className="w-12 px-3 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all cleanup records" />
              </th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Record</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[#64707a]">
                  No demo workflow records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.recordKey} className="border-t border-[#12212c]/8">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(record.recordKey)}
                      onChange={() => toggleRecord(record.recordKey)}
                      aria-label={`Select ${record.number}`}
                    />
                  </td>
                  <td className="px-3 py-3 capitalize">{record.type}</td>
                  <td className="px-3 py-3 font-medium">{record.number}</td>
                  <td className="px-3 py-3">{record.customer}</td>
                  <td className="px-3 py-3">{record.status}</td>
                  <td className="px-3 py-3 text-right font-semibold">{record.amount}</td>
                  <td className="px-3 py-3 text-[#64707a]">{record.updatedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialogMode ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#12212c]/45 px-4">
          <form
            action={dialogMode === "selected" ? deleteSelectedDemoRecordsAction : clearDemoWorkflowRecordsAction}
            className="w-full max-w-lg rounded-[1.15rem] border border-[#12212c]/10 bg-[#fbf7ef] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Confirm permanent deletion</h2>
            <p className="mt-2 text-sm leading-6 text-[#64707a]">
              This will permanently delete selected demo records. Type DELETE to confirm.
            </p>
            {dialogMode === "selected"
              ? selected.map((recordKey) => <input key={recordKey} type="hidden" name="selectedRecord" value={recordKey} />)
              : null}
            <input
              name="confirmText"
              placeholder="Type DELETE"
              className="mt-4 h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/80 px-3"
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogMode(null)}
                className="rounded-full border border-[#12212c]/10 bg-white px-4 py-2 text-sm font-semibold text-[#12212c]"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-full bg-[#7f2d27] px-4 py-2 text-sm font-semibold text-white">
                Delete permanently
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
