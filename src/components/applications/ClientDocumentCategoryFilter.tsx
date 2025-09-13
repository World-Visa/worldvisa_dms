'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DocumentCategoryInfo } from '@/types/documents';
import { ChecklistCategory } from '@/types/checklist';

interface ClientDocumentCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  checklistCategories?: ChecklistCategory[];
  hasChecklist?: boolean;
  submittedDocumentsCount?: number;
}

export function ClientDocumentCategoryFilter({ 
  selectedCategory, 
  onCategoryChange,
  checklistCategories = [],
  hasChecklist = false,
  submittedDocumentsCount = 0
}: ClientDocumentCategoryFilterProps) {
  
  // Get categories based on checklist state
  const getCategoriesForState = (): DocumentCategoryInfo[] => {
    if (!hasChecklist || checklistCategories.length === 0) {
      // No checklist: Only show submitted documents
      return [
        { id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount }
      ];
    }
    
    // Has checklist: Show submitted + dynamic checklist categories
    return [
      { id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount },
      ...checklistCategories.map(cat => ({
        id: cat.id,
        label: cat.label,
        count: cat.count
      }))
    ];
  };

  const categories = getCategoriesForState();

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-colors",
            selectedCategory === category.id
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          )}
        >
          {category.label}
          {category.count > 0 && (
            <span className={cn(
              "ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium",
              selectedCategory === category.id
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            )}>
              {category.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
