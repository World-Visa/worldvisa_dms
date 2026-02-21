"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/v2/datatable/data-table";
import { DataTablePagination } from "@/components/v2/datatable/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { RequirementSelector } from "@/components/applications/checklist/RequirementSelector";
import { DescriptionModal } from "@/components/applications/checklist/DescriptionModal";
import { getCategoryBadgeStyle } from "@/lib/checklist/dataProcessing";
import { useChecklistMutations } from "@/hooks/useChecklist";
import { Check, FileText, Loader2 } from "lucide-react";
import type { DocumentRequirement } from "@/types/checklist";

interface ChecklistTableItem {
  category: string;
  documentType: string;
  requirement?: DocumentRequirement;
  checklist_id?: string;
  isSelected?: boolean;
  description?: string;
}

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
  onAddToPending: (item: ChecklistTableItem) => void;
}

function getDisplayCategory(category: string): string {
  if (category.includes("Company Documents")) return "Company Documents";
  return category;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export const ChecklistEditorTable = memo(function ChecklistEditorTable({
  items,
  mode,
  activeTab,
  applicationId,
  onUpdateRequirement,
}: ChecklistEditorTableProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [activeDescModal, setActiveDescModal] = useState<{
    item: ChecklistTableItem;
  } | null>(null);

  const { deleteItem, updateItemDescription } =
    useChecklistMutations(applicationId);

  const handleDelete = useCallback(
    async (checklistId: string) => {
      setDeletingIds((prev) => new Set([...prev, checklistId]));
      try {
        await deleteItem.mutateAsync({ checklist_id: checklistId });
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(checklistId);
          return next;
        });
      }
    },
    [deleteItem],
  );

  const columns = useMemo<ColumnDef<ChecklistTableItem>[]>(
    () => [
      {
        id: "sno",
        header: "S.No",
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.index + 1}</span>
        ),
        size: 60,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const display = getDisplayCategory(row.original.category);
          return (
            <Badge
              variant="default"
              className={`text-xs py-1 text-white ${getCategoryBadgeStyle(row.original.category)}`}
            >
              {display}
            </Badge>
          );
        },
      },
      {
        accessorKey: "documentType",
        header: "Document Name",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{item.documentType}</span>
              </div>
              {item.checklist_id && (
                <div className="ml-6 mt-1">
                  {item.description?.trim() ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {truncateText(item.description, 50)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveDescModal({ item })}
                        className="mt-1 h-6 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-black"
                      >
                        Edit Description
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveDescModal({ item })}
                      className="h-6 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-black"
                    >
                      Add Description
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "requirement",
        header: "Requirement",
        cell: ({ row }) => {
          const req = row.original.requirement;
          if (!req || req === "not_required") return null;
          return (
            <Badge
              variant="default"
              className={
                req === "mandatory"
                  ? "bg-red-100 text-red-800 hover:bg-red-200 text-xs"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs"
              }
            >
              {req === "mandatory" ? "Mandatory" : "Optional"}
            </Badge>
          );
        },
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isCurrentTab = mode === "edit" && activeTab === "current";

          if (isCurrentTab) {
            const isDeleting = deletingIds.has(item.checklist_id ?? "");
            return (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    item.checklist_id && handleDelete(item.checklist_id)
                  }
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            );
          }

          const req = item.requirement;
          const hasRequirement =
            req === "mandatory" || req === "optional";
          return (
            <div className="flex items-center justify-end gap-2">
              {hasRequirement && (
                <Check className="h-4 w-4 text-green-600 shrink-0" />
              )}
              <div className="w-32">
                <RequirementSelector
                  value={req ?? "not_required"}
                  onChange={(r) =>
                    onUpdateRequirement(item.category, item.documentType, r)
                  }
                />
              </div>
            </div>
          );
        },
      },
    ],
    [mode, activeTab, deletingIds, handleDelete, onUpdateRequirement],
  );

  const table = useDataTableInstance({
    data: items,
    columns,
    enableRowSelection: false,
    defaultPageSize: 20,
    getRowId: (row) =>
      row.checklist_id ?? `${row.category}-${row.documentType}`,
  });

  return (
    <>
      <div className="overflow-hidden rounded-md border [&_td]:py-2">
        <DataTable table={table} columns={columns} />
      </div>
      {table.getPageCount() > 1 && (
        <div className="border rounded-md py-2">
          <DataTablePagination table={table} />
        </div>
      )}

      {activeDescModal?.item.checklist_id && (
        <DescriptionModal
          open
          onOpenChange={(open) => {
            if (!open) setActiveDescModal(null);
          }}
          existingDescription={activeDescModal.item.description ?? ""}
          onSave={async (description: string) => {
            if (!activeDescModal.item.checklist_id) return;
            await updateItemDescription.mutateAsync({
              checklist_id: activeDescModal.item.checklist_id,
              description,
            });
            setActiveDescModal(null);
          }}
          mode="edit"
          isLoading={updateItemDescription.isPending}
        />
      )}
    </>
  );
});
