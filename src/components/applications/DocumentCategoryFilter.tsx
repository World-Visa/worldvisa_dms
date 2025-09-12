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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Create company categories
  const companyCategories: DocumentCategoryInfo[] = companies.map(company => ({
    id: company.category as DocumentCategory,
    label: company.category,
    count: 0
  }));

  // Combine base categories with company categories
  const allCategories = [...baseCategories, ...companyCategories];

  // Find the selected category info
  const selectedCategoryInfo = allCategories.find(cat => cat.id === selectedCategory);

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

  // Add Company Button component
  const AddCompanyButton = () => (
    companies.length < maxCompanies && (
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
    )
  );

  return (
    <div className="mb-6">
      {/* Desktop View - Show all buttons */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        {allCategories.map((category) => (
          <CategoryButton key={category.id} category={category} />
        ))}
        <AddCompanyButton />
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
              {baseCategories.map((category) => (
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
              
              {companyCategories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {companyCategories.map((category) => (
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="w-full">
            <AddCompanyButton />
          </div>
        </div>
      </div>
    </div>
  );
}
