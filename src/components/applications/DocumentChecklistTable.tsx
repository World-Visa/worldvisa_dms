"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentCommentCounts } from "@/hooks/useDocumentCommentCounts";
import { useDocumentChecklistLogic } from "@/hooks/useDocumentChecklistLogic";
import { useReuploadDocument } from "@/hooks/useReuploadDocument";
import {
  filterItemsByCategory,
  generateDefaultItems,
  generateSavedItems,
  getAllowedDocumentCount,
  mapCategoryLabel,
} from "@/lib/checklist/dataProcessing";
import { Document } from "@/types/applications";
import type {
  ChecklistItem,
  ChecklistState,
} from "@/types/checklist";
import {
  ApiDocument,
  Company,
  DocumentChecklistTableProps,
} from "@/types/documents";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChecklistTableRow } from "./checklist/ChecklistTableRow";
import { ChecklistTableHeader } from "./checklist/ChecklistTableHeader";
import { DocumentListModal } from "./DocumentListModal";
import { RejectionDetailsSheet } from "./RejectionDetailsSheet";
import { ReuploadDocumentModal } from "./ReuploadDocumentModal";
import { UploadDocumentsModal } from "./UploadDocumentsModal";
import { ListNoResults } from "./list-no-results";
import {
  getAllowedDocumentLimitMessage,
  isNewUploadBlockedByAllowedDocumentLimit,
} from "@/lib/documents/checklist";

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
  requirement?: "mandatory" | "optional" | "not_required";
  isSelected?: boolean;
  company_name?: string;
  company?: {
    name: string;
    fromDate: string;
    toDate: string;
    category: string;
  };
  checklist_id?: string;
  rejectedRemark?: string;
  documentStatus?: string;
  description?: string;
  instruction?: string;
}

interface DocumentChecklistTableComponentProps
  extends DocumentChecklistTableProps {
  checklistState?: ChecklistState;
  isClientView?: boolean;
  checklistData?: { success: boolean; data: ChecklistItem[] };
  companies: Company[];
}

const LOADING_ROW_COUNT = 6;
const SKELETON_COLS = 5;

const TableLoadingRows = memo(function TableLoadingRows() {
  return (
    <>
      {Array.from({ length: LOADING_ROW_COUNT }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-40 max-w-full" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-6 w-20 rounded-md" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-6 w-20 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-6" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-5 w-5 rounded-md ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
});

const DocumentChecklistTableComponent = ({
  documents,
  isLoading,
  error,
  applicationId,
  clientLeadId,
  selectedCategory,
  companies,
  checklistState = "none",
  isClientView = false,
  checklistData,
}: DocumentChecklistTableComponentProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [isDocumentListModalOpen, setIsDocumentListModalOpen] = useState(false);
  const [selectedDocumentsForView, setSelectedDocumentsForView] = useState<Document[]>([]);
  const [selectedDocumentTypeForView, setSelectedDocumentTypeForView] = useState("");
  const [selectedCompanyCategoryForView, setSelectedCompanyCategoryForView] = useState<string | undefined>(undefined);
  const [isRejectionDetailsOpen, setIsRejectionDetailsOpen] = useState(false);
  const [selectedRejectedDocument, setSelectedRejectedDocument] = useState<Document | null>(null);
  const [selectedRejectedDocumentType, setSelectedRejectedDocumentType] = useState("");
  const [selectedRejectedDocumentCategory, setSelectedRejectedDocumentCategory] = useState("");
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] = useState<Document | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] = useState("");
  const [selectedReuploadDocumentCategory, setSelectedReuploadDocumentCategory] = useState("");
  const [selectedInstruction, setSelectedInstruction] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const reuploadMutation = useReuploadDocument();

  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);

  const {
    activeTab,
    itemsPerPage,
    allDocumentTypes,
    extractedCompanies,
    currentCompany,
    handleTabChange,
    queryClient,
  } = useDocumentChecklistLogic({
    documents,
    isLoading,
    error,
    applicationId,
    selectedCategory,
    companies,
    checklistState,
    filteredDocuments: [],
    currentChecklistDocuments: [],
    availableDocumentsForEditing: [],
    selectedDocuments: [],
    requirementMap: {},
    isClientView,
    checklistData,
    pendingAdditions: [],
    pendingDeletions: [],
    pendingUpdates: [],
  });

  // Sync hook itemsPerPage to local pageSize on first render
  useEffect(() => {
    setPageSize(itemsPerPage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate checklist items
  const defaultItems = useMemo(
    () => generateDefaultItems(checklistState, allDocumentTypes, documents || []),
    [checklistState, allDocumentTypes, documents],
  );

  const savedItems = useMemo(
    () =>
      generateSavedItems(
        checklistState,
        checklistData,
        documents || [],
        selectedCategory,
        extractedCompanies,
      ),
    [checklistState, checklistData, documents, selectedCategory, extractedCompanies],
  );

  const checklistItems = useMemo((): ChecklistTableItem[] => {
    if (checklistState === "saved") {
      if (savedItems.length === 0 && selectedCategory.includes("company_documents")) {
        return defaultItems;
      }
      return savedItems;
    }
    return defaultItems;
  }, [checklistState, selectedCategory, savedItems, defaultItems]);

  // Document counts per type/category
  const filterDocumentsByType = useCallback(
    (docs: Document[], documentType: string, companyCategory?: string): Document[] => {
      const expectedDocType = documentType.toLowerCase().replace(/\s+/g, "_");
      return docs.filter((doc) => {
        if (!doc?.file_name) return false;

        let typeMatches = false;
        const docTypeFromName = doc.document_name;
        if (docTypeFromName) {
          const normalizedDocName = docTypeFromName.toLowerCase().replace(/\s+/g, "_");
          const normalizedExpected = expectedDocType.toLowerCase();
          typeMatches =
            normalizedDocName === normalizedExpected ||
            normalizedDocName.includes(normalizedExpected) ||
            normalizedExpected.includes(normalizedDocName);
        }

        if (!typeMatches && doc.document_type) {
          typeMatches = doc.document_type === expectedDocType;
        }

        if (!typeMatches) {
          typeMatches = doc.file_name.toLowerCase().includes(documentType.toLowerCase());
        }

        if (!typeMatches) return false;
        if (!companyCategory) return true;

        if (doc.document_category) {
          return mapCategoryLabel(doc.document_category) === companyCategory;
        }
        return false;
      });
    },
    [],
  );

  // Enrich items: if any uploaded doc is rejected, reflect that on the row
  const enrichedChecklistItems = useMemo((): ChecklistTableItem[] => {
    if (!documents || documents.length === 0) return checklistItems;
    return checklistItems.map((item) => {
      const allDocs = filterDocumentsByType(documents, item.documentType, item.category);
      const rejectedDoc = allDocs.find((d) => d.status === "rejected");
      if (rejectedDoc) {
        return {
          ...item,
          isUploaded: true,
          documentStatus: "rejected",
          rejectedRemark: rejectedDoc.reject_message ?? item.rejectedRemark,
          uploadedDocument: rejectedDoc,
        };
      }
      return item;
    });
  }, [checklistItems, documents, filterDocumentsByType]);

  const categoryFilteredItems = useMemo(
    () => filterItemsByCategory(enrichedChecklistItems, selectedCategory),
    [enrichedChecklistItems, selectedCategory],
  );

  const documentTypeOptions = useMemo(
    () =>
      Array.from(new Set(categoryFilteredItems.map((item) => item.documentType)))
        .sort()
        .map((type) => ({ label: type, value: type })),
    [categoryFilteredItems],
  );

  const filteredItems = useMemo(() => {
    if (selectedDocumentTypes.length === 0) return categoryFilteredItems;
    return categoryFilteredItems.filter((item) =>
      selectedDocumentTypes.includes(item.documentType),
    );
  }, [categoryFilteredItems, selectedDocumentTypes]);

  // Comment counts
  const documentIds = useMemo(
    () =>
      filteredItems
        .filter((item) => item.isUploaded && item.uploadedDocument)
        .map((item) => (item.uploadedDocument as Document)?._id)
        .filter(Boolean) as string[],
    [filteredItems],
  );
  const { data: commentCounts = {} } = useDocumentCommentCounts(documentIds);

  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (documents && documents.length > 0) {
      for (const item of enrichedChecklistItems) {
        const key = `${item.documentType}_${item.category || "default"}`;
        counts[key] = filterDocumentsByType(documents, item.documentType, item.category).length;
      }
    }
    return counts;
  }, [documents, enrichedChecklistItems, filterDocumentsByType]);

  const uploadedDocumentsMap = useMemo(() => {
    if (!documents || documents.length === 0) return {};
    const map: Record<string, Document[]> = {};
    for (const item of enrichedChecklistItems) {
      const key = `${item.documentType}_${item.category || "default"}`;
      map[key] = filterDocumentsByType(documents, item.documentType, item.category);
    }
    return map;
  }, [documents, enrichedChecklistItems, filterDocumentsByType]);

  const allowedDocumentCountsMap = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    for (const item of enrichedChecklistItems) {
      const key = `${item.documentType}_${item.category || "default"}`;
      map[key] = getAllowedDocumentCount(item.category, item.documentType);
    }
    return map;
  }, [enrichedChecklistItems]);

  const getLatestDocuments = useCallback(
    (fallback: Document[]): Document[] => {
      const cached = queryClient.getQueryData<{ success: boolean; data: Document[] }>(
        ["application-documents-all", applicationId],
      );
      return cached?.data || fallback || [];
    },
    [queryClient, applicationId],
  );

  // Handlers
  const handleUploadClick = useCallback(
    (documentType: string, category: string) => {
      const countKey = `${documentType}_${category || "default"}`;
      const currentCount = documentCounts[countKey] ?? 0;
      const { blocked, allowedDocument } =
        isNewUploadBlockedByAllowedDocumentLimit(
          category,
          documentType,
          currentCount,
        );

      if (blocked && allowedDocument !== undefined) {
        toast.error(
          `${getAllowedDocumentLimitMessage(documentType, allowedDocument)} ${currentCount} already uploaded.`,
        );
        return;
      }

      setSelectedDocumentType(documentType);
      const instruction = checklistItems.find(
        (item) => item.documentType === documentType && item.category === category,
      )?.instruction;
      setSelectedInstruction(instruction ?? "");

      if (
        category.includes("Documents") &&
        !["Identity Documents", "Education Documents", "Other Documents"].includes(category)
      ) {
        let company = extractedCompanies.find((c) => c.category === category);
        if (!company && currentCompany && category.includes("Company Documents")) {
          company = currentCompany;
        }
        setSelectedDocumentCategory(category);
        setSelectedCompany(company);
      } else {
        setSelectedDocumentCategory(category);
        setSelectedCompany(undefined);
      }
      setIsModalOpen(true);
    },
    [documentCounts, extractedCompanies, currentCompany, checklistItems],
  );

  const handleReuploadClick = useCallback(
    (documentId: string, documentType: string, category: string) => {
      const doc = documents?.find((d) => d._id === documentId);
      if (!doc) return;
      const instruction = checklistItems.find(
        (item) => item.documentType === documentType && item.category === category,
      )?.instruction;
      setSelectedInstruction(instruction ?? "");
      setSelectedReuploadDocument(doc);
      setSelectedReuploadDocumentType(documentType);
      setSelectedReuploadDocumentCategory(category);
      setIsReuploadModalOpen(true);
    },
    [documents, checklistItems],
  );

  const handleViewRejectionDetails = useCallback(
    (document: Document, documentType: string, category: string) => {
      setSelectedRejectedDocument(document);
      setSelectedRejectedDocumentType(documentType);
      setSelectedRejectedDocumentCategory(category);
      setIsRejectionDetailsOpen(true);
    },
    [],
  );

  const handleRejectionDetailsClose = useCallback(() => {
    setIsRejectionDetailsOpen(false);
    setSelectedRejectedDocument(null);
    setSelectedRejectedDocumentType("");
    setSelectedRejectedDocumentCategory("");
  }, []);

  const handleReuploadFromDetails = useCallback(
    async (documentId: string, documentType: string, category: string) => {
      const doc = documents?.find((d) => d._id === documentId);
      if (!doc) return;
      setSelectedReuploadDocument(doc);
      setSelectedReuploadDocumentType(documentType);
      setSelectedReuploadDocumentCategory(category);
      setIsRejectionDetailsOpen(false);
      setIsReuploadModalOpen(true);
    },
    [documents],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDocumentType("");
    setSelectedDocumentCategory("");
    setSelectedCompany(undefined);
    setSelectedInstruction("");
  }, []);

  const handleViewDocuments = useCallback(
    (documentType: string, companyCategory?: string) => {
      const latestDocs = getLatestDocuments(documents || []);
      const matching = filterDocumentsByType(latestDocs, documentType, companyCategory);
      setSelectedDocumentsForView(matching);
      setSelectedDocumentTypeForView(documentType);
      setSelectedCompanyCategoryForView(companyCategory);
      setIsDocumentListModalOpen(true);
    },
    [documents, getLatestDocuments, filterDocumentsByType],
  );

  const handleReuploadModalClose = useCallback(() => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType("");
    setSelectedReuploadDocumentCategory("");
    setSelectedInstruction("");

    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocs = getLatestDocuments(documents || []);
      setSelectedDocumentsForView(
        filterDocumentsByType(latestDocs, selectedDocumentTypeForView, selectedCompanyCategoryForView),
      );
    }
  }, [
    isDocumentListModalOpen,
    selectedDocumentTypeForView,
    selectedCompanyCategoryForView,
    getLatestDocuments,
    filterDocumentsByType,
    documents,
  ]);

  // Keep modal documents in sync with latest data
  useEffect(() => {
    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocs = getLatestDocuments(documents || []);
      setSelectedDocumentsForView(
        filterDocumentsByType(latestDocs, selectedDocumentTypeForView, selectedCompanyCategoryForView),
      );
    }
  }, [
    documents,
    isDocumentListModalOpen,
    selectedDocumentTypeForView,
    selectedCompanyCategoryForView,
    applicationId,
    queryClient,
    getLatestDocuments,
    filterDocumentsByType,
  ]);

  // Invalidate query cache when documents change
  useEffect(() => {
    if (documents && documents.length > 0) {
      const id = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["application-documents-all", applicationId],
        });
      }, 50);
      return () => clearTimeout(id);
    }
  }, [documents, applicationId, queryClient]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);
  const totalCount = filteredItems.length;
  const hasNextPage = currentPage * pageSize < totalCount;
  const hasPrevPage = currentPage > 1;

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-4">
      <ChecklistTableHeader
        title="Document Checklist"
        documentTypeOptions={documentTypeOptions}
        selectedDocumentTypes={selectedDocumentTypes}
        onDocumentTypesChange={(types) => {
          setSelectedDocumentTypes(types);
          setCurrentPage(1);
        }}
        checklistState={checklistState}
        selectedCategory={selectedCategory}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingAdditions={[]}
        pendingDeletions={[]}
        pendingUpdates={[]}
        extractedCompanies={extractedCompanies}
      />

      {/* Error state */}
      {error && (
        <div className="py-8 text-center">
          <p className="text-error-base text-sm">Failed to load document checklist.</p>
          <p className="text-text-sub text-xs mt-1">{error.message}</p>
        </div>
      )}

      {/* Empty state — only show when not loading and no items */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <ListNoResults
          title="No documents in checklist"
          description={
            selectedDocumentTypes.length > 0
              ? "No documents match the selected filter."
              : "No documents have been added to this checklist yet."
          }
          onClearFilters={
            selectedDocumentTypes.length > 0
              ? () => setSelectedDocumentTypes([])
              : undefined
          }
        />
      )}

      {/* Table — only render when loading or there are items to display */}
      {(isLoading || filteredItems.length > 0) && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Requirement</TableHead>
              <TableHead className="w-20">Comments</TableHead>
              <TableHead className="text-right w-20">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows />
            ) : (
              paginatedItems.map((item, idx) => (
                <ChecklistTableRow
                  key={`${item.category}-${item.documentType}-${item.checklist_id ?? "new"}-${idx}`}
                  item={item}
                  index={idx}
                  startIndex={startIndex}
                  isClientView={isClientView}
                  applicationId={applicationId}
                  onViewDocuments={handleViewDocuments}
                  onUpload={handleUploadClick}
                  onReupload={handleReuploadClick}
                  onViewRejection={handleViewRejectionDetails}
                  commentCounts={commentCounts}
                  documentCounts={documentCounts}
                  uploadedDocuments={uploadedDocumentsMap[`${item.documentType}_${item.category || "default"}`] ?? []}
                  allowedDocumentCount={allowedDocumentCountsMap[`${item.documentType}_${item.category || "default"}`]}
                />
              ))
            )}
          </TableBody>
          {!isLoading && totalCount > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={SKELETON_COLS} className="p-0">
                  <TablePaginationFooter
                    pageSize={pageSize}
                    currentPageItemsCount={paginatedItems.length}
                    totalCount={totalCount}
                    hasPreviousPage={hasPrevPage}
                    hasNextPage={hasNextPage}
                    onPreviousPage={() => setCurrentPage((p) => p - 1)}
                    onNextPage={() => setCurrentPage((p) => p + 1)}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 25, 50]}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}

      {/* Modals */}
      <UploadDocumentsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        applicationId={applicationId}
        clientLeadId={clientLeadId}
        selectedDocumentType={selectedDocumentType}
        selectedDocumentCategory={selectedDocumentCategory}
        company={selectedCompany}
        documents={documents as ApiDocument[]}
        isClientView={isClientView}
        instruction={selectedInstruction}
        existingDocumentCount={
          documentCounts[`${selectedDocumentType}_${selectedDocumentCategory || "default"}`] ?? 0
        }
      />

      <DocumentListModal
        isOpen={isDocumentListModalOpen}
        onClose={() => setIsDocumentListModalOpen(false)}
        documentType={selectedDocumentTypeForView}
        documents={selectedDocumentsForView}
        allApplicationDocuments={getLatestDocuments(documents || [])}
        applicationId={applicationId}
        category={selectedCompanyCategoryForView}
        onReuploadDocument={handleReuploadClick}
        isClientView={isClientView}
        onDocumentDeleted={() => {
          queryClient
            .refetchQueries({ queryKey: ["application-documents-all", applicationId] })
            .then(() => {
              const latestDocs = getLatestDocuments(documents || []);
              setSelectedDocumentsForView(
                filterDocumentsByType(latestDocs, selectedDocumentTypeForView, selectedCompanyCategoryForView),
              );
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
        clientLeadId={clientLeadId}
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
        isClientView={isClientView}
        instruction={selectedInstruction}
      />
    </div>
  );
};

export const DocumentChecklistTable = memo(DocumentChecklistTableComponent);
DocumentChecklistTable.displayName = "DocumentChecklistTable";
