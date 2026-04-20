"use client";

import { Badge } from "@/components/ui/primitives/badge";
import { TableCell } from "@/components/ui/table";
import {
  getStage2StateDisplay,
  getStage2SubclassDisplay,
} from "@/lib/stage2DocumentDisplay";
import type { Stage2Document } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
import { getResolvedEoiExpiryDate } from "@/lib/stage2/eoiExpiry";
import { Stage2RowActionsCell } from "@/components/applications/stage2/Stage2RowActionsCell";
import {
  MotionTableRow,
  useStage2RowMotionProps,
} from "@/components/applications/stage2/Stage2MotionTableRow";
import { cn } from "@/lib/utils";
import TruncatedText from "@/components/ui/truncated-text";

type EOIDocumentRowProps = {
  rowIndex: number;
  document: Stage2Document;
  isClientView: boolean;
  sameFileAsPrev?: boolean;
  onView: (document: Stage2Document) => void;
  onEdit?: (document: Stage2Document) => void;
  onDelete?: (document: Stage2Document) => void;
};

export function EOIDocumentRow({
  rowIndex,
  document,
  isClientView,
  sameFileAsPrev,
  onView,
  onEdit,
  onDelete,
}: EOIDocumentRowProps) {
  const motionProps = useStage2RowMotionProps(rowIndex);
  const stateLabel = document.state ? getStage2StateDisplay(document.state) : "N/A";
  const resolvedExpiry = getResolvedEoiExpiryDate(document);

  return (
    <MotionTableRow
      {...motionProps}
      className={cn(
        "group transition-colors duration-200 hover:bg-neutral-50",
        sameFileAsPrev && "bg-neutral-50/25",
      )}
    >
      <TableCell className="min-w-0 font-normal">
        <TruncatedText className="max-w-full text-neutral-700">{document.document_name?.slice(0, 20) || document.file_name?.slice(0, 20)}</TruncatedText>
      </TableCell>
      <TableCell className="min-w-0 font-normal">
        <Badge variant="lighter" color="purple" size="md" className="min-w-0 max-w-full">
          <TruncatedText className="max-w-[18ch]">{stateLabel}</TruncatedText>
        </Badge>
      </TableCell>

      <TableCell className="min-w-0">
        <TruncatedText className="max-w-full">{getStage2SubclassDisplay(document.subclass)}</TruncatedText>
      </TableCell>

      <TableCell className="whitespace-nowrap tabular-nums text-sm">
        {document.point ?? "N/A"}
      </TableCell>

      <TableCell className="whitespace-nowrap text-sm">
        {formatDate(document.date, "short")}
      </TableCell>

      <TableCell className="whitespace-nowrap text-sm tabular-nums">
        {resolvedExpiry ? formatDate(resolvedExpiry, "short") : "—"}
      </TableCell>

      <Stage2RowActionsCell
        document={document}
        isClientView={isClientView}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </MotionTableRow>
  );
}
