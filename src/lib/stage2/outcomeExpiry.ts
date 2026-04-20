import { addMonths, addYears, format, isValid } from "date-fns";
import { getAnzscoCodeByCode } from "@/lib/constants/australianData";

const OUTCOME_ENGLISH = "English Language Test";
const OUTCOME_SKILL = "Skill Assessment Outcome";
const OUTCOME_VISA_GRANT = "Visa grant";
const OUTCOME_ROI = "License/ Registration(ROI)";
const OUTCOME_APHRA = "APHRA";
const OUTCOME_ECA = "ECA";

export type OutcomeExpiryInput = {
  outcome?: string | null;
  outcome_date?: string | null;
  skill_assessing_body?: string | null;
};

export function computeOutcomeExpiryDate({
  outcome,
  outcome_date,
  skill_assessing_body,
}: OutcomeExpiryInput): Date | null {
  if (!outcome?.trim() || !outcome_date?.trim()) return null;

  const base = new Date(outcome_date.trim());
  if (!isValid(base)) return null;

  const o = outcome.trim();

  if (o === OUTCOME_ENGLISH) {
    return addYears(base, 5);
  }
  if (o === OUTCOME_SKILL) {
    const meta = getAnzscoCodeByCode(skill_assessing_body?.trim() ?? "");
    const isAcs = meta?.assessing_authority === "ACS";
    return addYears(base, isAcs ? 2 : 3);
  }
  if (o === OUTCOME_ROI) {
    return addMonths(base, 6);
  }
  if (o === OUTCOME_VISA_GRANT) {
    return addYears(base, 5);
  }
  if (o === OUTCOME_APHRA || o === OUTCOME_ECA) {
    return addYears(base, 3);
  }

  return null;
}

export function formatOutcomeExpiryForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getOutcomeExpiryPeriodLabel(
  input: Pick<OutcomeExpiryInput, "outcome" | "skill_assessing_body">,
): string | null {
  if (!input.outcome?.trim()) return null;
  const o = input.outcome.trim();

  if (o === OUTCOME_ENGLISH) return "5 years";
  if (o === OUTCOME_SKILL) {
    const meta = getAnzscoCodeByCode(input.skill_assessing_body?.trim() ?? "");
    const isAcs = meta?.assessing_authority === "ACS";
    return isAcs ? "2 years" : "3 years";
  }
  if (o === OUTCOME_ROI) return "6 months";
  if (o === OUTCOME_VISA_GRANT) return "5 years";
  if (o === OUTCOME_APHRA || o === OUTCOME_ECA) return "3 years";
  return null;
}

export function getOutcomeExpiryDisplayParts(
  input: OutcomeExpiryInput,
): { date: Date; periodLabel: string } | null {
  const date = computeOutcomeExpiryDate(input);
  if (!date) return null;
  const periodLabel = getOutcomeExpiryPeriodLabel(input);
  if (!periodLabel) return null;
  return { date, periodLabel };
}
