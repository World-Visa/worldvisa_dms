'use client';

import React, { memo } from 'react';
import { DocumentCategoryInfo } from '@/types/documents';
import { CategoryButton } from './CategoryButton';
import { AddCompanyButton } from './AddCompanyButton';
import { ActionButtons } from './ActionButtons';
import { Company } from '@/types/documents';
import { ChecklistState } from '@/types/checklist';

interface CategoryChipsProps {
  categories: DocumentCategoryInfo[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRemoveCompany?: (companyName: string) => void;
  disabled: boolean;
  // Company and action props
  companies: Company[];
  maxCompanies: number;
  onAddCompany?: () => void;
  checklistState: ChecklistState;
  isClientView: boolean;
  hasCompanyDocuments: boolean;
  onStartCreatingChecklist?: () => void;
  onStartEditingChecklist?: () => void;
  onSaveChecklist?: () => void;
  onCancelChecklist?: () => void;
  isSavingChecklist: boolean;
}

export const CategoryChips = memo(function CategoryChips({
  categories,
  selectedCategory,
  onCategoryChange,
  onRemoveCompany,
  disabled,
  companies,
  maxCompanies,
  onAddCompany,
  checklistState,
  isClientView,
  hasCompanyDocuments,
  onStartCreatingChecklist,
  onStartEditingChecklist,
  onSaveChecklist,
  onCancelChecklist,
  isSavingChecklist
}: CategoryChipsProps) {
  return (
    <div className="hidden md:flex flex-wrap items-center gap-3">
      {categories.map((category) => (
        <CategoryButton 
          key={category.id} 
          category={category}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          onRemoveCompany={onRemoveCompany}
          disabled={disabled}
        />
      ))}
      <AddCompanyButton 
        checklistState={checklistState}
        isClientView={isClientView}
        hasCompanyDocuments={hasCompanyDocuments}
        companies={companies}
        maxCompanies={maxCompanies}
        onAddCompany={onAddCompany}
      />
      <ActionButtons 
        isClientView={isClientView}
        checklistState={checklistState}
        onStartCreatingChecklist={onStartCreatingChecklist}
        onStartEditingChecklist={onStartEditingChecklist}
        onSaveChecklist={onSaveChecklist}
        onCancelChecklist={onCancelChecklist}
        isSavingChecklist={isSavingChecklist}
      />
    </div>
  );
});
