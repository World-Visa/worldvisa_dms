'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentCategoryInfo } from '@/types/documents';
import { AddCompanyButton } from './AddCompanyButton';
import { ActionButtons } from './ActionButtons';
import { Company } from '@/types/documents';
import { ChecklistState } from '@/types/checklist';
import { formatDateRange } from '@/utils/dateFormat';

interface CategoryDropdownProps {
  categories: DocumentCategoryInfo[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
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
  checklistActions?: 'inline' | 'link';
  applicationId?: string;
}

export const CategoryDropdown = memo(function CategoryDropdown({
  categories,
  selectedCategory,
  onCategoryChange,
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
  isSavingChecklist,
  checklistActions = 'inline',
  applicationId,
}: CategoryDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const useLinkMode = checklistActions === 'link' && !!applicationId && !isClientView;
  const hasChecklist = checklistState === 'saved';

  const selectedCategoryInfo = categories.find(cat => cat.id === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="md:hidden">
      <div className="flex flex-col gap-3">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-3 h-auto w-full justify-between text-left"
            >
              <span className="truncate text-sm">
                {disabled ? 'Loading...' : (selectedCategoryInfo?.label || 'Select Category')}
              </span>
              {disabled ? (
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
                onClick={() => handleCategorySelect(category.id)}
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
          {useLinkMode ? (
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/admin/applications/${applicationId}/checklist`}>
                {hasChecklist ? 'Edit checklist' : 'Create checklist'}
              </Link>
            </Button>
          ) : (
            <ActionButtons 
              isClientView={isClientView}
              checklistState={checklistState}
              onStartCreatingChecklist={onStartCreatingChecklist}
              onStartEditingChecklist={onStartEditingChecklist}
              onSaveChecklist={onSaveChecklist}
              onCancelChecklist={onCancelChecklist}
              isSavingChecklist={isSavingChecklist}
            />
          )}
        </div>
      </div>
    </div>
  );
});
