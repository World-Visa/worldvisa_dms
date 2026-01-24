'use client';

import React, { useMemo, memo, useCallback } from 'react';
import { DocumentCategoryFilterProps, Company } from '@/types/documents';
import { ChecklistState, ChecklistCategory } from '@/types/checklist';
import { generateCategories } from './filter/CategoryGenerator';
import { CategoryChips } from './filter/CategoryChips';
import { CategoryDropdown } from './filter/CategoryDropdown';
import type { Document } from '@/types/applications';
import type { DocumentCategoryInfo } from '@/types/documents';

function computeCategoryCounts(
  categories: DocumentCategoryInfo[],
  documents: Document[] | undefined
): Record<string, number> {
  const map: Record<string, number> = {};
  if (!documents?.length) return map;

  for (const cat of categories) {
    let n = 0;
    if (cat.id === 'submitted' || cat.id === 'all') {
      n = documents.length;
    } else if (cat.id === 'checklist') {
      n = documents.length;
    } else if (
      cat.id === 'identity' ||
      cat.id === 'identity_documents' ||
      cat.label === 'Identity Documents'
    ) {
      n = documents.filter(
        (d) =>
          d.document_category === 'Identity Documents' ||
          d.document_category === 'Identity'
      ).length;
    } else if (
      cat.id === 'education' ||
      cat.id === 'education_documents' ||
      cat.label === 'Education Documents'
    ) {
      n = documents.filter(
        (d) =>
          d.document_category === 'Education Documents' ||
          d.document_category === 'Education'
      ).length;
    } else if (
      cat.id === 'other' ||
      cat.id === 'other_documents' ||
      cat.label === 'Other Documents'
    ) {
      n = documents.filter(
        (d) =>
          d.document_category === 'Other Documents' ||
          d.document_category === 'Other'
      ).length;
    } else if (
      cat.id === 'self_employment' ||
      cat.label === 'Self Employment/Freelance'
    ) {
      n = documents.filter(
        (d) => d.document_category === 'Self Employment/Freelance'
      ).length;
    } else if (cat.id === 'company') {
      n = documents.filter(
        (d) =>
          d.document_category?.includes('Company Documents') ||
          d.document_category === 'Company'
      ).length;
    } else if (
      cat.label?.includes('Company Documents') &&
      cat.label !== 'Company Documents'
    ) {
      n = documents.filter((d) => d.document_category === cat.label).length;
    } else {
      n = documents.filter((d) => d.document_category === cat.label).length;
    }
    map[cat.id] = n;
  }
  return map;
}

interface ExtendedDocumentCategoryFilterProps extends DocumentCategoryFilterProps {
  companies?: Company[];
  onAddCompany?: () => void;
  onRemoveCompany?: (companyName: string) => void;
  onRemoveCompanyWithCheck?: (companyName: string, companyCategory: string) => void;
  documents?: import('@/types/applications').Document[];
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
}

export const DocumentCategoryFilter = memo(function DocumentCategoryFilter({
  selectedCategory,
  onCategoryChange,
  companies = [],
  onAddCompany,
  onRemoveCompany,
  onRemoveCompanyWithCheck,
  documents,
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
  isSavingChecklist = false
}: ExtendedDocumentCategoryFilterProps) {
  const categories = useMemo(
    () =>
      generateCategories({
        isClientView,
        checklistState,
        checklistCategories,
        submittedDocumentsCount,
      }),
    [isClientView, checklistState, checklistCategories, submittedDocumentsCount]
  );

  const categoryCounts = useMemo(
    () => computeCategoryCounts(categories, documents),
    [categories, documents]
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
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          onRemoveCompany={handleRemoveCompany}
          onRemoveCompanyWithCheck={onRemoveCompanyWithCheck}
          documents={documents}
          categoryCounts={categoryCounts}
          disabled={false}
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
        disabled={false}
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