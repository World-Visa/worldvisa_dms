'use client';

import React, { memo, useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { Company } from '@/types/documents';
import { generateCompanyDescription } from '@/utils/dateCalculations';

interface CompanyInfoDisplayProps {
  selectedCategory: string;
  extractedCompanies: Company[];
}

export const CompanyInfoDisplay = memo(function CompanyInfoDisplay({
  selectedCategory,
  extractedCompanies
}: CompanyInfoDisplayProps) {
  const displayCompany = useMemo(() => {
    if (!selectedCategory.includes('company_documents')) {
      return null;
    }

    const categoryLabel = selectedCategory
      .split('_')
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    
    return extractedCompanies.find(company => company.category === categoryLabel);
  }, [selectedCategory, extractedCompanies]);

  if (!displayCompany) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gray-200 rounded">
          <Building2 className="h-3 w-3 text-gray-600" />
        </div>
        <div className="text-sm">
          <div className="font-medium text-gray-900">{displayCompany.name}</div>
          <div className="text-xs text-gray-600">
            {displayCompany.description || generateCompanyDescription(displayCompany.fromDate, displayCompany.toDate)}
          </div>
        </div>
      </div>
    </div>
  );
});
