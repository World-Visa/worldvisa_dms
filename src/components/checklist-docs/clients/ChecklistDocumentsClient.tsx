'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ViewTransition } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ListNoResults } from '@/components/applications/list-no-results';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  DirectionEnum,
} from '@/components/ui/table';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import {
  useDeleteDocument,
  useGroupedDocuments,
  useUpdateDocumentState,
  useVisaServiceTypes,
} from '@/hooks/useChecklistDocumentTemplates';
import type { ChecklistDocumentTemplate } from '@/types/checklistDocumentTemplates';
import { CHECKLIST_DOC_TEMPLATE_COLUMNS } from '@/lib/constants/checklistDocTemplatesTable';
import {
  ChecklistTemplateTableLoadingRow,
  ChecklistTemplateTableRow,
  COLUMN_COUNT,
} from '@/components/checklist-docs/ChecklistTemplateTableRow';
import { ChecklistDocsBreadcrumb } from '../breadcrumb/ChecklistDocsBreadcrumb';
import { ChecklistDocumentSheet } from '../sheet/ChecklistDocumentSheet';

interface ChecklistDocumentsClientProps {
  visaType: string;
  category: string;
}

export const ChecklistDocumentsClient = memo(
  function ChecklistDocumentsClient({
    visaType,
    category,
  }: ChecklistDocumentsClientProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editDoc, setEditDoc] = useState<
      ChecklistDocumentTemplate | undefined
    >();
    const [deleteTarget, setDeleteTarget] =
      useState<ChecklistDocumentTemplate | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortDirection, setSortDirection] = useState<
      DirectionEnum | false
    >(false);

    const { data: groupedData, isLoading } = useGroupedDocuments(visaType);
    const { data: visaTypesData } = useVisaServiceTypes();
    const updateState = useUpdateDocumentState();
    const deleteDocument = useDeleteDocument();

    const visaTypeCount = (
      visaTypesData?.data?.visaServiceTypes ?? []
    ).filter((v) => v !== 'All').length;

    const documents =
      groupedData?.data?.groups?.find((g) => g.category === category)
        ?.documents ?? [];

    useEffect(() => {
      setCurrentPage(1);
    }, [category, visaType]);

    const sortedDocuments = useMemo(() => {
      if (!sortDirection) return documents;
      return [...documents].sort((a, b) => {
        const cmp = a.documentType.localeCompare(b.documentType);
        return sortDirection === DirectionEnum.ASC ? cmp : -cmp;
      });
    }, [documents, sortDirection]);

    const totalCount = sortedDocuments.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
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

    const openCreate = useCallback(() => {
      setEditDoc(undefined);
      setSheetOpen(true);
    }, []);

    const openEdit = useCallback((doc: ChecklistDocumentTemplate) => {
      setEditDoc(doc);
      setSheetOpen(true);
    }, []);

    const handleToggleState = useCallback(
      (doc: ChecklistDocumentTemplate) => {
        updateState.mutate({
          id: doc._id,
          state: doc.state === 'active' ? 'inactive' : 'active',
          visaType,
        });
      },
      [updateState, visaType],
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <ViewTransition
            name={`visa-folder-header-${visaType.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <ChecklistDocsBreadcrumb visaType={visaType} category={category} />
          </ViewTransition>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <RiAddLine className="mr-1.5 size-4" />
            Add Document
          </Button>
        </div>

        {!isLoading && documents.length === 0 ? (
          <div className="flex h-[calc(60vh-200px)] min-h-[240px] items-center justify-center py-16">
            <ListNoResults
              title="No documents yet"
              description="Add checklist template documents for this category."
              action={
                <Button size="sm" onClick={openCreate}>
                  Add the first one
                </Button>
              }
            />
          </div>
        ) : (
          <Table
            isLoading={isLoading}
            loadingRowsCount={8}
            loadingRow={<ChecklistTemplateTableLoadingRow />}
          >
            <TableHeader>
              <TableRow>
                {CHECKLIST_DOC_TEMPLATE_COLUMNS.map((col) =>
                  col.label === 'Document Type' ? (
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
                {paginatedDocuments.map((doc) => (
                  <ChecklistTemplateTableRow
                    key={doc._id}
                    document={doc}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onToggleState={handleToggleState}
                    isStateTogglePending={
                      updateState.isPending &&
                      updateState.variables?.id === doc._id
                    }
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
                    onPreviousPage={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    onNextPage={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 25, 50]}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}

        <ChecklistDocumentSheet
          mode={editDoc ? 'edit' : 'create'}
          document={editDoc}
          visaType={visaType}
          category={category}
          open={sheetOpen}
          onOpenChange={(o) => {
            setSheetOpen(o);
            if (!o) setEditDoc(undefined);
          }}
          visaTypeCount={visaTypeCount}
        />

        <ConfirmationModal
          open={!!deleteTarget}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          onConfirm={() => {
            if (deleteTarget) {
              deleteDocument.mutate({ id: deleteTarget._id, visaType });
              setDeleteTarget(null);
            }
          }}
          title="Delete document?"
          description={
            <>
              <strong>{deleteTarget?.documentType}</strong> will be permanently
              removed from <em>{category}</em>. This cannot be undone.
            </>
          }
          confirmText="Delete"
          variant="destructive"
          isLoading={deleteDocument.isPending}
        />
      </div>
    );
  },
);
