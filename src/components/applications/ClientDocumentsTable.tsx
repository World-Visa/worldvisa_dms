"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { getCategoryDisplayProps } from "@/lib/utils/documentCategoryNormalizer";
import { ClientDocumentsResponse, ClientDocument } from "@/types/client";
import { Document } from "@/types/applications";
import { format } from "date-fns";
import ViewDocumentSheet from "./ViewDocumentSheet";

// Helper function to convert ClientDocument to Document
const convertClientDocumentToDocument = (
  clientDoc: ClientDocument
): Document => ({
  ...clientDoc,
  comments: clientDoc.comments.map((comment) => ({
    _id: comment._id,
    comment: comment.comment,
    added_by: comment.added_by,
    added_at: comment.created_at || new Date().toISOString(),
  })),
});

interface ClientDocumentsTableProps {
  data?: ClientDocumentsResponse;
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onUploadSuccess?: () => void;
  availableCategories?: string[];
}

export function ClientDocumentsTable({
  data,
  isLoading,
  error,
  currentPage,
  onPageChange,
}: ClientDocumentsTableProps) {
  const [selectedDocument, setSelectedDocument] =
    useState<ClientDocument | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);

  const handleViewDocument = (document: ClientDocument) => {
    setSelectedDocument(document);
    setIsViewSheetOpen(true);
  };

  const handleDownloadDocument = (document: ClientDocument) => {
    if (document.download_url) {
      window.open(document.download_url, "_blank");
    }
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
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load documents: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const documents = data?.data?.documents || [];
  const pagination = data?.pagination;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Submitted Documents
              </CardTitle>
              <CardDescription>
                Your uploaded documents and their current status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents submitted
              </h3>
              <p className="text-gray-600 mb-4">
                You haven&apos;t uploaded any documents yet. Click the upload
                button to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">S.No</TableHead>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document, index) => (
                      <TableRow key={document._id}>
                        <TableCell className="font-medium">
                          {(currentPage - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="font-lexend">
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            Not specified
                          </Badge>
                        </TableCell>
                        <TableCell className="font-lexend">
                          {(() => {
                            if (document.document_category) {
                              const {
                                category,
                                badgeVariant,
                                badgeClassName,
                                displayText,
                              } = getCategoryDisplayProps(
                                document.document_category
                              );
                              return (
                                <Badge
                                  variant={badgeVariant}
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
                            const statusConfig = getStatusConfig(
                              document.status
                            );
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
                          <div className="text-sm text-gray-600">
                            {format(
                              new Date(document.uploaded_at),
                              "MMM dd, yyyy, h:mm a"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDocument(document)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              view
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadDocument(document)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      currentPage * pagination.limit,
                      pagination.totalRecords
                    )}{" "}
                    of {pagination.totalRecords} documents
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Document View Sheet */}
      {selectedDocument && (
        <ViewDocumentSheet
          document={convertClientDocumentToDocument(selectedDocument)}
          documents={documents.map(convertClientDocumentToDocument)}
          applicationId={selectedDocument.record_id}
          isOpen={isViewSheetOpen}
          onClose={() => {
            setIsViewSheetOpen(false);
            setSelectedDocument(null);
          }}
          isClientView={true} // This will hide admin-specific features
        />
      )}
    </>
  );
}
