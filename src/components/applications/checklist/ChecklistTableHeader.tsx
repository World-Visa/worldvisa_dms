"use client";

import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { ChecklistDocument, ChecklistState } from "@/types/checklist";
import { Company } from "@/types/documents";
import { memo } from "react";
import { ChecklistTabs } from "./ChecklistTabs";
import { CompanyInfoDisplay } from "./CompanyInfoDisplay";
import { PendingChangesBanner } from "./PendingChangesBanner";

interface ChecklistTableHeaderProps {
  title: string;
  documentTypeOptions: { label: string; value: string }[];
  selectedDocumentTypes: string[];
  onDocumentTypesChange: (types: string[]) => void;
  checklistState: ChecklistState;
  selectedCategory: string;
  activeTab: "current" | "available";
  onTabChange: (tab: "current" | "available") => void;
  pendingAdditions: ChecklistDocument[];
  pendingDeletions: string[];
  pendingUpdates: ChecklistDocument[];
  onClearPendingChanges?: () => void;
  onSavePendingChanges?: () => Promise<void>;
  extractedCompanies: Company[];
  isClientView?: boolean;
}

export const ChecklistTableHeader = memo(function ChecklistTableHeader({
  title: _title,
  documentTypeOptions,
  selectedDocumentTypes,
  onDocumentTypesChange,
  checklistState,
  selectedCategory,
  activeTab,
  onTabChange,
  pendingAdditions,
  pendingDeletions,
  pendingUpdates,
  onClearPendingChanges,
  onSavePendingChanges,
  extractedCompanies,
}: ChecklistTableHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {checklistState === "editing" && selectedCategory !== "all" && (
        <ChecklistTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}

      {checklistState === "editing" &&
        (pendingAdditions.length > 0 ||
          pendingDeletions.length > 0 ||
          pendingUpdates.length > 0) && (
          <PendingChangesBanner
            pendingAdditions={pendingAdditions}
            pendingDeletions={pendingDeletions}
            pendingUpdates={pendingUpdates}
            onClearPendingChanges={onClearPendingChanges}
            onSavePendingChanges={onSavePendingChanges}
          />
        )}

      <div className="flex w-full items-center justify-between gap-4">
        <FacetedFormFilter
          type="multi"
          size="small"
          title="Document Type"
          placeholder="Filter by type…"
          options={documentTypeOptions}
          selected={selectedDocumentTypes}
          onSelect={onDocumentTypesChange}
        />

        <CompanyInfoDisplay
          selectedCategory={selectedCategory}
          extractedCompanies={extractedCompanies}
        />
      </div>
    </div>
  );
});
