'use client';

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadDocumentsModal } from './UploadDocumentsModal';
import { DocumentListModal } from './DocumentListModal';
import { RejectionDetailsSheet } from './RejectionDetailsSheet';
import { ReuploadDocumentModal } from './ReuploadDocumentModal';
import { useSearchMemo } from '@/lib/utils/search';
import { ChecklistTableHeader } from './checklist/ChecklistTableHeader';
import { ChecklistTableBody } from './checklist/ChecklistTableBody';
import { useDocumentChecklistLogic } from '@/hooks/useDocumentChecklistLogic';
import { useReuploadDocument } from '@/hooks/useReuploadDocument';
import {
  generateCreatingItems,
  generateEditingCurrentItems,
  generateEditingAvailableItems,
  generateDefaultItems,
  generateSavedItems,
  filterItemsByCategory,
  getCategoryBadgeStyle,
  mapCategoryLabel
} from '@/lib/checklist/dataProcessing';
import {
  ApiDocument,
  Company,
  DocumentChecklistTableProps
} from '@/types/documents';
import { Document } from '@/types/applications';
import type { ChecklistState, ChecklistDocument, DocumentRequirement, ChecklistUpdateRequest, ChecklistItem } from '@/types/checklist';

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
  pendingUpdates?: Array<{ checklistId: string, required: boolean, documentType: string, documentCategory: string }>;
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
  checklistState = 'none',
  filteredDocuments = [],
  currentChecklistDocuments = [],
  availableDocumentsForEditing = [],
  selectedDocuments = [],
  requirementMap = {},
  onUpdateDocumentRequirement,
  isClientView = false,
  checklistData,
  // Pending changes props
  pendingAdditions = [],
  pendingDeletions = [],
  pendingUpdates = [],
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
  const [isDocumentListModalOpen, setIsDocumentListModalOpen] = useState(false);
  const [selectedDocumentsForView, setSelectedDocumentsForView] = useState<Document[]>([]);
  const [selectedDocumentTypeForView, setSelectedDocumentTypeForView] = useState<string>('');
  const [selectedCompanyCategoryForView, setSelectedCompanyCategoryForView] = useState<string | undefined>(undefined);
  const [isRejectionDetailsOpen, setIsRejectionDetailsOpen] = useState(false);
  const [selectedRejectedDocument, setSelectedRejectedDocument] = useState<Document | null>(null);
  const [selectedRejectedDocumentType, setSelectedRejectedDocumentType] = useState<string>('');
  const [selectedRejectedDocumentCategory, setSelectedRejectedDocumentCategory] = useState<string>('');
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] = useState<Document | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] = useState<string>('');
  const [selectedReuploadDocumentCategory, setSelectedReuploadDocumentCategory] = useState<string>('');

  // Reupload mutation
  const reuploadMutation = useReuploadDocument();

  // Use the custom hook for complex logic
  const {
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
    allDocumentTypes,
    extractedCompanies,
    currentCompany,
    tabCounts,
    handleAddToPendingChanges,
    handleTabChange,
    queryClient
  } = useDocumentChecklistLogic({
    documents,
    isLoading,
    error,
    applicationId,
    selectedCategory,
    companies,
    checklistState,
    filteredDocuments,
    currentChecklistDocuments,
    availableDocumentsForEditing,
    selectedDocuments,
    requirementMap,
    isClientView,
    checklistData,
    pendingAdditions,
    pendingDeletions,
    pendingUpdates,
    onAddToPendingChanges,
    onRemoveFromPendingChanges,
    onAddToPendingDeletions,
    onRemoveFromPendingDeletions,
    onSavePendingChanges,
    onClearPendingChanges
  });

  // Generate checklist items using utility functions
  const creatingItems = useMemo(() =>
    generateCreatingItems(checklistState, filteredDocuments, requirementMap, selectedDocuments),
    [checklistState, filteredDocuments, requirementMap, selectedDocuments]
  );

  const editingCurrentItems = useMemo(() =>
    generateEditingCurrentItems(checklistState, currentChecklistDocuments),
    [checklistState, currentChecklistDocuments]
  );

  const editingAvailableItems = useMemo(() =>
    generateEditingAvailableItems(checklistState, availableDocumentsForEditing, requirementMap, pendingAdditions),
    [checklistState, availableDocumentsForEditing, requirementMap, pendingAdditions]
  );

  const defaultItems = useMemo(() =>
    generateDefaultItems(checklistState, allDocumentTypes, documents || []),
    [checklistState, allDocumentTypes, documents]
  );

  const savedItems = useMemo(() =>
    generateSavedItems(checklistState, checklistData, documents || [], selectedCategory, extractedCompanies),
    [checklistState, checklistData, documents, selectedCategory, extractedCompanies]
  );

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
  const categoryFilteredItems = useMemo(() =>
    filterItemsByCategory(checklistItems, selectedCategory),
    [checklistItems, selectedCategory]
  );

  // Apply search filtering with highlighting
  const filteredItems = useSearchMemo(
    categoryFilteredItems,
    searchQuery,
    (item) => item.documentType,
    { keys: ['documentType'], threshold: 0.3 }
  );

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handleUploadClick = useCallback((documentType: string, category: string) => {
    setSelectedDocumentType(documentType);

    if (category.includes('Documents') &&
      !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category)) {
      let company = extractedCompanies.find(c => c.category === category);

      if (!company && currentCompany && category.includes('Company Documents')) {
        company = currentCompany;
      }

      setSelectedDocumentCategory(category);
      setSelectedCompany(company);
    } else {
      setSelectedDocumentCategory(category);
      setSelectedCompany(undefined);
    }

    setIsModalOpen(true);
  }, [extractedCompanies, currentCompany]);

  const handleReuploadClick = useCallback((documentId: string, documentType: string, category: string) => {
    // Find the document to reupload
    const documentToReupload = documents?.find(doc => doc._id === documentId);
    if (!documentToReupload) {
      console.error('Document not found for reupload:', documentId);
      return;
    }

    setSelectedReuploadDocument(documentToReupload);
    setSelectedReuploadDocumentType(documentType);
    setSelectedReuploadDocumentCategory(category);
    setIsReuploadModalOpen(true);
  }, [documents]);

  const handleViewRejectionDetails = useCallback((document: Document, documentType: string, category: string) => {
    setSelectedRejectedDocument(document);
    setSelectedRejectedDocumentType(documentType);
    setSelectedRejectedDocumentCategory(category);
    setIsRejectionDetailsOpen(true);
  }, []);

  const handleRejectionDetailsClose = useCallback(() => {
    setIsRejectionDetailsOpen(false);
    setSelectedRejectedDocument(null);
    setSelectedRejectedDocumentType('');
    setSelectedRejectedDocumentCategory('');
  }, []);

  const handleReuploadFromDetails = useCallback(async (documentId: string, documentType: string, category: string) => {
    // Find the document to reupload
    const documentToReupload = documents?.find(doc => doc._id === documentId);
    if (!documentToReupload) {
      console.error('Document not found for reupload:', documentId);
      return;
    }

    setSelectedReuploadDocument(documentToReupload);
    setSelectedReuploadDocumentType(documentType);
    setSelectedReuploadDocumentCategory(category);
    setIsRejectionDetailsOpen(false);
    setIsReuploadModalOpen(true);
  }, [documents]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDocumentType('');
    setSelectedDocumentCategory('');
    setSelectedCompany(undefined);
  }, []);

  const handleReuploadModalClose = useCallback(() => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType('');
    setSelectedReuploadDocumentCategory('');
  }, []);

  const filterDocumentsByType = useCallback((documents: Document[], documentType: string, companyCategory?: string): Document[] => {
    const expectedDocType = documentType.toLowerCase().replace(/\s+/g, '_');

    return documents.filter(doc => {
      let typeMatches = false;
      
      if (doc.document_name && doc.document_name.toLowerCase() === expectedDocType) {
        typeMatches = true;
      }
      // Fallback: try to match by document_type field
      else if (doc.document_type && doc.document_type === expectedDocType) {
        typeMatches = true;
      }
      // Fallback: try to match by filename
      else {
        const fileName = doc.file_name.toLowerCase();
        const docTypeName = documentType.toLowerCase();
        typeMatches = fileName.includes(docTypeName);
      }

      if (!companyCategory) {
        return typeMatches;
      }

      if (typeMatches && doc.document_category) {
        // Map API category to display category for comparison
        const mappedDocCategory = mapCategoryLabel(doc.document_category);
        return mappedDocCategory === companyCategory;
      }

      return false;
    });
  }, []);

  const getLatestDocuments = useCallback((fallbackDocuments: Document[]): Document[] => {
    const latestDocumentsData = queryClient.getQueryData<{
      success: boolean;
      data: Document[]
    }>(['application-documents', applicationId]);
    return latestDocumentsData?.data || fallbackDocuments || [];
  }, [queryClient, applicationId]);

  const handleViewDocuments = useCallback((documentType: string, companyCategory?: string) => {
    const latestDocuments = getLatestDocuments(documents || []);
    const matchingDocuments = filterDocumentsByType(latestDocuments, documentType, companyCategory);

    setSelectedDocumentsForView(matchingDocuments);
    setSelectedDocumentTypeForView(documentType);
    setSelectedCompanyCategoryForView(companyCategory);
    setIsDocumentListModalOpen(true);
  }, [documents, getLatestDocuments, filterDocumentsByType]);

  // Update modal documents when the main documents data changes
  useEffect(() => {
    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocuments = getLatestDocuments(documents || []);
      const matchingDocuments = filterDocumentsByType(latestDocuments, selectedDocumentTypeForView, selectedCompanyCategoryForView);
      setSelectedDocumentsForView(matchingDocuments);
    }
  }, [
    documents,
    isDocumentListModalOpen,
    selectedDocumentTypeForView,
    selectedCompanyCategoryForView,
    applicationId,
    queryClient,
    getLatestDocuments,
    filterDocumentsByType
  ]);

  // Force re-computation of checklist items when documents change
  useEffect(() => {
    if (documents && documents.length > 0) {
      const timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['application-documents', applicationId],
        });
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [documents, applicationId, queryClient]);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load document checklist</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full">
        <ChecklistTableHeader
          title="Document Checklist"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          checklistState={checklistState}
          selectedCategory={selectedCategory}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentCount={tabCounts.currentCount}
          availableCount={tabCounts.availableCount}
          pendingAdditions={pendingAdditions}
          pendingDeletions={pendingDeletions}
          pendingUpdates={pendingUpdates}
          onClearPendingChanges={onClearPendingChanges}
          onSavePendingChanges={onSavePendingChanges}
          extractedCompanies={extractedCompanies}
        />

        <ChecklistTableBody
          filteredItems={filteredItems}
          categoryFilteredItems={categoryFilteredItems}
          searchQuery={searchQuery}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          checklistState={checklistState}
          activeTab={activeTab}
          selectedCategory={selectedCategory}
          onUpdateDocumentRequirement={onUpdateDocumentRequirement}
          onAddToPendingChanges={handleAddToPendingChanges}
          onAddToPendingDeletions={onAddToPendingDeletions}
          onRemoveFromPendingChanges={onRemoveFromPendingChanges}
          onRemoveFromPendingDeletions={onRemoveFromPendingDeletions}
          onSavePendingChanges={onSavePendingChanges}
          onClearPendingChanges={onClearPendingChanges}
          pendingAdditions={pendingAdditions}
          pendingDeletions={pendingDeletions}
          handleViewDocuments={handleViewDocuments}
          handleUploadClick={handleUploadClick}
          handleReuploadClick={handleReuploadClick}
          handleViewRejectionDetails={handleViewRejectionDetails}
          getCategoryBadgeStyle={getCategoryBadgeStyle}
          isAddingDocument={isAddingDocument}
          addingDocumentId={addingDocumentId}
          isDocumentAdded={isDocumentAdded}
          addedDocumentId={addedDocumentId}
        />

        <UploadDocumentsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          applicationId={applicationId}
          selectedDocumentType={selectedDocumentType}
          selectedDocumentCategory={selectedDocumentCategory}
          company={selectedCompany}
          documents={documents as ApiDocument[]}
          isClientView={isClientView}
        />
      </Card>

      <DocumentListModal
        isOpen={isDocumentListModalOpen}
        onClose={() => setIsDocumentListModalOpen(false)}
        documentType={selectedDocumentTypeForView}
        documents={selectedDocumentsForView}
        applicationId={applicationId}
        category={selectedCompanyCategoryForView}
        onReuploadDocument={handleReuploadClick}
        isClientView={isClientView}
        onDocumentDeleted={() => {
          queryClient.refetchQueries({ 
            queryKey: ['application-documents', applicationId] 
          }).then(() => {
            const latestDocuments = getLatestDocuments(documents || []);
            const matchingDocuments = filterDocumentsByType(latestDocuments, selectedDocumentTypeForView, selectedCompanyCategoryForView);
            setSelectedDocumentsForView(matchingDocuments);
          });
        }}
      />

      <RejectionDetailsSheet
        isOpen={isRejectionDetailsOpen}
        onClose={handleRejectionDetailsClose}
        document={selectedRejectedDocument}
        documentType={selectedRejectedDocumentType}
        category={selectedRejectedDocumentCategory}
        onReupload={handleReuploadFromDetails}
        isReuploading={reuploadMutation.isPending}
      />

      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={handleReuploadModalClose}
        applicationId={applicationId}
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
      />
    </div>
  );
};

export const DocumentChecklistTable = memo(DocumentChecklistTableComponent);
DocumentChecklistTable.displayName = 'DocumentChecklistTable';