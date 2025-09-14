import { 
  IDENTITY_DOCUMENTS, 
  EDUCATION_DOCUMENTS, 
  OTHER_DOCUMENTS, 
  COMPANY_DOCUMENTS
} from '@/lib/documents/checklist';
import { Document } from '@/types/applications';
import { Company } from '@/types/documents';

import type { 
  ChecklistState, 
  ChecklistDocument, 
  DocumentRequirement, 
  ChecklistItem 
} from '@/types/checklist';

interface DocumentType {
  category: string;
  documentType: string;
  companyName?: string;
}

interface ChecklistTableItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: Document | unknown;
  requirement?: DocumentRequirement;
  isSelected?: boolean;
  company_name?: string;
  checklist_id?: string;
}

export function generateAllDocumentTypes(
  companies: Company[],
  isClientView: boolean,
  checklistData?: { success: boolean; data: ChecklistItem[] }
): DocumentType[] {
  if (isClientView && checklistData?.data) {
    return checklistData.data.map((item: {document_category: string; document_type: string}) => {
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
      
      return {
        documentType: item.document_type,
        category: categoryLabel
      };
    });
  }

  const baseDocuments = [
    ...IDENTITY_DOCUMENTS,
    ...EDUCATION_DOCUMENTS,
    ...OTHER_DOCUMENTS,
  ];

  const companyDocuments = companies.flatMap(company => 
    COMPANY_DOCUMENTS.map(doc => ({
      ...doc,
      category: company.category,
      companyName: company.name
    }))
  );

  return [...baseDocuments, ...companyDocuments];
}

export function extractCompaniesFromDocuments(documents: Document[]): Company[] {
  if (!documents || documents.length === 0) return [];
  
  const companyCategories = new Set<string>();
  documents.forEach(doc => {
    if (doc.document_category && doc.document_category.includes('Company Documents')) {
      companyCategories.add(doc.document_category);
    }
  });
  
  return Array.from(companyCategories).map(category => {
    const companyName = category.split(' ')[0].toLowerCase();
    return {
      name: companyName,
      category: category,
      fromDate: "2024-01",
      toDate: "2025-12"
    };
  });
}

export function mapCategoryLabel(category: string): string {
  if (category === 'Identity') return 'Identity Documents';
  if (category === 'Education') return 'Education Documents';
  if (category === 'Other') return 'Other Documents';
  if (category === 'Company') return 'Company Documents';
  return category;
}

export function matchesCategory(itemCategory: string, targetCategory: string): boolean {
  const categoryLabel = mapCategoryLabel(itemCategory);
  
  if (targetCategory === 'company') {
    return categoryLabel === 'Company Documents' || categoryLabel === 'Company';
  }
  
  if (targetCategory.includes('Company Documents')) {
    return categoryLabel === targetCategory;
  }
  
  switch (targetCategory) {
    case 'identity':
    case 'identity_documents':
      return categoryLabel === 'Identity Documents';
    case 'education':
    case 'education_documents':
      return categoryLabel === 'Education Documents';
    case 'other':
    case 'other_documents':
      return categoryLabel === 'Other Documents';
    case 'all':
    default:
      return true;
  }
}

export function generateCreatingItems(
  checklistState: ChecklistState,
  filteredDocuments: DocumentType[],
  requirementMap: Record<string, DocumentRequirement>,
  selectedDocuments: ChecklistDocument[]
): ChecklistTableItem[] {
  if (checklistState !== 'creating') return [];
  
  return filteredDocuments.map((docType: DocumentType) => {
    const key = `${docType.category}-${docType.documentType}`;
    const requirement = requirementMap[key] || 'not_required';
    const isSelected = selectedDocuments.some(doc => 
      doc.category === docType.category && doc.documentType === docType.documentType
    );
    
    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: false,
      uploadedDocument: undefined,
      requirement,
      isSelected,
      company_name: docType.companyName
    };
  });
}

export function generateEditingCurrentItems(
  checklistState: ChecklistState,
  currentChecklistDocuments: ChecklistDocument[]
): ChecklistTableItem[] {
  if (checklistState !== 'editing') return [];
  
  return currentChecklistDocuments.map((item: ChecklistDocument) => ({
    ...item,
    category: mapCategoryLabel(item.category)
  }));
}

export function generateEditingAvailableItems(
  checklistState: ChecklistState,
  availableDocumentsForEditing: DocumentType[],
  requirementMap: Record<string, DocumentRequirement>,
  pendingAdditions: ChecklistDocument[]
): ChecklistTableItem[] {
  if (checklistState !== 'editing') return [];
  
  return availableDocumentsForEditing.map((docType: DocumentType) => {
    const key = `${docType.category}-${docType.documentType}`;
    
    const pendingAddition = pendingAdditions.find(doc => 
      doc.category === docType.category && doc.documentType === docType.documentType
    );
    
    const requirement = pendingAddition?.requirement || requirementMap[key] || 'not_required';
    
    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: false,
      uploadedDocument: undefined,
      requirement: requirement as DocumentRequirement,
      isSelected: false,
      company_name: docType.companyName
    };
  });
}

export function generateDefaultItems(
  checklistState: ChecklistState,
  allDocumentTypes: DocumentType[],
  documents: Document[]
): ChecklistTableItem[] {
  if (checklistState !== 'none') return [];
  
  const validDocuments = documents?.filter(doc => 
    doc && typeof doc === 'object' && doc.file_name
  ) || [];
  
  return allDocumentTypes.map((docType: DocumentType) => {
    const expectedDocType = docType.documentType.toLowerCase().replace(/\s+/g, '_');
    
    const uploadedDoc = validDocuments.find(doc => {
      if (!doc || !doc.file_name) return false;
      
      const docTypeFromField = doc.document_type;
      if (docTypeFromField && docTypeFromField === expectedDocType) {
        if (docType.category.includes('Documents') && 
            !['Identity Documents', 'Education Documents', 'Other Documents'].includes(docType.category)) {
          return doc.document_category === docType.category;
        }
        return true;
      }
      
      const fileName = doc.file_name.toLowerCase();
      const docTypeName = docType.documentType.toLowerCase();
      return fileName.includes(docTypeName);
    });
    
    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: !!uploadedDoc,
      uploadedDocument: uploadedDoc,
    };
  });
}

export function generateSavedItems(
  checklistState: ChecklistState,
  checklistData: { success: boolean; data: ChecklistItem[] } | undefined,
  documents: Document[],
  selectedCategory: string,
  extractedCompanies: Company[]
): ChecklistTableItem[] {
  if (checklistState !== 'saved' || !checklistData?.data || !Array.isArray(checklistData.data)) {
    return [];
  }
  
  let currentCompanyForSavedItems = null;
  
  if (selectedCategory === 'company') {
    currentCompanyForSavedItems = null;
  } else if (selectedCategory.includes('company_documents')) {
    const categoryLabel = selectedCategory
      .split('_')
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    
    if (extractedCompanies.length === 0) {
      currentCompanyForSavedItems = null;
    } else {
      currentCompanyForSavedItems = extractedCompanies.find(company => company.category === categoryLabel);
    }
  }

  const validDocuments = documents?.filter(doc => 
    doc && typeof doc === 'object' && doc.file_name
  ) || [];
  
  return checklistData.data.map((checklistItem: ChecklistItem) => {
    let categoryLabel = mapCategoryLabel(checklistItem.document_category);
    
    if ((checklistItem.document_category === 'Company' || 
         checklistItem.document_category === 'Company Documents' || 
         categoryLabel === 'Company Documents') && currentCompanyForSavedItems) {
      categoryLabel = currentCompanyForSavedItems.category;
    }
    
    const expectedDocType = checklistItem.document_type.toLowerCase().replace(/\s+/g, '_');
    
    const uploadedDoc = validDocuments.find(doc => {
      if (!doc || !doc.file_name) return false;
      
      if (doc.document_category !== categoryLabel) {
        return false;
      }
      
      const docTypeFromField = doc.document_type;
      if (docTypeFromField && docTypeFromField === expectedDocType) {
        return true;
      }
      
      const fileName = doc.file_name.toLowerCase();
      const docTypeName = checklistItem.document_type.toLowerCase();
      const fileNameMatch = fileName.includes(docTypeName);
      return fileNameMatch;
    });
    
    return {
      category: categoryLabel,
      documentType: checklistItem.document_type,
      isUploaded: !!uploadedDoc,
      uploadedDocument: uploadedDoc,
      requirement: (checklistItem.required ? 'mandatory' : 'optional') as DocumentRequirement,
      checklist_id: checklistItem.checklist_id
    };
  });
}

export function filterItemsByCategory(
  checklistItems: ChecklistTableItem[],
  selectedCategory: string
): ChecklistTableItem[] {
  // Handle company documents
  if (selectedCategory === 'company') {
    return checklistItems.filter(item => 
      item.category === 'Company Documents' || item.category === 'Company'
    );
  }
  
  // Handle dynamic company documents (with company names)
  if (selectedCategory.includes('company_documents')) {
    const categoryLabel = selectedCategory
      .split('_')
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    
    return checklistItems.filter(item => 
      item.category === categoryLabel || item.category === 'Company Documents' || item.category === 'Company'
    );
  }
  
  switch (selectedCategory) {
    case 'identity':
    case 'identity_documents':
      return checklistItems.filter(item => item.category === 'Identity Documents');
    case 'education':
    case 'education_documents':
      return checklistItems.filter(item => item.category === 'Education Documents');
    case 'other':
    case 'other_documents':
      return checklistItems.filter(item => item.category === 'Other Documents');
    case 'all':
    default:
      return checklistItems;
  }
}

export function getCategoryBadgeStyle(category: string): string {
  if (category.endsWith(' Documents') && 
      !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category)) {
    return 'bg-orange-500 hover:bg-orange-600'; // Company documents
  }
  
  switch (category) {
    case 'Identity Documents':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'Education Documents':
      return 'bg-green-500 hover:bg-green-600';
    case 'Other Documents':
      return 'bg-purple-500 hover:bg-purple-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
}
