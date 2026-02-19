import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useClientDeleteDocument } from "@/hooks/useClientDeleteDocument";
import { useDocumentCommentCounts } from "@/hooks/useDocumentCommentCounts";
import {
  useMoveDocument,
  useMoveDocumentAgent,
} from "@/hooks/useDocumentMovedDocs";
import { useDeleteDocument } from "@/hooks/useMutationsDocuments";
import { getCategoryDisplayProps } from "@/lib/utils/documentCategoryNormalizer";
import { Document as ApplicationDocument } from "@/types/applications";
import { ClientDocumentsResponse } from "@/types/client";
import { formatDate } from "@/utils/format";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CommentIcon } from "./CommentIcon";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";
import { ReuploadDocumentModal } from "./ReuploadDocumentModal";
import { UploadDocumentsModal } from "./UploadDocumentsModal";
import ViewDocumentSheet from "./ViewDocumentSheet";

interface DocumentsTableProps {
  applicationId: string;
  // Admin: pass full documents list
  documents?: ApplicationDocument[];
  // Admin loading/error states
  isLoading?: boolean;
  error?: Error | null;
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
    category: string,
  ) => void;
  onUploadSuccess?: () => void;
}

export function DocumentsTable({
  applicationId,
  documents: adminDocuments,
  isLoading: adminIsLoading,
  error: adminError,
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
  const clientMoveDocumentMutation = useMoveDocument();
  const agentMoveDocumentMutation = useMoveDocumentAgent();

  // Use appropriate data based on view type
  const isLoading = isClientView ? clientIsLoading : adminIsLoading;
  const error = isClientView ? clientError : adminError;

  const documents: ApplicationDocument[] = isClientView
    ? ((clientDocumentsData?.data?.documents ||
        []) as unknown as ApplicationDocument[])
    : adminDocuments || [];

  // Get document IDs for comment counts
  const documentIds = documents.map((doc) => doc._id);
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
    category: string,
  ) => {
    const documentToReupload = documents.find((doc) => doc._id === documentId);
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
        await clientMoveDocumentMutation.mutateAsync(documentToDelete.id);
        onClientDeleteSuccess?.();
      } else {
        await agentMoveDocumentMutation.mutateAsync(documentToDelete.id);
        // Note: Parent should handle refetch if needed
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

  // Column definitions
  const columns = useMemo<ColumnDef<ApplicationDocument>[]>(
    () => [
      {
        id: "sno",
        header: "S.No",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return (
            <div className="font-medium">
              {pageIndex * pageSize + row.index + 1}
            </div>
          );
        },
      },
      {
        id: "documentName",
        header: "Document Name",
        cell: ({ row }) => {
          const document = row.original;
          return (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span
                  className="truncate max-w-[150px] font-semibold text-gray-900 underline"
                  title={document.file_name}
                >
                  {document.file_name.length > 20
                    ? `${document.file_name.substring(0, 20)}...`
                    : document.file_name}
                </span>
              </div>
              {document.status === "rejected" && document.reject_message && (
                <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 max-w-[200px]">
                  <div className="flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <strong>Rejection Reason:</strong>{" "}
                      {document.reject_message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "documentType",
        header: "Document Type",
        cell: ({ row }) => {
          const document = row.original;
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
        },
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => {
          const document = row.original;
          let documentCategory = document.document_category;

          // If no document_category field, try to infer from filename
          if (!documentCategory && document.file_name) {
            const fileName = document.file_name.toLowerCase();

            if (
              fileName.includes("payslip") ||
              fileName.includes("salary") ||
              fileName.includes("experience") ||
              fileName.includes("work") ||
              fileName.includes("company") ||
              fileName.includes("employment")
            ) {
              documentCategory = "Company Documents";
            } else if (
              fileName.includes("passport") ||
              fileName.includes("aadhaar") ||
              fileName.includes("aadhar") ||
              fileName.includes("visa") ||
              fileName.includes("birth") ||
              fileName.includes("marriage")
            ) {
              documentCategory = "Identity Documents";
            } else if (
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
            } else {
              documentCategory = "Other Documents";
            }
          }

          if (documentCategory) {
            const { badgeVariant, badgeClassName, displayText } =
              getCategoryDisplayProps(documentCategory);
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
                title={documentCategory}
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
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const document = row.original;
          const statusConfig = getStatusConfig(document.status);
          return (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${statusConfig.className}`}
            >
              <span className={statusConfig.iconClassName}>
                {statusConfig.icon}
              </span>
              <span>{statusConfig.label}</span>
            </div>
          );
        },
      },
      {
        id: "comments",
        header: "Comments",
        cell: ({ row }) => {
          const document = row.original;
          return (
            <CommentIcon
              documentId={document._id}
              commentCount={commentCounts[document._id] || 0}
              size="sm"
            />
          );
        },
      },
      {
        id: "submittedAt",
        header: "Submitted At",
        cell: ({ row }) => {
          const document = row.original;
          return formatDate(document.uploaded_at, "time");
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const document = row.original;
          const isDeleting = isClientView
            ? clientDeleteDocumentMutation.isPending ||
              document.status === "approved"
            : deleteDocumentMutation.isPending;

          return (
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
                  <DropdownMenuItem
                    onClick={() => handleViewDocument(document)}
                  >
                    View
                  </DropdownMenuItem>
                  {document.status === "reviewed" && (
                    <DropdownMenuItem
                      onClick={() => {
                        const documentType =
                          document.document_name ||
                          document.document_type ||
                          "Document";
                        const category =
                          document.document_category || "Other Documents";
                        handleOpenReuploadModal(
                          document._id,
                          documentType,
                          category,
                        );
                      }}
                    >
                      Reupload
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      handleDeleteDocument(document._id, document.file_name)
                    }
                    disabled={isDeleting}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      commentCounts,
      isClientView,
      clientDeleteDocumentMutation.isPending,
      deleteDocumentMutation.isPending,
    ],
  );

  const table = useReactTable({
    data: documents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

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

  if (!documents || documents.length === 0) {
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
      <div className="w-full">
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
                    onClick={() => handleViewDocument(row.original)}
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
                    No results.
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
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
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
        <UploadDocumentsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          applicationId={applicationId}
          company={undefined}
          isClientView={isClientView}
          onSuccess={onUploadSuccess}
        />
      </div>

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
