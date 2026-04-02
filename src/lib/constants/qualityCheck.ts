import { ROLES } from "@/lib/roles";

export const QUALITY_CHECK_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Removed", value: "removed" },
] as const;

export const QUALITY_CHECK_RECORD_TYPE_OPTIONS = [
  { label: "Visa Applications", value: "Visa_Applications" },
  { label: "Spouse Skill Assessment", value: "Spouse_Skill_Assessment" },
] as const;

/** May mark QC reviewed without being the assignee (assignee can always mark when pending). */
export const QUALITY_CHECK_REVIEW_ANY_ROLES = [
  ROLES.MASTER_ADMIN,
  ROLES.SUPERVISOR,
] as const;

/** May remove a QC request (requester may also remove — see sheet logic). Excludes team_leader. */
export const QUALITY_CHECK_REMOVE_ROLES = [
  ROLES.MASTER_ADMIN,
  ROLES.ADMIN,
  ROLES.SUPERVISOR,
] as const;

export const QUALITY_CHECK_REVIEW_ANY_ROLE_SET = new Set<string>(
  QUALITY_CHECK_REVIEW_ANY_ROLES,
);

export const QUALITY_CHECK_REMOVE_ROLE_SET = new Set<string>(
  QUALITY_CHECK_REMOVE_ROLES,
);
