/**
 * Checklist Utility Functions
 * 
 * This module provides utility functions for checklist operations,
 * document filtering, and requirement management.
 */

import type {
  ChecklistItem,
  ChecklistDocument,
  DocumentRequirement,
  RequirementMap,
  ChecklistCategory,
  ChecklistCreateRequest
} from '@/types/checklist';

interface DocumentType {
  category: string;
  documentType: string;
  companyName?: string;
}

interface Company {
  category: string;
  name: string;
}
import type { Document } from '@/types/applications';
import { IDENTITY_DOCUMENTS, EDUCATION_DOCUMENTS, OTHER_DOCUMENTS, COMPANY_DOCUMENTS, SELF_EMPLOYMENT_DOCUMENTS } from '@/lib/documents/checklist';

/**
 * Convert requirement string to boolean for API
 */
export function requirementToBoolean(requirement: DocumentRequirement): boolean | null {
  switch (requirement) {
    case 'mandatory':
      return true;
    case 'optional':
      return false;
    case 'not_required':
    default:
      return null; // Don't include in API call
  }
}

/**
 * Convert boolean to requirement string
 */
export function booleanToRequirement(required: boolean): DocumentRequirement {
  return required ? 'mandatory' : 'optional';
}

/**
 * Auto-mark submitted documents as mandatory
 */
export function markSubmittedDocumentsAsMandatory(
  documents: Document[],
  allDocumentTypes: DocumentType[]
): RequirementMap {
  const requirementMap: RequirementMap = {};
  
  // Add safety checks
  if (!Array.isArray(documents)) {
    console.warn('markSubmittedDocumentsAsMandatory: documents is not an array', documents);
    return requirementMap;
  }
  
  if (!Array.isArray(allDocumentTypes)) {
    console.warn('markSubmittedDocumentsAsMandatory: allDocumentTypes is not an array', allDocumentTypes);
    return requirementMap;
  }
  
  const validDocuments = documents?.filter(doc => 
    doc && typeof doc === 'object' && doc.file_name
  ) || [];
  
  allDocumentTypes.forEach(docType => {
    const expectedDocType = docType.documentType.toLowerCase().replace(/\s+/g, '_');
    
    const uploadedDoc = validDocuments.find(doc => {
      if (!doc || !doc.file_name) return false;
      
      // Check by document_type field first
      if (doc.document_type && doc.document_type === expectedDocType) {
        if (docType.category.includes('Documents') && 
            !['Identity Documents', 'Education Documents', 'Other Documents'].includes(docType.category)) {
          return doc.document_category === docType.category;
        }
        return true;
      }
      
      // Fallback to filename matching
      const fileName = doc.file_name.toLowerCase();
      const docTypeName = docType.documentType.toLowerCase();
      return fileName.includes(docTypeName);
    });
    
    if (uploadedDoc) {
      const key = `${docType.category}-${docType.documentType}`;
      requirementMap[key] = 'mandatory';
    }
  });
  
  return requirementMap;
}

/**
 * Get all available document types including company documents
 */
export function getAllDocumentTypes(companies: Company[] = []) {
  const baseDocuments = [
    ...IDENTITY_DOCUMENTS,
    ...EDUCATION_DOCUMENTS,
    ...OTHER_DOCUMENTS,
    ...SELF_EMPLOYMENT_DOCUMENTS,
  ];

  // Add company documents for each company (these will have dynamic company names)
  const companyDocuments = companies.flatMap(company => 
    COMPANY_DOCUMENTS.map(doc => ({
      ...doc,
      category: company.category,
      companyName: company.name
    }))
  );

  // If no companies are added yet, still include generic company documents
  // so users can see them in the checklist creation mode
  const genericCompanyDocuments = companies.length === 0 ? 
    COMPANY_DOCUMENTS.map(doc => ({
      ...doc,
      category: 'Company Documents',
      companyName: undefined
    })) : [];

  return [...baseDocuments, ...companyDocuments, ...genericCompanyDocuments];
}

/**
 * Filter documents based on selected categories
 */
export function filterDocumentsByCategories(
  allDocumentTypes: DocumentType[],
  selectedCategories: string[]
): DocumentType[] {
  if (selectedCategories.includes('all')) {
    return allDocumentTypes;
  }
  
  return allDocumentTypes.filter((docType: DocumentType) => {
    // Handle company documents - check for both   'company' selection and 'Company' category
    if (docType.category === 'Company') {
      return selectedCategories.includes('company');
    }
    
    // Handle company documents with dynamic company names
    if (docType.category.includes('Documents') && 
        !['Identity Documents', 'Education Documents', 'Other Documents'].includes(docType.category)) {
      return selectedCategories.includes('company') || 
             selectedCategories.some(cat => cat === docType.category);
    }
    
    // Handle base categories
    switch (docType.category) {
      case 'Identity Documents':
        return selectedCategories.includes('identity');
      case 'Education Documents':
        return selectedCategories.includes('education');
      case 'Other Documents':
        return selectedCategories.includes('other');
      case 'Self Employment/Freelance':
        return selectedCategories.includes('self_employment');
      default:
        return false;
    }
  });
}

/**
 * Generate checklist categories based on saved checklist
 */
export function generateChecklistCategories(
  checklistItems: ChecklistItem[],
  companies: { name: string; category: string; fromDate?: string; toDate?: string; isCurrentEmployment?: boolean }[] = [],
  uploadedDocuments: { document_category?: string }[] = []
): ChecklistCategory[] {
  const categoryMap = new Map<string, ChecklistCategory>();
  
  // Process checklist items
  checklistItems.forEach(item => {
    const categoryKey = item.document_category;
    
    // Skip company documents - they will be handled separately
    if (categoryKey === 'Company' || categoryKey === 'Company Documents') {
      return;
    }
    
    if (!categoryMap.has(categoryKey)) {
      let displayLabel = categoryKey;
      if (categoryKey === 'Identity') {
        displayLabel = 'Identity Documents';
      } else if (categoryKey === 'Education') {
        displayLabel = 'Education Documents';
      } else if (categoryKey === 'Other') {
        displayLabel = 'Other Documents';
      } else if (categoryKey === 'Self Employment/Freelance') {
        displayLabel = 'Self Employment/Freelance';
      }
      
      categoryMap.set(categoryKey, {
        id: categoryKey.toLowerCase().replace(/\s+/g, '_'),
        label: displayLabel,
        count: 0,
        type: 'base',
        is_selected: true
      });
    }
    
    const category = categoryMap.get(categoryKey)!;
    category.count++;
  });
  
  // Extract company categories from uploaded documents
  // This ensures company chips persist across logout/login
  const companyCategories = new Set<string>();
  
  // Get company categories from uploaded documents
  uploadedDocuments.forEach(doc => {
    if (doc.document_category && doc.document_category.includes('Company Documents')) {
      companyCategories.add(doc.document_category);
    }
  });
  
  // Add company-specific categories from uploaded documents
  // Track which company items have been counted to avoid double-counting
  const countedCompanyItems = new Set<string>();
  
  companyCategories.forEach(companyCategory => {
    const companyName = companyCategory.replace(' Company Documents', '');
    
    // Count items for this specific company
    // First try to match by company_name if it exists
    let companyItems = checklistItems.filter(item => 
      item.document_category === 'Company' && 
      item.company_name === companyName
    );
    
    // If no items found by company_name, fall back to counting all company items
    // This handles cases where company_name might not be set properly
    if (companyItems.length === 0) {
      companyItems = checklistItems.filter(item => item.document_category === 'Company');
    }
    
    // Filter out items that have already been counted for other companies
    const uniqueCompanyItems = companyItems.filter(item => {
      const itemKey = `${item.document_type}-${item.company_name || 'generic'}`;
      if (countedCompanyItems.has(itemKey)) {
        return false; // Already counted
      }
      countedCompanyItems.add(itemKey);
      return true;
    });
    
    // Find the company data to get dates
    const companyData = companies.find(company => company.name === companyName);
    
    categoryMap.set(companyCategory, {
      id: companyCategory.toLowerCase().replace(/\s+/g, '_'),
      label: companyCategory,
      count: uniqueCompanyItems.length,
      type: 'company' as const,
      company_name: companyName,
      is_selected: true,
      fromDate: companyData?.fromDate,
      toDate: companyData?.toDate,
      isCurrentEmployment: companyData?.isCurrentEmployment
    });
  });
  
  companies.forEach(company => {
    const companyCategoryKey = company.category; // e.g., "WorldVisa Company Documents"
    
    // Skip if already added from uploaded documents
    if (categoryMap.has(companyCategoryKey)) {
      return;
    }
    
    // Count items for this specific company
    // First try to match by company_name if it exists
    let companyItems = checklistItems.filter(item => 
      item.document_category === 'Company' && 
      item.company_name === company.name
    );
    
    // If no items found by company_name, fall back to counting all company items
    if (companyItems.length === 0) {
      companyItems = checklistItems.filter(item => item.document_category === 'Company');
    }
    
    categoryMap.set(companyCategoryKey, {
      id: companyCategoryKey.toLowerCase().replace(/\s+/g, '_'),
      label: companyCategoryKey,
      count: companyItems.length,
      type: 'company' as const,
      company_name: company.name,
      is_selected: true,
      fromDate: company.fromDate,
      toDate: company.toDate,
      isCurrentEmployment: company.isCurrentEmployment
    });
  });
  
  const result = Array.from(categoryMap.values());
  
  return result;
}

/**
 * Check if company documents are selected in checklist
 */
export function hasCompanyDocumentsInChecklist(checklistItems: ChecklistItem[]): boolean {
  if (!Array.isArray(checklistItems)) {
    console.warn('hasCompanyDocumentsInChecklist: checklistItems is not an array', checklistItems);
    return false;
  }
  
  return checklistItems.some(item => 
    item.document_category === 'Company' || item.document_category === 'Company Documents'
  );
}

/**
 * Get documents not in checklist for editing mode
 */
export function getAvailableDocumentsForEditing(
  allDocumentTypes: DocumentType[],
  checklistItems: ChecklistItem[]
): DocumentType[] {
  // Add safety checks
  if (!Array.isArray(allDocumentTypes)) {
    console.warn('getAvailableDocumentsForEditing: allDocumentTypes is not an array', allDocumentTypes);
    return [];
  }
  
  if (!Array.isArray(checklistItems)) {
    console.warn('getAvailableDocumentsForEditing: checklistItems is not an array', checklistItems);
    return allDocumentTypes;
  }
  
  
  const checklistDocumentTypes = new Set(
    checklistItems.map(item => {
        let categoryLabel = item.document_category;
        if (item.document_category === 'Identity') {
          categoryLabel = 'Identity Documents';
        } else if (item.document_category === 'Education') {
          categoryLabel = 'Education Documents';
        } else if (item.document_category === 'Other') {
          categoryLabel = 'Other Documents';
        } else if (item.document_category === 'Self Employment/Freelance') {
          categoryLabel = 'Self Employment/Freelance';
        } else if (item.document_category === 'Company') {
        // For company documents, use the specific company name if available
        if (item.company_name) {
          categoryLabel = `${item.company_name} Company Documents`;
        } else {
          categoryLabel = 'Company Documents';
        }
      } else if (item.document_category.includes('Company Documents')) {
        // If it's already a specific company category, keep it as is
        categoryLabel = item.document_category;
      }
      return `${categoryLabel}-${item.document_type}`;
    })
  );
  
  
  const filteredDocuments = allDocumentTypes.filter(docType => {
    const key = `${docType.category}-${docType.documentType}`;
    
    // Check if this document type is already in the checklist
    if (checklistDocumentTypes.has(key)) {
      return false; // Exclude it from available documents
    }
    
    // Special handling for company documents
    if (docType.category.includes('Company Documents')) {
      // Extract company name from the category (e.g., "worldvisa Company Documents" -> "worldvisa")
      const companyName = docType.category.replace(' Company Documents', '');
      
      // Check if there's a checklist item for this specific company and document type
      const companySpecificKey = `${companyName} Company Documents-${docType.documentType}`;
      if (checklistDocumentTypes.has(companySpecificKey)) {
        return false; // Exclude it from available documents
      }
      
      // Also check if there's a generic "Company Documents" entry in the checklist for the same document type
      // This handles cases where checklist items have document_category: "Company" (mapped to "Company Documents")
      const genericKey = `Company Documents-${docType.documentType}`;
      if (checklistDocumentTypes.has(genericKey)) {
        return false; // Exclude it from available documents
      }
    }
    
    // Special handling for generic "Company" category documents
    if (docType.category === 'Company') {
      // Check if there's a generic "Company Documents" entry in the checklist for the same document type
      const genericKey = `Company Documents-${docType.documentType}`;
      if (checklistDocumentTypes.has(genericKey)) {
        return false; // Exclude it from available documents
      }
    }
    
    return true; // Include it in available documents
  });
  

  return filteredDocuments;
}

/**
 * Map full category names to API-expected format
 */
function mapCategoryToApiFormat(category: string): string {
  switch (category) {
    case 'Identity Documents':
      return 'Identity';
    case 'Education Documents':
      return 'Education';
    case 'Other Documents':
      return 'Other';
    case 'Self Employment/Freelance':
      return 'Self Employment/Freelance';
    case 'Company':
      return 'Company';
    default:
      if (category.includes('Company Documents')) {
        return 'Company';
      }
      return category;
  }
}

/**
 * Create checklist items from selected documents
 */
export function createChecklistItemsFromDocuments(
  selectedDocuments: ChecklistDocument[],
  requirementMap: RequirementMap
): ChecklistCreateRequest[] { 
  return selectedDocuments
    .map(doc => {
      const key = `${doc.category}-${doc.documentType}`;
      const requirement = requirementMap[key] || 'not_required';
      const required = requirementToBoolean(requirement);
      
      // Only include if requirement is not 'not_required'
      if (required === null) return null;
      
      return {
        document_type: doc.documentType,
        document_category: mapCategoryToApiFormat(doc.category),
        required,
        company_name: doc.company_name
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Validate checklist before saving
 */
export function validateChecklist(selectedDocuments: ChecklistDocument[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (selectedDocuments.length === 0) {
    errors.push('Please select at least one document for the checklist');
  }
  
  // Check for duplicate documents
  const documentKeys = selectedDocuments.map(doc => `${doc.category}-${doc.documentType}`);
  const duplicates = documentKeys.filter((key, index) => documentKeys.indexOf(key) !== index);
  
  if (duplicates.length > 0) {
    errors.push('Duplicate documents found in selection');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  if (category === 'Identity Documents') return 'Identity';
  if (category === 'Education Documents') return 'Education';
  if (category === 'Other Documents') return 'Other';
  if (category === 'Self Employment/Freelance') return 'Self Employment/Freelance';
  if (category.includes('Documents')) return category.replace(' Documents', '');
  return category;
}

/**
 * Sort categories for display
 */
export function sortCategoriesForDisplay(categories: ChecklistCategory[]): ChecklistCategory[] {
  const order = ['identity', 'education', 'other', 'self_employment', 'company'];
  
  return categories.sort((a, b) => {
    const aIndex = order.findIndex(o => a.id.includes(o));
    const bIndex = order.findIndex(o => b.id.includes(o));
    
    if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
}
