"use client";

import { memo } from "react";
import { RiAlertLine, RiMessage2Line, RiTimeLine } from "react-icons/ri";

import { HighlightText } from "@/components/ui/HighlightText";
import { TableCell, TableRow } from "@/components/ui/table";
import type { RequestedDocument } from "@/lib/api/requestedDocuments";
import { ClientNameCell } from "@/components/requested-documents/ClientNameCell";
import { RequestDocStatusBadge } from "@/components/requested-documents/RequestDocStatusBadge";
import { CopyButton } from "@/components/ui/primitives/copy-button";
import TruncatedText from "@/components/ui/truncated-text";
import { ReviewRouteDisplay } from "@/components/requested-documents/ReviewRouteDisplay";
import { cn } from "@/lib/utils";

export const RequestedDocTableRow = memo(function RequestedDocTableRow({
  document,
  searchQuery,
  onView,
}: {
  document: RequestedDocument;
  searchQuery?: string;
  onView: (document: RequestedDocument) => void;
}) {
  // Remove "Company document name" from companyName using a JS string function
  let companyName = document.document_category?.trim() || "—";
  companyName = companyName.replace(/Company documents/gi, "").trim() || "—";
  const docType = document.document_name || document.file_name || "—";
  const hasQuery = (searchQuery?.trim()?.length ?? 0) > 0;

  const requestedAt = new Date(document.requested_review.requested_at);
  const messageCount = document.requested_review.messages?.length ?? 0;

  return (
    <TableRow
      className={cn(
        "group relative isolate cursor-pointer transition-colors hover:bg-neutral-50",
        document.isOverdue ? "border-l-4 border-l-red-400" : undefined,
      )}
      onClick={() => onView(document)}
    >
      {/* Document */}
      <TableCell className="pr-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <TruncatedText className="max-w-[20ch] text-sm font-medium text-foreground">
              {companyName}
            </TruncatedText>
            {companyName !== "—" && (
              <CopyButton
                valueToCopy={companyName}
                size="2xs"
                className="shrink-0 -my-1 -mr-2 rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              />
            )}
          </div>
          {docType !== "—" && (
            <TruncatedText className="max-w-[20ch] text-xs text-muted-foreground font-normal">
              {hasQuery ? (
                <HighlightText text={docType} query={searchQuery!} className="text-xs text-muted-foreground" />
              ) : (
                docType
              )}
            </TruncatedText>
          )}
          {document.isOverdue && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <RiAlertLine className="h-3 w-3" />
              <span>Overdue ({document.daysSinceRequest} days)</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* Client Name */}
      <TableCell className="pr-6">
        <div className="text-xs">
          <ClientNameCell recordId={document.record_id} clientName={document.client_name} searchQuery={searchQuery} />
        </div>
      </TableCell>

      {/* Route */}
      <TableCell>
        <ReviewRouteDisplay document={document} />
      </TableCell>

      {/* Status */}
      <TableCell>
        <RequestDocStatusBadge status={document.requested_review.status} />
      </TableCell>

      {/* Requested */}
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium text-sm">
            {requestedAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RiTimeLine className="h-3 w-3" />
            {requestedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </TableCell>

      {/* Messages */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1 tabular-nums">
          <RiMessage2Line className={cn("h-3.5 w-3.5", messageCount > 0 ? "text-blue-500" : "text-muted-foreground")} />
          <span className={cn("text-xs font-semibold", messageCount > 0 ? "text-blue-500" : "text-muted-foreground")}>
            {messageCount}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
});

