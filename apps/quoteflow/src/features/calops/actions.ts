"use server";

import {
  ActivityType,
  AssetHistoryType,
  CalibrationDecision,
  CalibrationWorkOrderStatus,
  CertificateStatus,
  ExportPackageType,
  Priority,
  QuoteStatus,
  ServiceType,
  type CalServiceType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser, requireCalOpsAccess } from "@/features/admin/guards";
import { db } from "@/lib/db";

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nextReference(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

function evaluateTolerance(input: {
  asFoundValue: number | null;
  asLeftValue: number | null;
  toleranceLow: number | null;
  toleranceHigh: number | null;
}) {
  const candidate = input.asLeftValue ?? input.asFoundValue;

  if (candidate === null || input.toleranceLow === null || input.toleranceHigh === null) {
    return {
      result: "Not evaluated",
      decision: CalibrationDecision.NOT_EVALUATED,
      isOutOfTolerance: false,
    };
  }

  const asFoundFails =
    input.asFoundValue !== null &&
    (input.asFoundValue < input.toleranceLow || input.asFoundValue > input.toleranceHigh);
  const candidatePasses = candidate >= input.toleranceLow && candidate <= input.toleranceHigh;

  if (asFoundFails && candidatePasses && input.asLeftValue !== null) {
    return {
      result: "Adjusted pass",
      decision: CalibrationDecision.ADJUSTED_PASS,
      isOutOfTolerance: true,
    };
  }

  if (candidatePasses) {
    return {
      result: "Pass",
      decision: CalibrationDecision.PASS,
      isOutOfTolerance: false,
    };
  }

  return {
    result: "Fail",
    decision: CalibrationDecision.FAIL,
    isOutOfTolerance: true,
  };
}

async function getAssignee(userId: string | null) {
  if (!userId) {
    return { assignedUserId: null, assignedTechnician: null };
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    return { assignedUserId: null, assignedTechnician: null };
  }

  return { assignedUserId: user.id, assignedTechnician: user.name };
}

async function addWorkOrderActivity(input: {
  workOrderId: string;
  actorUserId?: string | null;
  title: string;
  description: string;
}) {
  await db.calActivityLog.create({
    data: {
      workOrderId: input.workOrderId,
      actorUserId: input.actorUserId ?? null,
      title: input.title,
      description: input.description,
    },
  });
}

function revalidateWorkOrderPaths(workOrderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/calops");
  revalidatePath("/admin/work-orders");
  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath("/admin/certificates");
  revalidatePath("/tech");
  revalidatePath(`/tech/work-orders/${workOrderId}`);
}

export async function updateCalibrationWorkOrderAction(formData: FormData) {
  const { session, user } = await requireCalOpsAccess();
  const workOrderId = String(formData.get("workOrderId"));
  const status = String(formData.get("status")) as CalibrationWorkOrderStatus;
  const priority = String(formData.get("priority")) as Priority;
  const serviceType = String(formData.get("serviceType")) as CalServiceType;
  const assignedUserId = optionalString(formData.get("assignedUserId"));
  const dueDate = optionalDate(formData.get("dueDate"));
  const intakeNotes = optionalString(formData.get("intakeNotes"));
  const calibrationData = optionalString(formData.get("calibrationData"));
  const uncertaintyNotes = optionalString(formData.get("uncertaintyNotes"));
  const certificateNotes = optionalString(formData.get("certificateNotes"));
  const revenueAmount = optionalNumber(formData.get("revenueAmount"));
  const assignee = await getAssignee(assignedUserId);

  const existing = await db.calibrationWorkOrder.findUnique({
    where: { id: workOrderId },
  });

  if (!existing) return;

  await db.calibrationWorkOrder.update({
    where: { id: existing.id },
    data: {
      status,
      priority,
      serviceType,
      assignedUserId: assignee.assignedUserId,
      assignedTechnician: assignee.assignedTechnician,
      dueDate,
      intakeNotes,
      calibrationData,
      uncertaintyNotes,
      certificateNotes,
      revenueAmount,
      completedAt:
        status === CalibrationWorkOrderStatus.CALIBRATION_COMPLETE ||
        status === CalibrationWorkOrderStatus.TECHNICAL_REVIEW ||
        status === CalibrationWorkOrderStatus.CERTIFICATE_READY ||
        status === CalibrationWorkOrderStatus.CLOSED
          ? existing.completedAt ?? new Date()
          : null,
    },
  });

  if (existing.status !== status) {
    await addWorkOrderActivity({
      workOrderId: existing.id,
      actorUserId: user.id,
      title: "Status changed",
      description: `${existing.woNumber} moved from ${existing.status} to ${status}.`,
    });

    await db.activityLog.create({
      data: {
        type: ActivityType.CAL_WORK_ORDER_STATUS_CHANGED,
        entityType: "CalibrationWorkOrder",
        entityId: existing.id,
        title: "Calibration work order status changed",
        description: `${existing.woNumber} moved from ${existing.status} to ${status}.`,
        actor: session.user.email ?? user.email,
        customerId: existing.customerId,
      },
    });
  }

  revalidateWorkOrderPaths(existing.id);
}

export async function updateTechnicianCalibrationWorkOrderAction(formData: FormData) {
  const { session, user } = await requireAuthenticatedUser();
  const workOrderId = String(formData.get("workOrderId"));
  const status = String(formData.get("status")) as CalibrationWorkOrderStatus;
  const calibrationData = optionalString(formData.get("calibrationData"));
  const uncertaintyNotes = optionalString(formData.get("uncertaintyNotes"));
  const certificateNotes = optionalString(formData.get("certificateNotes"));

  const existing = await db.calibrationWorkOrder.findUnique({
    where: { id: workOrderId },
  });

  if (!existing || existing.assignedUserId !== user.id) return;

  await db.calibrationWorkOrder.update({
    where: { id: existing.id },
    data: {
      status,
      calibrationData,
      uncertaintyNotes,
      certificateNotes,
      completedAt:
        status === CalibrationWorkOrderStatus.CALIBRATION_COMPLETE ||
        status === CalibrationWorkOrderStatus.TECHNICAL_REVIEW ||
        status === CalibrationWorkOrderStatus.CERTIFICATE_READY ||
        status === CalibrationWorkOrderStatus.CLOSED
          ? existing.completedAt ?? new Date()
          : null,
    },
  });

  if (existing.status !== status) {
    await addWorkOrderActivity({
      workOrderId: existing.id,
      actorUserId: user.id,
      title: status === CalibrationWorkOrderStatus.TECHNICAL_REVIEW ? "Submitted for review" : "Status changed",
      description: `${existing.woNumber} moved from ${existing.status} to ${status}.`,
    });

    await db.activityLog.create({
      data: {
        type: ActivityType.CAL_WORK_ORDER_STATUS_CHANGED,
        entityType: "CalibrationWorkOrder",
        entityId: existing.id,
        title: "Calibration work order status changed",
        description: `${existing.woNumber} moved from ${existing.status} to ${status}.`,
        actor: session.user.email ?? user.email,
        customerId: existing.customerId,
      },
    });
  }

  revalidateWorkOrderPaths(existing.id);
}

export async function addCalibrationRecordAction(formData: FormData) {
  const { user } = await requireAuthenticatedUser();
  const workOrderId = String(formData.get("workOrderId"));
  const label = optionalString(formData.get("label"));

  if (!workOrderId || !label) return;

  const workOrder = await db.calibrationWorkOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) return;

  const isManager = user.role === "ADMIN" || user.role === "MANAGER";
  if (!isManager && workOrder.assignedUserId !== user.id) return;

  const nominalValue = optionalNumber(formData.get("nominalValue"));
  const asFoundValue = optionalNumber(formData.get("asFoundValue"));
  const asLeftValue = optionalNumber(formData.get("asLeftValue"));
  const toleranceLow = optionalNumber(formData.get("toleranceLow"));
  const toleranceHigh = optionalNumber(formData.get("toleranceHigh"));
  const evaluated = evaluateTolerance({
    asFoundValue,
    asLeftValue,
    toleranceLow,
    toleranceHigh,
  });

  await db.calibrationRecordEntry.create({
    data: {
      workOrderId,
      enteredByUserId: user.id,
      label,
      nominalValue,
      asFoundValue,
      asFound: optionalString(formData.get("asFound")),
      asLeftValue,
      asLeft: optionalString(formData.get("asLeft")),
      toleranceLow,
      toleranceHigh,
      tolerance: optionalString(formData.get("tolerance")),
      units: optionalString(formData.get("units")),
      result: optionalString(formData.get("result")) ?? evaluated.result,
      decision: evaluated.decision,
      isOutOfTolerance: evaluated.isOutOfTolerance,
      notes: optionalString(formData.get("notes")),
    },
  });

  if (evaluated.isOutOfTolerance) {
    const linkedAssets = await db.calibrationWorkOrderAsset.findMany({
      where: { workOrderId },
      select: { assetId: true },
    });

    await db.assetHistoryEvent.createMany({
      data: linkedAssets.map((link) => ({
        assetId: link.assetId,
        workOrderId,
        actorUserId: user.id,
        type: AssetHistoryType.OOT_FOUND,
        title: "Out-of-tolerance data entered",
        description: `${label} evaluated as ${evaluated.result}.`,
      })),
    });
  }

  await addWorkOrderActivity({
    workOrderId,
    actorUserId: user.id,
    title: "Calibration data added",
    description: `Data point "${label}" was added.`,
  });

  revalidateWorkOrderPaths(workOrderId);
}

export async function addCalibrationFindingAction(formData: FormData) {
  const { user } = await requireAuthenticatedUser();
  const workOrderId = String(formData.get("workOrderId"));
  const findingType = optionalString(formData.get("findingType"));
  const description = optionalString(formData.get("description"));

  if (!workOrderId || !findingType || !description) return;

  const workOrder = await db.calibrationWorkOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) return;

  const isManager = user.role === "ADMIN" || user.role === "MANAGER";
  if (!isManager && workOrder.assignedUserId !== user.id) return;

  await db.calibrationFinding.create({
    data: {
      workOrderId,
      authorUserId: user.id,
      findingType,
      severity: optionalString(formData.get("severity")),
      description,
      correctiveAction: optionalString(formData.get("correctiveAction")),
    },
  });

  await addWorkOrderActivity({
    workOrderId,
    actorUserId: user.id,
    title: "Finding added",
    description: `${findingType} finding added to the work order.`,
  });

  revalidateWorkOrderPaths(workOrderId);
}

export async function addCalibrationActivityNoteAction(formData: FormData) {
  const { session, user } = await requireAuthenticatedUser();
  const workOrderId = String(formData.get("workOrderId"));
  const body = optionalString(formData.get("body"));

  if (!workOrderId || !body) return;

  const workOrder = await db.calibrationWorkOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) return;

  const isManager = user.role === "ADMIN" || user.role === "MANAGER";
  if (!isManager && workOrder.assignedUserId !== user.id) return;

  await addWorkOrderActivity({
    workOrderId,
    actorUserId: user.id,
    title: "Work note added",
    description: body,
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.CAL_WORK_ORDER_NOTE_ADDED,
      entityType: "CalibrationWorkOrder",
      entityId: workOrder.id,
      title: "Calibration work note added",
      description: `A work note was added to ${workOrder.woNumber}.`,
      actor: session.user.email ?? user.email,
      customerId: workOrder.customerId,
    },
  });

  revalidateWorkOrderPaths(workOrderId);
}

export async function createWorkOrderPackageExportAction(formData: FormData) {
  const { user } = await requireCalOpsAccess();
  const workOrderId = String(formData.get("workOrderId"));
  const packageType = String(formData.get("packageType")) as ExportPackageType;
  const title = optionalString(formData.get("title")) ?? "Calibration package export";
  const notes = optionalString(formData.get("notes"));

  const workOrder = await db.calibrationWorkOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder || !Object.values(ExportPackageType).includes(packageType)) return;

  await db.workOrderPackageExport.create({
    data: {
      workOrderId,
      exportedByUserId: user.id,
      packageType,
      title,
      notes,
    },
  });

  await addWorkOrderActivity({
    workOrderId,
    actorUserId: user.id,
    title: "Export package logged",
    description: `${title} was prepared as ${packageType}.`,
  });

  revalidateWorkOrderPaths(workOrderId);
  revalidatePath(`/admin/work-orders/${workOrderId}/package`);
}

export async function convertQuoteToCalibrationWorkOrderAction(formData: FormData) {
  const { session, user } = await requireCalOpsAccess();
  const quoteId = String(formData.get("quoteId"));
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true },
  });

  if (!quote || quote.serviceType !== ServiceType.CALIBRATION) return;

  const existing = await db.calibrationWorkOrder.findFirst({
    where: {
      customerId: quote.customerId,
      intakeNotes: { contains: quote.quoteNumber },
    },
  });

  if (existing) {
    redirect(`/admin/work-orders/${existing.id}`);
  }

  const procedure = await db.calibrationProcedure.findFirst({
    where: { workspaceId: quote.workspaceId ?? undefined, isActive: true },
    orderBy: { procedureNumber: "asc" },
  });

  const workOrder = await db.calibrationWorkOrder.create({
    data: {
      woNumber: nextReference("CAL-WO"),
      workspaceId: quote.workspaceId,
      customerId: quote.customerId,
      serviceType: "CALIBRATION",
      assignedUserId: quote.assignedUserId,
      assignedTechnician: quote.assignedTo,
      dueDate: quote.targetDueDate,
      priority: quote.priority,
      procedureId: procedure?.id,
      intakeNotes: `Created from ${quote.quoteNumber}. ${quote.issueDescription ?? quote.aiSummary}`,
      calibrationData: "Calibration data pending.",
      uncertaintyNotes: quote.documentationRequirements ?? "Uncertainty placeholder.",
      certificateNotes: "Certificate draft pending calibration completion.",
      revenueAmount: quote.quotedAmount,
    },
  });

  if (quote.equipmentType) {
    const asset = await db.calAsset.create({
      data: {
        assetId: `A-${Date.now().toString().slice(-6)}`,
        workspaceId: quote.workspaceId,
        customerId: quote.customerId,
        description: quote.equipmentType,
        manufacturer: quote.manufacturer,
        model: quote.modelNumber,
        serialNumber: quote.serialNumber,
        assetType: "OTHER",
        capacityRange: quote.rangeOrCapacity,
        accuracyTolerance: quote.documentationRequirements,
        procedureId: procedure?.id,
        notes: `Created from ${quote.quoteNumber}.`,
      },
    });

    await db.calibrationWorkOrderAsset.create({
      data: {
        workOrderId: workOrder.id,
        assetId: asset.id,
        passFail: "Pending",
      },
    });
  }

  await db.quoteRequest.update({
    where: { id: quote.id },
    data: { status: QuoteStatus.CONVERTED_TO_WORK_ORDER_DRAFT },
  });

  await addWorkOrderActivity({
    workOrderId: workOrder.id,
    actorUserId: user.id,
    title: "Created from QuoteFlow",
    description: `${workOrder.woNumber} was created from ${quote.quoteNumber}.`,
  });

  await db.activityLog.create({
    data: {
      type: "CAL_WORK_ORDER_CREATED",
      entityType: "CalibrationWorkOrder",
      entityId: workOrder.id,
      title: "Calibration work order created",
      description: `${workOrder.woNumber} was created from ${quote.quoteNumber}.`,
      actor: session.user.email ?? user.email,
      customerId: quote.customerId,
      quoteId: quote.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin/work-orders");
  redirect(`/admin/work-orders/${workOrder.id}`);
}

export async function generateCertificateDraftAction(formData: FormData) {
  const { session, user } = await requireCalOpsAccess();
  const workOrderId = String(formData.get("workOrderId"));
  const workOrder = await db.calibrationWorkOrder.findUnique({
    where: { id: workOrderId },
    include: {
      customer: true,
      assets: { include: { asset: true } },
      records: true,
      standards: { include: { standard: true } },
      certificateDraft: true,
    },
  });

  if (!workOrder) return;

  if (workOrder.certificateDraft) {
    redirect(`/admin/certificates/${workOrder.certificateDraft.id}`);
  }

  const firstAsset = workOrder.assets[0]?.asset;
  const hasFailure =
    workOrder.records.some((record) => record.result?.toLowerCase().includes("fail")) ||
    workOrder.assets.some((link) => link.passFail?.toLowerCase().includes("fail"));
  const certificate = await db.certificateDraft.create({
    data: {
      certificateNumber: nextReference("CERT-DRAFT"),
      workOrderId: workOrder.id,
      customerId: workOrder.customerId,
      labId: workOrder.labId,
      assetId: firstAsset?.id ?? null,
      status: CertificateStatus.DRAFT,
      accreditationStatement: "ISO/IEC 17025 accreditation placeholder.",
      environmentalConditions: "Environmental conditions placeholder.",
      calibrationMethod: "Procedure and method placeholder.",
      asFoundSummary: workOrder.records.map((record) => `${record.label}: ${record.asFound ?? "pending"}`).join("; ") || "As-found data placeholder.",
      asLeftSummary: workOrder.records.map((record) => `${record.label}: ${record.asLeft ?? "pending"}`).join("; ") || "As-left data placeholder.",
      passFail: hasFailure ? "Review required" : "Pass",
      statementOfConformity: hasFailure ? "Statement of conformity requires technical review." : "Statement of conformity placeholder: asset meets listed tolerance limits.",
      decisionRule: "Simple acceptance rule: measured result must fall within stated tolerance limits.",
      notes: workOrder.certificateNotes ?? "Draft certificate generated from completed work order.",
      uncertaintyStatement: workOrder.uncertaintyNotes ?? "Measurement uncertainty statement placeholder.",
      traceabilityStatement: `Standards used: ${
        workOrder.standards.map((link) => link.standard.standardId).join(", ") || "traceability placeholder"
      }.`,
      issueDate: new Date(),
      revision: "Draft A",
    },
  });

  await addWorkOrderActivity({
    workOrderId: workOrder.id,
    actorUserId: user.id,
    title: "Certificate draft generated",
    description: `${certificate.certificateNumber} was generated from ${workOrder.woNumber}.`,
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.CERTIFICATE_DRAFT_CREATED,
      entityType: "CertificateDraft",
      entityId: certificate.id,
      title: "Certificate draft created",
      description: `${certificate.certificateNumber} created for ${workOrder.woNumber}.`,
      actor: session.user.email ?? user.email,
      customerId: workOrder.customerId,
    },
  });

  revalidateWorkOrderPaths(workOrder.id);
  revalidatePath(`/admin/certificates/${certificate.id}`);
  redirect(`/admin/certificates/${certificate.id}`);
}

