"use client";

import { useState } from "react";

type ProjectFormValues = {
  id?: string;
  name: string;
  clientName: string;
  businessName: string;
  industry: string;
  serviceArea: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  services: string;
  logoText: string;
  brandPrimary: string;
  brandAccent: string;
  brandNeutral: string;
  linkedinUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  testimonials: string;
  faqs: string;
  photos: string;
  status: "DRAFT" | "READY" | "PUBLISHED";
  templateKey: string;
};

function parseDelimitedLines(value: string, keys: string[]): Array<Record<string, string>> {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return keys.reduce<Record<string, string>>((accumulator, key, index) => {
        accumulator[key] = parts[index] ?? "";
        return accumulator;
      }, {});
    })
    .filter((item) => Object.values(item).every(Boolean));
}

export function ProjectForm({
  initialValues,
}: {
  initialValues?: Partial<ProjectFormValues>;
}) {
  const [values, setValues] = useState<ProjectFormValues>({
    id: initialValues?.id,
    name: initialValues?.name ?? "",
    clientName: initialValues?.clientName ?? "",
    businessName: initialValues?.businessName ?? "",
    industry: initialValues?.industry ?? "",
    serviceArea: initialValues?.serviceArea ?? "",
    contactEmail: initialValues?.contactEmail ?? "",
    contactPhone: initialValues?.contactPhone ?? "",
    address: initialValues?.address ?? "",
    services: initialValues?.services ?? "",
    logoText: initialValues?.logoText ?? "",
    brandPrimary: initialValues?.brandPrimary ?? "#10212c",
    brandAccent: initialValues?.brandAccent ?? "#c46a29",
    brandNeutral: initialValues?.brandNeutral ?? "#f5efe4",
    linkedinUrl: initialValues?.linkedinUrl ?? "",
    facebookUrl: initialValues?.facebookUrl ?? "",
    instagramUrl: initialValues?.instagramUrl ?? "",
    testimonials: initialValues?.testimonials ?? "",
    faqs: initialValues?.faqs ?? "",
    photos: initialValues?.photos ?? "",
    status: initialValues?.status ?? "DRAFT",
    templateKey: initialValues?.templateKey ?? "local-service-classic",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function updateValue<Key extends keyof ProjectFormValues>(key: Key, value: ProjectFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        ...values,
        services: values.services
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        testimonials: parseDelimitedLines(values.testimonials, ["quote", "author", "company"]),
        faqs: parseDelimitedLines(values.faqs, ["question", "answer"]),
        photos: values.photos
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/projects", {
        method: values.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        project?: { id: string; slug: string };
        message?: string;
      };

      if (!response.ok || !data.project) {
        throw new Error(data.message ?? "Unable to save project.");
      }

      setSuccessMessage(
        values.id
          ? "Project updated successfully."
          : `Project created successfully. Preview at /sites/${data.project.slug}`,
      );

      if (!values.id) {
        updateValue("id", data.project.id);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save project.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Project name">
          <input value={values.name} onChange={(event) => updateValue("name", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Client name">
          <input value={values.clientName} onChange={(event) => updateValue("clientName", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Business name">
          <input value={values.businessName} onChange={(event) => updateValue("businessName", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Industry">
          <input value={values.industry} onChange={(event) => updateValue("industry", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Service area">
          <input value={values.serviceArea} onChange={(event) => updateValue("serviceArea", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Contact email">
          <input value={values.contactEmail} onChange={(event) => updateValue("contactEmail", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Contact phone">
          <input value={values.contactPhone} onChange={(event) => updateValue("contactPhone", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Address">
          <input value={values.address} onChange={(event) => updateValue("address", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Logo text">
          <input value={values.logoText} onChange={(event) => updateValue("logoText", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Status">
          <select value={values.status} onChange={(event) => updateValue("status", event.target.value as ProjectFormValues["status"])} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Primary brand color">
          <input value={values.brandPrimary} onChange={(event) => updateValue("brandPrimary", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Accent color">
          <input value={values.brandAccent} onChange={(event) => updateValue("brandAccent", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Neutral color">
          <input value={values.brandNeutral} onChange={(event) => updateValue("brandNeutral", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
      </div>

      <Field label="Services (one per line)">
        <textarea value={values.services} onChange={(event) => updateValue("services", event.target.value)} className="min-h-28 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="LinkedIn URL">
          <input value={values.linkedinUrl} onChange={(event) => updateValue("linkedinUrl", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Facebook URL">
          <input value={values.facebookUrl} onChange={(event) => updateValue("facebookUrl", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
        <Field label="Instagram URL">
          <input value={values.instagramUrl} onChange={(event) => updateValue("instagramUrl", event.target.value)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
        </Field>
      </div>

      <Field label="Testimonials (quote | author | company per line)">
        <textarea value={values.testimonials} onChange={(event) => updateValue("testimonials", event.target.value)} className="min-h-28 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
      </Field>

      <Field label="FAQs (question | answer per line)">
        <textarea value={values.faqs} onChange={(event) => updateValue("faqs", event.target.value)} className="min-h-28 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
      </Field>

      <Field label="Photo URLs (one per line)">
        <textarea value={values.photos} onChange={(event) => updateValue("photos", event.target.value)} className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
      </Field>

      <button type="submit" className="rounded-full bg-[#c46a29] px-4 py-2 text-sm font-medium text-white" disabled={isSaving}>
        {isSaving ? "Saving..." : values.id ? "Update project" : "Create project"}
      </button>

      {error ? <p className="text-sm text-[#b4514b]">{error}</p> : null}
      {successMessage ? <p className="text-sm text-[#25624f]">{successMessage}</p> : null}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      {children}
    </label>
  );
}
