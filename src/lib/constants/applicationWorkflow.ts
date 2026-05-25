export const APPLICATION_STAGE_OPTIONS = [
  "Stage 4 Authority Selection",
  "Stage 4 Documentation: Review",
  "Stage 1 Documentation: Approved",
  "Stage 3 Documentation: Approved",
  "Stage 4 Documentation: Approved",
  "Stage 5 Documentation: Approved",
  "Stage 1 Documentation: Rejected",
  "Stage 4 Documentation: Rejected",
  "Stage 3 Application Lodged",
  "Stage 4 Application Lodged",
  "Stage 3 Further Information Requested",
  "Stage 4 Further Information Requested",
  "Stage 1 Milestone Completed",
  "Stage 3 Milestone Completed",
  "Stage 4 Milestone Completed",
  "Stage 5 Milestone Completed",
  "Stage 1 Review/Appeal/Fresh Application",
  "Stage 3 Review/Appeal/Fresh Application",
  "Stage 4 Review/Appeal/Fresh Application",
  "Lodge Application 1",
  "Lodge Application 2",
  "Lodge Application 3",
  "Lodge Application 4",
  "INIVITATION TO APPLY",
  "LODGE APPLICATION",
  "SEND CHECK LIST",
  "MEDICALS",
  "VISA GRAND",
  "Invitation to Apply",
  "Application Lodged",
  "Skill Assessment Stage",
  "Visa Rejected",
  "Visa Grant",
  "Language Test",
  "SA Application Lodge",
  "VA Application Lodge",
  "Stage 3 Visa Application",
  "Stage 1 Documentation Reviewed",
  "Stage 2 Milestone Completed",
  "Invitation to Apply 2",
] as const;

export const APPLICATION_STATE_OPTIONS = ["Active", "Inactive"] as const;

export type ApplicationStateOption = (typeof APPLICATION_STATE_OPTIONS)[number];

export function resolveStageOptions(
  current?: string | null,
  options: readonly string[] = APPLICATION_STAGE_OPTIONS,
): string[] {
  const trimmed = current?.trim();
  if (!trimmed) return [...options];
  if (options.includes(trimmed)) return [...options];
  return [trimmed, ...options];
}

export function getApplicationRecordType(
  application: { Record_Type?: string },
  isSpouseApplication?: boolean,
): string {
  return (
    application.Record_Type ??
    (isSpouseApplication ? "spouse_skill_assessment" : "visa_application")
  );
}
