import type { Document } from '@/types/applications';

/**
 * Get all documents that belong to a specific company category.
 * 
 * @param companyCategory - The company category to match (e.g., "Oracle Company Documents")
 * @param documents - Array of documents to filter
 * @returns Array of documents that match the company category
 */
export function getCompanyDocuments(
  companyCategory: string,
  documents: Document[]
): Document[] {
  // Guard against invalid inputs
  if (!companyCategory?.trim() || !Array.isArray(documents)) {
    return [];
  }

  return documents.filter((doc) => {
    // Guard against null/undefined document or document_category
    if (!doc?.document_category) {
      return false;
    }

    // Exact match for company category
    return doc.document_category === companyCategory;
  });
}
