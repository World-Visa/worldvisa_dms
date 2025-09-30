import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";
import { formatDate } from "@/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDeleteDocument } from "@/hooks/useMutationsDocuments";
import { useApplicationDocumentsPaginated } from "@/hooks/useApplicationDocumentsPaginated";
import { UploadDocumentsModal } from "./UploadDocumentsModal";
import { ApplicationsPagination } from "./ApplicationsPagination";
import {
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getCategoryDisplayProps } from "@/lib/utils/documentCategoryNormalizer";
import ViewDocumentSheet from "./ViewDocumentSheet";
import { Document as ApplicationDocument } from "@/types/applications";
import { ClientDocumentsResponse } from "@/types/client";
import { useClientDeleteDocument } from "@/hooks/useClientDeleteDocument";
import { CommentIcon } from "./CommentIcon";
import { useDocumentCommentCounts } from "@/hooks/useDocumentCommentCounts";
import { ReuploadDocumentModal } from "./ReuploadDocumentModal";

interface DocumentsTableProps {
  applicationId: string;
  currentPage?: number;
  limit?: number; // Limit of documents per page
  onPageChange?: (page: number) => void;
  // Client privilege props
  isClientView?: boolean;
  // Client-specific data (when isClientView is true)
  clientDocumentsData?: ClientDocumentsResponse;
  clientIsLoading?: boolean;
  clientError?: Error | null;
  onClientDeleteSuccess?: () => void;
  onReuploadDocument?: (
    documentId: string,
    documentType: string,
    category: string
  ) => void;
  onUploadSuccess?: () => void;
}

export function DocumentsTable({
  applicationId,
  currentPage = 1,
  limit = 10,
  onPageChange,
  isClientView = false,
  clientDocumentsData,
  clientIsLoading = false,
  clientError = null,
  onClientDeleteSuccess,
  onReuploadDocument,
  onUploadSuccess,
}: DocumentsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<ApplicationDocument | null>(null);
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] =
    useState<ApplicationDocument | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] =
    useState<string>("");
  const [
    selectedReuploadDocumentCategory,
    setSelectedReuploadDocumentCategory,
  ] = useState<string>("");

  const deleteDocumentMutation = useDeleteDocument();
  const clientDeleteDocumentMutation = useClientDeleteDocument();

  const {
    data: adminDocumentsData,
    isLoading: adminIsLoading,
    error: adminError,
    refetch,
  } = useApplicationDocumentsPaginated(applicationId, currentPage, limit);

  // Use appropriate data based on view type
  const documentsData = isClientView ? clientDocumentsData : adminDocumentsData;
  const isLoading = isClientView ? clientIsLoading : adminIsLoading;
  const error = isClientView ? clientError : adminError;

  const documents = isClientView
    ? (documentsData as ClientDocumentsResponse)?.data?.documents || []
    : documentsData?.data || [];
  const pagination = documentsData?.pagination;

  // Get document IDs for comment counts
  const documentIds = (documents as ApplicationDocument[]).map(
    (doc) => doc._id
  );
  const { data: commentCounts = {} } = useDocumentCommentCounts(documentIds);

  const handleDeleteDocument = (documentId: string, fileName: string) => {
    setDocumentToDelete({ id: documentId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const handleViewDocument = (document: ApplicationDocument) => {
    setSelectedDocument(document);
    setViewSheetOpen(true);
  };

  const handleCloseViewSheet = () => {
    setViewSheetOpen(false);
    setSelectedDocument(null);
  };

  const handleOpenReuploadModal = (
    documentId: string,
    documentType: string,
    category: string
  ) => {
    const documentToReupload = (documents as ApplicationDocument[])?.find(
      (doc) => doc._id === documentId
    );
    if (!documentToReupload) {
      console.error("Document not found for reupload:", documentId);
      return;
    }

    setSelectedReuploadDocument(documentToReupload);
    setSelectedReuploadDocumentType(documentType);
    setSelectedReuploadDocumentCategory(category);
    setIsReuploadModalOpen(true);
  };

  const handleReuploadModalClose = () => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType("");
    setSelectedReuploadDocumentCategory("");
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      if (isClientView) {
        await clientDeleteDocumentMutation.mutateAsync({
          documentId: documentToDelete.id,
        });
        onClientDeleteSuccess?.();
      } else {
        await deleteDocumentMutation.mutateAsync(documentToDelete.id);
        refetch();
      }
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch {}
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Approved",
          className:
            "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
          iconClassName: "text-green-600",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: "Rejected",
          className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
          iconClassName: "text-red-600",
        };
      case "reviewed":
        return {
          icon: <Eye className="h-3 w-3" />,
          label: "Reviewed",
          className:
            "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
          iconClassName: "text-blue-600",
        };
      case "request_review":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: "Review Requested",
          className:
            "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
          iconClassName: "text-yellow-600",
        };
      case "pending":
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          label: "Pending",
          className:
            "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
          iconClassName: "text-gray-600",
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3].map((i) => (
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
          <CardTitle>Submitted Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load documents</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documents || (documents as unknown[])?.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Submitted Documents</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(documents as ApplicationDocument[])?.map(
                (document: ApplicationDocument, index: number) => (
                  <TableRow key={document._id}>
                    <TableCell className="font-medium">
                      {(pagination?.currentPage
                        ? (pagination.currentPage - 1) * pagination.limit
                        : 0) +
                        index +
                        1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span
                            className="truncate max-w-[150px]"
                            title={document.file_name}
                          >
                            {document.file_name.length > 20
                              ? `${document.file_name.substring(0, 20)}...`
                              : document.file_name}
                          </span>
                        </div>
                        {/* Show rejection message for rejected documents */}
                        {document.status === "rejected" &&
                          document.reject_message && (
                            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 max-w-[200px]">
                              <div className="flex items-start gap-1">
                                <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <strong>Rejection Reason:</strong>{" "}
                                  {document.reject_message}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="font-lexend ">
                      {(() => {
                        // Get document type from API response - use document_name field
                        const documentType = document.document_name;

                        if (documentType) {
                          const formattedType = documentType
                            .replace(/_/g, " ")
                            .replace(/\//g, "/");
                          return (
                            <Badge
                              variant="secondary"
                              className="text-xs max-w-[120px] font-medium truncate"
                              title={formattedType}
                            >
                              {formattedType.length > 15
                                ? `${formattedType.substring(0, 15)}...`
                                : formattedType}
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              Not specified
                            </Badge>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell className="font-lexend">
                      {(() => {
                        // Try to determine document category with fallback logic
                        let documentCategory = document.document_category;

                        // If no document_category field, try to infer from filename or document type
                        if (!documentCategory && document.file_name) {
                          const fileName = document.file_name.toLowerCase();

                          // Check for company-related documents
                          if (
                            fileName.includes("payslip") ||
                            fileName.includes("salary") ||
                            fileName.includes("experience") ||
                            fileName.includes("work") ||
                            fileName.includes("company") ||
                            fileName.includes("employment")
                          ) {
                            documentCategory = "Company Documents";
                          }
                          // Check for identity documents
                          else if (
                            fileName.includes("passport") ||
                            fileName.includes("aadhaar") ||
                            fileName.includes("aadhar") ||
                            fileName.includes("visa") ||
                            fileName.includes("birth") ||
                            fileName.includes("marriage")
                          ) {
                            documentCategory = "Identity Documents";
                          }
                          // Check for education documents
                          else if (
                            fileName.includes("degree") ||
                            fileName.includes("certificate") ||
                            fileName.includes("10th") ||
                            fileName.includes("12th") ||
                            fileName.includes("bachelor") ||
                            fileName.includes("master") ||
                            fileName.includes("diploma") ||
                            fileName.includes("ielts") ||
                            fileName.includes("pte") ||
                            fileName.includes("toefl")
                          ) {
                            documentCategory = "Education Documents";
                          }
                          // Default to Other Documents
                          else {
                            documentCategory = "Other Documents";
                          }
                        }

                        if (documentCategory) {
                          const {
                            category,
                            badgeVariant,
                            badgeClassName,
                            displayText,
                          } = getCategoryDisplayProps(documentCategory);
                          return (
                            <Badge
                              variant={
                                badgeVariant as
                                  | "default"
                                  | "outline"
                                  | "secondary"
                                  | "destructive"
                                  | null
                                  | undefined
                              }
                              className={`text-xs max-w-[140px] font-medium truncate ${badgeClassName}`}
                              title={category}
                            >
                              {displayText}
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              Not specified
                            </Badge>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const statusConfig = getStatusConfig(document.status);
                        return (
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${statusConfig.className}`}
                          >
                            <span className={statusConfig.iconClassName}>
                              {statusConfig.icon}
                            </span>
                            <span className="font-lexend">
                              {statusConfig.label}
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <CommentIcon
                        documentId={document._id}
                        commentCount={commentCounts[document._id] || 0}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(document.uploaded_at, "time")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2 w-full">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleViewDocument(document)}
                          className="cursor-pointer"
                        >
                          view
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (document.status === "reviewed") {
                              const documentType =
                                document.document_name ||
                                document.document_type ||
                                "Document";
                              const category =
                                document.document_category || "Other Documents";
                              handleOpenReuploadModal(
                                document._id,
                                documentType,
                                category
                              );
                            } else {
                              handleDeleteDocument(
                                document._id,
                                document.file_name
                              );
                            }
                          }}
                          disabled={
                            isClientView
                              ? clientDeleteDocumentMutation.isPending ||
                                document.status === "approved"
                              : deleteDocumentMutation.isPending
                          }
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
          {/* Pagination */}
          {pagination && (
            <ApplicationsPagination
              currentPage={pagination.currentPage}
              totalRecords={pagination.totalRecords}
              limit={pagination.limit}
              onPageChange={onPageChange || (() => {})}
            />
          )}
        </CardContent>
        <UploadDocumentsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          applicationId={applicationId}
          company={undefined}
          isClientView={isClientView}
          onSuccess={onUploadSuccess}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteDocumentDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        documentName={documentToDelete?.name || ""}
        isDeleting={
          isClientView
            ? clientDeleteDocumentMutation.isPending
            : deleteDocumentMutation.isPending
        }
      />

      {/* View Document Sheet */}
      {selectedDocument && (
        <ViewDocumentSheet
          document={selectedDocument}
          documents={documents as ApplicationDocument[]}
          applicationId={applicationId}
          isOpen={viewSheetOpen}
          onClose={handleCloseViewSheet}
          onReuploadDocument={onReuploadDocument}
          documentType={selectedDocument.document_name || "Document"}
          category={selectedDocument.document_category || "Other Documents"}
          isClientView={isClientView}
        />
      )}

      {/* Reupload Document Modal */}
      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={handleReuploadModalClose}
        applicationId={applicationId}
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
        isClientView={isClientView}
      />
    </>
  );
}
