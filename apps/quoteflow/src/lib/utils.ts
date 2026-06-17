import { clsx, type ClassValue } from "clsx";
import { format, isPast, isToday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(0, 10);

  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatPercent(value?: number | null) {
  return `${formatNumber(value)}%`;
}

export function formatDate(value?: Date | string | null, dateFormat = "MMM d, yyyy") {
  if (!value) return "Not set";
  return format(new Date(value), dateFormat);
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "Not set";
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function sentenceCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function compactDateLabel(value?: Date | string | null) {
  if (!value) return "No due date";
  const date = new Date(value);

  if (isToday(date)) {
    return "Today";
  }

  return format(date, "MMM d");
}

export function getDueDateTone(value?: Date | string | null) {
  if (!value) return "neutral";

  const date = new Date(value);
  if (isPast(date) && !isToday(date)) {
    return "danger";
  }

  if (isToday(date)) {
    return "warning";
  }

  return "neutral";
}

export function calculateTicketFinancials(input: {
  actualHours?: number | null;
  laborRate?: number | null;
  materialsCost?: number | null;
  shippingCost?: number | null;
  billedAmount?: number | null;
}) {
  const laborCost = (input.actualHours ?? 0) * (input.laborRate ?? 0);
  const materialsCost = input.materialsCost ?? 0;
  const shippingCost = input.shippingCost ?? 0;
  const billedAmount = input.billedAmount ?? 0;
  const totalCost = laborCost + materialsCost + shippingCost;
  const profitLoss = billedAmount - totalCost;
  const marginPercent = billedAmount > 0 ? (profitLoss / billedAmount) * 100 : 0;

  return {
    laborCost,
    totalCost,
    profitLoss,
    marginPercent,
  };
}
