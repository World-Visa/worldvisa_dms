"use client";

import { Badge } from "@/components/ui/primitives/badge";
import { TableCell } from "@/components/ui/table";
import {
  getStage2StateDisplay,
  getStage2SubclassDisplay,
} from "@/lib/stage2DocumentDisplay";
import type { Stage2Document } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
import { Stage2RowActionsCell } from "@/components/applications/stage2/Stage2RowActionsCell";
import {
  MotionTableRow,
  useStage2RowMotionProps,
} from "@/components/applications/stage2/Stage2MotionTableRow";
import TruncatedText from "@/components/ui/truncated-text";

type InvitationDocumentRowProps = {
  rowIndex: number;
  document: Stage2Document;
  isClientView: boolean;
  onView: (document: Stage2Document) => void;
  onEdit?: (document: Stage2Document) => void;
  onDelete?: (document: Stage2Document) => void;
};

export function InvitationDocumentRow({
  rowIndex,
  document,
  isClientView,
  onView,
  onEdit,
  onDelete,
}: InvitationDocumentRowProps) {
  const motionProps = useStage2RowMotionProps(rowIndex);
  const stateLabel = document.state ? getStage2StateDisplay(document.state) : "N/A";

  return (
    <MotionTableRow
      {...motionProps}
      className="group transition-colors duration-200 hover:bg-neutral-50"
    >
      <TableCell className="min-w-0 font-medium">
        <TruncatedText className="max-w-full">{document.document_name?.slice(0, 20) || document.file_name?.slice(0, 20)}</TruncatedText>
      </TableCell>
      <TableCell className="whitespace-nowrap text-text-sub text-sm">
        {formatDate(document.date, "short")}
      </TableCell>
      <TableCell className="min-w-0">
        <TruncatedText className="max-w-full">{getStage2SubclassDisplay(document.subclass)}</TruncatedText>
      </TableCell>
      <TableCell className="min-w-0">
        <Badge variant="lighter" color="purple" size="md" className="min-w-0 max-w-full">
          <TruncatedText className="max-w-[18ch]">{stateLabel}</TruncatedText>
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums text-sm">
        {document.point ?? "N/A"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {document.expiry_at
          ? formatDate(document.expiry_at, "short")
          : document.deadline
            ? formatDate(document.deadline, "short")
            : "N/A"}
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
