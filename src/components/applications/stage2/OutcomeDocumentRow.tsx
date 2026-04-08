"use client";

import { TableCell } from "@/components/ui/table";
import { getAnzscoCodeByCode } from "@/lib/constants/australianData";
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

function getAnzscoDisplay(code?: string) {
  if (!code) return "N/A";
  const data = getAnzscoCodeByCode(code);
  if (data) return `${data.anzsco_code} - ${data.name} (${data.assessing_authority})`;
  return code;
}

export function OutcomeDocumentRow({
  rowIndex,
  document,
  isClientView,
  onView,
  onEdit,
  onDelete,
}: OutcomeDocumentRowProps) {
  const skillAssessingBodyDisplay = getAnzscoDisplay(document.skill_assessing_body);
  const motionProps = useStage2RowMotionProps(rowIndex);
  const outcome = document.outcome ?? "N/A";

  return (
    <MotionTableRow
      {...motionProps}
      className="group transition-colors duration-200 hover:bg-neutral-50"
    >
      <TableCell className="min-w-0 font-medium">
        <TruncatedText className="max-w-full">{document.document_name || document.file_name}</TruncatedText>
      </TableCell>
      <TableCell className="min-w-0">
        <TruncatedText className="max-w-full">{document.uploaded_by}</TruncatedText>
      </TableCell>
      <TableCell className="whitespace-nowrap text-text-sub text-sm">
        {formatDate(document.uploaded_at, "short")}
      </TableCell>
      <TableCell className="min-w-0">
        <TruncatedText className="max-w-full">{outcome}</TruncatedText>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {document.outcome_date ? formatDate(document.outcome_date, "short") : "N/A"}
      </TableCell>
      <TableCell className="min-w-0">
        <TruncatedText className="max-w-full">{skillAssessingBodyDisplay}</TruncatedText>
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
