import { addDays, format, isValid } from "date-fns";

/** API value for state nomination invitations (POST example). */
export const INVITATION_TYPE_STATE_NOMINATION = "state nomination";

/** API value for final invitation (PATCH example). */
export const INVITATION_TYPE_FINAL_INVITE = "Final invite";

export const INVITATION_TYPE_OPTIONS = [
  {
    value: INVITATION_TYPE_STATE_NOMINATION,
    label: "State nomination",
  },
  {
    value: INVITATION_TYPE_FINAL_INVITE,
    label: "Final invitation",
  },
] as const;

export function invitationTypeLabel(
  apiValue: string | undefined | null,
): string {
  if (!apiValue?.trim()) return "—";
  const v = apiValue.trim();
  if (v === INVITATION_TYPE_STATE_NOMINATION) return "State nomination";
  if (v === INVITATION_TYPE_FINAL_INVITE) return "Final invitation";
  return apiValue;
}

export function getInvitationExpiryOffsetDays(invitationType: string): number {
  const t = invitationType.trim();
  if (t === INVITATION_TYPE_FINAL_INVITE) return 60;
  return 30;
}

export function computeInvitationExpiryDate(
  invitationDate: Date,
  invitationType: string,
): Date | null {
  if (!isValid(invitationDate) || !invitationType.trim()) return null;
  const days = getInvitationExpiryOffsetDays(invitationType);
  return addDays(invitationDate, days);
}

/** FormData / simple date field */
export function formatInvitationExpiryForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** JSON PATCH (ISO) */
export function formatInvitationExpiryForPatch(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
