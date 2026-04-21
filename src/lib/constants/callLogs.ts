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

export const CALL_DIRECTION_BADGE: Record<CallDirection, { label: string; color: "green" | "blue" }> = {
  inbound:  { label: "Incoming",  color: "green" },
  outbound: { label: "Outgoing", color: "blue" },
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
  { value: "inbound",  label: "Incoming" },
  { value: "outbound", label: "Outgoing" },
];

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "last_24h", label: "Last 24 Hours" },
  { value: "last_7d",  label: "Last 7 Days" },
  { value: "last_30d", label: "Last 30 Days" },
  { value: "last_90d", label: "Last 90 Days" },
];

export function formatCallDuration(duration: string | null): string {
  if (!duration) return "—";
  let total: number;
  if (duration.includes(":")) {
    const parts = duration.split(":").map(Number);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      total = h * 3600 + m * 60 + s;
    } else {
      return "—";
    }
  } else {
    total = parseInt(duration, 10);
  }
  if (Number.isNaN(total) || total <= 0) return "—";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
