"use client";

import { Badge } from "@/components/ui/primitives/badge";
import { TableCell } from "@/components/ui/table";
import {
  getAnzscoCodeByCode,
  getStateByCode,
  getVisaSubclassByCode,
} from "@/lib/constants/australianData";
import type { Stage2Document } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
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

function getSubclassDisplay(code?: string) {
  if (!code) return "N/A";
  const subclass = getVisaSubclassByCode(code);
  return subclass ? subclass.label : code;
}

function getStateDisplay(code?: string) {
  if (!code) return "N/A";
  const state = getStateByCode(code);
  return state ? `${state.code} - ${state.name}` : code;
}

function getAnzscoDisplay(code?: string) {
  if (!code) return "N/A";
  const data = getAnzscoCodeByCode(code);
  if (data) return `${data.anzsco_code} - ${data.name} (${data.assessing_authority})`;
  return code;
}

export function EOIDocumentRow({
  rowIndex,
  document,
  isClientView,
  sameFileAsPrev,
  onView,
  onEdit,
  onDelete,
}: EOIDocumentRowProps) {
  const anzscoDisplay = getAnzscoDisplay(document.skill_assessing_body);
  const motionProps = useStage2RowMotionProps(rowIndex);
  const stateLabel = document.state ? getStateDisplay(document.state) : "N/A";

  return (
    <MotionTableRow
      {...motionProps}
      className={cn(
        "group transition-colors duration-200 hover:bg-neutral-50",
        sameFileAsPrev && "bg-neutral-50/25",
      )}
    >
      <TableCell className="min-w-0 font-medium">
        <TruncatedText className="max-w-full">{document.document_name || document.file_name}</TruncatedText>
      </TableCell>
      <TableCell className="whitespace-nowrap text-text-sub text-sm">
        {formatDate(document.date, "short")}
      </TableCell>
      <TableCell className="min-w-0">
        <TruncatedText className="max-w-full">{getSubclassDisplay(document.subclass)}</TruncatedText>
      </TableCell>
      <TableCell className="min-w-0">
        <Badge variant="lighter" color="purple" size="md" className="min-w-0 max-w-full">
          <TruncatedText className="max-w-[18ch]">{stateLabel}</TruncatedText>
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums text-sm">
        {document.point ?? "N/A"}
      </TableCell>
      <TableCell className="min-w-0">
        <TruncatedText className="max-w-full">{anzscoDisplay}</TruncatedText>
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
