import type { AdminApprovalRequest } from "@/hooks/useAdminApprovalRequests";
import type { DeadlineExtensionEntry } from "@/types/applications";
import { formatDeadlineDate } from "./deadline-date-utils";

export interface DeadlineOutcomeViewModel {
  key: string;
  variant: "approved" | "rejected";
  bodyText: string;
  actorDisplayName: string;
  actorAvatarUrl?: string | null;
  actorUsername?: string;
  actorFullName?: string;
  /** Set when outcome is driven by `deadline_extensions` (approved extension on document). */
  extensionPreviousDateLabel?: string;
  extensionNewDateLabel?: string;
  requestedBy?: string;
  approvedAtLabel?: string;
}

export function pickLatestDeadlineExtension(
  entries: DeadlineExtensionEntry[] | undefined,
): DeadlineExtensionEntry | undefined {
  if (!entries?.length) return undefined;
  const forField = entries.filter((e) => e.fieldName === "Deadline_For_Lodgment");
  if (!forField.length) return undefined;
  return [...forField].sort((a, b) => {
    const ta = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
    const tb = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
    return tb - ta;
  })[0];
}

export function buildOutcomeViewModel(
  isPending: boolean,
  outcome: AdminApprovalRequest | undefined,
  latestExtension: DeadlineExtensionEntry | undefined,
): DeadlineOutcomeViewModel | null {
  if (isPending) return null;

  if (outcome?.status === "rejected") {
    const displayName =
      outcome.reviewerInfo?.full_name ??
      outcome.reviewerInfo?.username ??
      (typeof outcome.reviewedBy === "string" ? outcome.reviewedBy : null) ??
      "—";
    return {
      key: outcome._id,
      variant: "rejected",
      bodyText: outcome.rejectionReason?.trim() || "—",
      actorDisplayName: displayName,
      actorAvatarUrl: outcome.reviewerInfo?.profile_image_url?.trim() || undefined,
      actorUsername: outcome.reviewerInfo?.username,
      actorFullName:
        outcome.reviewerInfo?.full_name ??
        (typeof outcome.reviewedBy === "string" ? outcome.reviewedBy : undefined),
    };
  }

  if (latestExtension) {
    const info = latestExtension.approvedByInfo;
    const displayName =
      info?.full_name ?? info?.username ?? latestExtension.approvedBy ?? "—";
    const prevRaw = latestExtension.previousValue?.trim();
    const extensionPreviousDateLabel = prevRaw
      ? formatDeadlineDate(prevRaw)
      : undefined;
    const extensionNewDateLabel = formatDeadlineDate(latestExtension.newValue);
    const requestedByRaw = latestExtension.requestedBy?.trim();
    const approvedAtRaw = latestExtension.approvedAt?.trim();
    return {
      key: `deadline-ext-${latestExtension.requestId ?? latestExtension.approvedAt ?? latestExtension.newValue}`,
      variant: "approved",
      bodyText: latestExtension.reason?.trim() || "—",
      actorDisplayName: displayName,
      actorAvatarUrl: info?.profile_image_url?.trim() || undefined,
      actorUsername: info?.username,
      actorFullName: info?.full_name ?? latestExtension.approvedBy,
      extensionPreviousDateLabel,
      extensionNewDateLabel:
        extensionNewDateLabel !== "—" ? extensionNewDateLabel : undefined,
      requestedBy: requestedByRaw || undefined,
      approvedAtLabel: approvedAtRaw ? formatDeadlineDate(approvedAtRaw) : undefined,
    };
  }

  if (outcome?.status === "approved") {
    const displayName =
      outcome.reviewerInfo?.full_name ??
      outcome.reviewerInfo?.username ??
      (typeof outcome.reviewedBy === "string" ? outcome.reviewedBy : null) ??
      "—";
    return {
      key: outcome._id,
      variant: "approved",
      bodyText: outcome.reason?.trim() || "—",
      actorDisplayName: displayName,
      actorAvatarUrl: outcome.reviewerInfo?.profile_image_url?.trim() || undefined,
      actorUsername: outcome.reviewerInfo?.username,
      actorFullName:
        outcome.reviewerInfo?.full_name ??
        (typeof outcome.reviewedBy === "string" ? outcome.reviewedBy : undefined),
    };
  }

  return null;
}
