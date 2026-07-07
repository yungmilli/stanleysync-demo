"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Priority, QuoteStatus, ServiceType, UserRole } from "@prisma/client";

import { sentenceCase } from "@/lib/utils";

type AssignableUser = {
  id: string;
  name: string;
  role: UserRole;
};

type QuoteReviewEditorProps = {
  quote: {
    id: string;
    status: QuoteStatus;
    priority: Priority;
    serviceType: ServiceType;
    assignedUserId: string | null;
    requestedTurnaround: string | null;
    quotedAmount: number | null;
    adminNotes: string | null;
    issueDescription: string | null;
  };
  assignableUsers: AssignableUser[];
  conversionPath: string;
  conversionPathOptions: string[];
  action: (formData: FormData) => void;
};

const quoteStatuses = [
  "NEW",
  "REVIEWING",
  "NEEDS_MORE_INFO",
  "QUOTED",
  "ACCEPTED",
  "DECLINED",
  "CONVERTED",
  "CONVERTED_TO_WORK_ORDER_DRAFT",
  "CLOSED",
] as const;

const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
const serviceTypes = ["CALIBRATION", "REPAIR", "CUSTOM_SERVICE", "OTHER"] as const;
type ReviewFieldName =
  | "status"
  | "priority"
  | "serviceType"
  | "assignedUserId"
  | "requestedTurnaround"
  | "quotedAmount"
  | "adminNotes"
  | "customerVisibleNotes"
  | "conversionPath";

export function QuoteReviewEditor({
  quote,
  assignableUsers,
  conversionPath,
  conversionPathOptions,
  action,
}: QuoteReviewEditorProps) {
  const initialConversionPath = conversionPathOptions.includes(conversionPath)
    ? conversionPath
    : conversionPathOptions[0] ?? "Quote review only";
  const initial = useMemo(
    () => ({
      status: quote.status,
      priority: quote.priority,
      serviceType: quote.serviceType,
      assignedUserId: quote.assignedUserId ?? "",
      requestedTurnaround: quote.requestedTurnaround ?? "",
      quotedAmount: quote.quotedAmount?.toString() ?? "",
      adminNotes: quote.adminNotes ?? "",
      customerVisibleNotes: quote.issueDescription ?? "",
      conversionPath: initialConversionPath,
    }),
    [quote, initialConversionPath],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState(initial);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function cancel() {
    setValues(initial);
    setIsEditing(false);
  }

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={() => {
        setIsEditing(false);
      }}
    >
      <input type="hidden" name="quoteId" value={quote.id} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Safe review mode</p>
          <p className="mt-1 text-xs text-[#64707a]">
            {isDirty ? "Unsaved changes are local until you save." : "Fields are locked until Edit mode is enabled."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <button
              type="button"
              className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white"
              onClick={() => setIsEditing(true)}
            >
              Edit quote
            </button>
          ) : (
            <>
              <button
                type="button"
                className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium"
                onClick={cancel}
              >
                Cancel changes
              </button>
              <QuoteReviewSubmitButton disabled={!isDirty} />
            </>
          )}
        </div>
      </div>
      {isDirty ? (
        <div className="rounded-[0.8rem] border border-[#c46a29]/25 bg-[#fff4e6] px-3 py-2 text-xs font-medium text-[#9e4f18]">
          Unsaved changes
        </div>
      ) : (
        <div className="rounded-[0.8rem] border border-[#25624f]/15 bg-[#e9f5ef] px-3 py-2 text-xs font-medium text-[#25624f]">
          Saved ✓
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Status" name="status" value={values.status} disabled={!isEditing} onChange={update} options={quoteStatuses} />
        <SelectField label="Priority" name="priority" value={values.priority} disabled={!isEditing} onChange={update} options={priorities} />
        <SelectField label="Service type" name="serviceType" value={values.serviceType} disabled={!isEditing} onChange={update} options={serviceTypes} />
        <SelectField label="Conversion path" name="conversionPath" value={values.conversionPath} disabled={!isEditing} onChange={update} options={conversionPathOptions} />
      </div>
      <label className="block text-sm">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Assigned person</span>
        <select
          name="assignedUserId"
          value={values.assignedUserId}
          disabled={!isEditing}
          onChange={(event) => update("assignedUserId", event.target.value)}
          className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 disabled:opacity-70"
        >
          <option value="">Unassigned</option>
          {assignableUsers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} - {sentenceCase(member.role)}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Turnaround" name="requestedTurnaround" value={values.requestedTurnaround} disabled={!isEditing} onChange={update} />
        <InputField label="Quoted amount" name="quotedAmount" value={values.quotedAmount} disabled={!isEditing} onChange={update} prefix="$" />
      </div>
      <TextAreaField label="Customer visible notes" name="customerVisibleNotes" value={values.customerVisibleNotes} disabled={!isEditing} onChange={update} />
      <TextAreaField label="Internal admin notes" name="adminNotes" value={values.adminNotes} disabled={!isEditing} onChange={update} />
    </form>
  );
}

function QuoteReviewSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white disabled:bg-[#8b959c] disabled:text-white"
      disabled={disabled || pending}
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  name: ReviewFieldName;
  value: string;
  options: readonly string[];
  disabled: boolean;
  onChange: (name: ReviewFieldName, value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <select
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 disabled:opacity-70"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {sentenceCase(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  label,
  name,
  value,
  disabled,
  onChange,
  prefix,
}: {
  label: string;
  name: ReviewFieldName;
  value: string;
  disabled: boolean;
  onChange: (name: ReviewFieldName, value: string) => void;
  prefix?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <span className="relative block">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64707a]">
            {prefix}
          </span>
        ) : null}
        <input
          name={name}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(name, event.target.value)}
          className={`h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 disabled:opacity-70 ${prefix ? "pl-7" : ""}`}
        />
      </span>
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  disabled,
  onChange,
}: {
  label: string;
  name: ReviewFieldName;
  value: string;
  disabled: boolean;
  onChange: (name: ReviewFieldName, value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <textarea
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3 disabled:opacity-70"
      />
    </label>
  );
}
