import type React from "react";
import {
  RiCheckboxCircleFill,
  RiCloseCircleLine,
  RiFileCheckFill,
  RiFolderWarningFill,
  RiTimeLine,
} from "react-icons/ri";

type BadgeStatus = "completed" | "pending" | "failed" | "disabled";

export interface DocumentStatusBadgeCfg {
  status: BadgeStatus;
  label: string;
  icon: React.ElementType;
}

export const DOCUMENT_STATUS_BADGE: Record<string, DocumentStatusBadgeCfg> = {
  approved: { status: "completed", label: "Approved", icon: RiCheckboxCircleFill },
  reviewed: { status: "disabled",  label: "Reviewed", icon: RiFileCheckFill },
  rejected: { status: "failed",    label: "Rejected", icon: RiCloseCircleLine },
  pending:  { status: "pending",   label: "Pending",  icon: RiFolderWarningFill },
  uploaded: { status: "completed", label: "Uploaded", icon: RiCheckboxCircleFill },
};

export const DOCUMENT_STATUS_FALLBACK: DocumentStatusBadgeCfg = {
  status: "pending",
  label: "Pending",
  icon: RiTimeLine,
};
