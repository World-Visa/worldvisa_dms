import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  containerClassname = "max-h-[60vh] overflow-y-auto",
}: Stage2DocumentsTableProps) {
  const renderHeaderCells = () => {
    switch (type) {
      case "outcome":
        return (
          <>
            <TableHead>Document Name</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Uploaded At</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Outcome Date</TableHead>
            <TableHead>Skill Assessing Body</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </>
        );
      case "eoi":
        return (
          <>
            <TableHead>Document Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Subclass</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>ANZSCO</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </>
        );
      case "invitation":
        return (
          <>
            <TableHead>Document Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Subclass</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
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
      isLoading={isLoading}
      loadingRowsCount={5}
      loadingRow={<Stage2LoadingRow type={type} />}
      containerClassname={containerClassname}
    >
      <TableHeader>
        <TableRow>
          {renderHeaderCells()}
        </TableRow>
      </TableHeader>

      {!isLoading && (
        <>
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

          <TableFooter />
        </>
      )}
    </Table>
  );
}
