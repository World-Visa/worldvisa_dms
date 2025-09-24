import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  IDENTITY_DOCUMENTS, 
  EDUCATION_DOCUMENTS, 
  OTHER_DOCUMENTS, 
  COMPANY_DOCUMENTS,
  SELF_EMPLOYMENT_DOCUMENTS
} from '@/lib/documents/checklist';
import { 
  Company,
} from '@/types/documents';
import { parseCompaniesFromDocuments } from '@/utils/companyParsing';
import { Document } from '@/types/applications';
import type { 
  ChecklistState, 
  ChecklistDocument, 
  DocumentRequirement, 
  ChecklistUpdateRequest, 
  ChecklistItem 
} from '@/types/checklist';

interface DocumentType {
  category: string;
  documentType: string;
  companyName?: string;
}

interface UseDocumentChecklistLogicProps {
  documents?: Document[];
  isLoading?: boolean;
  error?: Error | null;
  applicationId: string;
  selectedCategory: string;
  companies: Company[];
  checklistState?: ChecklistState;
  filteredDocuments?: DocumentType[];
  currentChecklistDocuments?: ChecklistDocument[];
  availableDocumentsForEditing?: DocumentType[];
  selectedDocuments?: ChecklistDocument[];
  requirementMap?: Record<string, DocumentRequirement>;
  onUpdateDocumentRequirement?: (category: string, documentType: string, requirement: DocumentRequirement) => void;
  onUpdateChecklist?: (itemsToUpdate: ChecklistUpdateRequest[], itemsToDelete: string[]) => Promise<void>;
  isClientView?: boolean;
  checklistData?: { success: boolean; data: ChecklistItem[] };
  pendingAdditions?: ChecklistDocument[];
  pendingDeletions?: string[];
  pendingUpdates?: Array<{checklistId: string, required: boolean, documentType: string, documentCategory: string}>;
  onAddToPendingChanges?: (document: ChecklistDocument) => void;
  onRemoveFromPendingChanges?: (document: ChecklistDocument) => void;
  onAddToPendingDeletions?: (checklistId: string) => void;
  onRemoveFromPendingDeletions?: (checklistId: string) => void;
  onSavePendingChanges?: () => Promise<void>;
  onClearPendingChanges?: () => void;
}

export function useDocumentChecklistLogic({
  documents,
  selectedCategory,
  companies,
  checklistState = 'none',
  currentChecklistDocuments = [],
  availableDocumentsForEditing = [],
  isClientView = false,
  checklistData,
  onAddToPendingChanges,
}: UseDocumentChecklistLogicProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'current' | 'available'>('current');
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [addingDocumentId, setAddingDocumentId] = useState<string | undefined>(undefined);
  const [isDocumentAdded, setIsDocumentAdded] = useState(false);
  const [addedDocumentId, setAddedDocumentId] = useState<string | undefined>(undefined);
  
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Memoize category mapping function
  const mapCategoryLabel = useCallback((category: string) => {
    if (category === 'Identity') return 'Identity Documents';
    if (category === 'Education') return 'Education Documents';
    if (category === 'Other') return 'Other Documents';
    if (category === 'Company') return 'Company Documents';
    if (category === 'Self Employment/Freelance') return 'Self Employment/Freelance';
    
    // Handle company-specific categories (e.g., "radicalstart infolab pvt.ltd Company Documents")
    if (category.includes('Company Documents')) {
      return category; // Return as-is for company-specific categories
    }
    
    return category;
  }, []);

  // Combine all document types from checklist
  const allDocumentTypes = useMemo(() => {
    if (isClientView && checklistData?.data) {
      const checklistDocuments = checklistData.data.map((item: {document_category: string; document_type: string}) => {
        let categoryLabel = item.document_category;
        if (item.document_category === 'Identity') {
          categoryLabel = 'Identity Documents';
        } else if (item.document_category === 'Education') {
          categoryLabel = 'Education Documents';
        } else if (item.document_category === 'Other') {
          categoryLabel = 'Other Documents';
        } else if (item.document_category === 'Self Employment/Freelance') {
          categoryLabel = 'Self Employment/Freelance';
        } else if (item.document_category === 'Self Employment/Freelance') {
          categoryLabel = 'Self Employment/Freelance';
        } else if (item.document_category === 'Company') {
          // For company documents, try to find the actual company category from documents
          if (documents && documents.length > 0) {
            const companyDoc = documents.find(doc => 
              doc.document_category && 
              doc.document_category.includes('Company Documents') &&
              doc.company_name === (item as unknown as ChecklistItem).company_name

            );
            if (companyDoc && companyDoc.document_category) {
              categoryLabel = companyDoc.document_category;
            } else {
              categoryLabel = 'Company Documents';
              
            }
          } else {
            categoryLabel = 'Company Documents';
          }
        }
        
        return {
          documentType: item.document_type,
          category: categoryLabel
        };
      });

      return checklistDocuments;
    }

    const baseDocuments = [
      ...IDENTITY_DOCUMENTS,
      ...EDUCATION_DOCUMENTS,
      ...OTHER_DOCUMENTS,
      ...SELF_EMPLOYMENT_DOCUMENTS,
    ];

    const companyDocuments = companies.flatMap(company => 
      COMPANY_DOCUMENTS.map(doc => ({
        ...doc,
        category: company.category,
        companyName: company.name
      }))
    );


    return [...baseDocuments, ...companyDocuments];
  }, [companies, isClientView, checklistData, documents]);

  // Extract companies from documents API response, but use actual company data when available
  const extractedCompanies = useMemo(() => {
    // Get company categories from documents (if any exist)
    const companyCategories = new Set<string>();
    if (documents && documents.length > 0) {
      documents.forEach(doc => {
        if (doc.document_category && doc.document_category.includes('Company Documents')) {
          companyCategories.add(doc.document_category);
        }
      });
    }
    
    // Always include companies from the companies prop (which have correct dates and descriptions)
    const existingCompanies = companies || [];
    
    // If we have companies from props, use them (regardless of whether they have documents)
    if (existingCompanies.length > 0) {
      return existingCompanies;
    }
    
    // Fallback: generate companies from document categories (for backward compatibility)
    if (companyCategories.size > 0) {
      return parseCompaniesFromDocuments(documents || []);
    }
    
    // If no companies and no documents, return empty array
    return [];
  }, [documents, companies]);

  // Get current company if a company category is selected
  const currentCompany = useMemo(() => {
    if (selectedCategory === 'company') {
      return null;
    }
    if (selectedCategory.includes('company_documents')) {
      // Convert underscore format back to proper category format
      // e.g., "radicalstart_infolab_pvt.ltd_company_documents" -> "radicalstart infolab pvt.ltd Company Documents"
      const parts = selectedCategory.split('_');
      const companyParts = parts.slice(0, -2); // All parts except "company" and "documents"
      const companyName = companyParts.join(' ').toLowerCase(); // Keep company name in lowercase
      const categoryLabel = `${companyName} Company Documents`;
      
      const foundCompany = companies.find(company => 
        company.category.toLowerCase() === categoryLabel.toLowerCase()
      );
      return foundCompany;
    }
    return null;
  }, [selectedCategory, companies]);

  // Memoize category filtering function
  const matchesCategory = useCallback((itemCategory: string, targetCategory: string) => {
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
      case 'self_employment':
      case 'self_employment/freelance':
        return categoryLabel === 'Self Employment/Freelance';
      case 'all':
      default:
        return true;
    }
  }, [mapCategoryLabel]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    if (checklistState !== 'editing') {
      return { currentCount: 0, availableCount: 0 };
    }

    const currentCount = currentChecklistDocuments.filter(item => 
      matchesCategory(item.category, selectedCategory)
    ).length;

    const availableCount = availableDocumentsForEditing.filter(item => 
      matchesCategory(item.category, selectedCategory)
    ).length;

    return { currentCount, availableCount };
  }, [checklistState, currentChecklistDocuments, availableDocumentsForEditing, selectedCategory, matchesCategory]);

  // Enhanced add to pending changes with loading and success state
  const handleAddToPendingChanges = useCallback(async (document: ChecklistDocument) => {
    const documentId = `${document.category}-${document.documentType}`;
    setIsAddingDocument(true);
    setAddingDocumentId(documentId);
    
    try {
      onAddToPendingChanges?.(document);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsDocumentAdded(true);
      setAddedDocumentId(documentId);
      
      setTimeout(() => {
        setIsDocumentAdded(false);
        setAddedDocumentId(undefined);
      }, 2000);
      
    } finally {
      setIsAddingDocument(false);
      setAddingDocumentId(undefined);
    }
  }, [onAddToPendingChanges]);

  // Memoize tab change handler
  const handleTabChange = useCallback((tab: 'current' | 'available') => {
    setActiveTab(tab);
  }, []);

  // Reset to first page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  return {
    // State
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    activeTab,
    isAddingDocument,
    addingDocumentId,
    isDocumentAdded,
    addedDocumentId,
    itemsPerPage,
    
    // Computed values
    allDocumentTypes,
    extractedCompanies,
    currentCompany,
    tabCounts,
    
    // Handlers
    handleAddToPendingChanges,
    handleTabChange,
    mapCategoryLabel,
    matchesCategory,
    
    // Query client for document operations
    queryClient
  };
}
