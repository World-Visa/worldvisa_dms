"use client";

import { TableCell } from "@/components/ui/table";
import { getStage2AnzscoDisplay } from "@/lib/stage2DocumentDisplay";
import type { Stage2Document } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
import { Stage2RowActionsCell } from "@/components/applications/stage2/Stage2RowActionsCell";
import {
  MotionTableRow,
  useStage2RowMotionProps,
} from "@/components/applications/stage2/Stage2MotionTableRow";
import TruncatedText from "@/components/ui/truncated-text";

type OutcomeDocumentRowProps = {
  rowIndex: number;
  document: Stage2Document;
  isClientView: boolean;
  onView: (document: Stage2Document) => void;
  onEdit?: (document: Stage2Document) => void;
  onDelete?: (document: Stage2Document) => void;
};

export function OutcomeDocumentRow({
  rowIndex,
  document,
  isClientView,
  onView,
  onEdit,
  onDelete,
}: OutcomeDocumentRowProps) {
  const skillAssessingBodyDisplay = getStage2AnzscoDisplay(document.skill_assessing_body);
  const outcome = document.outcome ?? "N/A";
  const motionProps = useStage2RowMotionProps(rowIndex);
  
  return (
    <MotionTableRow
      {...motionProps}
      className="group transition-colors duration-200"
    >
      <TableCell className="min-w-0 font-normal">
        <TruncatedText className="max-w-full text-neutral-700">{document.document_name || document.file_name}</TruncatedText>
      </TableCell>
      <TableCell className="min-w-0 font-normal">
        <TruncatedText className="max-w-full text-neutral-700">{outcome}</TruncatedText>
      </TableCell>
      <TableCell className="min-w-0 font-normal">
        <TruncatedText className="max-w-full text-neutral-700">{skillAssessingBodyDisplay}</TruncatedText>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm font-normal">
        {document.outcome_date ? formatDate(document.outcome_date, "short") : "N/A"}
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
