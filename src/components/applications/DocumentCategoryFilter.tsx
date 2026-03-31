"use client";

import React, { useMemo, memo, useCallback } from "react";
import { DocumentCategoryFilterProps, Company } from "@/types/documents";
import { ChecklistState, ChecklistCategory } from "@/types/checklist";
import { generateCategories } from "./filter/CategoryGenerator";
import { FolderCategoryRail } from "./filter/FolderCategoryRail";
import { CategoryDropdown } from "./filter/CategoryDropdown";
import type { Document } from "@/types/applications";
import type { DocumentCategoryInfo } from "@/types/documents";
import { Button } from "@/components/ui/button";

function computeCategoryCounts(
  categories: DocumentCategoryInfo[],
  documents: Document[] | undefined,
): Record<string, number> {
  const map: Record<string, number> = {};
  if (!documents?.length) return map;

  for (const cat of categories) {
    let n = 0;
    if (cat.id === "submitted" || cat.id === "all") {
      n = documents.length;
    } else if (cat.id === "checklist") {
      n = documents.length;
    } else if (
      cat.id === "identity" ||
      cat.id === "identity_documents" ||
      cat.label === "Identity Documents"
    ) {
      n = documents.filter(
        (d) =>
          d.document_category === "Identity Documents" ||
          d.document_category === "Identity",
      ).length;
    } else if (
      cat.id === "education" ||
      cat.id === "education_documents" ||
      cat.label === "Education Documents"
    ) {
      n = documents.filter(
        (d) =>
          d.document_category === "Education Documents" ||
          d.document_category === "Education",
      ).length;
    } else if (
      cat.id === "other" ||
      cat.id === "other_documents" ||
      cat.label === "Other Documents"
    ) {
      n = documents.filter(
        (d) =>
          d.document_category === "Other Documents" ||
          d.document_category === "Other",
      ).length;
    } else if (
      cat.id === "self_employment" ||
      cat.label === "Self Employment/Freelance"
    ) {
      n = documents.filter(
        (d) => d.document_category === "Self Employment/Freelance",
      ).length;
    } else if (cat.id === "company") {
      n = documents.filter(
        (d) =>
          d.document_category?.includes("Company Documents") ||
          d.document_category === "Company",
      ).length;
    } else if (
      cat.label?.includes("Company Documents") &&
      cat.label !== "Company Documents"
    ) {
      n = documents.filter((d) => d.document_category === cat.label).length;
    } else {
      n = documents.filter((d) => d.document_category === cat.label).length;
    }
    map[cat.id] = n;
  }
  return map;
}

interface ExtendedDocumentCategoryFilterProps
  extends DocumentCategoryFilterProps {
  companies?: Company[];
  onRemoveCompany?: (companyName: string) => void;
  onRemoveCompanyWithCheck?: (
    companyName: string,
    companyCategory: string,
  ) => void;
  documents?: import("@/types/applications").Document[];
  maxCompanies?: number;
  // Client privilege props
  isClientView?: boolean;
  submittedDocumentsCount?: number;
  checklistState?: ChecklistState;
  checklistCategories?: ChecklistCategory[];
  hasCompanyDocuments?: boolean;
  showSampleDocuments?: boolean;
  onToggleSampleDocuments?: () => void;
  sampleDocumentsCount?: number;
  onAddCompany?: () => void;
}

export const DocumentCategoryFilter = memo(function DocumentCategoryFilter({
  selectedCategory,
  onCategoryChange,
  companies = [],
  documents,
  maxCompanies = 5,
  // Client privilege props
  isClientView = false,
  submittedDocumentsCount = 0,
  // Checklist props (admin only)
  checklistState = "none",
  checklistCategories = [],
  hasCompanyDocuments = false,
  showSampleDocuments = false,
  onToggleSampleDocuments,
  sampleDocumentsCount = 0,
  onAddCompany,
}: ExtendedDocumentCategoryFilterProps) {
  const categories = useMemo(
    () =>
      generateCategories({
        isClientView,
        checklistState,
        checklistCategories,
        submittedDocumentsCount,
      }),
    [
      isClientView,
      checklistState,
      checklistCategories,
      submittedDocumentsCount,
    ],
  );

  const categoryCounts = useMemo(
    () => computeCategoryCounts(categories, documents),
    [categories, documents],
  );

  // Memoize category change handler to prevent unnecessary re-renders
  const handleCategoryChange = useCallback(
    (category: string) => {
      onCategoryChange(category);
    },
    [onCategoryChange],
  );

  const canShowAddCompanyAction = useMemo(
    () =>
      (checklistState === "saved" || isClientView) &&
      hasCompanyDocuments &&
      companies.length < maxCompanies,
    [checklistState, isClientView, hasCompanyDocuments, companies.length, maxCompanies],
  );

  // Show "No checklist" message when there are no categories and it's client view
  if (isClientView && categories.length === 0) {
    return <></>;
  }

  return (
    <div className="mb-6">
      {/* Desktop View - Show all buttons */}
      <div className="relative hidden md:block">
        <FolderCategoryRail
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categoryCounts={categoryCounts}
          showAddCompanyAction={canShowAddCompanyAction}
          showSampleDocumentsAction={Boolean(onToggleSampleDocuments)}
          showSampleDocuments={showSampleDocuments}
          sampleDocumentsCount={sampleDocumentsCount}
          onAddCompany={onAddCompany}
          onToggleSampleDocuments={onToggleSampleDocuments}
        />
      </div>

      {/* Mobile/Tablet View - Show dropdown */}
      <div className="md:hidden space-y-2">
        <CategoryDropdown
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          disabled={false}
          companies={companies}
          maxCompanies={maxCompanies}
        />
        <div className="flex flex-wrap items-center gap-2">
          {onToggleSampleDocuments ? (
            <Button size="sm" variant="secondary" onClick={onToggleSampleDocuments}>
              {showSampleDocuments ? "Back to checklist" : "Sample documents"}
            </Button>
          ) : null}
          {canShowAddCompanyAction ? (
            <Button size="sm" onClick={onAddCompany}>
              Add Company
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
});
