"use client";

import { memo } from "react";
import { ChecklistCategoryTabs } from "./ChecklistCategoryTabs";
import { ChecklistEditorTable } from "./ChecklistEditorTable";
import { ChecklistTabs } from "@/components/applications/checklist/ChecklistTabs";
import { SearchBox } from "@/components/ui/SearchBox";
import type { ChecklistPageMode } from "./types";

interface ChecklistTableItem {
  category: string;
  documentType: string;
  requirement?: "mandatory" | "optional" | "not_required";
  checklist_id?: string;
  isSelected?: boolean;
  description?: string;
}

interface ChecklistEditorProps {
  mode: ChecklistPageMode;
  activeTab: "current" | "available";
  categories: Array<{ id: string; label: string; count: number }>;
  selectedCategory: string;
  searchQuery: string;
  filteredItems: ChecklistTableItem[];
  categoryFilteredItems: ChecklistTableItem[];
  onCategoryChange: (category: string) => void;
  onTabChange: (tab: "current" | "available") => void;
  onSearchChange: (query: string) => void;
  onUpdateRequirement: (
    category: string,
    documentType: string,
    requirement: "mandatory" | "optional" | "not_required",
  ) => void;
  onAddToPending: (item: ChecklistTableItem) => void;
  applicationId: string;
}

export const ChecklistEditor = memo(function ChecklistEditor({
  mode,
  activeTab,
  categories,
  selectedCategory,
  searchQuery,
  filteredItems,
  categoryFilteredItems,
  onCategoryChange,
  onTabChange,
  onSearchChange,
  onUpdateRequirement,
  onAddToPending,
  applicationId,
}: ChecklistEditorProps) {
  const isEdit = mode === "edit";

  return (
    <div className="space-y-4">
      <ChecklistCategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        type="checklist"
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 w-full">
          {isEdit && (
            <ChecklistTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          )}

          <div className="flex items-center gap-4">
            <SearchBox
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search documents..."
              aria-label="Search document checklist"
              className="w-full"
            />
          </div>
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground" role="status">
            {filteredItems.length === categoryFilteredItems.length
              ? `Showing all ${filteredItems.length} documents`
              : `Showing ${filteredItems.length} of ${categoryFilteredItems.length} documents`}
          </p>
        )}

        <ChecklistEditorTable
          items={filteredItems}
          mode={mode as "create" | "edit"}
          activeTab={activeTab}
          applicationId={applicationId}
          onUpdateRequirement={onUpdateRequirement}
          onAddToPending={onAddToPending}
        />
      </div>
    </div>
  );
});
