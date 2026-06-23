import { addMonths, addYears, format, isValid, parseISO } from "date-fns";
import type { Stage2Document } from "@/types/stage2Documents";

const EOI_VALIDITY_YEARS = 2;
const ROI_VALIDITY_MONTHS = 6;

export type InterestDocumentType = "eoi" | "roi";

export function computeInterestExpiryDate(
  interestDate: Date | null | undefined,
  type: InterestDocumentType,
): Date | null {
  if (!interestDate || !isValid(interestDate)) return null;
  if (type === "roi") {
    return addMonths(interestDate, ROI_VALIDITY_MONTHS);
  }
  return addYears(interestDate, EOI_VALIDITY_YEARS);
}

export function getInterestExpiryPeriodLabel(type: InterestDocumentType): string {
  if (type === "roi") return `${ROI_VALIDITY_MONTHS} months`;
  return `${EOI_VALIDITY_YEARS} years`;
}

export function getInterestDateLabel(type: InterestDocumentType): string {
  return type === "roi" ? "ROI date" : "EOI date";
}

export function computeEoiExpiryDate(
  eoiDate: Date | null | undefined,
): Date | null {
  return computeInterestExpiryDate(eoiDate, "eoi");
}

export function getEoiExpiryPeriodLabel(): string {
  return getInterestExpiryPeriodLabel("eoi");
}

export function formatEoiExpiryForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatEoiExpiryForPatch(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function resolveInterestType(
  doc: Pick<Stage2Document, "type" | "expiry_at" | "date">,
): InterestDocumentType {
  return doc.type === "roi" ? "roi" : "eoi";
}

export function getResolvedInterestExpiryDate(
  doc: Pick<Stage2Document, "type" | "expiry_at" | "date">,
): Date | null {
  const stored = doc.expiry_at?.trim();
  if (stored) {
    const parsed = parseISO(stored);
    if (isValid(parsed)) return parsed;
  }
  const interestDateStr = doc.date?.trim();
  if (!interestDateStr) return null;
  const base = parseISO(
    interestDateStr.length === 10 ? `${interestDateStr}T12:00:00` : interestDateStr,
  );
  if (!isValid(base)) return null;
  return computeInterestExpiryDate(base, resolveInterestType(doc));
}

export function getResolvedEoiExpiryDate(
  doc: Pick<Stage2Document, "type" | "expiry_at" | "date">,
): Date | null {
  return getResolvedInterestExpiryDate(doc);
}
