import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { getStateByCode, getVisaSubclassByCode } from "@/lib/constants/australianData";
import type { Stage2Document } from "@/types/stage2Documents";
import { formatDate } from "@/utils/format";
import { Stage2RowActionsCell } from "@/components/applications/stage2/Stage2RowActionsCell";
import TruncatedText from "@/components/ui/truncated-text";

type InvitationDocumentRowProps = {
  document: Stage2Document;
  isClientView: boolean;
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

export function InvitationDocumentRow({
  document,
  isClientView,
  onView,
  onEdit,
  onDelete,
}: InvitationDocumentRowProps) {
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
      <TableCell>{document.deadline ? formatDate(document.deadline, "short") : "N/A"}</TableCell>

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
