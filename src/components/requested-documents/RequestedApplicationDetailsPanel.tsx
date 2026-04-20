"use client";

import type { ReactNode } from "react";
import { Application } from "@/types/applications";
import { RequestedDocument } from "@/lib/api/requestedDocuments";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import TruncatedText from "../ui/truncated-text";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/40 py-3 last:border-0 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export type RequestedApplicationDetailsPanelProps = {
  application: Application | undefined;
  isLoading: boolean;
  requestedDocument?: Pick<
    RequestedDocument,
    "record_id" | "document_category" | "document_name" | "file_name" | "client_name"
  >;
  className?: string;
};

export function RequestedApplicationDetailsPanel({
  application,
  isLoading,
  requestedDocument,
  className,
}: RequestedApplicationDetailsPanelProps) {
  if (isLoading) {
    return (
      <div className={cn("min-h-0 flex-1 space-y-3 px-4 py-3", className)}>
        <div className="h-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-2", className)}>
      <div className="border-b border-border/40 px-0 py-2">
        <span className="text-xs font-medium text-muted-foreground">Details</span>
      </div>
      <dl className="pt-1">
        {application ? (
          <>
            <DetailRow label="Applicant name">{application.Name || "—"}</DetailRow>
            <DetailRow label="Target country">{application.Qualified_Country || "—"}</DetailRow>
            <DetailRow label="Assessing authority">{application.Assessing_Authority || "—"}</DetailRow>
            <DetailRow label="Service type">{application.Service_Finalized || "—"}</DetailRow>
            <DetailRow label="Suggested ANZSCO">
              <TruncatedText className="max-w-[20ch]">
                {application.Suggested_Anzsco || "—"}
              </TruncatedText>
            </DetailRow>
            <DetailRow label="Record type">{application.Record_Type || "—"}</DetailRow>
            <DetailRow label="Stage">{application.Application_Stage || "—"}</DetailRow>
            <DetailRow label="Handled by">{application.Application_Handled_By || "—"}</DetailRow>
            <DetailRow label="Created">
              {application.Created_Time ? formatDate(application.Created_Time, "short") : "—"}
            </DetailRow>
            <DetailRow label="Main applicant">{application.Main_Applicant || "—"}</DetailRow>
            {application.Spouse_Name ? (
              <DetailRow label="Spouse">{application.Spouse_Name}</DetailRow>
            ) : null}
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">Application details not available</p>
        )}

        {requestedDocument ? (
          <>
            <div className="border-b border-border/40 py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Request context
              </span>
            </div>
            <DetailRow label="Client">{requestedDocument.client_name || "—"}</DetailRow>
            <DetailRow label="Document">{requestedDocument.document_name || requestedDocument.file_name || "—"}</DetailRow>
            <DetailRow label="Category">{requestedDocument.document_category || "—"}</DetailRow>
          </>
        ) : null}
      </dl>
    </div>
  );
}
