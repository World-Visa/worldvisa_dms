'use client';

import React, { useMemo, memo, useCallback } from 'react';
import { DocumentCategoryFilterProps, Company } from '@/types/documents';
import { ChecklistState, ChecklistCategory } from '@/types/checklist';
import { generateCategories } from './filter/CategoryGenerator';
import { CategoryChips } from './filter/CategoryChips';
import { CategoryDropdown } from './filter/CategoryDropdown';
import { LoadingOverlay } from './filter/LoadingOverlay';

interface ExtendedDocumentCategoryFilterProps extends DocumentCategoryFilterProps {
  companies?: Company[];
  onAddCompany?: () => void;
  onRemoveCompany?: (companyName: string) => void;
  maxCompanies?: number;
  // Client privilege props
  isClientView?: boolean;
  submittedDocumentsCount?: number;
  checklistState?: ChecklistState;
  checklistCategories?: ChecklistCategory[];
  hasCompanyDocuments?: boolean;
  onStartCreatingChecklist?: () => void;
  onStartEditingChecklist?: () => void;
  onSaveChecklist?: () => void;
  onCancelChecklist?: () => void;
  isSavingChecklist?: boolean;
  // Loading state
  isCategoryChanging?: boolean;
}

export const DocumentCategoryFilter = memo(function DocumentCategoryFilter({
  selectedCategory,
  onCategoryChange,
  companies = [],
  onAddCompany,
  onRemoveCompany,
  maxCompanies = 5,
  // Client privilege props
  isClientView = false,
  submittedDocumentsCount = 0,
  // Checklist props (admin only)
  checklistState = 'none',
  checklistCategories = [],
  hasCompanyDocuments = false,
  onStartCreatingChecklist,
  onStartEditingChecklist,
  onSaveChecklist,
  onCancelChecklist,
  isSavingChecklist = false,
  // Loading state
  isCategoryChanging = false
}: ExtendedDocumentCategoryFilterProps) {
  // Memoize expensive category generation
  const categories = useMemo(() =>
    generateCategories({
      isClientView,
      checklistState,
      checklistCategories,
      submittedDocumentsCount
    }),
    [isClientView, checklistState, checklistCategories, submittedDocumentsCount]
  );

  // Memoize category change handler to prevent unnecessary re-renders
  const handleCategoryChange = useCallback((category: string) => {
    onCategoryChange(category);
  }, [onCategoryChange]);

  // Memoize company removal handler
  const handleRemoveCompany = useCallback((companyName: string) => {
    onRemoveCompany?.(companyName);
  }, [onRemoveCompany]);


  // Show "No checklist" message when there are no categories and it's client view
  if (isClientView && categories.length === 0) {
    return (
      <></>
    );
  }

  return (
    <div className="mb-6">
      {/* Desktop View - Show all buttons */}
      <div className="relative">
        <LoadingOverlay isVisible={isCategoryChanging} />
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          onRemoveCompany={handleRemoveCompany}
          disabled={isCategoryChanging}
          companies={companies}
          maxCompanies={maxCompanies}
          onAddCompany={onAddCompany}
          checklistState={checklistState}
          isClientView={isClientView}
          hasCompanyDocuments={hasCompanyDocuments}
          onStartCreatingChecklist={onStartCreatingChecklist}
          onStartEditingChecklist={onStartEditingChecklist}
          onSaveChecklist={onSaveChecklist}
          onCancelChecklist={onCancelChecklist}
          isSavingChecklist={isSavingChecklist}
        />
      </div>

      {/* Mobile/Tablet View - Show dropdown */}
      <CategoryDropdown
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        disabled={isCategoryChanging}
        companies={companies}
        maxCompanies={maxCompanies}
        onAddCompany={onAddCompany}
        checklistState={checklistState}
        isClientView={isClientView}
        hasCompanyDocuments={hasCompanyDocuments}
        onStartCreatingChecklist={onStartCreatingChecklist}
        onStartEditingChecklist={onStartEditingChecklist}
        onSaveChecklist={onSaveChecklist}
        onCancelChecklist={onCancelChecklist}
        isSavingChecklist={isSavingChecklist}
      />
    </div>
  );
}
);