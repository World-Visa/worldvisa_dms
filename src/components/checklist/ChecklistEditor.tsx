"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChecklistCategoryTabs } from "./ChecklistCategoryTabs";
import {
  ChecklistEditorTable,
  type ChecklistTableItem,
} from "./ChecklistEditorTable";
import { ChecklistTabs } from "@/components/applications/checklist/ChecklistTabs";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { ListNoResults } from "@/components/applications/list-no-results";
import type { ChecklistPageMode } from "./types";

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
  applicationId,
}: ChecklistEditorProps) {
  const isEdit = mode === "edit";
  // On the "Current Checklist" top tab, inner tabs are redundant — show all items directly
  const isChecklistTab = selectedCategory === "checklist";
  const showInnerTabs = isEdit && !isChecklistTab;
  // For specific category tabs in edit mode, show empty state when no checklist items exist for that category
  const showEmptyState =
    isEdit && !isChecklistTab && activeTab === "current" && categoryFilteredItems.length === 0;

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
          {showInnerTabs && (
            <ChecklistTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          )}

          <FacetedFormFilter
            type="text"
            size="small"
            title="Search"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search documents…"
          />
        </div>

        {showEmptyState ? (
          <ListNoResults
            title="No documents in checklist"
            description="No checklist has been added for this category. Kindly add documents from the Available Documents tab."
            action={
              <button
                type="button"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => onTabChange("available")}
              >
                Go to Available Documents
              </button>
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${selectedCategory}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChecklistEditorTable
                items={filteredItems}
                mode={mode as "create" | "edit"}
                activeTab={activeTab}
                applicationId={applicationId}
                onUpdateRequirement={onUpdateRequirement}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});
