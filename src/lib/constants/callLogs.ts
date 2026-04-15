import type React from "react";
import {
  RiCheckboxCircleFill,
  RiCloseCircleLine,
  RiPhoneFill,
  RiTimeLine,
} from "react-icons/ri";
import type { CallDirection, CallStatus, DateRangePreset } from "@/types/callLog";
import { PhoneMissed } from "lucide-react";

type BadgeStatus = "completed" | "pending" | "failed" | "disabled";

export interface CallStatusBadgeCfg {
  status: BadgeStatus;
  label: string;
  icon: React.ElementType;
}

export const CALL_STATUS_BADGE: Record<CallStatus, CallStatusBadgeCfg> = {
  completed:  { status: "completed", label: "Completed",  icon: RiCheckboxCircleFill },
  answered:   { status: "completed", label: "Answered",   icon: RiPhoneFill },
  initiated:  { status: "pending",   label: "Initiated",  icon: RiTimeLine },
  missed:     { status: "failed",    label: "Missed",     icon: PhoneMissed  },
  busy:       { status: "failed",    label: "Busy",       icon: RiCloseCircleLine },
  cancelled:  { status: "failed",    label: "Cancelled",  icon: RiCloseCircleLine },
};

export const CALL_STATUS_FALLBACK: CallStatusBadgeCfg = {
  status: "disabled",
  label: "Unknown",
  icon: RiTimeLine,
};

export const CALL_DIRECTION_BADGE: Record<CallDirection, { label: string; color: "blue" | "purple" }> = {
  Inbound:  { label: "Inbound",  color: "blue" },
  Outbound: { label: "Outbound", color: "purple" },
};

export const CALL_STATUS_OPTIONS: { value: CallStatus; label: string }[] = [
  { value: "completed",  label: "Completed" },
  { value: "answered",   label: "Answered" },
  { value: "initiated",  label: "Initiated" },
  { value: "missed",     label: "Missed" },
  { value: "busy",       label: "Busy" },
  { value: "cancelled",  label: "Cancelled" },
];

export const CALL_DIRECTION_OPTIONS: { value: CallDirection; label: string }[] = [
  { value: "Inbound",  label: "Inbound" },
  { value: "Outbound", label: "Outbound" },
];

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "last_24h", label: "Last 24 Hours" },
  { value: "last_7d",  label: "Last 7 Days" },
  { value: "last_30d", label: "Last 30 Days" },
  { value: "last_90d", label: "Last 90 Days" },
];

export function formatCallDuration(seconds: string | null): string {
  if (!seconds) return "—";
  const total = parseInt(seconds, 10);
  if (Number.isNaN(total) || total <= 0) return "—";
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}
