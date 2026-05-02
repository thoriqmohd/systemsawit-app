import type { CollectionRecord, Grade, PaymentStatus } from "@/lib/mock-data";

export const gradeRates: Record<Grade, number> = {
  Pending: 710,
  A: 760,
  B: 710,
  C: 650,
  Reject: 0
};

export const statusSteps = ["Draft", "Collected", "Delivered", "Graded", "Approved", "Paid"] as const;

export function getNetWeight(record: Pick<CollectionRecord, "grossWeight" | "tareWeight" | "actualWeight">) {
  if (record.grossWeight && record.tareWeight) return Math.max(record.grossWeight - record.tareWeight, 0);
  return record.actualWeight;
}

export function getDeductionKg(record: Pick<CollectionRecord, "deductionPercent" | "moisturePercent" | "dirtPercent" | "grossWeight" | "tareWeight" | "actualWeight">) {
  const deduction = record.deductionPercent + record.moisturePercent + record.dirtPercent;
  return getNetWeight(record) * (deduction / 100);
}

export function getPayableWeight(record: Pick<CollectionRecord, "deductionPercent" | "moisturePercent" | "dirtPercent" | "grossWeight" | "tareWeight" | "actualWeight">) {
  return Math.max(getNetWeight(record) - getDeductionKg(record), 0);
}

export function getPaymentAmount(record: CollectionRecord) {
  return (getPayableWeight(record) / 1000) * record.rate;
}

export function getPaymentStatus(record: CollectionRecord): PaymentStatus {
  if (record.status === "Paid") return "Paid";
  if (record.status === "Approved") return "Processing";
  return "Pending";
}

export function nextCollectionStatus(record: CollectionRecord): CollectionRecord {
  const index = statusSteps.indexOf(record.status);
  const next = statusSteps[Math.min(index + 1, statusSteps.length - 1)];
  const grade = next === "Graded" && record.grade === "Pending" ? "B" : record.grade;
  const rate = grade !== "Pending" ? gradeRates[grade] : record.rate;
  return { ...record, status: next, grade, rate };
}

export const currency = new Intl.NumberFormat("ms-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0
});

export const number = new Intl.NumberFormat("ms-MY");

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("ms-MY", { day: "2-digit", month: "short" }).format(new Date(value));
}
