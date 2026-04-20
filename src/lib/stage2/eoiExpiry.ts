import { addYears, format, isValid, parseISO } from "date-fns";
import type { Stage2Document } from "@/types/stage2Documents";

/** SkillSelect EOI validity from the EOI date (common rule of thumb). */
const EOI_VALIDITY_YEARS = 2;

export function computeEoiExpiryDate(
  eoiDate: Date | null | undefined,
): Date | null {
  if (!eoiDate || !isValid(eoiDate)) return null;
  return addYears(eoiDate, EOI_VALIDITY_YEARS);
}

export function getEoiExpiryPeriodLabel(): string {
  return `${EOI_VALIDITY_YEARS} years`;
}

/** POST multipart / FormData */
export function formatEoiExpiryForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** JSON PATCH (ISO), aligned with invitation expiry patch */
export function formatEoiExpiryForPatch(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Expiry for display: prefer stored `expiry_at`; if missing, use EOI `date` + validity window
 * (same as {@link computeEoiExpiryDate}) so legacy documents without `expiry_at` still show expiry.
 */
export function getResolvedEoiExpiryDate(
  doc: Pick<Stage2Document, "expiry_at" | "date">,
): Date | null {
  const stored = doc.expiry_at?.trim();
  if (stored) {
    const parsed = parseISO(stored);
    if (isValid(parsed)) return parsed;
  }
  const eoiDateStr = doc.date?.trim();
  if (!eoiDateStr) return null;
  const base = parseISO(
    eoiDateStr.length === 10 ? `${eoiDateStr}T12:00:00` : eoiDateStr,
  );
  if (!isValid(base)) return null;
  return computeEoiExpiryDate(base);
}
