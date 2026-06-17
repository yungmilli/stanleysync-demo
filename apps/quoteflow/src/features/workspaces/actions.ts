"use server";

import fs from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { requireAuthenticatedUser } from "@/features/admin/guards";
import { DASHBOARD_WIDGET_CATALOG } from "@/features/workspaces/queries";
import { db } from "@/lib/db";

const WORKSPACE_SETUP_ROLES: UserRole[] = [UserRole.SYSTEM_OWNER, UserRole.ADMIN, UserRole.MANAGER];

export async function switchWorkspaceAction(formData: FormData) {
  const { user } = await requireAuthenticatedUser();
  if (user.role !== UserRole.SYSTEM_OWNER) return;
  const workspaceId = String(formData.get("workspaceId") ?? "");

  const workspace = await db.businessWorkspace.findUnique({ where: { id: workspaceId } });
  if (!workspace || !workspace.isActive) return;

  await db.user.update({
    where: { id: user.id },
    data: { activeWorkspaceId: workspace.id },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workspace");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/calops");
  revalidatePath("/admin/apps");
  revalidatePath("/admin/settings");

  redirect("/admin");
}

export async function saveDashboardWidgetsAction(formData: FormData) {
  const { user } = await requireAuthenticatedUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");

  const workspace = await db.businessWorkspace.findUnique({ where: { id: workspaceId } });
  if (!workspace || !workspace.isActive) return;

  await Promise.all(
    DASHBOARD_WIDGET_CATALOG.map((widget, index) => {
      const orderValue = Number(formData.get(`${widget.key}:order`) ?? index);
      return db.dashboardWidgetPreference.upsert({
        where: { workspaceId_widgetKey: { workspaceId, widgetKey: widget.key } },
        update: {
          title: widget.title,
          isVisible: formData.get(`${widget.key}:visible`) === "on",
          sortOrder: Number.isFinite(orderValue) ? orderValue : index,
        },
        create: {
          workspaceId,
          widgetKey: widget.key,
          title: widget.title,
          isVisible: formData.get(`${widget.key}:visible`) === "on",
          sortOrder: Number.isFinite(orderValue) ? orderValue : index,
        },
      });
    }),
  );

  await db.auditEvent.create({
    data: {
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      action: "dashboard.widgets.updated",
      entityType: "BusinessWorkspace",
      entityId: workspaceId,
      summary: "Dashboard widget layout updated.",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}

export async function saveWorkspaceBrandingAction(formData: FormData) {
  const { user } = await requireAuthenticatedUser();
  if (!WORKSPACE_SETUP_ROLES.includes(user.role)) return;
  const workspaceId = String(formData.get("workspaceId") ?? "");

  const workspace = await db.businessWorkspace.findUnique({ where: { id: workspaceId } });
  if (!workspace || !workspace.isActive) return;

  const businessName = String(formData.get("businessName") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const logoPlaceholder = String(formData.get("logoPlaceholder") ?? "").trim();
  const invoiceTerms = String(formData.get("invoiceTerms") ?? "").trim();
  const quoteTerms = String(formData.get("quoteTerms") ?? "").trim();
  const primary = String(formData.get("primary") ?? "#12212c").trim();
  const accent = String(formData.get("accent") ?? "#c46a29").trim();
  const uploadedLogoUrl = await saveWorkspaceLogoUpload(workspaceId, formData.get("logoFile"));

  await db.businessWorkspace.update({
    where: { id: workspaceId },
    data: {
      businessName: businessName || undefined,
      industry: industry || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      logoPlaceholder: logoPlaceholder || null,
      logoUrl: uploadedLogoUrl ?? workspace.logoUrl,
      invoiceTerms: invoiceTerms || null,
      quoteTerms: quoteTerms || null,
      setupCompletedAt: new Date(),
      themeAccent: accent,
      brandColors: { primary, accent },
    },
  });

  await db.auditEvent.create({
    data: {
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      action: "workspace.branding.updated",
      entityType: "BusinessWorkspace",
      entityId: workspaceId,
      summary: "Workspace branding settings updated.",
      payload: { businessName, industry, email, phone, website, address, logoPlaceholder, invoiceTerms, quoteTerms, primary, accent },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/workspace");
  revalidatePath("/admin/first-run");
}

export async function saveFirstRunSetupAction(formData: FormData) {
  await saveWorkspaceBrandingAction(formData);
  redirect("/admin");
}

async function saveWorkspaceLogoUpload(workspaceId: string, value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;

  const allowedTypes = new Map([["image/jpeg", "jpg"]]);
  const extension = allowedTypes.get(value.type);
  if (!extension) return null;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "workspaces");
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${workspaceId}-logo.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  const bytes = await value.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));

  return `/uploads/workspaces/${filename}`;
}
