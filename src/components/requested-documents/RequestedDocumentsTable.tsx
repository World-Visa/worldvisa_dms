"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  MessageSquare,
  User,
  Eye,
  Clock,
  FileText,
} from "lucide-react";
import { RequestedDocument } from "@/lib/api/requestedDocuments";
import { StatusBadge } from "./StatusBadge";
import { RequestedDocumentViewSheet } from "./RequestedDocumentViewSheet";
import { RequestedDocumentType } from "@/types/common";
import { ClientNameCell } from "./ClientNameCell";

import { cn } from "@/lib/utils";
import { getCategoryDisplayProps } from "@/lib/utils/documentCategoryNormalizer";
import { useRequestedDocumentRealtime } from "@/hooks/useRequestedDocumentRealtime";

interface RequestedDocumentsTableProps {
  documents: RequestedDocument[];
  isLoading?: boolean;
  type: RequestedDocumentType;
}

export function RequestedDocumentsTable({
  documents,
  isLoading = false,
  type,
}: RequestedDocumentsTableProps) {
  const [selectedDocument, setSelectedDocument] =
    useState<RequestedDocument | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Enable real-time updates for requested documents
  useRequestedDocumentRealtime();

  const handleViewDocument = (document: RequestedDocument) => {
    setSelectedDocument(document);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedDocument(null);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-gray-50/50">
              <TableHead className="w-[250px] font-semibold text-gray-700">
                Document
              </TableHead>
              <TableHead className="w-[200px] font-semibold text-gray-700">
                Client Name
              </TableHead>
              <TableHead className="w-[140px] font-semibold text-gray-700">
                Requested By
              </TableHead>
              <TableHead className="w-[140px] font-semibold text-gray-700">
                Requested To
              </TableHead>
              <TableHead className="w-[100px] font-semibold text-gray-700">
                Status
              </TableHead>
              <TableHead className="w-[150px] font-semibold text-gray-700">
                Requested
              </TableHead>
              <TableHead className="text-right w-[100px] font-semibold text-gray-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="flex items-center gap-4 py-2">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[60%]" />
                      <Skeleton className="h-3 w-[40%]" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No documents found
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {type === "requested-to-me"
              ? "No documents have been requested for your review yet. When colleagues request your review, they will appear here."
              : type === "my-requests"
                ? "You haven't requested any documents for review yet. Request reviews from colleagues to track them here."
                : "No document review requests found. Document reviews from all team members will appear here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-gray-50/50">
              <TableHead className="w-[250px] font-semibold text-gray-700">
                Document
              </TableHead>
              <TableHead className="w-[200px] font-semibold text-gray-700">
                Client Name
              </TableHead>
              <TableHead className="w-[140px] font-semibold text-gray-700">
                Requested By
              </TableHead>
              <TableHead className="w-[140px] font-semibold text-gray-700">
                Requested To
              </TableHead>
              <TableHead className="w-[100px] font-semibold text-gray-700">
                Status
              </TableHead>
              <TableHead className="w-[150px] font-semibold text-gray-700">
                Requested
              </TableHead>
              <TableHead className="text-right w-[100px] font-semibold text-gray-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document, index) => {
              const isOverdue = document.isOverdue;
              const daysSinceRequest = document.daysSinceRequest;

              return (
                <TableRow
                  key={`${document._id}-${index}`}
                  className={cn(
                    "hover:bg-blue-50/30 transition-all duration-150",
                    isOverdue && "border-l-4 border-l-red-400",
                  )}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <p
                        className="text-sm font-semibold text-gray-900 truncate max-w-[220px]"
                        title={document.document_name || document.file_name}
                      >
                        {document.document_name || document.file_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {document.document_category
                          ? getCategoryDisplayProps(document.document_category)
                              .category
                          : "Document"}
                      </p>
                      {isOverdue && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600 font-semibold">
                            Overdue ({daysSinceRequest} days)
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <ClientNameCell recordId={document.record_id} />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {document.requested_review.requested_by}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {document.requested_review.requested_to}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={document.requested_review.status} />
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {document.requested_review.requested_at
                          ? new Date(
                              document.requested_review.requested_at,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            })
                          : "Unknown date"}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {document.requested_review.requested_at
                          ? new Date(
                              document.requested_review.requested_at,
                            ).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            })
                          : "Unknown time"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {document.requested_review.messages &&
                        document.requested_review.messages.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MessageSquare className="h-3 w-3" />
                            {document.requested_review.messages.length}
                          </div>
                        )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => handleViewDocument(document)}
                        aria-label="View document details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* View Sheet */}
      <RequestedDocumentViewSheet
        document={selectedDocument}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        type={type}
      />
    </>
  );
}
