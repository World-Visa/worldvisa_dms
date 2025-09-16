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
    // Check if this is a company documents category (either with underscores or spaces)
    if (!selectedCategory.includes('company_documents') && !selectedCategory.includes('Company Documents')) {
      return null;
    }

    // Create a flexible matching function that works for all company names
    const findMatchingCompany = (category: string): Company | null => {
      // First, try exact category match
      let foundCompany = extractedCompanies.find(company => company.category === category);
      if (foundCompany) return foundCompany;

      // Try to convert underscore format to space format for matching
      if (category.includes('_')) {
        const spaceFormat = category.replace(/_/g, ' ');
        foundCompany = extractedCompanies.find(company => company.category === spaceFormat);
        if (foundCompany) return foundCompany;
      }

      // If no exact match, try to extract company name and match flexibly
      let companyName: string;
      
      if (category.includes('_')) {
        // Handle underscore format: "company_name_company_documents"
        const parts = category.split('_');
        companyName = parts[0]; // First part is the company name
      } else {
        // Handle space format: "Company Name Company Documents"
        const parts = category.split(' ');
        // Remove "Company Documents" from the end
        const companyParts = parts.filter(part => 
          !part.toLowerCase().includes('company') && 
          !part.toLowerCase().includes('documents')
        );
        companyName = companyParts.join(' ');
      }

      // Try multiple matching strategies (all case-insensitive since company names are now stored in lowercase)
      const matchingStrategies = [
        // 1. Exact name match (both are lowercase now)
        (company: Company) => company.name === companyName.toLowerCase(),
        
        // 2. Partial name match - for names with special characters
        (company: Company) => company.name.includes(companyName.toLowerCase()) || 
                              companyName.toLowerCase().includes(company.name),
        
        // 3. Category contains the company name (case-insensitive)
        (company: Company) => company.category.toLowerCase().includes(companyName.toLowerCase()),
        
        // 4. Company name contains category company name (case-insensitive)
        (company: Company) => companyName.toLowerCase().includes(company.name),
        
        // 5. Fuzzy match - remove special characters and compare
        (company: Company) => {
          const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalize(company.name) === normalize(companyName);
        }
      ];

      // Try each strategy
      for (const strategy of matchingStrategies) {
        foundCompany = extractedCompanies.find(strategy);
        if (foundCompany) {
          return foundCompany;
        }
      }

      return null;
    };

    const foundCompany = findMatchingCompany(selectedCategory);
    
    return foundCompany;
  }, [selectedCategory, extractedCompanies]);

  if (!displayCompany) {
    return null;
  }

  // Extract original case company name from description
  const getDisplayCompanyName = (company: Company): string => {
    if (company.description) {
      // Extract company name from description: "Worked at COMPANY_NAME from..."
      const match = company.description.match(/Worked at ([^ ]+) from/);
      if (match && match[1]) {
        return match[1];
      }
    }
    // Fallback to stored name (which is now lowercase)
    return company.name;
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gray-200 rounded">
          <Building2 className="h-3 w-3 text-gray-600" />
        </div>
        <div className="text-sm">
          <div className="font-medium text-gray-900">{getDisplayCompanyName(displayCompany)}</div>
          <div className="text-xs text-gray-600">
            {displayCompany.description || generateCompanyDescription(displayCompany.fromDate, displayCompany.toDate)}
          </div>
        </div>
      </div>
    </div>
  );
});
