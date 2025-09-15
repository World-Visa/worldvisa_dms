import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  IDENTITY_DOCUMENTS, 
  EDUCATION_DOCUMENTS, 
  OTHER_DOCUMENTS, 
  COMPANY_DOCUMENTS
} from '@/lib/documents/checklist';
import { useSearchMemo } from '@/lib/utils/search';
import { 
  ApiDocument,
  Company,
  DocumentChecklistTableProps
} from '@/types/documents';
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
  applicationId,
  selectedCategory,
  companies,
  checklistState = 'none',
  filteredDocuments = [],
  currentChecklistDocuments = [],
  availableDocumentsForEditing = [],
  selectedDocuments = [],
  requirementMap = {},
  isClientView = false,
  checklistData,
  pendingAdditions = [],
  pendingDeletions = [],
  pendingUpdates = [],
  onAddToPendingChanges,
  onRemoveFromPendingChanges,
  onAddToPendingDeletions,
  onRemoveFromPendingDeletions,
  onSavePendingChanges,
  onClearPendingChanges
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
    ];

    const companyDocuments = companies.flatMap(company => 
      COMPANY_DOCUMENTS.map(doc => ({
        ...doc,
        category: company.category,
        companyName: company.name
      }))
    );

    return [...baseDocuments, ...companyDocuments];
  }, [companies, isClientView, checklistData]);

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
      return Array.from(companyCategories).map(category => {
        const companyName = category.split(' ')[0].toLowerCase();
        
        // Try to find a document with description for this company to extract dates
        let description = '';
        let fromDate = "2024-01-01"; // Default fallback dates
        let toDate = "2025-12-31";
        
        if (documents && documents.length > 0) {
          const companyDoc = documents.find(doc => 
            doc.document_category === category && doc.description
          );
          
          if (companyDoc && companyDoc.description) {
            description = companyDoc.description;
            
            // Try to extract dates from description
            const dateMatch = companyDoc.description.match(/from\s+(\w+\s+\d{2},\s+\d{4})\s+to\s+(\w+\s+\d{2},\s+\d{4})/i);
            if (dateMatch) {
              const fromDateStr = dateMatch[1];
              const toDateStr = dateMatch[2];
              
              try {
                fromDate = new Date(fromDateStr).toISOString().split('T')[0];
                toDate = new Date(toDateStr).toISOString().split('T')[0];
              } catch {
                // Failed to parse dates, using defaults
              }
            }
          }
        }
        
        return {
          name: companyName,
          category: category,
          fromDate: fromDate,
          toDate: toDate,
          description: description
        };
      });
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
      const categoryLabel = selectedCategory
        .split('_')
        .map((word, index) => {
          if (index === 0) return word.toLowerCase();
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
      
      const foundCompany = companies.find(company => company.category === categoryLabel);
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
