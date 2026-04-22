"use client";

import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { Badge } from "@/components/ui/primitives/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar";
import type { CallLog } from "@/types/callLog";
import {
  CALL_STATUS_BADGE,
  CALL_STATUS_FALLBACK,
  CALL_DIRECTION_BADGE,
  formatCallDuration,
} from "@/lib/constants/callLogs";
import { getInitials } from "@/lib/constants/users";
import { PhoneIncoming } from "../icons/phone-incoming";
import { PhoneOutgoing } from "../icons/phone-outgoing";
import Link from "next/link";
import { ROUTES } from "@/utils/routes";
import TruncatedText from "../ui/truncated-text";

interface CallLogTableRowProps {
  log: CallLog;
  onView: (log: CallLog) => void;
}

function formatStartTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export const CallLogTableRow = memo(function CallLogTableRow({ log, onView }: CallLogTableRowProps) {
  const statusCfg = CALL_STATUS_BADGE[log.status] ?? CALL_STATUS_FALLBACK;
  const dirCfg = CALL_DIRECTION_BADGE[log.direction];
  const DirectionIcon = log.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;

  const clientName = log.client_name ?? log.customer_phone;
  const agentName = log.agent_name ?? log.agent_phone;

  return (
    <TableRow
      className="group cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-white/2"
      onClick={() => onView(log)}
    >
      {/* Caller */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={log.client_image_url ?? undefined} alt={clientName} />
            <AvatarFallback className="text-[10px]">{getInitials(clientName)}</AvatarFallback>
          </Avatar>
          <Link
            href={ROUTES.APPLICATION_DETAILS(log.client_lead_id)}
            className="text-sm text-foreground capitalize hover:underline truncate max-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            {clientName}
          </Link>
        </div>
      </TableCell>

      {/* Agent */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={log.agent_image_url ?? undefined} alt={agentName} />
            <AvatarFallback className="text-[10px]">{getInitials(agentName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground truncate max-w-[120px]">{agentName}</span>
        </div>
      </TableCell>

      {/* Direction */}
      <TableCell>
        <StatusBadge variant="light">
          <DirectionIcon className="-mx-0.5 size-3.5" />
          {dirCfg.label}
        </StatusBadge>
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
        <TruncatedText className="text-sm text-muted-foreground tabular-nums">
          {log.start_time ? formatStartTime(log.start_time) : "—"}
        </TruncatedText>
      </TableCell>
    </TableRow>
  );
});
