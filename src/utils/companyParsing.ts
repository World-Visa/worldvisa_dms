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


export function parseCompanyFromDescription(
  documentCategory: string,
  description?: string
): Company | null {
  if (!documentCategory.includes('Company Documents')) {
    return null;
  }

  const companyName = documentCategory
    .replace(' Company Documents', '')
    .toLowerCase();

  // Don't use default dates - return null if we can't parse dates from description
  let fromDate: string | null = null;
  let toDate: string | null = null;
  let isCurrentEmployment = false;

  if (description) {
    
    const currentMatch = description.match(
      /Working at ([^\s]+(?:\s+[^\s]+)*) since (\w+\s+\d{1,2},\s+\d{4})\s+\(([^)]+)\)/i
    );

    if (currentMatch) {
      const [, , fromDateStr] = currentMatch;
      try {
        fromDate = parseDateString(fromDateStr);
        toDate = null;
        isCurrentEmployment = true;
      } catch {
        return null;
      }
    } else {
      const pastMatch = description.match(
        /Worked at ([^\s]+(?:\s+[^\s]+)*) from (\w+\s+\d{1,2},\s+\d{4})\s+to\s+(\w+\s+\d{1,2},\s+\d{4})\s+\(([^)]+)\)/i
      );

      if (pastMatch) {
        const [, , fromDateStr, toDateStr] = pastMatch;
        try {
          fromDate = parseDateString(fromDateStr);
          toDate = parseDateString(toDateStr);
          isCurrentEmployment = false;
        } catch {
          return null;
        }
      } else {
        const legacyMatch = description.match(
          /From (\w+\s+\d{1,2},\s+\d{4})\s+to\s+(\w+\s+\d{1,2},\s+\d{4})\s+\(([^)]+)\)/i
        );

        if (legacyMatch) {
          const [, fromDateStr, toDateStr] = legacyMatch;
          try {
            fromDate = parseDateString(fromDateStr);
            toDate = parseDateString(toDateStr);
            isCurrentEmployment = false;
          } catch {
            return null;
          }
        } else {
          return null;
        }
      }
    }
  } else {
    return null;
  }

  if (fromDate) {
    return {
      name: companyName,
      fromDate,
      toDate,
      isCurrentEmployment,
      category: documentCategory,
      description: description || ''
    };
  }

  return null;
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
        const existing = companyMap.get(company.name);
        if (!existing || (!existing.description && company.description)) {
          companyMap.set(company.name, company);
        }
      }
    }
  });

  return Array.from(companyMap.values());
}

export function migrateCompanyData(company: any): Company {
  if (typeof company.isCurrentEmployment === 'boolean') {
    return company as Company;
  }

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
