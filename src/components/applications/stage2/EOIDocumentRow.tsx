import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  getAnzscoCodeByCode,
  getStateByCode,
  getVisaSubclassByCode,
} from "@/lib/constants/australianData";
import type { Stage2Document } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
import { Stage2RowActionsCell } from "@/components/applications/stage2/Stage2RowActionsCell";
import { cn } from "@/lib/utils";
import TruncatedText from "@/components/ui/truncated-text";

type EOIDocumentRowProps = {
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
  document,
  isClientView,
  sameFileAsPrev,
  onView,
  onEdit,
  onDelete,
}: EOIDocumentRowProps) {
  const anzscoDisplay = getAnzscoDisplay(document.skill_assessing_body);

  return (
    <TableRow>
      <TableCell>
        <TruncatedText className="max-w-[32ch]">
          {document.document_name || document.file_name}
        </TruncatedText>
      </TableCell>
      <TableCell>{formatDate(document.date, "short")}</TableCell>
      <TableCell>{getSubclassDisplay(document.subclass)}</TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {document.state ? getStateDisplay(document.state) : "N/A"}
        </Badge>
      </TableCell>
      <TableCell>{document.point ?? "N/A"}</TableCell>
      <TableCell>
        <TruncatedText className="max-w-[32ch]">
          {anzscoDisplay}
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
