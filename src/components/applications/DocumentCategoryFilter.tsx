'use client';

import React, { useMemo } from 'react';
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

export function DocumentCategoryFilter({
  selectedCategory,
  onCategoryChange,
  companies = [],
  onAddCompany,
  onRemoveCompany,
  maxCompanies = 3,
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
  const categories = useMemo(() => 
    generateCategories({
      isClientView,
      checklistState,
      checklistCategories,
      submittedDocumentsCount
    }), 
    [isClientView, checklistState, checklistCategories, submittedDocumentsCount]
  );


  // Show "No checklist" message when there are no categories and it's client view
  if (isClientView && categories.length === 0) {
    return (
      <div className="text-center py-8 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Checklist Generated</h3>
          <p className="text-yellow-700">
            No checklist has been generated. Contact your application handling processing executive.
          </p>
        </div>
      </div>
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
          onCategoryChange={onCategoryChange}
          onRemoveCompany={onRemoveCompany}
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
        onCategoryChange={onCategoryChange}
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
