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
import { IDENTITY_DOCUMENTS, EDUCATION_DOCUMENTS, OTHER_DOCUMENTS, COMPANY_DOCUMENTS } from '@/lib/documents/checklist';

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

    ...COMPANY_DOCUMENTS,
  ];

  // Add company documents for each company (these will have dynamic company names)
  const companyDocuments = companies.flatMap(company => 
    COMPANY_DOCUMENTS.map(doc => ({
      ...doc,
      category: company.category,
      companyName: company.name
    }))
  );

  return [...baseDocuments, ...companyDocuments];
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
      default:
        return false;
    }
  });
}

/**
 * Generate checklist categories based on saved checklist
 */
export function generateChecklistCategories(
  checklistItems: ChecklistItem[]
): ChecklistCategory[] {
  const categoryMap = new Map<string, ChecklistCategory>();
  
  // Process checklist items
  checklistItems.forEach(item => {
    const categoryKey = item.document_category;
    
    if (!categoryMap.has(categoryKey)) {
      // Map API category names to display names
      let displayLabel = categoryKey;
      if (categoryKey === 'Identity') {
        displayLabel = 'Identity Documents';
      } else if (categoryKey === 'Education') {
        displayLabel = 'Education Documents';
      } else if (categoryKey === 'Other') {
        displayLabel = 'Other Documents';
      } else if (categoryKey === 'Company') {
        displayLabel = 'Company Documents';
      }
      
      categoryMap.set(categoryKey, {
        id: categoryKey.toLowerCase().replace(/\s+/g, '_'),
        label: displayLabel,
        count: 0,
        type: categoryKey.includes('Documents') && 
              !['Identity Documents', 'Education Documents', 'Other Documents'].includes(categoryKey)
              ? 'company' : 'base',
        company_name: item.company_name,
        is_selected: true
      });
    }
    
    const category = categoryMap.get(categoryKey)!;
    category.count++;
  });
  
  return Array.from(categoryMap.values());
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
    item.document_category.includes('Documents') && 
    !['Identity Documents', 'Education Documents', 'Other Documents'].includes(item.document_category)
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
      // Map API category names to display names for comparison
      let categoryLabel = item.document_category;
      if (item.document_category === 'Identity') {
        categoryLabel = 'Identity Documents';
      } else if (item.document_category === 'Education') {
        categoryLabel = 'Education Documents';
      } else if (item.document_category === 'Other') {
        categoryLabel = 'Other Documents';
      } else if (item.document_category === 'Company') {
        categoryLabel = 'Company Documents';
      }
      return `${categoryLabel}-${item.document_type}`;
    })
  );
  
  return allDocumentTypes.filter(docType => {
    const key = `${docType.category}-${docType.documentType}`;
    return !checklistDocumentTypes.has(key);
  });
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
  if (category.includes('Documents')) return category.replace(' Documents', '');
  return category;
}

/**
 * Sort categories for display
 */
export function sortCategoriesForDisplay(categories: ChecklistCategory[]): ChecklistCategory[] {
  const order = ['identity', 'education', 'other', 'company'];
  
  return categories.sort((a, b) => {
    const aIndex = order.findIndex(o => a.id.includes(o));
    const bIndex = order.findIndex(o => b.id.includes(o));
    
    if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
}
