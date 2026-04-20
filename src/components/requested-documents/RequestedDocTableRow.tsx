"use client";

import { memo } from "react";
import { RiAlertLine, RiMessage2Line, RiRepeat2Line, RiTimer2Fill } from "react-icons/ri";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  let companyName = document.document_category?.trim() || "—";
  companyName = companyName.replace(/Company documents/gi, "").trim() || "—";
  const docType = document.document_name || document.file_name || "—";
  const hasQuery = (searchQuery?.trim()?.length ?? 0) > 0;

  const requestedAt = new Date(document.requested_review.requested_at);
  const messageCount = document.requested_review.messages?.length ?? 0;
  const iterationCount = document.review_chain?.filter(
    (e) => e.requested_to_role === "master_admin" || e.requested_to_role === "supervisor"
  ).length ?? 0;

  return (
    <TableRow
      className={cn(
        "group relative isolate cursor-pointer transition-colors hover:bg-neutral-50/80",
        document.isOverdue ? "border-l-2 border-l-red-400" : undefined,
      )}
      onClick={() => onView(document)}
    >
      {/* Document */}
      <TableCell className="pr-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <TruncatedText className="max-w-[22ch] text-[13px] font-medium text-text-base">
              {companyName}
            </TruncatedText>
            {companyName !== "—" && (
              <CopyButton
                valueToCopy={companyName}
                size="2xs"
                className="shrink-0 -my-1 rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              />
            )}
          </div>
          {docType !== "—" && (
            <TruncatedText className="max-w-[22ch] text-text-sub text-xs font-normal">
              {hasQuery ? (
                <HighlightText text={docType} query={searchQuery!} className="text-xs text-muted-foreground" />
              ) : (
                docType
              )}
            </TruncatedText>
          )}
          {document.isOverdue && (
            <div className="flex items-center gap-1 text-xs font-medium text-destructive">
              <RiAlertLine className="h-3 w-3 shrink-0" />
              <span>Overdue · {document.daysSinceRequest}d</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* Client Name */}
      <TableCell className="pr-4">
        <div className="text-sm">
          <ClientNameCell recordId={document.record_id} clientName={document.client_name} searchQuery={searchQuery} />
        </div>
      </TableCell>

      {/* Route */}
      <TableCell>
        <ReviewRouteDisplay document={document} />
      </TableCell>

      {/* ANZSCO */}
      <TableCell>
        {document.suggested_anzsco ? (
          <TruncatedText className="max-w-[16ch] text-sm font-medium text-text-sub ">
            {document.suggested_anzsco}
          </TruncatedText>
        ) : (
          <span className="text-sm text-muted-foreground/60">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <RequestDocStatusBadge status={document.requested_review.status} />
      </TableCell>

      {/* Requested */}
      <TableCell className="pr-4">
        <div className="space-y-0.5">
          <p className="text-[13px] font-medium text-text-base tabular-nums">
            {requestedAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-text-sub text-xs flex items-center gap-1 tabular-nums">
            <RiTimer2Fill className="h-3 w-3 shrink-0" />
            {requestedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </TableCell>

      {/* Messages */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1.5 tabular-nums">
          <div className="flex items-center gap-0.5">
            <RiMessage2Line className={cn("h-3.5 w-3.5 shrink-0", messageCount > 0 ? "text-blue-500" : "text-muted-foreground/40")} />
            <span className={cn("text-sm font-semibold", messageCount > 0 ? "text-blue-500" : "text-muted-foreground/40")}>
              {messageCount}
            </span>
          </div>
          {iterationCount > 1 && (
            <TooltipProvider>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 cursor-default leading-none">
                    <RiRepeat2Line className="h-3 w-3 shrink-0" />
                    {iterationCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" variant="default">
                  Reviewed {iterationCount} time{iterationCount !== 1 ? "s" : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});
