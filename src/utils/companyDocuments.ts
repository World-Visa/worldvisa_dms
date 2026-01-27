import type { Document } from '@/types/applications';

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

export function filterDocumentsWithValidIds(documents: Document[]): Document[] {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents.filter((doc) => {
    return doc?._id && 
           typeof doc._id === 'string' && 
           doc._id.trim() !== '';
  });
}
