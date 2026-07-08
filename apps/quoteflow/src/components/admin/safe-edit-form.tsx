"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function SafeEditForm({
  action,
  children,
  saveLabel = "Save changes",
  cancelLabel = "Cancel changes",
  editLabel = "Edit",
  startLocked = false,
  lockedMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  saveLabel?: string;
  cancelLabel?: string;
  editLabel?: string;
  startLocked?: boolean;
  lockedMessage?: string;
}) {
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(!startLocked);

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
      onSubmit={() => {
        setIsDirty(false);
        if (startLocked) setIsEditing(false);
      }}
      onReset={() => window.setTimeout(() => {
        setIsDirty(false);
        if (startLocked) setIsEditing(false);
      }, 0)}
    >
      {startLocked && !isEditing ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-2 text-sm text-[#64707a]">
          <span>{lockedMessage ?? "Open edit mode before changing these fields."}</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white"
          >
            {editLabel}
          </button>
        </div>
      ) : isDirty ? (
        <div className="rounded-[0.8rem] border border-[#c46a29]/20 bg-[#fff4e6] px-3 py-2 text-sm text-[#9e4f18]">
          Unsaved changes
        </div>
      ) : (
        <div className="rounded-[0.8rem] border border-[#25624f]/15 bg-[#e9f5ef] px-3 py-2 text-sm text-[#25624f]">
          Saved ✓
        </div>
      )}
      <fieldset disabled={!isEditing} className={!isEditing ? "opacity-75" : ""}>
        {children}
      </fieldset>
      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          <SafeEditSubmitButton label={saveLabel} />
          <button type="reset" className="rounded-full border border-[#12212c]/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#12212c]">
            {cancelLabel}
          </button>
        </div>
      ) : null}
    </form>
  );
}

function SafeEditSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white disabled:bg-[#8b959c] disabled:text-white"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}
