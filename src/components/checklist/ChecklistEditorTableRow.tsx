"use client";

import { memo } from "react";
import { Check } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/primitives/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { CompactButton } from "@/components/ui/primitives/button-compact";
import { RequirementSelector } from "@/components/applications/checklist/RequirementSelector";
import TruncatedText from "@/components/ui/truncated-text";
import { cn } from "@/lib/utils";
import type { DocumentRequirement } from "@/types/checklist";
import { CHECKLIST_EDITOR_TABLE_COLUMNS } from "@/lib/constants/checklistEditorTable";
import {
  RiDeleteBin2Line,
  RiFileEditLine,
  RiMore2Fill,
} from "react-icons/ri";

export interface ChecklistTableItem {
  category: string;
  documentType: string;
  requirement?: DocumentRequirement;
  checklist_id?: string;
  isSelected?: boolean;
  description?: string;
}

/** Used for display and category-column sorting (same rules as before). */
export function getDisplayCategory(category: string): string {
  if (category.includes("Company Documents")) return "Company Documents";
  return category;
}

interface ChecklistEditorTableRowProps {
  item: ChecklistTableItem;
  rowIndex: number;
  mode: "create" | "edit";
  activeTab: "current" | "available";
  onViewDescription: (item: ChecklistTableItem) => void;
  onAddOrEditDescription: (item: ChecklistTableItem) => void;
  onRequestDelete: (item: ChecklistTableItem) => void;
  onUpdateRequirement: (
    category: string,
    documentType: string,
    requirement: DocumentRequirement,
  ) => void;
}

const col = CHECKLIST_EDITOR_TABLE_COLUMNS;

export const ChecklistEditorTableRow = memo(function ChecklistEditorTableRow({
  item,
  rowIndex,
  mode,
  activeTab,
  onViewDescription,
  onAddOrEditDescription,
  onRequestDelete,
  onUpdateRequirement,
}: ChecklistEditorTableRowProps) {
  const isCurrentTab = mode === "edit" && activeTab === "current";
  const req = item.requirement;
  const hasRequirement = req === "mandatory" || req === "optional";
  const hasDescription = Boolean(item.description?.trim());

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <TableRow
      className={cn(
        "group relative isolate transition-colors",
        "hover:bg-neutral-50",
      )}
    >
      <TableCell className={col[0].cellClassName}>
        <span className="font-medium text-sm">{rowIndex}</span>
      </TableCell>

      <TableCell className={col[1].cellClassName}>
        <Badge variant="lighter" color="purple" size="md">
          {getDisplayCategory(item.category)}
        </Badge>
      </TableCell>

      <TableCell className={col[2].cellClassName}>
        <TruncatedText className="text-sm max-w-[28ch]">
          {item.documentType}
        </TruncatedText>
      </TableCell>

      <TableCell className={col[3].cellClassName}>
        {!item.checklist_id ? (
          <span className="text-text-soft text-sm">—</span>
        ) : hasDescription ? (
          <button
            type="button"
            onClick={() => onViewDescription(item)}
            className="text-sm text-primary underline underline-offset-2 hover:text-primary/90"
          >
            View description
          </button>
        ) : (
          <span className="text-text-soft text-sm">—</span>
        )}
      </TableCell>

      <TableCell className={col[4].cellClassName}>
        {!req || req === "not_required" ? (
          <span className="text-text-soft text-sm">—</span>
        ) : (
          <Badge
            variant="lighter"
            color={req === "mandatory" ? "red" : "yellow"}
            size="md"
          >
            {req === "mandatory" ? "Mandatory" : "Optional"}
          </Badge>
        )}
      </TableCell>

      <TableCell
        className={cn(col[5].cellClassName)}
        onClick={stopPropagation}
      >
        {isCurrentTab && item.checklist_id ? (
          <div className="flex w-full justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <CompactButton
                  icon={RiMore2Fill}
                  variant="ghost"
                  className="z-10 mx-auto shrink-0"
                  aria-label="Open actions"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56"
                onClick={stopPropagation}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onAddOrEditDescription(item)}
                  >
                    <RiFileEditLine />
                    {hasDescription ? "Edit description" : "Add description"}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer text-error-base focus:text-error-base"
                    onClick={() => onRequestDelete(item)}
                  >
                    <RiDeleteBin2Line />
                    Delete checklist document
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex w-full items-center justify-end gap-2">
            {hasRequirement && (
              <Check className="h-4 w-4 text-green-600 shrink-0" />
            )}
            <div className="w-30 shrink-0">
              <RequirementSelector
                value={req ?? "not_required"}
                onChange={(r) =>
                  onUpdateRequirement(item.category, item.documentType, r)
                }
              />
            </div>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});
