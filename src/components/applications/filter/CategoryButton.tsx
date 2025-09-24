'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { DocumentCategoryInfo } from '@/types/documents';
import { formatDateRange, formatDate } from '@/utils/dateFormat';
import { Badge } from '@/components/ui/badge';

interface CategoryButtonProps {
  category: DocumentCategoryInfo;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onRemoveCompany?: (companyName: string) => void;
  disabled?: boolean;
}

export const CategoryButton = memo(function CategoryButton({
  category,
  selectedCategory,
  onCategoryChange,
  onRemoveCompany,
  disabled = false
}: CategoryButtonProps) {
  // Check if this is a company-specific chip (contains "Company Documents" but not the generic one)
  const isCompanyChip = category.label.includes('Company Documents') &&
    category.label !== 'Company Documents' &&
    onRemoveCompany;

  // Extract company name from the category label (this will be lowercase for matching)
  const companyName = isCompanyChip ? category.label.replace(' Company Documents', '') : null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent category selection
    if (companyName && onRemoveCompany) {
      onRemoveCompany(companyName);
    }
  };

  return (
    <div className="relative group">
      <button
        key={category.id}
        disabled={disabled}
        className={cn(
          'relative inline-flex flex-col items-center gap-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
          'border-2 focus:outline-none focus:ring-0',
          disabled 
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:shadow-md transform hover:-translate-y-0.5',
          selectedCategory === category.id
            ? 'bg-black text-white border-black shadow-lg focus:ring-black/20'
            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-200'
        )}
        onClick={() => !disabled && onCategoryChange(category.id)}
      >
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">{category.label}</span>
          {/* Show current employment badge */}
          {category.isCurrentEmployment && (
            <Badge 
              variant="secondary" 
              className="bg-green-500 text-white text-xs px-1.5 py-0.5"
            >
              Current
            </Badge>
          )}
        </div>
        {/* Show date range for any chip that has date information */}
        {category.fromDate && (
          <div className={cn(
            'text-xs font-normal',
            selectedCategory === category.id
              ? 'text-white/80'
              : 'text-gray-500'
          )}>
            {category.isCurrentEmployment 
              ? `Since ${formatDate(category.fromDate)} - Present`
              : category.toDate 
                ? formatDateRange(category.fromDate, category.toDate)
                : `From ${formatDate(category.fromDate)}`
            }
          </div>
        )}
      </button>

      {/* Delete button for company chips */}
      {isCompanyChip && (
        <button
          onClick={handleDeleteClick}
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
            'bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1',
            'opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100'
          )}
          title={`Remove ${companyName}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});
