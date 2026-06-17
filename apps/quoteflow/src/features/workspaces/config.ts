import { BusinessType } from "@prisma/client";

export const MODULES = ["QuoteFlow", "WorkFlow", "SiteBuilder", "CalOps", "LeadEngine"] as const;
export type ModuleKey = (typeof MODULES)[number];

export const CALOPS_MODULES: ModuleKey[] = ["CalOps"];

export function parseModules(value: unknown): ModuleKey[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ModuleKey => MODULES.includes(item as ModuleKey));
}

export function hasModule(value: unknown, module: ModuleKey) {
  return parseModules(value).includes(module);
}

export function businessTypeLabel(type: BusinessType) {
  const labels: Record<BusinessType, string> = {
    GENERAL_SERVICE: "General Service Business",
    AUTO_REPAIR: "Auto Repair Shop",
    CONTRACTOR_FIELD_SERVICE: "Contractor / Field Service",
    CALIBRATION_LAB: "Calibration Lab",
    CUSTOM: "Custom",
  };

  return labels[type];
}

export function isCalibrationWorkspace(type: BusinessType, modules: unknown) {
  return type === BusinessType.CALIBRATION_LAB || hasModule(modules, "CalOps");
}
