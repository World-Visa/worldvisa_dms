"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HighlightText } from "@/components/ui/HighlightText";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDocumentCommentCounts } from "@/hooks/useDocumentCommentCounts";
import { useChecklistMutations } from "@/hooks/useChecklist";
import { cn } from "@/lib/utils";
import { useDocumentChecklistLogic } from "@/hooks/useDocumentChecklistLogic";
import { useReuploadDocument } from "@/hooks/useReuploadDocument";
import {
  filterItemsByCategory,
  generateCreatingItems,
  generateDefaultItems,
  generateEditingAvailableItems,
  generateEditingCurrentItems,
  generateSavedItems,
  getCategoryBadgeStyle,
  mapCategoryLabel,
} from "@/lib/checklist/dataProcessing";
import { useSearchMemo } from "@/lib/utils/search";
import { Document } from "@/types/applications";
import type {
  ChecklistDocument,
  ChecklistItem,
  ChecklistState,
  ChecklistUpdateRequest,
  DocumentRequirement,
} from "@/types/checklist";
import {
  ApiDocument,
  Company,
  DocumentChecklistTableProps,
} from "@/types/documents";
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Check,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Upload,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CommentIcon } from "./CommentIcon";
import { ChecklistTableHeader } from "./checklist/ChecklistTableHeader";
import { DescriptionDialog } from "./checklist/DescriptionDialog";
import { DescriptionModal } from "./checklist/DescriptionModal";
import { RequirementSelector } from "./checklist/RequirementSelector";
import { DocumentListModal } from "./DocumentListModal";
import { RejectionDetailsSheet } from "./RejectionDetailsSheet";
import { RejectionMessageDisplay } from "./RejectionMessageDisplay";
import { ReuploadDocumentModal } from "./ReuploadDocumentModal";
import { UploadDocumentsModal } from "./UploadDocumentsModal";

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

interface ExtendedDocumentChecklistTableProps
  extends DocumentChecklistTableProps {
  // Checklist props
  checklistState?: ChecklistState;
  filteredDocuments?: DocumentType[];
  currentChecklistDocuments?: ChecklistDocument[];
  availableDocumentsForEditing?: DocumentType[];
  selectedDocuments?: ChecklistDocument[];
  requirementMap?: Record<string, DocumentRequirement>;
  onSelectDocument?: (document: ChecklistDocument) => void;
  onUpdateDocumentRequirement?: (
    category: string,
    documentType: string,
    requirement: DocumentRequirement,
  ) => void;
  onUpdateChecklist?: (
    itemsToUpdate: ChecklistUpdateRequest[],
    itemsToDelete: string[],
  ) => Promise<void>;
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
  checklistState = "none",
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
  onAddToPendingChanges,
  onRemoveFromPendingChanges,
  onAddToPendingDeletions,
  onRemoveFromPendingDeletions,
  onSavePendingChanges,
  onClearPendingChanges,
  // Loading states
  isBatchDeleting = false,
}: ExtendedDocumentChecklistTableProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [selectedDocumentCategory, setSelectedDocumentCategory] =
    useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(
    undefined,
  );
  const [isDocumentListModalOpen, setIsDocumentListModalOpen] = useState(false);
  const [selectedDocumentsForView, setSelectedDocumentsForView] = useState<
    Document[]
  >([]);
  const [selectedDocumentTypeForView, setSelectedDocumentTypeForView] =
    useState<string>("");
  const [selectedCompanyCategoryForView, setSelectedCompanyCategoryForView] =
    useState<string | undefined>(undefined);
  const [isRejectionDetailsOpen, setIsRejectionDetailsOpen] = useState(false);
  const [selectedRejectedDocument, setSelectedRejectedDocument] =
    useState<Document | null>(null);
  const [selectedRejectedDocumentType, setSelectedRejectedDocumentType] =
    useState<string>("");
  const [
    selectedRejectedDocumentCategory,
    setSelectedRejectedDocumentCategory,
  ] = useState<string>("");
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] =
    useState<Document | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] =
    useState<string>("");
  const [
    selectedReuploadDocumentCategory,
    setSelectedReuploadDocumentCategory,
  ] = useState<string>("");
  const [selectedInstruction, setSelectedInstruction] = useState<string>("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    sno: true,
    category: true,
    documentName: true,
    status: true,
    comments: true,
    action: true,
  });
  const [descriptionModals, setDescriptionModals] = useState<
    Record<string, { open: boolean; mode: "view" | "edit" }>
  >({});
  const [descriptionDialogs, setDescriptionDialogs] = useState<
    Record<string, boolean>
  >({});

  // Reupload mutation
  const reuploadMutation = useReuploadDocument();
  const { updateItemDescription } = useChecklistMutations(applicationId);

  // Use the custom hook for complex logic
  const {
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
    queryClient,
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
    onClearPendingChanges,
  });

  // Generate checklist items using utility functions
  const creatingItems = useMemo(
    () =>
      generateCreatingItems(
        checklistState,
        filteredDocuments,
        requirementMap,
        selectedDocuments,
      ),
    [checklistState, filteredDocuments, requirementMap, selectedDocuments],
  );

  const editingCurrentItems = useMemo(
    () =>
      generateEditingCurrentItems(checklistState, currentChecklistDocuments),
    [checklistState, currentChecklistDocuments],
  );

  const editingAvailableItems = useMemo(
    () =>
      generateEditingAvailableItems(
        checklistState,
        availableDocumentsForEditing,
        requirementMap,
        pendingAdditions,
      ),
    [
      checklistState,
      availableDocumentsForEditing,
      requirementMap,
      pendingAdditions,
    ],
  );

  const defaultItems = useMemo(
    () =>
      generateDefaultItems(checklistState, allDocumentTypes, documents || []),
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
    [
      checklistState,
      checklistData,
      documents,
      selectedCategory,
      extractedCompanies,
    ],
  );

  // Combine all checklist items based on state
  const checklistItems = useMemo((): ChecklistTableItem[] => {
    if (checklistState === "creating") return creatingItems;
    if (checklistState === "editing") {
      if (selectedCategory === "all") return editingCurrentItems;
      return activeTab === "current"
        ? editingCurrentItems
        : editingAvailableItems;
    }
    if (checklistState === "saved") {
      // If there are no saved items for the selected company, fall back to default items
      if (
        savedItems.length === 0 &&
        selectedCategory.includes("company_documents")
      ) {
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
    defaultItems,
  ]);

  // Filter items based on selected category
  const categoryFilteredItems = useMemo(
    () => filterItemsByCategory(checklistItems, selectedCategory),
    [checklistItems, selectedCategory],
  );

  // Apply search filtering with highlighting
  const filteredItems = useSearchMemo(
    categoryFilteredItems,
    searchQuery,
    (item) => item.documentType,
    { keys: ["documentType"], threshold: 0.3 },
  );

  // Get document IDs for comment counts
  const documentIds = useMemo(
    () =>
      filteredItems
        .filter((item) => item.isUploaded && item.uploadedDocument)
        .map((item) => (item.uploadedDocument as Document)?._id)
        .filter(Boolean) as string[],
    [filteredItems],
  );
  const { data: commentCounts = {} } = useDocumentCommentCounts(documentIds);

  // Helper functions for cell rendering
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) : text;
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const handleUploadClick = useCallback(
    (documentType: string, category: string) => {
      setSelectedDocumentType(documentType);

      // Find instruction from checklistItems
      const instruction = checklistItems.find(
        (item) =>
          item.documentType === documentType && item.category === category,
      )?.instruction;
      setSelectedInstruction(instruction || "");

      if (
        category.includes("Documents") &&
        ![
          "Identity Documents",
          "Education Documents",
          "Other Documents",
        ].includes(category)
      ) {
        let company = extractedCompanies.find((c) => c.category === category);

        if (
          !company &&
          currentCompany &&
          category.includes("Company Documents")
        ) {
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
    [extractedCompanies, currentCompany, checklistItems],
  );

  const handleReuploadClick = useCallback(
    (documentId: string, documentType: string, category: string) => {
      // Find the document to reupload
      const documentToReupload = documents?.find(
        (doc) => doc._id === documentId,
      );
      if (!documentToReupload) {
        console.error("Document not found for reupload:", documentId);
        return;
      }

      // Find instruction from checklistItems
      const instruction = checklistItems.find(
        (item) =>
          item.documentType === documentType && item.category === category,
      )?.instruction;
      setSelectedInstruction(instruction || "");

      setSelectedReuploadDocument(documentToReupload);
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
      // Find the document to reupload
      const documentToReupload = documents?.find(
        (doc) => doc._id === documentId,
      );
      if (!documentToReupload) {
        console.error("Document not found for reupload:", documentId);
        return;
      }

      setSelectedReuploadDocument(documentToReupload);
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

  const filterDocumentsByType = useCallback(
    (
      documents: Document[],
      documentType: string,
      companyCategory?: string,
    ): Document[] => {
      const expectedDocType = documentType.toLowerCase().replace(/\s+/g, "_");

      return documents.filter((doc) => {
        if (!doc || !doc.file_name) return false;

        let typeMatches = false;

        // First, try to match by document_name field (API field) - same logic as dataProcessing.ts
        const docTypeFromName = doc.document_name;
        if (docTypeFromName) {
          const normalizedDocName = docTypeFromName
            .toLowerCase()
            .replace(/\s+/g, "_");
          const normalizedExpectedType = expectedDocType.toLowerCase();

          // Exact match
          if (normalizedDocName === normalizedExpectedType) {
            typeMatches = true;
          }
          // Partial match - check if the document name contains the expected type
          else if (
            normalizedDocName.includes(normalizedExpectedType) ||
            normalizedExpectedType.includes(normalizedDocName)
          ) {
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
    },
    [],
  );

  // Calculate document counts per document type and company category
  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (documents && documents.length > 0) {
      // For each checklist item, count documents that match both type and company
      checklistItems.forEach((item) => {
        const key = `${item.documentType}_${item.category || "default"}`;
        const matchingDocuments = filterDocumentsByType(
          documents,
          item.documentType,
          item.category,
        );
        counts[key] = matchingDocuments.length;
      });
    }

    return counts;
  }, [documents, checklistItems, filterDocumentsByType]);

  const getLatestDocuments = useCallback(
    (fallbackDocuments: Document[]): Document[] => {
      // Use the all documents query to get all documents, not just paginated ones
      const latestDocumentsData = queryClient.getQueryData<{
        success: boolean;
        data: Document[];
      }>(["application-documents-all", applicationId]);
      return latestDocumentsData?.data || fallbackDocuments || [];
    },
    [queryClient, applicationId],
  );

  const handleReuploadModalClose = useCallback(() => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType("");
    setSelectedReuploadDocumentCategory("");
    setSelectedInstruction("");

    // Refresh the document list modal if it's open to show the reuploaded document
    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocuments = getLatestDocuments(documents || []);
      const matchingDocuments = filterDocumentsByType(
        latestDocuments,
        selectedDocumentTypeForView,
        selectedCompanyCategoryForView,
      );
      setSelectedDocumentsForView(matchingDocuments);
    }
  }, [
    isDocumentListModalOpen,
    selectedDocumentTypeForView,
    selectedCompanyCategoryForView,
    getLatestDocuments,
    filterDocumentsByType,
    documents,
  ]);

  const handleViewDocuments = useCallback(
    (documentType: string, companyCategory?: string) => {
      // Always get the latest documents from the query cache to ensure we have reuploaded documents
      const latestDocuments = getLatestDocuments(documents || []);
      const matchingDocuments = filterDocumentsByType(
        latestDocuments,
        documentType,
        companyCategory,
      );

      setSelectedDocumentsForView(matchingDocuments);
      setSelectedDocumentTypeForView(documentType);
      setSelectedCompanyCategoryForView(companyCategory);
      setIsDocumentListModalOpen(true);
    },
    [documents, getLatestDocuments, filterDocumentsByType],
  );

  // Update modal documents when the main documents data changes
  useEffect(() => {
    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocuments = getLatestDocuments(documents || []);
      const matchingDocuments = filterDocumentsByType(
        latestDocuments,
        selectedDocumentTypeForView,
        selectedCompanyCategoryForView,
      );
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
    filterDocumentsByType,
  ]);

  // Force re-computation of checklist items when documents change
  useEffect(() => {
    if (documents && documents.length > 0) {
      const timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["application-documents-all", applicationId],
        });
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [documents, applicationId, queryClient]);

  // Column definitions for TanStack Table
  const columns = useMemo<ColumnDef<ChecklistTableItem>[]>(
    () => [
      {
        id: "sno",
        header: "S.No",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return (
            <div className="font-medium w-16">
              {pageIndex * pageSize + row.index + 1}
            </div>
          );
        },
        enableHiding: true,
      },
      
      {
        id: "documentName",
        header: "Document Name",
        cell: ({ row }) => {
          const item = row.original;
          const itemKey = `${item.category}-${item.documentType}-${item.checklist_id || "new"}`;
          const descriptionModal = descriptionModals[itemKey];
          const descriptionDialog = descriptionDialogs[itemKey];

          const handleOpenDescriptionModal = () => {
            setDescriptionModals((prev) => ({
              ...prev,
              [itemKey]: { open: true, mode: "edit" },
            }));
          };

          const handleUpdateDescription = async (description: string) => {
            if (!item.checklist_id) {
              throw new Error("No checklist ID available");
            }
            await updateItemDescription.mutateAsync({
              checklist_id: item.checklist_id,
              description: description,
            });
            setDescriptionModals((prev) => ({
              ...prev,
              [itemKey]: { open: false, mode: "edit" },
            }));
          };

          return (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <div className="font-semibold text-gray-900" title={item.documentType}>
                  <HighlightText
                    text={item.documentType}
                    query={searchQuery}
                    className="text-sm"
                  />
                </div>
              </div>

              {item.description && item.description.trim() && (
                <div className="ml-6">
                  {checklistState === "editing" ? (
                    <Button
                      onClick={handleOpenDescriptionModal}
                      className="flex items-center gap-1 px-2 py-1 h-6 text-xs bg-gray-100 hover:bg-gray-200 cursor-pointer text-black border-gray-500"
                    >
                      Edit Description
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <p className="inline">
                        {truncateText(item.description, 50)}
                        {item.description.trim().length > 50 && "..."}
                      </p>
                      {item.description.trim().length > 50 && (
                        <button
                          onClick={() =>
                            setDescriptionDialogs((prev) => ({
                              ...prev,
                              [itemKey]: true,
                            }))
                          }
                          className="ml-1 text-blue-600 text-xs underline hover:text-blue-800"
                        >
                          Read more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {checklistState === "editing" &&
                (!item.description || !item.description.trim()) && (
                  <div className="ml-6">
                    <Button
                      onClick={handleOpenDescriptionModal}
                      className="flex items-center gap-1 px-2 py-1 h-6 text-xs bg-gray-100 hover:bg-gray-200 cursor-pointer text-black border-gray-500"
                    >
                      Add Description
                    </Button>
                  </div>
                )}
              <div className="sm:hidden">
                <Badge
                  variant="default"
                  className={cn(
                    "text-xs py-0.5 text-white",
                    getCategoryBadgeStyle(item.category),
                  )}
                >
                  {item.category}
                </Badge>
              </div>
              <div className="md:hidden flex flex-wrap gap-1">
                {item.isUploaded ? (
                  <Badge
                    variant="default"
                    className={cn(
                      "text-xs px-1.5 py-0.5 w-fit",
                      item.documentStatus === "rejected"
                        ? "bg-red-100 text-red-800 hover:bg-red-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200",
                    )}
                  >
                    {item.documentStatus === "rejected"
                      ? "Rejected"
                      : "Uploaded"}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground text-xs px-1.5 py-0.5 w-fit"
                  >
                    Not Uploaded
                  </Badge>
                )}
                {item.requirement && item.requirement !== "not_required" && (
                  <Badge
                    variant="default"
                    className={cn(
                      "text-xs px-1.5 py-0.5 w-fit",
                      item.requirement === "mandatory"
                        ? "bg-red-100 text-red-800 hover:bg-red-200"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                    )}
                  >
                    {item.requirement === "mandatory"
                      ? "Mandatory"
                      : "Optional"}
                  </Badge>
                )}
                {(() => {
                  const docCount =
                    documentCounts[
                      `${item.documentType}_${item.category || "default"}`
                    ] || 0;
                  const shouldShowStatus =
                    docCount === 1 && item.isUploaded && item.documentStatus;
                  return shouldShowStatus &&
                    item.documentStatus &&
                    item.documentStatus !== "rejected" ? (
                    <Badge
                      variant="default"
                      className={cn(
                        "text-xs px-1.5 py-0.5 w-fit",
                        getStatusBadgeStyle(item.documentStatus),
                      )}
                    >
                      {capitalize(item.documentStatus)}
                    </Badge>
                  ) : null;
                })()}
              </div>
            </div>
          );
        },
        enableHiding: false,
      },
      // {
      //   id: "category",
      //   header: "Category",
      //   cell: ({ row }) => {
      //     const item = row.original;
      //     return (
      //       <div className="hidden sm:table-cell">
      //         <Badge
      //           variant="default"
      //           className={cn(
      //             "text-xs py-1 text-white",
      //             getCategoryBadgeStyle(item.category),
      //           )}
      //         >
      //           {item.category}
      //         </Badge>
      //       </div>
      //     );
      //   },
      //   enableHiding: true,
      // },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const item = row.original;
          const uploadedDoc = item.uploadedDocument as Document;
          return (
            <div className="hidden md:table-cell">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  {item.isUploaded ? (
                    <Badge
                      variant="default"
                      className={cn(
                        "text-xs px-1.5 py-0.5 w-fit",
                        item.documentStatus === "rejected"
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200",
                      )}
                    >
                      {item.documentStatus === "rejected"
                        ? "Rejected"
                        : "Uploaded"}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-xs px-1.5 py-0.5 w-fit"
                    >
                      Not Uploaded
                    </Badge>
                  )}
                  {item.requirement && item.requirement !== "not_required" && (
                    <Badge
                      variant="default"
                      className={cn(
                        "text-xs px-1.5 py-0.5 w-fit",
                        item.requirement === "mandatory"
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                      )}
                    >
                      {item.requirement === "mandatory"
                        ? "Mandatory"
                        : "Optional"}
                    </Badge>
                  )}
                  {(() => {
                    const docCount =
                      documentCounts[
                        `${item.documentType}_${item.category || "default"}`
                      ] || 0;
                    const shouldShowStatus =
                      docCount === 1 && item.isUploaded && item.documentStatus;
                    return shouldShowStatus &&
                      item.documentStatus &&
                      item.documentStatus !== "rejected" ? (
                      <Badge
                        variant="default"
                        className={cn(
                          "text-xs px-1.5 py-0.5 w-fit",
                          getStatusBadgeStyle(item.documentStatus),
                        )}
                      >
                        {capitalize(item.documentStatus)}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                {item.documentStatus === "rejected" && item.rejectedRemark && (
                  <div className="max-w-xs">
                    <RejectionMessageDisplay
                      message={item.rejectedRemark}
                      maxLength={80}
                      onReadMore={() => {
                        if (uploadedDoc) {
                          const documentType =
                            item.documentType ||
                            uploadedDoc.document_type ||
                            "Document";
                          const category =
                            item.category ||
                            uploadedDoc.document_category ||
                            "Other Documents";
                          handleViewRejectionDetails(
                            uploadedDoc,
                            documentType,
                            category,
                          );
                        }
                      }}
                      showReadMoreButton={item.rejectedRemark.length > 80}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        },
        enableHiding: true,
      },
      {
        id: "comments",
        header: "Comments",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="w-20">
              {item.isUploaded && item.uploadedDocument ? (
                <CommentIcon
                  documentId={(item.uploadedDocument as Document)._id}
                  commentCount={
                    commentCounts[(item.uploadedDocument as Document)._id] || 0
                  }
                  size="sm"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">0</span>
                </div>
              )}
            </div>
          );
        },
        enableHiding: true,
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const item = row.original;
          const uploadedDoc = item.uploadedDocument as Document;
          const docCount =
            documentCounts[
              `${item.documentType}_${item.category || "default"}`
            ] || 0;

          return (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                {checklistState === "creating" ? (
                  <div className="w-32">
                    <RequirementSelector
                      value={item.requirement || "not_required"}
                      onChange={(requirement) =>
                        onUpdateDocumentRequirement?.(
                          item.category,
                          item.documentType,
                          requirement,
                        )
                      }
                    />
                  </div>
                ) : checklistState === "editing" ? (
                  activeTab === "current" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (item.checklist_id && onAddToPendingDeletions) {
                          onAddToPendingDeletions(item.checklist_id);
                        }
                      }}
                      disabled={isBatchDeleting}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 h-7 text-xs disabled:opacity-50",
                        pendingDeletions.includes(item.checklist_id || "")
                          ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                          : "text-red-600 hover:text-red-700",
                      )}
                    >
                      {isBatchDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          <span className="hidden sm:inline">Deleting...</span>
                        </>
                      ) : pendingDeletions.includes(item.checklist_id || "") ? (
                        <>
                          <div className="animate-pulse rounded-full h-3 w-3 bg-red-600"></div>
                          <span className="hidden sm:inline">Pending</span>
                        </>
                      ) : (
                        <span>Delete</span>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <RequirementSelector
                          value={item.requirement || "not_required"}
                          onChange={(requirement) =>
                            onUpdateDocumentRequirement?.(
                              item.category,
                              item.documentType,
                              requirement,
                            )
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToPendingChanges(item)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 h-7 text-xs",
                          isDocumentAdded &&
                            addedDocumentId ===
                              `${item.category}-${item.documentType}` &&
                            "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
                        )}
                        disabled={
                          item.requirement === "not_required" ||
                          isAddingDocument ||
                          (isDocumentAdded &&
                            addedDocumentId ===
                              `${item.category}-${item.documentType}`)
                        }
                      >
                        {isAddingDocument &&
                        addingDocumentId ===
                          `${item.category}-${item.documentType}` ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                            <span className="hidden sm:inline">Adding...</span>
                          </>
                        ) : isDocumentAdded &&
                          addedDocumentId ===
                            `${item.category}-${item.documentType}` ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span className="hidden sm:inline">Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            <span className="hidden sm:inline">Add</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )
                ) : (
                  <div
                    className="flex items-center justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label="Open menu"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* View - show when item.isUploaded */}
                        {item.isUploaded && (
                          <DropdownMenuItem
                            onClick={() => {
                              const documentType =
                                item.documentType ||
                                uploadedDoc?.document_type ||
                                "Document";
                              const category =
                                item.category ||
                                uploadedDoc?.document_category ||
                                "Other Documents";
                              handleViewDocuments(documentType, category);
                            }}
                          >
                            View{docCount > 0 ? ` (${docCount})` : ""}
                          </DropdownMenuItem>
                        )}
                        {/* Upload - show when not uploaded OR uploaded but not rejected */}
                        {(!item.isUploaded ||
                          (item.isUploaded &&
                            item.documentStatus !== "rejected")) && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUploadClick(
                                item.documentType,
                                item.category,
                              )
                            }
                          >
                            Upload
                          </DropdownMenuItem>
                        )}
                        {/* Reupload - show when uploaded and rejected */}
                        {item.isUploaded &&
                          item.documentStatus === "rejected" && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (uploadedDoc?._id) {
                                  const documentType =
                                    item.documentType ||
                                    uploadedDoc.document_type ||
                                    "Document";
                                  const category =
                                    item.category ||
                                    uploadedDoc.document_category ||
                                    "Other Documents";
                                  handleReuploadClick(
                                    uploadedDoc._id,
                                    documentType,
                                    category,
                                  );
                                }
                              }}
                            >
                              Reupload
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [
      searchQuery,
      checklistState,
      activeTab,
      documentCounts,
      commentCounts,
      descriptionModals,
      descriptionDialogs,
      pendingDeletions,
      isBatchDeleting,
      isAddingDocument,
      addingDocumentId,
      isDocumentAdded,
      addedDocumentId,
      onUpdateDocumentRequirement,
      onAddToPendingDeletions,
      handleAddToPendingChanges,
      handleViewDocuments,
      handleUploadClick,
      handleReuploadClick,
      handleViewRejectionDetails,
      updateItemDescription,
    ],
  );

  // Set up TanStack Table
  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: itemsPerPage,
      },
    },
    state: {
      columnVisibility,
    },
  });

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
            <p className="text-destructive">
              Failed to load document checklist
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
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
        table={table}
      />

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
              Showing {filteredItems.length} of {categoryFilteredItems.length}{" "}
              documents
              {filteredItems.length === 0 && " - no matches found"}
            </span>
          )}
        </div>
      )}

      {/* Table wrapper with border */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {selectedCategory === "submitted"
                      ? "No documents uploaded yet"
                      : "No documents in this category"}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Render all modals outside the table */}
      {Object.entries(descriptionModals).map(([key, modal]) => {
        if (!modal.open) return null;
        // Parse key: format is "category-documentType-checklistId-index"
        const parts = key.split("-");
        const checklistId = parts.slice(2, -1).join("-"); // Handle cases where category or documentType contains dashes
        const item = filteredItems.find(
          (i) =>
            `${i.category}-${i.documentType}-${i.checklist_id || "new"}` ===
              key.replace(/-\d+$/, "") ||
            (i.checklist_id === checklistId &&
              i.category === parts[0] &&
              i.documentType === parts[1]),
        );
        if (!item) return null;
        return (
          <DescriptionModal
            key={key}
            open={modal.open}
            onOpenChange={(open) =>
              setDescriptionModals((prev) => ({
                ...prev,
                [key]: { ...prev[key]!, open },
              }))
            }
            existingDescription={item.description || ""}
            onSave={async (description: string) => {
              if (!item.checklist_id) {
                throw new Error("No checklist ID available");
              }
              await updateItemDescription.mutateAsync({
                checklist_id: item.checklist_id,
                description: description,
              });
              setDescriptionModals((prev) => ({
                ...prev,
                [key]: { ...prev[key]!, open: false },
              }));
            }}
            mode={modal.mode}
            isLoading={updateItemDescription.isPending}
          />
        );
      })}

      {Object.entries(descriptionDialogs).map(([key, isOpen]) => {
        if (!isOpen) return null;
        // Find item by matching the key pattern
        const item = filteredItems.find(
          (i) =>
            `${i.category}-${i.documentType}-${i.checklist_id || "new"}` ===
            key,
        );
        if (!item) return null;
        return (
          <DescriptionDialog
            key={key}
            isOpen={isOpen}
            onClose={() =>
              setDescriptionDialogs((prev) => ({ ...prev, [key]: false }))
            }
            documentType={item.documentType}
            description={item.description || ""}
          />
        );
      })}

      <UploadDocumentsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        applicationId={applicationId}
        selectedDocumentType={selectedDocumentType}
        selectedDocumentCategory={selectedDocumentCategory}
        company={selectedCompany}
        documents={documents as ApiDocument[]}
        isClientView={isClientView}
        instruction={selectedInstruction}
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
            .refetchQueries({
              queryKey: ["application-documents-all", applicationId],
            })
            .then(() => {
              const latestDocuments = getLatestDocuments(documents || []);
              const matchingDocuments = filterDocumentsByType(
                latestDocuments,
                selectedDocumentTypeForView,
                selectedCompanyCategoryForView,
              );
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
        instruction={selectedInstruction}
      />
    </div>
  );
};

export const DocumentChecklistTable = memo(DocumentChecklistTableComponent);
DocumentChecklistTable.displayName = "DocumentChecklistTable";
