"use client";

import { memo, useState } from "react";
import {
  RiCheckLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiMessageLine,
  RiTimeLine,
} from "react-icons/ri";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge, BadgeIcon } from "@/components/ui/primitives/badge";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { DocumentRejectedPopover } from "@/components/ui/primitives/document-rejected-popover";
import TruncatedText from "@/components/ui/truncated-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AdminApprovalRequest } from "@/hooks/useAdminApprovalRequests";
import { getInitials } from "@/lib/constants/users";
import { cn } from "@/lib/utils";
import { RejectDocumentDialog } from "@/components/applications/RejectDocumentDialog";

const ROUTE_CONFIG = {
  by: { label: "By", color: "blue" as const },
  to: { label: "To", color: "purple" as const },
} as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatISODate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ApprovalRequestTableRowProps {
  request: AdminApprovalRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  approving?: boolean;
  rejecting?: boolean;
}

export const ApprovalRequestTableRow = memo(function ApprovalRequestTableRow({
  request,
  onApprove,
  onReject,
  approving,
  rejecting,
}: ApprovalRequestTableRowProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const isPending = request.status === "pending";

  const statusMap = {
    pending:  { status: "pending"   as const, label: "Pending" },
    approved: { status: "completed" as const, label: "Approved" },
    rejected: { status: "failed"    as const, label: "Rejected" },
  };
  const { status: badgeStatus, label: badgeLabel } = statusMap[request.status];
  const requestReason = request.reason?.trim() ?? "";

  return (
    <>
      <TableRow className="group relative isolate transition-colors hover:bg-neutral-50">
        {/* Client */}
        <TableCell>
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={request.client?.profile_image_url?.trim() || undefined}
                alt={request.client?.name ?? "Client"}
              />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(undefined, request.client?.name)}
              </AvatarFallback>
            </Avatar>
            <TruncatedText className="text-sm font-medium text-foreground max-w-[14ch]">
              {request.client?.name ?? "—"}
            </TruncatedText>
          </div>
        </TableCell>

        {/* From / To */}
        <TableCell>
          <div className="flex flex-col gap-1.5">
            {(["by", "to"] as const).map((key) => {
              const cfg = ROUTE_CONFIG[key];
              const name = key === "by" ? request.requestedBy : request.requestedTo;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="shrink-0 w-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {cfg.label}
                  </span>
                  <Badge variant="lighter" color={cfg.color} className="rounded-md" size="md">
                    <TruncatedText className="max-w-[12ch] capitalize text-xs font-normal">
                      {name || "—"}
                    </TruncatedText>
                  </Badge>
                </div>
              );
            })}
          </div>
        </TableCell>

        {/* Field Change */}
        <TableCell>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium">{request.fieldName}</p>
            <p className="text-sm font-medium text-foreground">
              {formatISODate(request.currentValue)}
              <span className="mx-1.5 text-muted-foreground">→</span>
              {formatISODate(request.requestedValue)}
            </p>
          </div>
        </TableCell>

        {/* Reason — hover popover */}
        <TableCell>
          {requestReason ? (
            <DocumentRejectedPopover
              rejectMessage={requestReason}
              title="Extension Reason"
              headerTone="danger"
              className="p-2 rounded-sm"
            >
              <StatusBadge variant="light" status="completed">
                <StatusBadgeIcon as={RiMessageLine} />
                View reason
              </StatusBadge>
            </DocumentRejectedPopover>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Status */}
        <TableCell>
          <div className="flex flex-col gap-1">
            {request.status === "rejected" ? (
              <DocumentRejectedPopover
                rejectMessage={request.rejectionReason?.trim() || "No reason provided"}
              >
                <StatusBadge variant="light" status="failed">
                  <StatusBadgeIcon as={RiCloseCircleLine} />
                  Rejected
                </StatusBadge>
              </DocumentRejectedPopover>
            ) : (
              <StatusBadge variant="light" status={badgeStatus}>
                <StatusBadgeIcon as={RiTimeLine} />
                {badgeLabel}
              </StatusBadge>
            )}
          </div>
        </TableCell>

        {/* Date */}
        <TableCell>
          <p className="font-medium text-sm">{formatDate(request.createdAt)}</p>
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          {isPending ? (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                disabled={approving || rejecting}
                onClick={() => onApprove(request._id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50",
                )}
              >
                <RiCheckLine className="h-3.5 w-3.5" />
                {approving ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={approving || rejecting}
                onClick={() => setShowRejectDialog(true)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50",
                )}
              >
                <RiCloseLine className="h-3.5 w-3.5" />
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>

      <RejectDocumentDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={(reason) => {
          onReject(request._id, reason);
          setShowRejectDialog(false);
        }}
        isLoading={!!rejecting}
        title="Reject approval request"
        confirmLabel="Reject request"
        labelText="Please provide a reason for rejection *"
        placeholder="Enter the reason for rejecting this approval request..."
        loadingLabel="Rejecting…"
      />
    </>
  );
});
