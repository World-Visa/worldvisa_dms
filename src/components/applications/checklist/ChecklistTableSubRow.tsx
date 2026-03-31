"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  RiCloseCircleLine,
  RiEyeLine,
  RiMore2Fill,
  RiUploadLine,
} from "react-icons/ri";
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
import { CommentIcon } from "@/components/applications/CommentIcon";
import { DocumentRejectedPopover } from "@/components/ui/primitives/document-rejected-popover";
import TruncatedText from "@/components/ui/truncated-text";
import ViewDocumentSheet from "@/components/applications/ViewDocumentSheet";
import type { Document } from "@/types/applications";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_STATUS_BADGE,
  DOCUMENT_STATUS_FALLBACK,
} from "@/lib/constants/documents";
import { getFileIcon } from "@/lib/utils/fileIcon";

interface ChecklistTableSubRowProps {
  doc: Document;
  allDocs: Document[];
  isLast: boolean;
  idx: number;
  total: number;
  documentType: string;
  category: string;
  applicationId: string;
  isClientView?: boolean;
  commentCounts: Record<string, number>;
  onReupload: (docId: string, documentType: string, category: string) => void;
}

export function ChecklistTableSubRow({
  doc,
  allDocs,
  isLast,
  idx,
  total,
  documentType,
  category,
  applicationId,
  isClientView,
  commentCounts,
  onReupload,
}: ChecklistTableSubRowProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const cfg = DOCUMENT_STATUS_BADGE[doc.status] ?? DOCUMENT_STATUS_FALLBACK;
  const uploadedAt = doc.uploaded_at
    ? new Date(doc.uploaded_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
    : "—";

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            opacity: { duration: 0.18, delay: idx * 0.045 },
            y: { type: "spring", stiffness: 480, damping: 36, delay: idx * 0.045 },
          },
        }}
        exit={{
          opacity: 0,
          y: -6,
          transition: {
            duration: 0.1,
            delay: (total - 1 - idx) * 0.025,
            ease: "easeIn",
          },
        }}
        onClick={() => setIsSheetOpen(true)}
        className={cn(
          "bg-neutral-50/40 hover:bg-neutral-50/80 cursor-pointer",
          isLast
            ? "[&>td]:border-b [&>td]:border-neutral-alpha-200"
            : "[&>td]:border-0",
        )}
      >
        {/* Cell 1 — Name + tree connector */}
        <td className="px-6 py-1.5 align-middle">
          <div className="relative flex items-center gap-1.5 pl-[54px]">
            {isLast ? (
              <div
                className="absolute border-l-[1.5px] border-b-[1.5px] border-neutral-200 rounded-bl-[6px]"
                style={{ left: 44, top: 0, bottom: "50%", width: 10 }}
              />
            ) : (
              <>
                <div
                  className="absolute border-l-[1.5px] border-neutral-200"
                  style={{ left: 44, top: 0, bottom: 0 }}
                />
                <div
                  className="absolute border-b-[1.5px] border-neutral-200"
                  style={{ left: 44, top: "50%", width: 10 }}
                />
              </>
            )}
            <Image
              src={getFileIcon(doc.file_name)}
              width={30}
              height={30}
              alt=""
              className="shrink-0"
            />
            <TruncatedText className="flex-1 text-sm font-light leading-none hover:underline hover:underline-offset-2 hover:font-medium transition-all duration-200 hover:text-neutral-800 text-neutral-600 max-w-[30ch]">
              {doc.file_name}
            </TruncatedText>
          </div>
        </td>

        {/* Cell 2 — Status */}
        <td className="hidden md:table-cell px-6 py-1.5 align-middle">
          {doc.status === "rejected" ? (
            <DocumentRejectedPopover
              rejectMessage={doc.reject_message ?? "No reason provided"}
            >
              <StatusBadge variant="light" status="failed">
                <StatusBadgeIcon as={RiCloseCircleLine} />
                Rejected
              </StatusBadge>
            </DocumentRejectedPopover>
          ) : (
            <StatusBadge variant="light" status={cfg.status}>
              <StatusBadgeIcon as={cfg.icon} />
              {cfg.label}
            </StatusBadge>
          )}
        </td>

        {/* Cell 3 — Date (Requirement column) */}
        <td className="hidden md:table-cell px-6 py-1.5 align-middle">
          <span className="text-xs text-text-soft whitespace-nowrap">
            {uploadedAt}
          </span>
        </td>

        {/* Cell 4 — Comments */}
        <td className="w-20 px-6 py-1.5 align-middle">
          <CommentIcon
            documentId={doc._id}
            commentCount={commentCounts[doc._id] ?? 0}
            size="sm"
          />
        </td>

        {/* Cell 5 — Actions */}
        <td
          className="w-20 px-6 py-1.5 text-right align-middle"
          onClick={stopPropagation}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <CompactButton icon={RiMore2Fill} variant="ghost" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-46">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setIsSheetOpen(true)}
                >
                  <RiEyeLine />
                  View Document
                </DropdownMenuItem>
                {doc.status === "rejected" && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onReupload(doc._id, documentType, category)}
                  >
                    <RiUploadLine />
                    Reupload Document
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </motion.tr>

      <ViewDocumentSheet
        document={doc}
        documents={allDocs}
        applicationId={applicationId}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        isClientView={isClientView}
        hideTrigger
        documentType={documentType}
        category={category}
      />
    </>
  );
}
