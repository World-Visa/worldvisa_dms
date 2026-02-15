"use client";

import React, { memo } from "react";
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
  tabCounts: { currentCount: number; availableCount: number };
  pendingDeletions: string[];
  onCategoryChange: (category: string) => void;
  onTabChange: (tab: "current" | "available") => void;
  onSearchChange: (query: string) => void;
  onUpdateRequirement: (
    category: string,
    documentType: string,
    requirement: "mandatory" | "optional" | "not_required",
  ) => void;
  onAddToPending: (item: ChecklistTableItem) => void;
  onAddToPendingDeletions: (checklistId: string) => void;
  onRemoveFromPendingDeletions: (checklistId: string) => void;
  isBatchDeleting?: boolean;
  categoryCounts?: Record<string, number>;
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
  tabCounts,
  pendingDeletions,
  onCategoryChange,
  onTabChange,
  onSearchChange,
  onUpdateRequirement,
  onAddToPending,
  onAddToPendingDeletions,
  onRemoveFromPendingDeletions,
  isBatchDeleting = false,
  categoryCounts,
  applicationId,
}: ChecklistEditorProps) {
  const isEdit = mode === "edit";

  return (
    <div className="space-y-4">
      <ChecklistCategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        categoryCounts={categoryCounts}
      />

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Document Checklist</h2>

        {isEdit && (
          <ChecklistTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            currentCount={tabCounts.currentCount}
            availableCount={tabCounts.availableCount}
          />
        )}

        <div className="flex items-center gap-4">
          <SearchBox
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search documents..."
            aria-label="Search document checklist"
            className="w-full lg:w-64"
          />
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
          searchQuery={searchQuery}
          pendingDeletions={pendingDeletions}
          onUpdateRequirement={onUpdateRequirement}
          onAddToPending={onAddToPending}
          onAddToPendingDeletions={onAddToPendingDeletions}
          onRemoveFromPendingDeletions={onRemoveFromPendingDeletions}
          isBatchDeleting={isBatchDeleting}
          applicationId={applicationId}
        />
      </div>
    </div>
  );
});
