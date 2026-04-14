"use client";

import { RiPlayCircleLine, RiPhoneLine } from "react-icons/ri";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { Badge } from "@/components/ui/primitives/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallLogDetail } from "@/hooks/useCallLogs";
import type { CallLog } from "@/types/callLog";
import {
  CALL_STATUS_BADGE,
  CALL_STATUS_FALLBACK,
  CALL_DIRECTION_BADGE,
  formatCallDuration,
} from "@/lib/constants/callLogs";
import { PhoneIncoming } from "../icons/phone-incoming";
import { PhoneOutgoing } from "../icons/phone-outgoing";

interface CallLogDetailSheetProps {
  log: CallLog | null;
  isOpen: boolean;
  onClose: () => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-stroke-soft last:border-0">
      <span className="text-xs font-medium text-text-soft uppercase tracking-wide">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function DetailContent({ callId }: { callId: string }) {
  const { data, isLoading } = useCallLogDetail(callId);
  const log = data?.data?.callLog;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 py-3 border-b border-stroke-soft">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground px-4">
        Call log details not found.
      </div>
    );
  }

  const statusCfg  = CALL_STATUS_BADGE[log.status] ?? CALL_STATUS_FALLBACK;
  const dirCfg     = CALL_DIRECTION_BADGE[log.direction];
  const DirectionIcon = log.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;

  const populatedAgent = typeof log.agent_id === "object" && log.agent_id !== null
    ? log.agent_id
    : log.agent ?? null;

  const populatedClient = typeof log.client_id === "object" && log.client_id !== null
    ? log.client_id
    : null;

  return (
    <div className="flex flex-col px-4 overflow-y-auto">
      {/* Status + Direction row */}
      <div className="flex items-center gap-2 py-4 border-b border-stroke-soft">
        <StatusBadge variant="light" status={statusCfg.status}>
          <StatusBadgeIcon as={statusCfg.icon} />
          {statusCfg.label}
        </StatusBadge>
        <Badge variant="lighter" color={dirCfg.color} size="md" className="gap-1">
          <DirectionIcon className="-mx-0.5 size-3.5" />
          {dirCfg.label}
        </Badge>
      </div>

      {/* Caller */}
      <DetailRow label="Caller">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{log.customer_phone}</span>
          {populatedClient ? (
            <span className="text-xs text-muted-foreground">{populatedClient.Name} · {populatedClient.Email}</span>
          ) : log.client_name ? (
            <span className="text-xs text-muted-foreground">{log.client_name}</span>
          ) : null}
        </div>
      </DetailRow>

      {/* Agent */}
      <DetailRow label="Agent">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{populatedAgent ? populatedAgent.name : log.agent_name || "—"}</span>
          <span className="text-xs text-muted-foreground">
            {populatedAgent ? populatedAgent.agent_number ?? log.agent_phone : log.agent_phone}
          </span>
          {populatedAgent?.email && (
            <span className="text-xs text-muted-foreground">{populatedAgent.email}</span>
          )}
        </div>
      </DetailRow>

      {/* Duration */}
      <DetailRow label="Duration">
        {formatCallDuration(log.answered_duration)}
      </DetailRow>

      {/* Start / End */}
      <DetailRow label="Start Time">{formatDateTime(log.start_time)}</DetailRow>
      <DetailRow label="End Time">{formatDateTime(log.end_time)}</DetailRow>

      {/* Dial Status */}
      {log.dial_status && (
        <DetailRow label="Dial Status">
          <span className="capitalize">{log.dial_status}</span>
        </DetailRow>
      )}

      {/* Disconnected By */}
      {log.disconnected_by && (
        <DetailRow label="Disconnected By">
          <span className="capitalize">{log.disconnected_by}</span>
        </DetailRow>
      )}

      {/* Group */}
      {log.group_name && (
        <DetailRow label="Group">{log.group_name}</DetailRow>
      )}

      {/* DID */}
      {log.mcube_did && (
        <DetailRow label="DID Number">{log.mcube_did}</DetailRow>
      )}

      {/* Call ID */}
      <DetailRow label="Call ID">
        <span className="font-mono text-xs text-muted-foreground break-all">{log.call_id}</span>
      </DetailRow>

      {/* Recording */}
      {log.recording_url && (
        <DetailRow label="Recording">
          <a
            href={log.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-information-base hover:underline text-sm"
          >
            <RiPlayCircleLine className="size-4" />
            Play Recording
          </a>
        </DetailRow>
      )}
    </div>
  );
}

export function CallLogDetailSheet({ log, isOpen, onClose }: CallLogDetailSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-hidden p-0 gap-0" side="right">
        <SheetHeader className="border-b border-stroke-soft px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
              <RiPhoneLine className="size-4 text-neutral-600" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold">Call Details</SheetTitle>
              {log && (
                <SheetDescription className="text-xs">
                  {log.customer_phone}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        {log && <DetailContent callId={log.call_id} />}
      </SheetContent>
    </Sheet>
  );
}
