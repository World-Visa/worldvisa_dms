"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  RiArrowRightSLine,
  RiCloseCircleLine,
  RiFileTextLine,
  RiMore2Fill,
  RiTimeLine,
  RiUploadLine,
} from "react-icons/ri";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { CompactButton } from "@/components/ui/primitives/button-compact";
import {
  StatusBadge,
  StatusBadgeIcon,
} from "@/components/ui/primitives/status-badge";
import { Badge } from "@/components/ui/primitives/badge";
import { HighlightText } from "@/components/ui/HighlightText";
import { CommentIcon } from "@/components/applications/CommentIcon";
import { DocumentRejectedPopover } from "@/components/ui/primitives/document-rejected-popover";
import TruncatedText from "@/components/ui/truncated-text";
import { DescriptionDialog } from "./DescriptionDialog";
import { ChecklistTableSubRow } from "./ChecklistTableSubRow";
import { Document } from "@/types/applications";
import type { DocumentRequirement } from "@/types/checklist";
import { cn } from "@/lib/utils";
import { DOCUMENT_STATUS_BADGE } from "@/lib/constants/documents";

interface ChecklistTableItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: Document | unknown;
  requirement?: DocumentRequirement;
  isSelected?: boolean;
  company_name?: string;
  company?: {
    name: string;
    fromDate: string;
    toDate: string;
    category: string;
  };
  checklist_id?: string;
  rejectedRemark?: string;
  documentStatus?: string;
  description?: string;
  instruction?: string;
}

interface ChecklistTableRowProps {
  item: ChecklistTableItem;
  index: number;
  startIndex: number;
  searchQuery?: string;
  isClientView?: boolean;
  applicationId: string;
  onViewDocuments: (documentType: string, companyCategory?: string) => void;
  onUpload: (documentType: string, category: string) => void;
  onReupload: (documentId: string, documentType: string, category: string) => void;
  onViewRejection?: (document: Document, documentType: string, category: string) => void;
  commentCounts?: Record<string, number>;
  documentCounts?: Record<string, number>;
  uploadedDocuments?: Document[];
  allowedDocumentCount?: number;
}

export const ChecklistTableRow = memo(function ChecklistTableRow({
  item,
  searchQuery,
  isClientView,
  applicationId,
  onViewDocuments,
  onUpload,
  onReupload,
  commentCounts = {},
  documentCounts = {},
  uploadedDocuments = [],
  allowedDocumentCount,
}: ChecklistTableRowProps) {
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const uploadedDoc = item.uploadedDocument as Document | undefined;
  const isRejected = item.documentStatus === "rejected";
  const docCount = documentCounts[`${item.documentType}_${item.category || "default"}`] ?? 0;
  const isOverLimit = allowedDocumentCount !== undefined && docCount > allowedDocumentCount;
  const isExpandable = uploadedDocuments.length > 0;

  const documentType = item.documentType || uploadedDoc?.document_type || "Document";
  const category = item.category || uploadedDoc?.document_category || "Other Documents";

  const handleViewDocuments = () => onViewDocuments(documentType, category);
  const handleUpload = () => onUpload(item.documentType, item.category);
  const handleReupload = () => {
    if (uploadedDoc?._id) onReupload(uploadedDoc._id, documentType, category);
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
  const toggleExpand = () => {
    if (isExpandable) setIsExpanded((v) => !v);
  };

  return (
    <>
      <TableRow
        className={cn(
          "transition-colors duration-200",
          isExpanded && isExpandable && "[&>td]:border-b-0",
          isExpanded && "bg-neutral-50/40",
        )}
        onClick={toggleExpand}
        style={{ cursor: isExpandable ? "pointer" : "default" }}
      >
        {/* Document Name */}
        <TableCell>
          <div className="flex items-center gap-2">
            {/* Animated chevron */}
            {isExpandable ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                className="text-neutral-400 hover:text-neutral-600 shrink-0"
                aria-label={isExpanded ? "Collapse documents" : "Expand documents"}
              >
                <motion.span
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="flex"
                >
                  <RiArrowRightSLine size={16} />
                </motion.span>
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {/* Folder icon — always shown for expandable rows */}
            {isExpandable ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isExpanded ? "open" : "closed"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.08, ease: "easeOut" }}
                  className="shrink-0"
                >
                  {isExpanded ? (
                    <Image
                      src="/icons/document-tree/folder-open-icon.png"
                      width={34}
                      height={40}
                      alt=""
                    />
                  ) : (
                    <div className="relative">
                      <Image
                        src="/icons/document-tree/folder-close-icon.png"
                        width={34}
                        height={40}
                        alt=""
                      />
                      <span className="absolute -bottom-0.5 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-neutral-600 text-white text-[9px] font-semibold leading-none px-0.5 tabular-nums">
                        {uploadedDocuments.length}
                      </span>
                    </div>
                  )}
                </motion.span>
              </AnimatePresence>
            ) : (
              <div className="shrink-0 flex items-center justify-center" style={{ width: 34, height: 40 }}>
                <Image
                  src="/icons/document-tree/folder-empty-icon.png"
                  width={46}
                  height={56}
                  alt=""
                  className="object-contain"
                />
              </div>
            )}

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <HighlightText
                  text={item.documentType}
                  query={searchQuery}
                  className="text-sm font-medium"
                />
                {/* Count pill — only shown when no folder icon (non-expandable rows) */}
                {!isExpandable && (docCount > 0 || allowedDocumentCount !== undefined) && (
                  <span
                    className={cn(
                      "inline-flex items-center text-xs px-1.5 py-0.5 rounded-md font-medium tabular-nums",
                      isOverLimit
                        ? "bg-error-lighter text-error-base"
                        : "bg-neutral-100 text-neutral-600",
                    )}
                  >
                    {docCount}
                    {allowedDocumentCount !== undefined ? `/${allowedDocumentCount}` : ""}
                  </span>
                )}
              </div>

              {/* Description — read-only */}
              {item.description?.trim() && (
                <div className="text-xs text-text-sub">
                  <span>
                    {item.description.length > 50
                      ? `${item.description.slice(0, 50)}…`
                      : item.description}
                  </span>
                  {item.description.trim().length > 50 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowDescriptionDialog(true); }}
                      className="ml-1 text-xs text-primary underline hover:text-primary/80"
                    >
                      Read more
                    </button>
                  )}
                </div>
              )}

              {/* Mobile-only status */}
              <div className="md:hidden flex flex-wrap gap-1 mt-0.5">
                <Badge variant="lighter" color="purple" size="md">
                  <TruncatedText className="max-w-[20ch]">{item.category}</TruncatedText>
                </Badge>
                {!isExpanded && (
                  item.isUploaded ? (
                    isRejected ? (
                      <DocumentRejectedPopover rejectMessage={item.rejectedRemark ?? "No reason provided"}>
                        <StatusBadge variant="light" status="failed">
                          <StatusBadgeIcon as={RiCloseCircleLine} />
                          Rejected
                        </StatusBadge>
                      </DocumentRejectedPopover>
                    ) : (
                      <StatusBadge variant="light" status="completed">
                        <StatusBadgeIcon as={DOCUMENT_STATUS_BADGE.uploaded.icon} />
                        Uploaded
                      </StatusBadge>
                    )
                  ) : (
                    <StatusBadge variant="light" status="disabled">
                      <StatusBadgeIcon as={RiTimeLine} />
                      Not Uploaded
                    </StatusBadge>
                  )
                )}
              </div>
            </div>
          </div>
        </TableCell>

        {/* Status — hidden when expanded */}
        <TableCell className="hidden md:table-cell">
          {isExpanded ? (
            <span className="text-text-soft text-sm">—</span>
          ) : item.isUploaded ? (
            isRejected ? (
              <DocumentRejectedPopover rejectMessage={item.rejectedRemark ?? "No reason provided"}>
                <StatusBadge variant="light" status="failed">
                  <StatusBadgeIcon as={RiCloseCircleLine} />
                  Rejected
                </StatusBadge>
              </DocumentRejectedPopover>
            ) : (
              <StatusBadge variant="light" status="completed">
                <StatusBadgeIcon as={DOCUMENT_STATUS_BADGE.uploaded.icon} />
                Uploaded
              </StatusBadge>
            )
          ) : (
            <StatusBadge variant="light" status="disabled">
              <StatusBadgeIcon as={RiTimeLine} />
              Not Uploaded
            </StatusBadge>
          )}
        </TableCell>

        {/* Requirement — hidden when expanded */}
        <TableCell className="hidden md:table-cell">
          {isExpanded ? (
            <span className="text-text-soft text-sm">—</span>
          ) : item.requirement === "mandatory" ? (
            <Badge variant="lighter" color="red" size="md">Mandatory</Badge>
          ) : item.requirement === "optional" ? (
            <Badge variant="lighter" color="yellow" size="md">Optional</Badge>
          ) : (
            <span className="text-text-soft text-sm">—</span>
          )}
        </TableCell>

        {/* Comments — hidden when expanded */}
        <TableCell className="w-20">
          {isExpanded ? (
            <span className="text-xs text-text-soft">—</span>
          ) : item.isUploaded && uploadedDoc ? (
            <CommentIcon
              documentId={uploadedDoc._id}
              commentCount={commentCounts[uploadedDoc._id] ?? 0}
              size="sm"
            />
          ) : (
            <span className="text-xs text-text-soft">0</span>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right w-20" onClick={stopPropagation}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <CompactButton icon={RiMore2Fill} variant="ghost" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-46">
              <DropdownMenuGroup>
                {item.isUploaded && !isExpandable && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleViewDocuments}
                  >
                    <RiFileTextLine />
                    View Document{docCount > 0 ? ` (${docCount})` : ""}
                  </DropdownMenuItem>
                )}
                {(!item.isUploaded || !isRejected) && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleUpload}
                  >
                    <RiUploadLine />
                    Upload Document
                  </DropdownMenuItem>
                )}
                {item.isUploaded && isRejected && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleReupload}
                  >
                    <RiUploadLine />
                    Reupload Document
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Sub-rows rendered directly in outer tbody for pixel-perfect column alignment */}
      <AnimatePresence>
        {isExpanded && uploadedDocuments.map((doc, idx) => (
          <ChecklistTableSubRow
            key={doc._id}
            doc={doc}
            allDocs={uploadedDocuments}
            isLast={idx === uploadedDocuments.length - 1}
            idx={idx}
            total={uploadedDocuments.length}
            documentType={documentType}
            category={category}
            applicationId={applicationId}
            isClientView={isClientView}
            commentCounts={commentCounts}
            onReupload={onReupload}
          />
        ))}
      </AnimatePresence>

      <DescriptionDialog
        isOpen={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        documentType={item.documentType}
        description={item.description ?? ""}
      />
    </>
  );
});
