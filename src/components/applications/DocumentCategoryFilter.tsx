'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentCategoryInfo, DocumentCategoryFilterProps, Company } from '@/types/documents';
import { CategoryButton } from './filter/CategoryButton';
import { AddCompanyButton } from './filter/AddCompanyButton';
import { ActionButtons } from './filter/ActionButtons';
import type { ChecklistState, ChecklistCategory } from '@/types/checklist';

const baseCategories: DocumentCategoryInfo[] = [
  { id: 'submitted', label: 'Submitted Documents', count: 0 },
  { id: 'all', label: 'All Documents', count: 0 },
  { id: 'identity', label: 'Identity Documents', count: 0 },
  { id: 'education', label: 'Education Documents', count: 0 },
  { id: 'other', label: 'Other Documents', count: 0 },
];

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const categories = useMemo((): DocumentCategoryInfo[] => {
    if (isClientView) {
      if (!checklistCategories || checklistCategories.length === 0) {
        // Only show submitted documents chip if there are actually submitted documents
        if (submittedDocumentsCount > 0) {
          return [
            { id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount }
          ];
        }
        // No submitted documents and no checklist - return empty array
        return [];
      }

      const categories = [];

      // Only add submitted documents chip if there are actually submitted documents
      if (submittedDocumentsCount > 0) {
        categories.push({ id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount });
      }

      // Add checklist categories
      categories.push(...checklistCategories.map(cat => ({
        id: cat.id,
        label: cat.label,
        count: cat.count
      })));

      return categories;
    }

    // Admin view: Original logic
    switch (checklistState) {
      case 'none':
        // Default state: Only show submitted documents + create checklist button
        return [{ id: 'submitted', label: 'Submitted Documents', count: 0 }];

      case 'creating':
        return [
          { id: 'all', label: 'All Documents', count: 0 },
          { id: 'identity', label: 'Identity Documents', count: 0 },
          { id: 'education', label: 'Education Documents', count: 0 },
          { id: 'other', label: 'Other Documents', count: 0 },
          { id: 'company', label: 'Company Documents', count: 0 }
        ];

      case 'saved':
        return [
          { id: 'submitted', label: 'Submitted Documents', count: 0 },
          ...checklistCategories.map(cat => ({
            id: cat.id,
            label: cat.label,
            count: cat.count
          }))
        ];

      case 'editing':
        return [
          { id: 'submitted', label: 'Submitted Documents', count: 0 },
          { id: 'checklist', label: 'Current Checklist', count: checklistCategories.reduce((sum, cat) => sum + cat.count, 0) },
          { id: 'all', label: 'All Documents', count: 0 },
          { id: 'identity', label: 'Identity Documents', count: 0 },
          { id: 'education', label: 'Education Documents', count: 0 },
          { id: 'other', label: 'Other Documents', count: 0 },
          { id: 'company', label: 'Company Documents', count: 0 },
          // Add individual company categories
          ...checklistCategories
            .filter(cat => cat.type === 'company')
            .map(cat => ({
              id: cat.id,
              label: cat.label,
              count: cat.count
            }))
        ];

      default:
        return baseCategories;
    }
  }, [isClientView, checklistCategories, submittedDocumentsCount, checklistState]);

  const selectedCategoryInfo = useMemo(() =>
    categories.find(cat => cat.id === selectedCategory),
    [categories, selectedCategory]
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
      <div className="hidden md:flex flex-wrap items-center gap-3 relative">
        {isCategoryChanging && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Loading...
            </div>
          </div>
        )}
        {categories.map((category) => (
          <CategoryButton 
            key={category.id} 
            category={category}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onRemoveCompany={onRemoveCompany}
            disabled={isCategoryChanging}
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

      {/* Mobile/Tablet View - Show dropdown */}
      <div className="md:hidden">
        <div className="flex flex-col gap-3">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isCategoryChanging}
                className="flex items-center gap-2 px-4 py-3 h-auto w-full justify-between text-left"
              >
                <span className="truncate text-sm">
                  {isCategoryChanging ? 'Loading...' : (selectedCategoryInfo?.label || 'Select Category')}
                </span>
                {isCategoryChanging ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[320px]" align="start">
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => {
                    onCategoryChange(category.id);
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>{category.label}</span>
                    {category.count > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        {category.count}
                      </span>
                    )}
                  </div>
                  {selectedCategory === category.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-full flex flex-col gap-2">  
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
        </div>
      </div>
    </div>
  );
}
