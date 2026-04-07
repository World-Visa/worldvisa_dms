"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
import { DescriptionModal } from "@/components/applications/checklist/DescriptionModal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useChecklistMutations } from "@/hooks/useChecklist";
import {
  CHECKLIST_EDITOR_TABLE_COLUMNS,
  CHECKLIST_EDITOR_TABLE_COLUMN_COUNT,
} from "@/lib/constants/checklistEditorTable";
import type { DocumentRequirement } from "@/types/checklist";
import {
  ChecklistEditorTableRow,
  getDisplayCategory,
  type ChecklistTableItem,
} from "./ChecklistEditorTableRow";

export type { ChecklistTableItem } from "./ChecklistEditorTableRow";

interface ChecklistEditorTableProps {
  items: ChecklistTableItem[];
  mode: "create" | "edit";
  activeTab: "current" | "available";
  applicationId: string;
  onUpdateRequirement: (
    category: string,
    documentType: string,
    requirement: DocumentRequirement,
  ) => void;
}

export const ChecklistEditorTable = memo(function ChecklistEditorTable({
  items,
  mode,
  activeTab,
  applicationId,
  onUpdateRequirement,
}: ChecklistEditorTableProps) {
  const [descriptionEditItem, setDescriptionEditItem] =
    useState<ChecklistTableItem | null>(null);
  const [viewDescriptionItem, setViewDescriptionItem] =
    useState<ChecklistTableItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTableItem | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortDirection, setSortDirection] = useState<DirectionEnum | false>(
    false,
  );

  const { deleteItem, updateItemDescription } =
    useChecklistMutations(applicationId);

  const handleDelete = useCallback(
    async (checklistId: string) => {
      await deleteItem.mutateAsync({ checklist_id: checklistId });
    },
    [deleteItem],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.checklist_id) return;
    try {
      await handleDelete(deleteTarget.checklist_id);
      setDeleteTarget(null);
    } catch {
      // keep modal open on failure
    }
  }, [deleteTarget, handleDelete]);

  const sortedItems = useMemo(() => {
    if (!sortDirection) return items;
    return [...items].sort((a, b) => {
      const catA = getDisplayCategory(a.category);
      const catB = getDisplayCategory(b.category);
      return sortDirection === DirectionEnum.ASC
        ? catA.localeCompare(catB)
        : catB.localeCompare(catA);
    });
  }, [items, sortDirection]);

  const totalCount = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {CHECKLIST_EDITOR_TABLE_COLUMNS.map((colDef) =>
              colDef.label === "Category" ? (
                <TableHead
                  key={colDef.label}
                  className={colDef.headerClassName}
                  sortable
                  sortDirection={sortDirection}
                  onSort={handleSortToggle}
                >
                  {colDef.label}
                </TableHead>
              ) : (
                <TableHead key={colDef.label} className={colDef.headerClassName}>
                  {colDef.label}
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((item, idx) => {
            const rowKey =
              item.checklist_id ?? `${item.category}-${item.documentType}`;
            const displayIndex = (currentPage - 1) * pageSize + idx + 1;
            return (
              <ChecklistEditorTableRow
                key={rowKey}
                item={item}
                rowIndex={displayIndex}
                mode={mode}
                activeTab={activeTab}
                onViewDescription={(row) => setViewDescriptionItem(row)}
                onAddOrEditDescription={(row) =>
                  setDescriptionEditItem(row)
                }
                onRequestDelete={(row) => setDeleteTarget(row)}
                onUpdateRequirement={onUpdateRequirement}
              />
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={CHECKLIST_EDITOR_TABLE_COLUMN_COUNT} className="p-0">
              <TablePaginationFooter
                pageSize={pageSize}
                currentPageItemsCount={paginatedItems.length}
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
                pageSizeOptions={[10, 20, 25, 50]}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {descriptionEditItem?.checklist_id && (
        <DescriptionModal
          open
          onOpenChange={(open) => {
            if (!open) setDescriptionEditItem(null);
          }}
          existingDescription={descriptionEditItem.description ?? ""}
          onSave={async (description: string) => {
            if (!descriptionEditItem.checklist_id) return;
            await updateItemDescription.mutateAsync({
              checklist_id: descriptionEditItem.checklist_id,
              description,
            });
            setDescriptionEditItem(null);
          }}
          mode="edit"
          isLoading={updateItemDescription.isPending}
        />
      )}

      <ConfirmationModal
        open={!!viewDescriptionItem}
        onOpenChange={(open) => {
          if (!open) setViewDescriptionItem(null);
        }}
        onConfirm={() => setViewDescriptionItem(null)}
        title="Description"
        description={
          viewDescriptionItem?.description?.trim() ? (
            <span className="whitespace-pre-wrap text-left">
              {viewDescriptionItem.description}
            </span>
          ) : (
            <span className="text-muted-foreground">No description.</span>
          )
        }
        confirmText="Close"
        hideCancelButton
        variant="default"
      />

      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete checklist document"
        description={
          deleteTarget ? (
            <>
              Remove{" "}
              <strong>{deleteTarget.documentType}</strong> from this
              application checklist? This cannot be undone.
            </>
          ) : null
        }
        variant="destructive"
        confirmText="Delete"
        isLoading={deleteItem.isPending && !!deleteTarget}
      />
    </>
  );
});
