'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DocumentCategory, DocumentCategoryInfo, DocumentCategoryFilterProps, Company } from '@/types/documents';

const baseCategories: DocumentCategoryInfo[] = [
  { id: 'submitted', label: 'Submitted Documents', count: 0 },
  { id: 'all', label: 'All Documents', count: 0 },
  { id: 'identity', label: 'Identity Documents', count: 0 },
  { id: 'education', label: 'Education Documents', count: 0 },
  { id: 'other', label: 'Other Documents', count: 0 },
];

interface ExtendedDocumentCategoryFilterProps extends DocumentCategoryFilterProps {
  companies: Company[];
  onAddCompany: () => void;
  maxCompanies: number;
}

export function DocumentCategoryFilter({ 
  selectedCategory, 
  onCategoryChange, 
  companies, 
  onAddCompany, 
  maxCompanies 
}: ExtendedDocumentCategoryFilterProps) {
  // Create company categories
  const companyCategories: DocumentCategoryInfo[] = companies.map(company => ({
    id: `company-${company.name}` as DocumentCategory,
    label: `${company.name} Documents`,
    count: 0
  }));

  // Combine base categories with company categories
  const allCategories = [...baseCategories, ...companyCategories];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {allCategories.map((category) => (
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
      ))}
      
      {/* Add Company Button */}
      {companies.length < maxCompanies && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCompany}
          className={cn(
            'cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
            'border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50',
            'focus:outline-none focus:ring-0'
          )}
        >
          <Plus className="h-4 w-4" />
          <span>Add Company</span>
        </Button>
      )}
    </div>
  );
}
