'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentCategoryInfo, DocumentCategoryFilterProps, Company } from '@/types/documents';
import { CreateChecklistButton } from './checklist/CreateChecklistButton';
import { EditChecklistButton } from './checklist/EditChecklistButton';
import { SaveChecklistButton } from './checklist/SaveChecklistButton';
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

export function DocumentCategoryFilter({ 
  selectedCategory, 
  onCategoryChange, 
  companies = [], 
  onAddCompany, 
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
  isSavingChecklist = false
}: ExtendedDocumentCategoryFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get categories based on checklist state or client view
  const getCategoriesForState = (): DocumentCategoryInfo[] => {
    // Client view: Show submitted + dynamic checklist categories (if any)
    if (isClientView) {
      if (!checklistCategories || checklistCategories.length === 0) {
        // No checklist: Only show submitted documents
        return [
          { id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount }
        ];
      }
      
      // Has checklist: Show submitted + dynamic checklist categories
      const categories = [
        { id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount },
        ...checklistCategories.map(cat => ({
          id: cat.id,
          label: cat.label,
          count: cat.count
        }))
      ];
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
          { id: 'company', label: 'Company Documents', count: 0 }
        ];
        
      default:
        return baseCategories;
    }
  };

  const categories = getCategoriesForState();
  const selectedCategoryInfo = categories.find(cat => cat.id === selectedCategory);

  // Button component for individual categories
  const CategoryButton = ({ category }: { category: DocumentCategoryInfo }) => (
    <button
      key={category.id}
      className={cn(
        'relative cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
        'border-2 focus:outline-none focus:ring-0',
        'hover:shadow-md transform hover:-translate-y-0.5',
        selectedCategory === category.id
          ? 'bg-black text-white border-black shadow-lg focus:ring-black/20'
          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-200'
      )}
      onClick={() => onCategoryChange(category.id)}
    >
      <span className="whitespace-nowrap">{category.label}</span>
      {category.count > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full',
          selectedCategory === category.id
            ? 'bg-white/20 text-white'
            : 'bg-gray-100 text-gray-600'
        )}>
          {category.count}
        </span>
      )}
    </button>
  );

  // Add Company Button component - only show in saved state if company documents exist (admin only)
  const AddCompanyButton = () => {
    if (isClientView) return null; // Hide for clients
    
    const shouldShow = checklistState === 'saved' && hasCompanyDocuments && companies.length < maxCompanies;
    
    if (!shouldShow) return null;
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onAddCompany}
        className={cn(
          'cursor-pointer inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
          'border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          'focus:outline-none focus:ring-0',
          'w-full md:w-auto'
        )}
      >
        <Plus className="h-4 w-4" />
        <span>Add Company</span>
      </Button>
    );
  };

  // Action buttons based on state (admin only)
  const ActionButtons = () => {
    if (isClientView) return null; // Hide for clients
    
    switch (checklistState) {
      case 'none':
        return onStartCreatingChecklist ? (
          <CreateChecklistButton onClick={onStartCreatingChecklist} />
        ) : null;
        
      case 'creating':
        return (
          <div className="flex items-center gap-2">
            {onCancelChecklist && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelChecklist}
                className="px-4 py-3 rounded-full text-sm"
              >
                Cancel
              </Button>
            )}
            {onSaveChecklist && (
              <SaveChecklistButton
                onClick={onSaveChecklist}
                mode="creating"
                isLoading={isSavingChecklist}
              />
            )}
          </div>
        );
        
      case 'saved':
        return onStartEditingChecklist ? (
          <EditChecklistButton onClick={onStartEditingChecklist} />
        ) : null;
        
      case 'editing':
        return (
          <div className="flex items-center gap-2">
            {onCancelChecklist && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelChecklist}
                className="px-4 py-3 rounded-full text-sm"
              >
                Cancel
              </Button>
            )}
            {onSaveChecklist && (
              <SaveChecklistButton
                onClick={onSaveChecklist}
                mode="editing"
                isLoading={isSavingChecklist}
              />
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="mb-6">
      {/* Desktop View - Show all buttons */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        {categories.map((category) => (
          <CategoryButton key={category.id} category={category} />
        ))}
        <AddCompanyButton />
        <ActionButtons />
      </div>

      {/* Mobile/Tablet View - Show dropdown */}
      <div className="md:hidden">
        <div className="flex flex-col gap-3">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 py-3 h-auto w-full justify-between text-left"
              >
                <span className="truncate text-sm">
                  {selectedCategoryInfo?.label || 'Select Category'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0" />
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
            <AddCompanyButton />
            <ActionButtons />
          </div>
        </div>
      </div>
    </div>
  );
}
