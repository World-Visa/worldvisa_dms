"use client";

import React, { memo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequirementSelector } from "@/components/applications/checklist/RequirementSelector";
import { DescriptionModal } from "@/components/applications/checklist/DescriptionModal";
import { getCategoryBadgeStyle } from "@/lib/checklist/dataProcessing";
import { useChecklistMutations } from "@/hooks/useChecklist";
import { FileText } from "lucide-react";
import { Check } from "lucide-react";
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
  searchQuery: string;
  pendingDeletions: string[];
  isAddingDocument?: boolean;
  addingDocumentId?: string;
  isDocumentAdded?: boolean;
  addedDocumentId?: string;
  onUpdateRequirement: (
    category: string,
    documentType: string,
    requirement: DocumentRequirement,
  ) => void;
  onAddToPending: (item: ChecklistTableItem) => void;
  onAddToPendingDeletions: (checklistId: string) => void;
  onRemoveFromPendingDeletions: (checklistId: string) => void;
  isBatchDeleting?: boolean;
  applicationId: string;
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength);
};

export const ChecklistEditorTable = memo(function ChecklistEditorTable({
  items,
  mode,
  activeTab,
  searchQuery,
  pendingDeletions,
  isAddingDocument,
  addingDocumentId,
  isDocumentAdded,
  addedDocumentId,
  onUpdateRequirement,
  onAddToPending,
  onAddToPendingDeletions,
  onRemoveFromPendingDeletions,
  isBatchDeleting = false,
  applicationId,
}: ChecklistEditorTableProps) {
  const [descriptionModals, setDescriptionModals] = useState<
    Record<string, { open: boolean; mode: "view" | "edit" }>
  >({});
  const { updateItemDescription } = useChecklistMutations(applicationId);

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">S.No</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead>Document Name</TableHead>
            <TableHead className="hidden md:table-cell">Requirement</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {mode === "create"
                    ? "Select document types and set requirements below"
                    : activeTab === "current"
                      ? "No items in current checklist"
                      : "No available documents to add"}
                </p>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow
                key={`${item.category}-${item.documentType}-${item.checklist_id ?? "new"}-${index}`}
              >
                <TableCell className="font-medium w-16">{index + 1}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    variant="default"
                    className={`text-xs py-1 text-white ${getCategoryBadgeStyle(item.category)}`}
                  >
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{item.documentType}</span>
                  </div>
                  <div className="sm:hidden mt-1">
                    <Badge
                      variant="default"
                      className={`text-xs py-0.5 text-white ${getCategoryBadgeStyle(item.category)}`}
                    >
                      {item.category}
                    </Badge>
                  </div>
                  {/* Description section - only for items with checklist_id */}
                  {item.checklist_id && (
                    <>
                      {item.description && item.description.trim() ? (
                        <div className="ml-6 mt-1">
                          <div className="text-xs text-muted-foreground">
                            <p className="inline">
                              {truncateText(item.description, 50)}
                              {item.description.trim().length > 50 && "..."}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const itemKey = `${item.category}-${item.documentType}-${item.checklist_id ?? "new"}-${index}`;
                              setDescriptionModals((prev) => ({
                                ...prev,
                                [itemKey]: { open: true, mode: "edit" },
                              }));
                            }}
                            className="flex items-center gap-1 px-2 py-1 h-6 text-xs bg-gray-100 hover:bg-gray-200 cursor-pointer text-black border-gray-500 mt-1"
                          >
                            Edit Description
                          </Button>
                        </div>
                      ) : (
                        <div className="ml-6 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const itemKey = `${item.category}-${item.documentType}-${item.checklist_id ?? "new"}-${index}`;
                              setDescriptionModals((prev) => ({
                                ...prev,
                                [itemKey]: { open: true, mode: "edit" },
                              }));
                            }}
                            className="flex items-center gap-1 px-2 py-1 h-6 text-xs bg-gray-100 hover:bg-gray-200 cursor-pointer text-black border-gray-500"
                          >
                            Add Description
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {item.requirement &&
                      item.requirement !== "not_required" && (
                        <Badge
                          variant="default"
                          className={
                            item.requirement === "mandatory"
                              ? "bg-red-100 text-red-800 hover:bg-red-200 text-xs"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs"
                          }
                        >
                          {item.requirement === "mandatory"
                            ? "Mandatory"
                            : "Optional"}
                        </Badge>
                      )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {mode === "create" ? (
                    <div className="flex items-center justify-end gap-2">
                      {item.requirement &&
                        (item.requirement === "mandatory" ||
                          item.requirement === "optional") && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      <div className="w-32">
                        <RequirementSelector
                          value={item.requirement ?? "not_required"}
                          onChange={(r) =>
                            onUpdateRequirement(
                              item.category,
                              item.documentType,
                              r,
                            )
                          }
                        />
                      </div>
                    </div>
                  ) : activeTab === "current" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        item.checklist_id &&
                        onAddToPendingDeletions(item.checklist_id)
                      }
                      disabled={isBatchDeleting}
                      className={
                        pendingDeletions.includes(item.checklist_id ?? "")
                          ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100 text-xs"
                          : "text-red-600 hover:text-red-700 text-xs"
                      }
                    >
                      {isBatchDeleting ? (
                        <>
                          <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 inline-block mr-1" />
                          Deleting...
                        </>
                      ) : pendingDeletions.includes(item.checklist_id ?? "") ? (
                        <>Pending</>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {item.requirement &&
                        (item.requirement === "mandatory" ||
                          item.requirement === "optional") && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      <div className="w-24">
                        <RequirementSelector
                          value={item.requirement ?? "not_required"}
                          onChange={(r) =>
                            onUpdateRequirement(
                              item.category,
                              item.documentType,
                              r,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Description Modals */}
      {Object.entries(descriptionModals).map(([key, modal]) => {
        if (!modal.open) return null;
        const parts = key.split("-");
        const checklistId = parts.slice(2, -1).join("-");
        const item = items.find(
          (i, idx) =>
            `${i.category}-${i.documentType}-${i.checklist_id ?? "new"}-${idx}` ===
            key,
        );
        if (!item || !item.checklist_id) return null;

        return (
          <DescriptionModal
            key={key}
            open={modal.open}
            onOpenChange={(open) =>
              setDescriptionModals((prev) => ({
                ...prev,
                [key]: { ...prev[key]!, open },
              }))
            }
            existingDescription={item.description || ""}
            onSave={async (description: string) => {
              if (!item.checklist_id) {
                throw new Error("No checklist ID available");
              }
              await updateItemDescription.mutateAsync({
                checklist_id: item.checklist_id,
                description: description,
              });
              setDescriptionModals((prev) => ({
                ...prev,
                [key]: { ...prev[key]!, open: false },
              }));
            }}
            mode={modal.mode}
            isLoading={updateItemDescription.isPending}
          />
        );
      })}
    </div>
  );
});
