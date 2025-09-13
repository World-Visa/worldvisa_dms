'use client';

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadDocumentsModal } from './UploadDocumentsModal';
import { TablePagination } from '@/components/common/TablePagination';
import { CompanyHeader } from './CompanyHeader';
import {
  IDENTITY_DOCUMENTS, 
  EDUCATION_DOCUMENTS, 
  OTHER_DOCUMENTS, 
  COMPANY_DOCUMENTS
} from '@/lib/documents/checklist';
import { 
  Company,
  DocumentChecklistTableProps
} from '@/types/documents';
import { Document } from '@/types/applications';
import { DocumentListModal } from './DocumentListModal';
import { useQueryClient } from '@tanstack/react-query';
import { SearchBox } from '@/components/ui/SearchBox';
import { useSearchMemo } from '@/lib/utils/search';
import { ChecklistTabs } from './checklist/ChecklistTabs';
import { ChecklistTableRow } from './checklist/ChecklistTableRow';
import type { ChecklistState, ChecklistDocument, DocumentRequirement, ChecklistUpdateRequest, ChecklistItem } from '@/types/checklist';
import { FileText } from 'lucide-react';

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

interface ExtendedDocumentChecklistTableProps extends DocumentChecklistTableProps {
  onRemoveCompany?: (companyName: string) => void;
  // Checklist props
  checklistState?: ChecklistState;
  filteredDocuments?: DocumentType[];
  currentChecklistDocuments?: ChecklistDocument[];
  availableDocumentsForEditing?: DocumentType[];
  selectedDocuments?: ChecklistDocument[];
  requirementMap?: Record<string, DocumentRequirement>;
  onSelectDocument?: (document: ChecklistDocument) => void;
  onUpdateDocumentRequirement?: (category: string, documentType: string, requirement: DocumentRequirement) => void;
  onUpdateChecklist?: (itemsToUpdate: ChecklistUpdateRequest[], itemsToDelete: string[]) => Promise<void>;
  isClientView?: boolean;
  checklistData?: { success: boolean; data: ChecklistItem[] };
  // Pending changes props
  pendingAdditions?: ChecklistDocument[];
  pendingDeletions?: string[];
  onAddToPendingChanges?: (document: ChecklistDocument) => void;
  onRemoveFromPendingChanges?: (document: ChecklistDocument) => void;
  onAddToPendingDeletions?: (checklistId: string) => void;
  onRemoveFromPendingDeletions?: (checklistId: string) => void;
  onSavePendingChanges?: () => Promise<void>;
  onClearPendingChanges?: () => void;
}

const DocumentChecklistTableComponent = ({ 
  documents, 
  isLoading, 
  error, 
  applicationId, 
  selectedCategory, 
  companies, 
  onRemoveCompany,
  checklistState = 'none',
  filteredDocuments = [],
  currentChecklistDocuments = [],
  availableDocumentsForEditing = [],
  selectedDocuments = [],
  requirementMap = {},
  onSelectDocument,
  onUpdateDocumentRequirement,
  onUpdateChecklist,
  isClientView = false,
  checklistData,
  // Pending changes props
  pendingAdditions = [],
  pendingDeletions = [],
  onAddToPendingChanges,
  onRemoveFromPendingChanges,
  onAddToPendingDeletions,
  onRemoveFromPendingDeletions,
  onSavePendingChanges,
  onClearPendingChanges
}: ExtendedDocumentChecklistTableProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDocumentListModalOpen, setIsDocumentListModalOpen] = useState(false);
  const [selectedDocumentsForView, setSelectedDocumentsForView] = useState<Document[]>([]);
  const [selectedDocumentTypeForView, setSelectedDocumentTypeForView] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'current' | 'available'>('current');
  
  // Memoize tab change handler to prevent recreation
  const handleTabChange = useCallback((tab: 'current' | 'available') => {
    setActiveTab(tab);
  }, []);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Combine all document types from checklist
  const allDocumentTypes = useMemo(() => {
    // For client view, use only the documents from the checklist
    if (isClientView && checklistData?.data) {
      const checklistDocuments = checklistData.data.map((item: {document_category: string; document_type: string; company_name?: string}) => {
        // Map API category names to expected category names
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
          category: categoryLabel,
          companyName: item.company_name
        };
      });

      // Add company documents for each added company
      const companyDocuments = companies.flatMap(company => 
        COMPANY_DOCUMENTS.map(doc => ({
          ...doc,
          category: company.category,
          companyName: company.name
        }))
      );

      return [...checklistDocuments, ...companyDocuments];
    }

    // For admin view, use all predefined document types
    const baseDocuments = [
      ...IDENTITY_DOCUMENTS,
      ...EDUCATION_DOCUMENTS,
      ...OTHER_DOCUMENTS,
    ];

    // Add company documents for each company
    const companyDocuments = companies.flatMap(company => 
      COMPANY_DOCUMENTS.map(doc => ({
        ...doc,
        category: company.category,
        companyName: company.name
      }))
    );

    return [...baseDocuments, ...companyDocuments];
  }, [companies, isClientView, checklistData]);

  // Memoize category mapping function to prevent recreation on every render
  const mapCategoryLabel = useCallback((category: string) => {
    if (category === 'Identity') return 'Identity Documents';
    if (category === 'Education') return 'Education Documents';
    if (category === 'Other') return 'Other Documents';
    if (category === 'Company') return 'Company Documents';
    return category;
  }, []);

  // Get checklist items based on state - split into separate memos for better performance
  const creatingItems = useMemo((): ChecklistTableItem[] => {
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
  }, [checklistState, filteredDocuments, requirementMap, selectedDocuments]);

  const editingCurrentItems = useMemo((): ChecklistTableItem[] => {
    if (checklistState !== 'editing') return [];
    
    return currentChecklistDocuments.map((item: ChecklistDocument) => ({
      ...item,
      category: mapCategoryLabel(item.category)
    }));
  }, [checklistState, currentChecklistDocuments, mapCategoryLabel]);

  const editingAvailableItems = useMemo((): ChecklistTableItem[] => {
    if (checklistState !== 'editing') return [];
    
    return availableDocumentsForEditing.map((docType: DocumentType) => {
      const key = `${docType.category}-${docType.documentType}`;
      const requirement = requirementMap[key] || 'not_required';
      
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
  }, [checklistState, availableDocumentsForEditing, requirementMap]);

  const savedItems = useMemo((): ChecklistTableItem[] => {
    if (checklistState !== 'saved' || !checklistData?.data || !Array.isArray(checklistData.data)) {
      return [];
    }
    
    const validDocuments = documents?.filter(doc => 
      doc && typeof doc === 'object' && doc.file_name
    ) || [];
    
    return checklistData.data.map((checklistItem: ChecklistItem) => {
      const categoryLabel = mapCategoryLabel(checklistItem.document_category);
      const expectedDocType = checklistItem.document_type.toLowerCase().replace(/\s+/g, '_');
      
      const uploadedDoc = validDocuments.find(doc => {
        if (!doc || !doc.file_name) return false;
        
        const docTypeFromField = doc.document_type;
        if (docTypeFromField && docTypeFromField === expectedDocType) {
          if (checklistItem.document_category === 'Company' && checklistItem.company_name) {
            return doc.company_name === checklistItem.company_name;
          }
          return true;
        }
        
        const fileName = doc.file_name.toLowerCase();
        const docTypeName = checklistItem.document_type.toLowerCase();
        return fileName.includes(docTypeName);
      });
      
      return {
        category: categoryLabel,
        documentType: checklistItem.document_type,
        isUploaded: !!uploadedDoc,
        uploadedDocument: uploadedDoc,
        requirement: (checklistItem.required ? 'mandatory' : 'optional') as DocumentRequirement,
        checklist_id: checklistItem.checklist_id,
        company_name: checklistItem.company_name
      };
    });
  }, [checklistState, checklistData, documents, mapCategoryLabel]);

  const defaultItems = useMemo((): ChecklistTableItem[] => {
    if (checklistState !== 'none') return [];
    
    const validDocuments = documents?.filter(doc => 
      doc && typeof doc === 'object' && doc.file_name
    ) || [];
    
    return allDocumentTypes.map((docType: {documentType: string; category: string; companyName?: string}) => {
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
  }, [checklistState, allDocumentTypes, documents]);

  // Combine all checklist items based on state
  const checklistItems = useMemo((): ChecklistTableItem[] => {
    if (checklistState === 'creating') return creatingItems;
    if (checklistState === 'editing') {
      if (selectedCategory === 'all') return editingCurrentItems;
      return activeTab === 'current' ? editingCurrentItems : editingAvailableItems;
    }
    if (checklistState === 'saved') return savedItems;
    return defaultItems;
  }, [
    checklistState,
    selectedCategory,
    activeTab,
    creatingItems,
    editingCurrentItems,
    editingAvailableItems,
    savedItems,
    defaultItems
  ]);


  // Filter items based on selected category
  const categoryFilteredItems = useMemo(() => {
    // Handle company documents
    if (selectedCategory === 'company') {
      return checklistItems.filter(item => item.category === 'Company');
    }
    
    // Handle dynamic company documents (with company names)
    if (selectedCategory.includes('Company Documents')) {
      return checklistItems.filter(item => item.category === selectedCategory);
    }
    
    switch (selectedCategory) {
      case 'identity':
        return checklistItems.filter(item => item.category === 'Identity Documents');
      case 'education':
        return checklistItems.filter(item => item.category === 'Education Documents');
      case 'other':
        return checklistItems.filter(item => item.category === 'Other Documents');
      case 'all':
      default:
        return checklistItems;
    }
  }, [checklistItems, selectedCategory]);

  // Memoize category filtering function
  const matchesCategory = useCallback((itemCategory: string, targetCategory: string) => {
    const categoryLabel = mapCategoryLabel(itemCategory);
    
    if (targetCategory === 'company') {
      return categoryLabel === 'Company';
    }
    
    if (targetCategory.includes('Company Documents')) {
      return categoryLabel === targetCategory;
    }
    
    switch (targetCategory) {
      case 'identity':
        return categoryLabel === 'Identity Documents';
      case 'education':
        return categoryLabel === 'Education Documents';
      case 'other':
        return categoryLabel === 'Other Documents';
      case 'all':
      default:
        return true;
    }
  }, [mapCategoryLabel]);

  // Calculate tab counts based on selected category - optimized
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

  // Apply search filtering with highlighting
  const filteredItems = useSearchMemo(
    categoryFilteredItems,
    searchQuery,
    (item) => item.documentType,
    { keys: ['documentType'], threshold: 0.3 }
  );

  // Get current company if a company category is selected
  const currentCompany = useMemo(() => {
    if (selectedCategory === 'company') {
      // For base company documents, no specific company
      return null;
    }
    if (selectedCategory.includes('Company Documents')) {
      return companies.find(company => company.category === selectedCategory);
    }
    return null;
  }, [selectedCategory, companies]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handleUploadClick = useCallback((documentType: string, category: string) => {
    setSelectedDocumentType(documentType);
    setSelectedDocumentCategory(category);
    
    // Find the company if this is a company document
    if (category.includes('Documents') && 
        !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category)) {
      const company = companies.find(c => c.category === category);
      setSelectedCompany(company);
    } else {
      setSelectedCompany(undefined);
    }
    
    setIsModalOpen(true);
  }, [companies]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDocumentType('');
    setSelectedDocumentCategory('');
    setSelectedCompany(undefined);
  }, []);

  const filterDocumentsByType = useCallback((documents: Document[], documentType: string): Document[] => {
    const expectedDocType = documentType.toLowerCase().replace(/\s+/g, '_');
    
    return documents.filter(doc => {
      // First try to match by document_type field (preferred method)
      if (doc.document_type && doc.document_type === expectedDocType) {
        return true;
      }
      
      // Fallback to filename matching for documents without document_type
      const fileName = doc.file_name.toLowerCase();
      const docTypeName = documentType.toLowerCase();
      return fileName.includes(docTypeName);
    });
  }, []);

  const getLatestDocuments = useCallback((fallbackDocuments: Document[]): Document[] => {
    const latestDocumentsData = queryClient.getQueryData<{ 
      success: boolean; 
      data: Document[] 
    }>(['application-documents', applicationId]);
    return latestDocumentsData?.data || fallbackDocuments || [];
  }, [queryClient, applicationId]);

  const handleViewDocuments = useCallback((documentType: string) => {
    const latestDocuments = getLatestDocuments(documents || []);
    const matchingDocuments = filterDocumentsByType(latestDocuments, documentType);
    
    setSelectedDocumentsForView(matchingDocuments);
    setSelectedDocumentTypeForView(documentType);
    setIsDocumentListModalOpen(true);
  }, [documents, getLatestDocuments, filterDocumentsByType]);

  // Reset to first page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Update modal documents when the main documents data changes
  useEffect(() => {
    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocuments = getLatestDocuments(documents || []);
      const matchingDocuments = filterDocumentsByType(latestDocuments, selectedDocumentTypeForView);
      setSelectedDocumentsForView(matchingDocuments);
    }
  }, [
    documents, 
    isDocumentListModalOpen, 
    selectedDocumentTypeForView, 
    applicationId, 
    queryClient, 
    getLatestDocuments, 
    filterDocumentsByType
  ]);

  // Helper function to get category badge styling - memoized
  const getCategoryBadgeStyle = useCallback((category: string) => {
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
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load document checklist</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Company Header */}
      {currentCompany && (
        <CompanyHeader
          company={currentCompany}
          onRemove={() => onRemoveCompany?.(currentCompany.name)}
        />
      )}

      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg sm:text-xl">Document Checklist</CardTitle>
            
            {/* Show tabs for editing mode when not on "All" category */}
            {checklistState === 'editing' && selectedCategory !== 'all' && (
              <ChecklistTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                currentCount={tabCounts.currentCount}
                availableCount={tabCounts.availableCount}
              />
            )}

            {/* Show pending changes for editing mode */}
            {checklistState === 'editing' && (pendingAdditions.length > 0 || pendingDeletions.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-900">
                      Pending Changes
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-blue-700">
                      {pendingAdditions.length > 0 && `${pendingAdditions.length} to add`}
                      {pendingAdditions.length > 0 && pendingDeletions.length > 0 && ', '}
                      {pendingDeletions.length > 0 && `${pendingDeletions.length} to remove`}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearPendingChanges}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={onSavePendingChanges}
                        className="text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="w-full">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search documents..."
                aria-label="Search document checklist"
                className="w-full lg:w-[40%]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Results Indicator */}
            {searchQuery && (
              <div 
                id="search-results"
                className="text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {filteredItems.length === categoryFilteredItems.length ? (
                  <span>Showing all {filteredItems.length} documents</span>
                ) : (
                  <span>
                    Showing {filteredItems.length} of {categoryFilteredItems.length} documents
                    {filteredItems.length === 0 && ' - no matches found'}
                  </span>
                )}
              </div>
            )}
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.No</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Document Name</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {selectedCategory === 'submitted' 
                            ? 'No documents uploaded yet' 
                            : 'No documents in this category'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item, index) => (
                      <ChecklistTableRow
                        key={`${item.category}-${item.documentType}-${item.checklist_id || 'new'}-${index}`}
                        item={item}
                        index={index}
                        startIndex={startIndex}
                        searchQuery={searchQuery}
                        checklistState={checklistState}
                        activeTab={activeTab}
                        selectedCategory={selectedCategory}
                        onUpdateDocumentRequirement={onUpdateDocumentRequirement}
                        onAddToPendingChanges={onAddToPendingChanges}
                        onAddToPendingDeletions={onAddToPendingDeletions}
                        onRemoveFromPendingChanges={onRemoveFromPendingChanges}
                        onRemoveFromPendingDeletions={onRemoveFromPendingDeletions}
                        onSavePendingChanges={onSavePendingChanges}
                        onClearPendingChanges={onClearPendingChanges}
                        pendingAdditions={pendingAdditions}
                        pendingDeletions={pendingDeletions}
                        handleViewDocuments={handleViewDocuments}
                        handleUploadClick={handleUploadClick}
                        getCategoryBadgeStyle={getCategoryBadgeStyle}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>

        <UploadDocumentsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          applicationId={applicationId}
          selectedDocumentType={selectedDocumentType}
          selectedDocumentCategory={selectedDocumentCategory}
          company={selectedCompany}
          isClientView={isClientView}
        />
      </Card>

      {/* Document List Modal */}
      <DocumentListModal
        isOpen={isDocumentListModalOpen}
        onClose={() => setIsDocumentListModalOpen(false)}
        documentType={selectedDocumentTypeForView}
        documents={selectedDocumentsForView}
        applicationId={applicationId}
        onDocumentDeleted={() => {
          queryClient.refetchQueries({ 
            queryKey: ['application-documents', applicationId] 
          }).then(() => {
            const latestDocuments = getLatestDocuments(documents || []);
            const matchingDocuments = filterDocumentsByType(latestDocuments, selectedDocumentTypeForView);
            setSelectedDocumentsForView(matchingDocuments);
          });
        }}
      />
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const DocumentChecklistTable = memo(DocumentChecklistTableComponent);
DocumentChecklistTable.displayName = 'DocumentChecklistTable';