/* eslint-disable @typescript-eslint/no-explicit-any */
import { Company } from '@/types/documents';

/**
 * Parse date string without timezone conversion to avoid day shifts
 * Converts "Sep 15, 2020" to "2020-09-15"
 */
function parseDateString(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse company data from document description
 * Handles both current and past employment formats
 */
export function parseCompanyFromDescription(
  documentCategory: string,
  description?: string
): Company | null {
  if (!documentCategory.includes('Company Documents')) {
    return null;
  }

  // Extract company name from category
  const companyName = documentCategory
    .replace(' Company Documents', '')
    .toLowerCase();

  // Default fallback values
  let fromDate = '2024-01-01';
  let toDate: string | null = '2025-12-31';
  let isCurrentEmployment = false;

  if (description) {
    // Try to parse current employment format: "Working at Google since Jul 04, 2023 (2 years 1 month)"
    const currentMatch = description.match(
      /Working at ([^\s]+(?:\s+[^\s]+)*) since (\w+\s+\d{2},\s+\d{4})\s+\(([^)]+)\)/i
    );

    if (currentMatch) {
      const [, , fromDateStr] = currentMatch;
      try {
        // Parse dates without timezone conversion to avoid day shifts
        fromDate = parseDateString(fromDateStr);
        toDate = null;
        isCurrentEmployment = true;
      } catch {
        // Failed to parse date, use defaults
      }
    } else {
      // Try to parse past employment format: "Worked at Google from Jul 04, 2023 to Aug 26, 2025 (2 years 1 month)"
      const pastMatch = description.match(
        /Worked at ([^\s]+(?:\s+[^\s]+)*) from (\w+\s+\d{2},\s+\d{4})\s+to\s+(\w+\s+\d{2},\s+\d{4})\s+\(([^)]+)\)/i
      );

      if (pastMatch) {
        const [, , fromDateStr, toDateStr] = pastMatch;
        try {
          // Parse dates without timezone conversion to avoid day shifts
          fromDate = parseDateString(fromDateStr);
          toDate = parseDateString(toDateStr);
          isCurrentEmployment = false;
        } catch {
          // Failed to parse dates, use defaults
        }
      }
    }
  }

  return {
    name: companyName,
    fromDate,
    toDate,
    isCurrentEmployment,
    category: documentCategory,
    description: description || ''
  };
}

/**
 * Parse multiple companies from documents array
 */
export function parseCompaniesFromDocuments(documents: any[]): Company[] {
  if (!documents || documents.length === 0) return [];

  const companyMap = new Map<string, Company>();

  documents.forEach((doc) => {
    if (doc.document_category && doc.document_category.includes('Company Documents')) {
      const company = parseCompanyFromDescription(doc.document_category, doc.description);
      if (company) {
        // Use the first occurrence or the one with the most complete description
        const existing = companyMap.get(company.name);
        if (!existing || (!existing.description && company.description)) {
          companyMap.set(company.name, company);
        }
      }
    }
  });

  return Array.from(companyMap.values());
}

/**
 * Migrate existing company data to new format
 */
export function migrateCompanyData(company: any): Company {
  // If already in new format, return as is
  if (typeof company.isCurrentEmployment === 'boolean') {
    return company as Company;
  }

  // Legacy format migration
  const toDate = company.toDate;
  const isCurrent = toDate && new Date(toDate) > new Date();

  return {
    name: company.name,
    fromDate: company.fromDate,
    toDate: isCurrent ? null : toDate,
    isCurrentEmployment: isCurrent,
    category: company.category,
    description: company.description
  };
}
