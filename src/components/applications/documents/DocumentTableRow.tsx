"use client";

import { memo } from "react";
import {
  RiClockwiseLine,
  RiCloseCircleLine,
  RiDeleteBin2Line,
  RiErrorWarningFill,
  RiEyeLine,
  RiFolderForbidFill,
  RiMore2Fill,
  RiUploadLine,
} from "react-icons/ri";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  StatusBadge,
  StatusBadgeIcon,
} from "@/components/ui/primitives/status-badge";
import { DocumentRejectedPopover } from "@/components/ui/primitives/document-rejected-popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { CompactButton } from "@/components/ui/primitives/button-compact";
import { Badge } from "@/components/ui/primitives/badge";
import { CommentIcon } from "@/components/applications/CommentIcon";
import TruncatedText from "@/components/ui/truncated-text";
import type { Document } from "@/types/applications";
import { getCategoryDisplayProps } from "@/lib/utils/documentCategoryNormalizer";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_STATUS_BADGE,
  DOCUMENT_STATUS_FALLBACK,
} from "@/lib/constants/documents";

function inferCategory(document: Document): string | undefined {
  if (document.document_category) return document.document_category;
  if (!document.file_name) return undefined;

  const fileName = document.file_name.toLowerCase();

  if (
    fileName.includes("payslip") ||
    fileName.includes("salary") ||
    fileName.includes("experience") ||
    fileName.includes("work") ||
    fileName.includes("company") ||
    fileName.includes("employment")
  ) {
    return "Company Documents";
  }

  if (
    fileName.includes("passport") ||
    fileName.includes("aadhaar") ||
    fileName.includes("aadhar") ||
    fileName.includes("visa") ||
    fileName.includes("birth") ||
    fileName.includes("marriage")
  ) {
    return "Identity Documents";
  }

  if (
    fileName.includes("degree") ||
    fileName.includes("certificate") ||
    fileName.includes("10th") ||
    fileName.includes("12th") ||
    fileName.includes("bachelor") ||
    fileName.includes("master") ||
    fileName.includes("diploma") ||
    fileName.includes("ielts") ||
    fileName.includes("pte") ||
    fileName.includes("toefl")
  ) {
    return "Education Documents";
  }

  return "Other Documents";
}

interface DocumentTableRowProps {
  document: Document;
  rowIndex: number;
  commentCount: number;
  isAdmin: boolean;
  isClientView: boolean;
  onView: (document: Document) => void;
  onDelete: (documentId: string, fileName: string, status: string, documentType: string, category: string) => void;
  onReupload: (documentId: string, documentType: string, category: string) => void;
  isDeletePending: boolean;
}

export const DocumentTableRow = memo(function DocumentTableRow({
  document,
  rowIndex,
  commentCount,
  isClientView,
  onView,
  onDelete,
  onReupload,
  isDeletePending,
}: DocumentTableRowProps) {
  const isRejected = document.status === "rejected";
  const badgeCfg = DOCUMENT_STATUS_BADGE[document.status] ?? DOCUMENT_STATUS_FALLBACK;

  const canDelete = !isDeletePending;
  const canReupload = document.status === "rejected";

  const documentType = document.document_name ?? document.document_type ?? "Document";
  const category = inferCategory(document) ?? "Other Documents";

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const handleReupload = () => {
    onReupload(document._id, documentType, category);
  };

  const categoryProps = category ? getCategoryDisplayProps(category) : null;
  const formattedType = documentType.replace(/_/g, " ");

  return (
    <TableRow
      className={cn(
        "group relative isolate cursor-pointer transition-colors",
        isRejected
          ? "bg-error-lighter/40 hover:bg-error-lighter/60"
          : "hover:bg-neutral-50",
      )}
      onClick={() => onView(document)}
    >

      {/* Document Name */}
      <TableCell className="font-medium">
        <TruncatedText className="max-w-[28ch]">{document.file_name}</TruncatedText>
      </TableCell>

      {/* Type */}
      <TableCell>
        {documentType && documentType !== "Document" ? (
          <Badge variant="lighter" color="blue" size="md">
            <TruncatedText className="max-w-[16ch]">{formattedType}</TruncatedText>
          </Badge>
        ) : (
          <span className="text-text-soft text-sm">—</span>
        )}
      </TableCell>

      {/* Category */}
      <TableCell>
        {categoryProps ? (
          <Badge variant="lighter" color="purple" size="md">
            {categoryProps.displayText}
          </Badge>
        ) : (
          <span className="text-text-soft text-sm">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        {isRejected ? (
          <DocumentRejectedPopover
            rejectMessage={document.reject_message ?? "No reason provided"}
          >
            <StatusBadge variant="light" status="failed">
              <StatusBadgeIcon as={RiErrorWarningFill} />
              Rejected
            </StatusBadge>
          </DocumentRejectedPopover>
        ) : (
          <StatusBadge variant="light" status={badgeCfg.status}>
            <StatusBadgeIcon as={badgeCfg.icon} />
            {badgeCfg.label}
          </StatusBadge>
        )}
      </TableCell>

      {/* Comments */}
      <TableCell>
        <CommentIcon
          documentId={document._id}
          commentCount={commentCount}
          size="sm"
        />
      </TableCell>

      {/* Submitted At */}
      {/* <TableCell className="text-text-sub text-sm">
        {document.uploaded_at ? formatDate(document.uploaded_at, "time") : "—"}
      </TableCell> */}

      {/* Actions */}
      <TableCell className="text-right" onClick={stopPropagation}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <CompactButton
              icon={RiMore2Fill}
              variant="ghost"
              className="z-10 ml-auto"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={stopPropagation}>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onView(document)}
              >
                <RiEyeLine />
                View Document
              </DropdownMenuItem>
              {canReupload && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleReupload}
                >
                  <RiUploadLine />
                  Reupload Document
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-error-base focus:text-error-base"
                disabled={!canDelete}
                onClick={() => onDelete(document._id, document.file_name, document.status, documentType, category)}
              >
                <RiDeleteBin2Line />
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
