import {
  AssetStatus,
  AssetType,
  CalibrationWorkOrderStatus,
  Priority,
  type Prisma,
} from "@prisma/client";
import { addDays, endOfMonth, startOfMonth } from "date-fns";

import { db } from "@/lib/db";

type SearchValue = string | string[] | undefined;

export const OPEN_CAL_WORK_ORDER_STATUSES: CalibrationWorkOrderStatus[] = [
  CalibrationWorkOrderStatus.RECEIVED,
  CalibrationWorkOrderStatus.IN_PROCESS,
  CalibrationWorkOrderStatus.CALIBRATION_COMPLETE,
  CalibrationWorkOrderStatus.TECHNICAL_REVIEW,
  CalibrationWorkOrderStatus.CERTIFICATE_READY,
  CalibrationWorkOrderStatus.INVOICE_PENDING,
];

function getSingleValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCalOpsListParams(searchParams: Record<string, SearchValue>) {
  return {
    query: getSingleValue(searchParams.query)?.trim() ?? "",
    customerId: getSingleValue(searchParams.customerId)?.trim() ?? "",
    assetType: getSingleValue(searchParams.assetType)?.trim() ?? "",
    status: getSingleValue(searchParams.status)?.trim() ?? "",
    priority: getSingleValue(searchParams.priority)?.trim() ?? "",
    technician: getSingleValue(searchParams.technician)?.trim() ?? "",
    view: getSingleValue(searchParams.view)?.trim() ?? "table",
    sort: getSingleValue(searchParams.sort)?.trim() ?? "recent",
  };
}

export async function getCalOpsDashboard() {
  const now = new Date();
  const dueSoon = addDays(now, 30);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [assets, workOrders, standards, certificates] = await Promise.all([
    db.calAsset.findMany({ include: { customer: true, procedure: true } }),
    db.calibrationWorkOrder.findMany({
      include: { customer: true, assignedUser: true, assets: { include: { asset: true } } },
    }),
    db.calibrationStandard.findMany({ include: { workOrderLinks: true, procedures: true } }),
    db.certificateDraft.findMany({ include: { customer: true, workOrder: true } }),
  ]);

  const openWorkOrders = workOrders.filter((workOrder) =>
    OPEN_CAL_WORK_ORDER_STATUSES.includes(workOrder.status),
  );
  const completedThisMonth = workOrders.filter(
    (workOrder) =>
      workOrder.completedAt &&
      workOrder.completedAt >= monthStart &&
      workOrder.completedAt <= monthEnd,
  );

  const assetsDueSoon = assets.filter(
    (asset) => asset.dueDate && asset.dueDate >= now && asset.dueDate <= dueSoon,
  );
  const standardsDueSoon = standards.filter(
    (standard) => standard.dueDate && standard.dueDate >= now && standard.dueDate <= dueSoon,
  );
  const overdueStandards = standards.filter((standard) => standard.dueDate && standard.dueDate < now);
  const ootAssets = assets.filter((asset) => asset.status === AssetStatus.OOT);
  const oots = workOrders.flatMap((workOrder) =>
    workOrder.assets.filter((link) => link.passFail?.toLowerCase().includes("fail")),
  ).length + ootAssets.length;

  const jobsByTechnician = Object.values(
    openWorkOrders.reduce<Record<string, { label: string; value: number }>>((accumulator, workOrder) => {
      const label = workOrder.assignedTechnician ?? "Unassigned";
      accumulator[label] = accumulator[label] ?? { label, value: 0 };
      accumulator[label].value += 1;
      return accumulator;
    }, {}),
  );

  const workloadHeatMap = Object.values(
    openWorkOrders.reduce<Record<string, { label: string; value: number }>>((accumulator, workOrder) => {
      const due = workOrder.dueDate;
      const label = !due
        ? "No date"
        : due < now
          ? "Overdue"
          : due <= addDays(now, 7)
            ? "0-7 days"
            : due <= dueSoon
              ? "8-30 days"
              : "30+ days";
      accumulator[label] = accumulator[label] ?? { label, value: 0 };
      accumulator[label].value += 1;
      return accumulator;
    }, {}),
  );

  return {
    metrics: [
      { label: "Assets due in 30 days", value: assetsDueSoon.length },
      { label: "Open work orders", value: openWorkOrders.length },
      { label: "Standards coming due", value: standardsDueSoon.length },
      { label: "Overdue standards", value: overdueStandards.length },
      { label: "Revenue completed", value: completedThisMonth.reduce((total, workOrder) => total + (workOrder.revenueAmount ?? 0), 0), kind: "currency" },
      { label: "OOT incidents", value: oots },
      { label: "Certificate drafts", value: certificates.length },
      { label: "Closed work orders", value: workOrders.filter((workOrder) => workOrder.status === CalibrationWorkOrderStatus.CLOSED).length },
    ],
    assetsDueSoon: assetsDueSoon.sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)).slice(0, 8),
    openWorkOrders: openWorkOrders.sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)).slice(0, 8),
    standardsDueSoon: [...standardsDueSoon, ...overdueStandards].sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)).slice(0, 8),
    jobsByTechnician,
    workloadHeatMap,
    workOrderStatusBreakdown: Object.values(
      workOrders.reduce<Record<string, { label: string; value: number }>>((accumulator, workOrder) => {
        accumulator[workOrder.status] = accumulator[workOrder.status] ?? {
          label: workOrder.status.replace(/_/g, " "),
          value: 0,
        };
        accumulator[workOrder.status].value += 1;
        return accumulator;
      }, {}),
    ),
  };
}

export async function getCalAssetsList(searchParams: Record<string, SearchValue>) {
  const filters = parseCalOpsListParams(searchParams);
  const where: Prisma.CalAssetWhereInput = {
    AND: [
      filters.query
        ? {
            OR: [
              { assetId: { contains: filters.query, mode: "insensitive" } },
              { description: { contains: filters.query, mode: "insensitive" } },
              { manufacturer: { contains: filters.query, mode: "insensitive" } },
              { model: { contains: filters.query, mode: "insensitive" } },
              { serialNumber: { contains: filters.query, mode: "insensitive" } },
              { customer: { company: { contains: filters.query, mode: "insensitive" } } },
            ],
          }
        : {},
      filters.customerId ? { customerId: filters.customerId } : {},
      filters.assetType ? { assetType: filters.assetType as AssetType } : {},
      filters.status ? { status: filters.status as AssetStatus } : {},
    ],
  };

  const [assets, customers] = await Promise.all([
    db.calAsset.findMany({
      where,
      orderBy: filters.sort === "dueDate" ? { dueDate: "asc" } : { updatedAt: "desc" },
      include: { customer: true, procedure: true, standards: true, childAssets: true },
    }),
    db.customer.findMany({ orderBy: { company: "asc" } }),
  ]);

  return { assets, customers, filters };
}

export async function getCalAssetDetail(id: string) {
  return db.calAsset.findUnique({
    where: { id },
    include: {
      lab: true,
      customer: true,
      procedure: true,
      parentAsset: true,
      childAssets: true,
      standards: true,
      recalls: {
        orderBy: { dueDate: "asc" },
      },
      historyEvents: {
        include: { actor: true, workOrder: true },
        orderBy: { createdAt: "desc" },
      },
      workOrderLinks: {
        include: {
          workOrder: {
            include: { customer: true, assignedUser: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      certificateDrafts: {
        include: { workOrder: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getCalibrationProceduresList() {
  return db.calibrationProcedure.findMany({
    orderBy: [{ isActive: "desc" }, { discipline: "asc" }, { procedureNumber: "asc" }],
    include: { standards: true, assets: true, workOrders: true },
  });
}

export async function getCalibrationProcedureDetail(id: string) {
  return db.calibrationProcedure.findUnique({
    where: { id },
    include: {
      standards: true,
      assets: { include: { customer: true } },
      workOrders: { include: { customer: true, assignedUser: true }, orderBy: { updatedAt: "desc" } },
    },
  });
}

export async function getCalibrationStandardsList() {
  return db.calibrationStandard.findMany({
    orderBy: { dueDate: "asc" },
    include: { procedures: true, workOrderLinks: { include: { workOrder: true } } },
  });
}

export async function getCalibrationStandardDetail(id: string) {
  return db.calibrationStandard.findUnique({
    where: { id },
    include: {
      procedures: true,
      assets: { include: { customer: true } },
      workOrderLinks: {
        include: { workOrder: { include: { customer: true, assignedUser: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getCalibrationWorkOrdersList(searchParams: Record<string, SearchValue>) {
  const filters = parseCalOpsListParams(searchParams);
  const where: Prisma.CalibrationWorkOrderWhereInput = {
    AND: [
      filters.query
        ? {
            OR: [
              { woNumber: { contains: filters.query, mode: "insensitive" } },
              { assignedTechnician: { contains: filters.query, mode: "insensitive" } },
              { customer: { company: { contains: filters.query, mode: "insensitive" } } },
              { assets: { some: { asset: { assetId: { contains: filters.query, mode: "insensitive" } } } } },
            ],
          }
        : {},
      filters.status ? { status: filters.status as CalibrationWorkOrderStatus } : {},
      filters.priority ? { priority: filters.priority as Priority } : {},
      filters.technician ? { assignedTechnician: { contains: filters.technician, mode: "insensitive" } } : {},
    ],
  };

  const workOrders = await db.calibrationWorkOrder.findMany({
    where,
    orderBy: filters.sort === "dueDate" ? { dueDate: "asc" } : { updatedAt: "desc" },
    include: {
      customer: true,
      assignedUser: true,
      procedure: true,
      assets: { include: { asset: true } },
      standards: { include: { standard: true } },
      certificateDraft: true,
    },
  });

  const byStatus = Object.fromEntries(
    Object.values(CalibrationWorkOrderStatus).map((status) => [
      status,
      workOrders.filter((workOrder) => workOrder.status === status),
    ]),
  );

  return { workOrders, byStatus, filters };
}

export async function getCalibrationWorkOrderDetail(id: string) {
  return db.calibrationWorkOrder.findUnique({
    where: { id },
    include: {
      lab: true,
      customer: true,
      assignedUser: true,
      procedure: true,
      assets: { include: { asset: { include: { procedure: true, standards: true } } } },
      standards: { include: { standard: true } },
      records: { include: { enteredBy: true }, orderBy: { createdAt: "asc" } },
      findings: { include: { author: true }, orderBy: { createdAt: "desc" } },
      activities: { include: { actor: true }, orderBy: { createdAt: "desc" } },
      certificateDraft: true,
      packageExports: { include: { exportedBy: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getCertificateDraftsList() {
  return db.certificateDraft.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      customer: true,
      lab: true,
      asset: true,
      workOrder: { include: { assignedUser: true, procedure: true } },
    },
  });
}

export async function getCertificateDraftDetail(id: string) {
  return db.certificateDraft.findUnique({
    where: { id },
    include: {
      customer: true,
      lab: true,
      asset: true,
      workOrder: {
        include: {
          procedure: true,
          assets: { include: { asset: true } },
          standards: { include: { standard: true } },
          records: { orderBy: { createdAt: "asc" } },
          findings: { orderBy: { createdAt: "desc" } },
          packageExports: { include: { exportedBy: true }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
}

export async function getTechnicianCalOpsDashboard(userId: string) {
  const workOrders = await db.calibrationWorkOrder.findMany({
    where: { assignedUserId: userId },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    include: {
      customer: true,
      lab: true,
      procedure: true,
      assets: { include: { asset: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  const now = new Date();

  return {
    workOrders,
    open: workOrders.filter((workOrder) => OPEN_CAL_WORK_ORDER_STATUSES.includes(workOrder.status)),
    reviewReady: workOrders.filter((workOrder) => workOrder.status === CalibrationWorkOrderStatus.TECHNICAL_REVIEW),
    overdue: workOrders.filter((workOrder) => workOrder.dueDate && workOrder.dueDate < now && workOrder.status !== CalibrationWorkOrderStatus.CLOSED),
  };
}

export async function getTechnicianCalibrationWorkOrderDetail(workOrderId: string, userId: string) {
  return db.calibrationWorkOrder.findFirst({
    where: { id: workOrderId, assignedUserId: userId },
    include: {
      customer: true,
      lab: true,
      procedure: true,
      assets: { include: { asset: { include: { standards: true } } } },
      standards: { include: { standard: true } },
      records: { include: { enteredBy: true }, orderBy: { createdAt: "asc" } },
      findings: { include: { author: true }, orderBy: { createdAt: "desc" } },
      activities: { include: { actor: true }, orderBy: { createdAt: "desc" } },
      certificateDraft: true,
      packageExports: { include: { exportedBy: true }, orderBy: { createdAt: "desc" } },
    },
  });
}
