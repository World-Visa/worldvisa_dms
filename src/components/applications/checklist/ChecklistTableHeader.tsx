"use client";

import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Company } from "@/types/documents";
import { memo } from "react";
import { CompanyInfoDisplay } from "./CompanyInfoDisplay";

interface ChecklistTableHeaderProps {
  documentTypeOptions: { label: string; value: string }[];
  selectedDocumentTypes: string[];
  onDocumentTypesChange: (types: string[]) => void;
  selectedCategory: string;
  extractedCompanies: Company[];
}

export const ChecklistTableHeader = memo(function ChecklistTableHeader({
  documentTypeOptions,
  selectedDocumentTypes,
  onDocumentTypesChange,
  selectedCategory,
  extractedCompanies,
}: ChecklistTableHeaderProps) {
  return (
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
  );
});
