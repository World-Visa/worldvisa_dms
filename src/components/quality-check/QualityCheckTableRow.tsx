"use client";

import { memo } from "react";
import { Clock, Eye, MessageSquare, Trash2 } from "lucide-react";

import { HighlightText } from "@/components/ui/HighlightText";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import TruncatedText from "@/components/ui/truncated-text";
import type { QualityCheckListItem } from "@/lib/api/qualityCheck";
import { cn } from "@/lib/utils";

function QualityCheckStatusBadge({
  status,
}: {
  status: QualityCheckListItem["qcStatus"];
}) {
  const config: Record<
    QualityCheckListItem["qcStatus"],
    { badgeStatus: "pending" | "completed" | "disabled"; icon: React.ElementType; label: string }
  > = {
    pending: { badgeStatus: "pending", icon: Clock, label: "Pending" },
    reviewed: { badgeStatus: "completed", icon: Eye, label: "Reviewed" },
    removed: { badgeStatus: "disabled", icon: Trash2, label: "Removed" },
  };

  const { badgeStatus, icon, label } = config[status] ?? config.pending;

  return (
    <StatusBadge variant="light" status={badgeStatus}>
      <StatusBadgeIcon as={icon} />
      {label}
    </StatusBadge>
  );
}

export const QualityCheckTableRow = memo(function QualityCheckTableRow({
  item,
  searchQuery,
  onView,
}: {
  item: QualityCheckListItem;
  searchQuery?: string;
  onView: (item: QualityCheckListItem) => void;
}) {
  const hasQuery = (searchQuery?.trim()?.length ?? 0) > 0;

  const requestedAt = item.qcRequestedAt ? new Date(item.qcRequestedAt) : null;
  const messageCount = item.messageCount ?? 0;

  return (
    <TableRow
      className={cn(
        "group relative isolate cursor-pointer transition-colors hover:bg-neutral-50",
        item.qcStatus === "pending" ? "border-l-4 border-l-warning-base/60" : undefined,
      )}
      onClick={() => onView(item)}
    >
      {/* Applicant */}
      <TableCell>
        <div className="space-y-0.5 w-full flex flex-col gap-1">
          <TruncatedText className="max-w-[28ch] font-medium text-foreground">
            {hasQuery ? (
              <HighlightText text={item.Name ?? "—"} query={searchQuery!} />
            ) : (
              item.Name ?? "—"
            )}
          </TruncatedText>
          <TruncatedText className="max-w-[32ch] text-xs text-muted-foreground font-normal">
            {hasQuery ? (
              <HighlightText text={item.Email ?? "—"} query={searchQuery!} />
            ) : (
              item.Email ?? "—"
            )}
          </TruncatedText>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <QualityCheckStatusBadge status={item.qcStatus} />
      </TableCell>

      {/* Requested By */}
      <TableCell>
        <TruncatedText className="max-w-[20ch] text-sm text-foreground">
          {item.qcRequestedBy || item.Quality_Check_From || "—"}
        </TruncatedText>
      </TableCell>

      {/* Requested */}
      <TableCell>
        {requestedAt ? (
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {requestedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {requestedAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Messages */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1 tabular-nums">
          <MessageSquare
            className={cn(
              "h-3.5 w-3.5",
              messageCount > 0 ? "text-blue-500" : "text-muted-foreground",
            )}
          />
          <span
            className={cn(
              "text-xs font-semibold",
              messageCount > 0 ? "text-blue-500" : "text-muted-foreground",
            )}
          >
            {messageCount}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
});

