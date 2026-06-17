"use client";

import { useEffect, useState } from "react";

export function SafeEditForm({
  action,
  children,
  saveLabel = "Save changes",
  cancelLabel = "Cancel changes",
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  saveLabel?: string;
  cancelLabel?: string;
}) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <form
      action={action}
      className="space-y-3"
      onChange={() => setIsDirty(true)}
      onInput={() => setIsDirty(true)}
      onSubmit={() => setIsDirty(false)}
      onReset={() => window.setTimeout(() => setIsDirty(false), 0)}
    >
      {isDirty ? (
        <div className="rounded-[0.8rem] border border-[#c46a29]/20 bg-[#fff4e6] px-3 py-2 text-sm text-[#9e4f18]">
          Unsaved changes
        </div>
      ) : null}
      {children}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
          {saveLabel}
        </button>
        <button type="reset" className="rounded-full border border-[#12212c]/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#12212c]">
          {cancelLabel}
        </button>
      </div>
    </form>
  );
}
