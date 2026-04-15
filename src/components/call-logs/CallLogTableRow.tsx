"use client";

import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { Badge } from "@/components/ui/primitives/badge";
import type { CallLog } from "@/types/callLog";
import {
  CALL_STATUS_BADGE,
  CALL_STATUS_FALLBACK,
  CALL_DIRECTION_BADGE,
  formatCallDuration,
} from "@/lib/constants/callLogs";
import { PhoneIncoming } from "../icons/phone-incoming";
import { PhoneOutgoing } from "../icons/phone-outgoing";

interface CallLogTableRowProps {
  log: CallLog;
  onView: (log: CallLog) => void;
}

function formatStartTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export const CallLogTableRow = memo(function CallLogTableRow({ log, onView }: CallLogTableRowProps) {
  const statusCfg  = CALL_STATUS_BADGE[log.status] ?? CALL_STATUS_FALLBACK;
  const dirCfg     = CALL_DIRECTION_BADGE[log.direction];
  const DirectionIcon = log.direction === "Inbound" ? PhoneIncoming : PhoneOutgoing;

  return (
    <TableRow
      className="group cursor-pointer transition-colors hover:bg-neutral-50"
      onClick={() => onView(log)}
    >
      {/* Caller */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{log.customer_phone}</span>
          {log.client_name && (
            <span className="text-xs text-muted-foreground">{log.client_name}</span>
          )}
        </div>
      </TableCell>

      {/* Agent */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{log.agent_name || "—"}</span>
          {log.agent_phone && (
            <span className="text-xs text-muted-foreground">{log.agent_phone}</span>
          )}
        </div>
      </TableCell>

      {/* Direction */}
      <TableCell>
        <Badge variant="lighter" color={dirCfg.color} size="md" className="gap-1">
          <DirectionIcon className="-mx-0.5 size-3.5" />
          {dirCfg.label}
        </Badge>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge variant="light" status={statusCfg.status}>
          <StatusBadgeIcon as={statusCfg.icon} />
          {statusCfg.label}
        </StatusBadge>
      </TableCell>

      {/* Duration */}
      <TableCell>
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatCallDuration(log.answered_duration)}
        </span>
      </TableCell>

      {/* Start Time */}
      <TableCell>
        <span className="text-sm text-muted-foreground tabular-nums">
          {log.start_time ? formatStartTime(log.start_time) : "—"}
        </span>
      </TableCell>
    </TableRow>
  );
});
