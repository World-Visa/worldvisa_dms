import { TableCell, TableRow } from "@/components/ui/table";
import { getAnzscoCodeByCode } from "@/lib/constants/australianData";
import type { Stage2Document } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
import { Stage2RowActionsCell } from "@/components/applications/stage2/Stage2RowActionsCell";
import TruncatedText from "@/components/ui/truncated-text";

type OutcomeDocumentRowProps = {
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
  document,
  isClientView,
  onView,
  onEdit,
  onDelete,
}: OutcomeDocumentRowProps) {
  const skillAssessingBodyDisplay = getAnzscoDisplay(document.skill_assessing_body);

  return (
    <TableRow>
      <TableCell>
        <TruncatedText className="max-w-[32ch]">
          {document.document_name || document.file_name}
        </TruncatedText>
      </TableCell>
      <TableCell>{document.uploaded_by}</TableCell>
      <TableCell>{formatDate(document.uploaded_at, "short")}</TableCell>
      <TableCell>{document.outcome || "N/A"}</TableCell>
      <TableCell>
        {document.outcome_date ? formatDate(document.outcome_date, "short") : "N/A"}
      </TableCell>
      <TableCell>
        <TruncatedText className="max-w-[32ch]">
          {skillAssessingBodyDisplay}
        </TruncatedText>
      </TableCell>

      <Stage2RowActionsCell
        document={document}
        isClientView={isClientView}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </TableRow>
  );
}
