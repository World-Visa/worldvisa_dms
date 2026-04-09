import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EOIDocumentRow } from "@/components/applications/stage2/EOIDocumentRow";
import { InvitationDocumentRow } from "@/components/applications/stage2/InvitationDocumentRow";
import { OutcomeDocumentRow } from "@/components/applications/stage2/OutcomeDocumentRow";
import type { Stage2Document, Stage2DocumentType } from "@/types/stage2Documents";
import * as React from "react";

type Stage2DocumentsTableProps = {
  type: Stage2DocumentType;
  documents: Stage2Document[];
  isLoading?: boolean;
  isClientView?: boolean;
  onView: (document: Stage2Document) => void;
  onEdit?: (document: Stage2Document) => void;
  onDelete?: (document: Stage2Document) => void;
  containerClassname?: string;
};

function Stage2LoadingRow({ type }: { type: Stage2DocumentType }) {
  const colCount = type === "outcome" ? 7 : type === "eoi" ? 7 : 7;
  return (
    <TableRow>
      <TableCell colSpan={colCount} className="py-3">
        <div className="h-8 w-full animate-pulse rounded-md bg-neutral-100" />
      </TableCell>
    </TableRow>
  );
}

export function Stage2DocumentsTable({
  type,
  documents,
  isLoading = false,
  isClientView = false,
  onView,
  onEdit,
  onDelete,
  containerClassname = "max-h-[60vh] overflow-y-auto pb-8",
}: Stage2DocumentsTableProps) {
  const renderHeaderCells = () => {
    switch (type) {
      case "outcome":
        return (
          <>
            <TableHead className="min-w-0 w-[22%]">Document Name</TableHead>
            <TableHead className="w-[13%] min-w-0 whitespace-nowrap">Uploaded By</TableHead>
            <TableHead className="w-[12%] whitespace-nowrap">Uploaded At</TableHead>
            <TableHead className="w-[11%] min-w-0">Outcome</TableHead>
            <TableHead className="w-[12%] whitespace-nowrap">Outcome Date</TableHead>
            <TableHead className="min-w-0">Skill Assessing Body</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </>
        );
      case "eoi":
        return (
          <>
            <TableHead className="min-w-0 w-[24%]">Document Name</TableHead>
            <TableHead className="w-[10%] whitespace-nowrap">Date</TableHead>
            <TableHead className="min-w-0 w-[15%]">Subclass</TableHead>
            <TableHead className="min-w-0 w-[14%]">State</TableHead>
            <TableHead className="w-[7%] whitespace-nowrap">Points</TableHead>
            <TableHead className="min-w-0 w-[18%]">ANZSCO</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </>
        );
      case "invitation":
        return (
          <>
            <TableHead className="min-w-0 w-[24%]">Document Name</TableHead>
            <TableHead className="w-[10%] whitespace-nowrap">Date</TableHead>
            <TableHead className="min-w-0 w-[15%]">Subclass</TableHead>
            <TableHead className="min-w-0 w-[14%]">State</TableHead>
            <TableHead className="w-[7%] whitespace-nowrap">Points</TableHead>
            <TableHead className="w-[12%] whitespace-nowrap">Deadline</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </>
        );
    }
  };

  const displayDocuments = React.useMemo(() => {
    if (type !== "eoi") return documents;
    return [...documents].sort((a, b) => {
      const fileCompare = (a.document_name || a.file_name || "").localeCompare(
        b.document_name || b.file_name || "",
      );
      if (fileCompare !== 0) return fileCompare;
      return (a.state || "").localeCompare(b.state || "");
    });
  }, [documents, type]);

  return (
    <Table
      className="w-full table-fixed"
      isLoading={isLoading}
      loadingRowsCount={5}
      loadingRow={<Stage2LoadingRow type={type} />}
      containerClassname={containerClassname}
    >
      <TableHeader sticky={false}>
        <TableRow>
          {renderHeaderCells()}
        </TableRow>
      </TableHeader>

      {!isLoading && (
        <TableBody>
          {displayDocuments.map((document, index) => {
            const prevDoc = index > 0 ? displayDocuments[index - 1] : null;
            const sameFileAsPrev =
              type === "eoi" &&
              !!prevDoc &&
              (prevDoc.file_name || prevDoc.document_name) ===
                (document.file_name || document.document_name);

            if (type === "outcome") {
              return (
                <OutcomeDocumentRow
                  key={document._id}
                  rowIndex={index}
                  document={document}
                  isClientView={isClientView}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            }

            if (type === "invitation") {
              return (
                <InvitationDocumentRow
                  key={document._id}
                  rowIndex={index}
                  document={document}
                  isClientView={isClientView}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            }

            return (
              <EOIDocumentRow
                key={document._id}
                rowIndex={index}
                document={document}
                sameFileAsPrev={sameFileAsPrev}
                isClientView={isClientView}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </TableBody>
      )}
    </Table>
  );
}
