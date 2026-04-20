"use client";

import type { ReactNode } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import type { Stage2Document, Stage2DocumentType } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
import {
  getStage2AnzscoDisplay,
  getStage2StateDisplay,
  getStage2SubclassDisplay,
} from "@/lib/stage2DocumentDisplay";
import { getOutcomeExpiryDisplayParts } from "@/lib/stage2/outcomeExpiry";
import { invitationTypeLabel } from "@/lib/stage2/invitationExpiry";
import { getResolvedEoiExpiryDate } from "@/lib/stage2/eoiExpiry";
import { cn } from "@/lib/utils";
import { DocumentEmbedPreview } from "@/components/applications/document-preview/DocumentEmbedPreview";
import { getDocumentUrl } from "@/lib/documents/getDocumentUrl";
import TruncatedText from "@/components/ui/truncated-text";

function typeLabel(type: Stage2DocumentType) {
  switch (type) {
    case "eoi":
      return "EOI";
    case "invitation":
      return "Invitation";
    case "outcome":
      return "Outcome";
    default:
      return type;
  }
}

function outcomeExpiryLabel(document: Stage2Document): string {
  const parts = getOutcomeExpiryDisplayParts({
    outcome: document.outcome,
    outcome_date: document.outcome_date,
    skill_assessing_body: document.skill_assessing_body,
  });
  if (!parts) return "N/A";
  return `${formatDate(parts.date, "short")} (${parts.periodLabel})`;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/40 py-3 last:border-0 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export type ViewStage2DocumentModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  document: Stage2Document | null;
  isClientView?: boolean;
  /** Application id for workers-hosted file preview `{base}/{leadId}/{fileName}` */
  previewLeadId?: string;
};

export function ViewStage2DocumentModal({
  isOpen,
  onOpenChange,
  document,
  previewLeadId,
}: ViewStage2DocumentModalProps) {
  const reduceMotion = useReducedMotion();
  const title = document?.document_name || document?.file_name || "Document";

  const docUrl = document ? getDocumentUrl(document) : "";
  const viewUrl = docUrl;
  const downloadUrl = docUrl || undefined;

  const motionBody = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion
      ? { duration: 0.15 }
      : { type: "spring" as const, stiffness: 420, damping: 36 },
  };

  const resolvedEoiExpiry =
    document?.type === "eoi" ? getResolvedEoiExpiryDate(document) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="flex h-[80vh] w-full max-w-[1240px] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              {document ? (
                <DialogTitle className="truncate text-base font-medium">{typeLabel(document.type)} document</DialogTitle>
              ) : (
                <DialogTitle className="truncate text-base font-medium">{title}</DialogTitle>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            mode="ghost"
            className="cursor-pointer shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <Cross2Icon className="size-4" />
          </Button>
        </DialogHeader>

        {document ? (
          <motion.div
            className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
            {...motionBody}
          >
            <div className="flex max-lg:min-h-[36vh] min-h-0 flex-1 flex-col overflow-hidden border-b lg:min-h-0 lg:border-b-0 lg:border-r">
              <DocumentEmbedPreview
                className="min-h-0 flex-1"
                fileName={document.file_name || document.document_name || "document"}
                viewUrl={viewUrl}
                downloadUrl={downloadUrl}
                leadId={document.storage_type === "r2" ? null : (previewLeadId ?? null)}
                zohoGradientViewButton
                suppressEntranceMotion
              />
            </div>

            {/* Details */}
            <div
              className={cn(
                "flex w-full shrink-0 flex-col overflow-hidden lg:w-[min(420px,40%)]",
                "bg-muted/20",
              )}
            >
              <div className="border-b border-border/40 px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground">Details</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
                <dl>
                  {document.type === "eoi" && (
                    <>
                      <DetailRow label="State">
                        {document.state ? getStage2StateDisplay(document.state) : "N/A"}
                      </DetailRow>
                      <DetailRow label="Subclass">{getStage2SubclassDisplay(document.subclass)}</DetailRow>
                      <DetailRow label="Points">{document.point ?? "N/A"}</DetailRow>
                      <DetailRow label="Date">
                        {document.date ? formatDate(document.date, "short") : "N/A"}
                      </DetailRow>
                      <DetailRow label="Expiry">
                        {resolvedEoiExpiry
                          ? formatDate(resolvedEoiExpiry, "short")
                          : "—"}
                      </DetailRow>
                      <DetailRow label="Skill assessing body">
                        {getStage2AnzscoDisplay(document.skill_assessing_body)}
                      </DetailRow>
                      {/* <DetailRow label="Language assessing body">
                        {getStage2AnzscoDisplay(document.language_assessing_body)}
                      </DetailRow> */}
                    </>
                  )}
                  {document.type === "invitation" && (
                    <>
                      <DetailRow label="Invitation type">
                        {invitationTypeLabel(document.invitation_type)}
                      </DetailRow>
                      <DetailRow label="Skill assessing body">
                        {getStage2AnzscoDisplay(document.skill_assessing_body)}
                      </DetailRow>
                      {/* <DetailRow label="Language assessing body">
                        {getStage2AnzscoDisplay(document.language_assessing_body)}
                      </DetailRow> */}
                      <DetailRow label="Date">
                        {document.date ? formatDate(document.date, "short") : "N/A"}
                      </DetailRow>
                      <DetailRow label="Subclass">{getStage2SubclassDisplay(document.subclass)}</DetailRow>
                      <DetailRow label="State">
                        {document.state ? getStage2StateDisplay(document.state) : "N/A"}
                      </DetailRow>
                      <DetailRow label="Points">{document.point ?? "N/A"}</DetailRow>
                      <DetailRow label="Expiry">
                        {document.expiry_at
                          ? formatDate(document.expiry_at, "short")
                          : document.deadline
                            ? formatDate(document.deadline, "short")
                            : "N/A"}
                      </DetailRow>
                    </>
                  )}
                  {document.type === "outcome" && (
                    <>
                      <DetailRow label="Outcome">{document.outcome ?? "N/A"}</DetailRow>
                      <DetailRow label="Skill assessing body">
                        {getStage2AnzscoDisplay(document.skill_assessing_body)}
                      </DetailRow>
                      <DetailRow label="Language assessing body">
                        {getStage2AnzscoDisplay(document.language_assessing_body)}
                      </DetailRow>
                      <DetailRow label="Outcome date">
                        {document.outcome_date ? formatDate(document.outcome_date, "short") : "N/A"}
                      </DetailRow>
                      <DetailRow label="Expiry date">{outcomeExpiryLabel(document)}</DetailRow>
                    </>
                  )}

                  {/* <DetailRow label="Document type">{document.document_type || "—"}</DetailRow> */}
                  <DetailRow label="File name">
                    <TruncatedText className="max-w-full">{document.file_name?.slice(0, 20) || "—"}</TruncatedText>
                  </DetailRow>
                  <DetailRow label="Uploaded by">
                    <TruncatedText className="max-w-full">{document.uploaded_by?.slice(0, 20) || "—"}</TruncatedText>
                  </DetailRow>
                  <DetailRow label="Uploaded at">
                    {document.uploaded_at ? formatDate(document.uploaded_at, "short") : "—"}
                  </DetailRow>
                </dl>
              </div>
            </div>
          </motion.div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
