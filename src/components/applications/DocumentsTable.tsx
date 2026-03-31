"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  DirectionEnum,
} from "@/components/ui/table";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { ListNoResults } from "@/components/applications/list-no-results";
import { DocumentTableRow } from "@/components/applications/documents/DocumentTableRow";
import { DOCUMENTS_TABLE_COLUMNS } from "@/lib/constants/documentsTable";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useDocumentCommentCounts } from "@/hooks/useDocumentCommentCounts";
import {
  useMoveDocument,
  useMoveDocumentAgent,
} from "@/hooks/useDocumentMovedDocs";
import type { Document as ApplicationDocument } from "@/types/applications";
import type { ClientDocumentsResponse } from "@/types/client";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import ViewDocumentSheet from "@/components/applications/ViewDocumentSheet";
import { ReuploadDocumentModal } from "@/components/applications/ReuploadDocumentModal";
import { UploadDocumentsModal } from "@/components/applications/UploadDocumentsModal";

interface DocumentsTableProps {
  applicationId: string;
  documents?: ApplicationDocument[];
  isLoading?: boolean;
  error?: Error | null;
  isClientView?: boolean;
  clientDocumentsData?: ClientDocumentsResponse;
  clientIsLoading?: boolean;
  clientError?: Error | null;
  onClientDeleteSuccess?: () => void;
  onReuploadDocument?: (
    documentId: string,
    documentType: string,
    category: string,
  ) => void;
  onUploadSuccess?: () => void;
}

const COLUMN_COUNT = DOCUMENTS_TABLE_COLUMNS.length;

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {DOCUMENTS_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
});

export function DocumentsTable({
  applicationId,
  documents: adminDocuments,
  isLoading: adminIsLoading,
  error: adminError,
  isClientView = false,
  clientDocumentsData,
  clientIsLoading = false,
  clientError = null,
  onClientDeleteSuccess,
  onReuploadDocument,
  onUploadSuccess,
}: DocumentsTableProps) {
  const { isAdmin } = useHasPermission();

  // Modal / sheet state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<ApplicationDocument | null>(null);
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] =
    useState<ApplicationDocument | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] =
    useState<string>("");
  const [selectedReuploadDocumentCategory, setSelectedReuploadDocumentCategory] =
    useState<string>("");

  // Pagination + sort state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortDirection, setSortDirection] = useState<DirectionEnum | false>(false);

  // Mutations
  const clientMoveDocumentMutation = useMoveDocument();
  const agentMoveDocumentMutation = useMoveDocumentAgent();

  // Resolve data source
  const isLoading = isClientView ? clientIsLoading : adminIsLoading;
  const error = isClientView ? clientError : adminError;

  const documents: ApplicationDocument[] = isClientView
    ? ((clientDocumentsData?.data?.documents ?? []) as unknown as ApplicationDocument[])
    : adminDocuments ?? [];

  // Comment counts
  const documentIds = useMemo(() => documents.map((d) => d._id), [documents]);
  const { data: commentCounts = {} } = useDocumentCommentCounts(documentIds);

  // Sorted documents
  const sortedDocuments = useMemo(() => {
    if (!sortDirection) return documents;
    return [...documents].sort((a, b) => {
      const catA = a.document_category ?? "";
      const catB = b.document_category ?? "";
      return sortDirection === DirectionEnum.ASC
        ? catA.localeCompare(catB)
        : catB.localeCompare(catA);
    });
  }, [documents, sortDirection]);

  const totalCount = sortedDocuments.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleSortToggle = useCallback(() => {
    setSortDirection((prev) => {
      if (prev === false) return DirectionEnum.ASC;
      if (prev === DirectionEnum.ASC) return DirectionEnum.DESC;
      return false;
    });
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Row action handlers
  const handleViewDocument = useCallback((document: ApplicationDocument) => {
    setSelectedDocument(document);
    setViewSheetOpen(true);
  }, []);

  const handleCloseViewSheet = useCallback(() => {
    setViewSheetOpen(false);
    setSelectedDocument(null);
  }, []);

  const handleDeleteDocument = useCallback((documentId: string, fileName: string) => {
    setDocumentToDelete({ id: documentId, name: fileName });
    setDeleteDialogOpen(true);
  }, []);

  const handleOpenReuploadModal = useCallback(
    (documentId: string, documentType: string, category: string) => {
      const doc = documents.find((d) => d._id === documentId);
      if (!doc) return;
      setSelectedReuploadDocument(doc);
      setSelectedReuploadDocumentType(documentType);
      setSelectedReuploadDocumentCategory(category);
      setIsReuploadModalOpen(true);
    },
    [documents],
  );

  const handleReuploadModalClose = useCallback(() => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType("");
    setSelectedReuploadDocumentCategory("");
  }, []);

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      if (isClientView) {
        await clientMoveDocumentMutation.mutateAsync(documentToDelete.id);
        onClientDeleteSuccess?.();
      } else {
        await agentMoveDocumentMutation.mutateAsync(documentToDelete.id);
      }
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch {}
  };

  // Empty / error states
  if (error) return null;

  if (!isLoading && documents.length === 0) {
    return (
      <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
        <ListNoResults
          title="No documents uploaded"
          description="Documents uploaded for this application will appear here."
        />
      </div>
    );
  }

  const isDeletePending = isClientView
    ? clientMoveDocumentMutation.isPending
    : agentMoveDocumentMutation.isPending;

  return (
    <>
      <Table
        isLoading={isLoading}
        loadingRowsCount={8}
        loadingRow={<TableLoadingRow />}
      >
        <TableHeader>
          <TableRow>
            {DOCUMENTS_TABLE_COLUMNS.map((col) =>
              col.label === "Category" ? (
                <TableHead
                  key={col.label}
                  className={col.headerClassName}
                  sortable
                  sortDirection={sortDirection}
                  onSort={handleSortToggle}
                >
                  {col.label}
                </TableHead>
              ) : (
                <TableHead key={col.label} className={col.headerClassName}>
                  {col.label}
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        {!isLoading && (
          <TableBody>
            {paginatedDocuments.map((doc, idx) => (
              <DocumentTableRow
                key={doc._id}
                document={doc}
                rowIndex={(currentPage - 1) * pageSize + idx + 1}
                commentCount={commentCounts[doc._id] ?? 0}
                isAdmin={isAdmin}
                isClientView={isClientView}
                onView={handleViewDocument}
                onDelete={handleDeleteDocument}
                onReupload={handleOpenReuploadModal}
                isDeletePending={isDeletePending}
              />
            ))}
          </TableBody>
        )}
        <TableFooter>
          <TableRow>
            <TableCell colSpan={COLUMN_COUNT} className="p-0">
              <TablePaginationFooter
                pageSize={pageSize}
                currentPageItemsCount={paginatedDocuments.length}
                totalCount={totalCount}
                hasPreviousPage={currentPage > 1}
                hasNextPage={currentPage < totalPages}
                onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 25, 50]}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <UploadDocumentsModal
        isOpen={false}
        onClose={() => {}}
        applicationId={applicationId}
        company={undefined}
        isClientView={isClientView}
        onSuccess={onUploadSuccess}
      />

      <ConfirmationModal
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        title="Delete Document"
        description={
          <>
            Delete <strong>{documentToDelete?.name}</strong>? This cannot be undone.
          </>
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletePending}
      />

      {selectedDocument && (
        <ViewDocumentSheet
          document={selectedDocument}
          documents={documents}
          applicationId={applicationId}
          isOpen={viewSheetOpen}
          onClose={handleCloseViewSheet}
          documentType={selectedDocument.document_name ?? "Document"}
          category={selectedDocument.document_category ?? "Other Documents"}
          isClientView={isClientView}
        />
      )}

      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={handleReuploadModalClose}
        applicationId={applicationId}
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
        isClientView={isClientView}
      />
    </>
  );
}
