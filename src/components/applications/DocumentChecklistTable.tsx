'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocumentChecklistLogic } from '@/hooks/useDocumentChecklistLogic';
import { useReuploadDocument } from '@/hooks/useReuploadDocument';
import {
  filterItemsByCategory,
  generateCreatingItems,
  generateDefaultItems,
  generateEditingAvailableItems,
  generateEditingCurrentItems,
  generateSavedItems,
  getCategoryBadgeStyle,
  mapCategoryLabel
} from '@/lib/checklist/dataProcessing';
import { useSearchMemo } from '@/lib/utils/search';
import { Document } from '@/types/applications';
import type { ChecklistDocument, ChecklistItem, ChecklistState, ChecklistUpdateRequest, DocumentRequirement } from '@/types/checklist';
import {
  ApiDocument,
  Company,
  DocumentChecklistTableProps
} from '@/types/documents';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ChecklistTableBody } from './checklist/ChecklistTableBody';
import { ChecklistTableHeader } from './checklist/ChecklistTableHeader';
import { DocumentListModal } from './DocumentListModal';
import { RejectionDetailsSheet } from './RejectionDetailsSheet';
import { ReuploadDocumentModal } from './ReuploadDocumentModal';
import { UploadDocumentsModal } from './UploadDocumentsModal';

interface DocumentType {
  category: string;
  documentType: string;
  companyName?: string;
  allowedDocument?: number;
  instruction?: string;
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
  description?: string;
  instruction?: string;
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
  pendingUpdates?: ChecklistDocument[];
  onAddToPendingChanges?: (document: ChecklistDocument) => void;
  onRemoveFromPendingChanges?: (document: ChecklistDocument) => void;
  onAddToPendingDeletions?: (checklistId: string) => void;
  onRemoveFromPendingDeletions?: (checklistId: string) => void;
  onSavePendingChanges?: () => Promise<void>;
  onClearPendingChanges?: () => void;
  // Loading states
  isBatchDeleting?: boolean;
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
  onClearPendingChanges,
  // Loading states
  isBatchDeleting = false
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

  // Description dialog state
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [selectedDescriptionDocumentType, setSelectedDescriptionDocumentType] = useState<string>('');
  const [selectedDescriptionText, setSelectedDescriptionText] = useState<string>('');

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
    pendingUpdates: [],
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
    if (checklistState === 'saved') {
      // If there are no saved items for the selected company, fall back to default items
      if (savedItems.length === 0 && selectedCategory.includes('company_documents')) {
        return defaultItems;
      }
      return savedItems;
    }
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


  const filterDocumentsByType = useCallback((documents: Document[], documentType: string, companyCategory?: string): Document[] => {
    const expectedDocType = documentType.toLowerCase().replace(/\s+/g, '_');

    return documents.filter(doc => {
      if (!doc || !doc.file_name) return false;

      let typeMatches = false;

      // First, try to match by document_name field (API field) - same logic as dataProcessing.ts
      const docTypeFromName = doc.document_name;
      if (docTypeFromName) {
        const normalizedDocName = docTypeFromName.toLowerCase().replace(/\s+/g, '_');
        const normalizedExpectedType = expectedDocType.toLowerCase();

        // Exact match
        if (normalizedDocName === normalizedExpectedType) {
          typeMatches = true;
        }
        // Partial match - check if the document name contains the expected type
        else if (normalizedDocName.includes(normalizedExpectedType) || normalizedExpectedType.includes(normalizedDocName)) {
          typeMatches = true;
        }
      }

      // Fallback: try to match by document_type field
      if (!typeMatches && doc.document_type) {
        const docTypeFromField = doc.document_type;
        if (docTypeFromField && docTypeFromField === expectedDocType) {
          typeMatches = true;
        }
      }

      // Fallback: try to match by filename
      if (!typeMatches) {
        const fileName = doc.file_name.toLowerCase();
        const docTypeName = documentType.toLowerCase();
        typeMatches = fileName.includes(docTypeName);
      }

      if (!typeMatches) {
        return false;
      }

      // If no company category specified, return all matching documents
      if (!companyCategory) {
        return true;
      }

      // For company documents, check category match
      if (doc.document_category) {
        // Map API category to display category for comparison
        const mappedDocCategory = mapCategoryLabel(doc.document_category);
        return mappedDocCategory === companyCategory;
      }

      return false;
    });
  }, []);


  // Calculate document counts per document type and company category
  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (documents && documents.length > 0) {
      // For each checklist item, count documents that match both type and company
      checklistItems.forEach(item => {
        const key = `${item.documentType}_${item.category || 'default'}`;
        const matchingDocuments = filterDocumentsByType(documents, item.documentType, item.category);
        counts[key] = matchingDocuments.length;
      });
    }

    return counts;
  }, [documents, checklistItems, filterDocumentsByType]);


  const getLatestDocuments = useCallback((fallbackDocuments: Document[]): Document[] => {
    // Use the all documents query to get all documents, not just paginated ones
    const latestDocumentsData = queryClient.getQueryData<{
      success: boolean;
      data: Document[]
    }>(['application-documents-all', applicationId]);
    return latestDocumentsData?.data || fallbackDocuments || [];
  }, [queryClient, applicationId]);

  const handleReuploadModalClose = useCallback(() => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType('');
    setSelectedReuploadDocumentCategory('');

    // Refresh the document list modal if it's open to show the reuploaded document
    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocuments = getLatestDocuments(documents || []);
      const matchingDocuments = filterDocumentsByType(latestDocuments, selectedDocumentTypeForView, selectedCompanyCategoryForView);
      setSelectedDocumentsForView(matchingDocuments);
    }
  }, [isDocumentListModalOpen, selectedDocumentTypeForView, selectedCompanyCategoryForView, getLatestDocuments, filterDocumentsByType, documents]);

  const handleViewDocuments = useCallback((documentType: string, companyCategory?: string) => {
    // Always get the latest documents from the query cache to ensure we have reuploaded documents
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
          queryKey: ['application-documents-all', applicationId],
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
          pendingUpdates={[]}
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
          isBatchDeleting={isBatchDeleting}
          applicationId={applicationId}
          isClientView={isClientView}
          documentCounts={documentCounts}
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
            queryKey: ['application-documents-all', applicationId]
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
        isClientView={isClientView}
      />
    </div>
  );
};

export const DocumentChecklistTable = memo(DocumentChecklistTableComponent);
DocumentChecklistTable.displayName = 'DocumentChecklistTable';