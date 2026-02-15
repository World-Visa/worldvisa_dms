import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateDocumentStatus,
  UpdateDocumentStatusRequest,
} from "@/lib/api/updateDocumentStatus";
import { Document } from "@/types/applications";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { useAddComment } from "./useCommentMutations";
import { revalidateDocumentsCache } from "@/lib/actions/cache-actions";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

interface DocumentsResponse {
  success: boolean;
  data: Document[];
  pagination?: PaginationInfo;
}

interface UseDocumentStatusUpdateProps {
  applicationId?: string;
  documentId?: string; // Add documentId for comment creation
  onSuccess?: (documentId: string, newStatus: string) => void;
  onError?: (error: Error, documentId: string, newStatus: string) => void;
}

export function useDocumentStatusUpdate({
  applicationId,
  documentId,
  onSuccess,
  onError,
}: UseDocumentStatusUpdateProps) {
  const queryClient = useQueryClient();

  const addCommentMutation = useAddComment(documentId || "");

  return useMutation({
    mutationFn: async ({
      documentId,
      status,
      changedBy,
      rejectMessage,
    }: {
      documentId: string;
      status: UpdateDocumentStatusRequest["status"];
      changedBy: string;
      rejectMessage?: string;
    }) => {
      const startTime = Date.now();

      try {
        const response = await updateDocumentStatus(documentId, {
          status,
          changed_by: changedBy,
          reject_message: rejectMessage,
        });

        const responseTime = Date.now() - startTime;

        if (!response.success) {
          throw new Error(
            response.message || "Failed to update document status",
          );
        }

        // If document is rejected and has a rejection message, create a comment
        if (status === "rejected" && rejectMessage && documentId) {
          try {
            // Use the comment creation mutation but don't await it to avoid blocking
            addCommentMutation.mutate({
              comment: `Document rejected: ${rejectMessage}`,
              added_by: changedBy,
            });
          } catch (commentError) {
            // Log comment creation error but don't fail the status update
            console.warn("Failed to create rejection comment:", commentError);
            Sentry.captureException(commentError, {
              tags: {
                operation: "create_rejection_comment",
                documentId,
              },
              extra: {
                rejectMessage,
                changedBy,
              },
            });
          }
        }

        // Track performance
        if (responseTime > 2000) {
          console.warn(`Slow status update response: ${responseTime}ms`);
        }

        return {
          documentId,
          newStatus: status,
          rejectMessage,
          response: response.data,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        // Log error to Sentry
        Sentry.captureException(error, {
          tags: {
            operation: "update_document_status",
            documentId,
            status,
          },
          extra: {
            changedBy,
            responseTime,
          },
        });

        throw error;
      }
    },

    onMutate: async ({ documentId, status, rejectMessage }) => {
      // Cancel any outgoing refetches for this document
      await queryClient.cancelQueries({
        queryKey: ["document", documentId],
      });

      if (applicationId) {
        await queryClient.cancelQueries({
          queryKey: ["application-documents", applicationId],
        });
        await queryClient.cancelQueries({
          queryKey: ["application-documents-paginated", applicationId],
        });
      }

      // Snapshot the previous values
      const previousDocument = queryClient.getQueryData<Document>([
        "document",
        documentId,
      ]);
      const previousDocumentsResponse = applicationId
        ? queryClient.getQueryData<{ success: boolean; data: Document[] }>([
            "application-documents",
            applicationId,
          ])
        : null;
      const previousPaginatedResponse = applicationId
        ? queryClient.getQueryData<DocumentsResponse>([
            "application-documents-paginated",
            applicationId,
          ])
        : null;
      const previousClientDocuments = queryClient.getQueryData<{
        data?: { documents?: Document[] };
      }>(["client-documents"]);

      // Optimistically update the document status
      queryClient.setQueryData<Document>(["document", documentId], (old) => {
        if (!old) return old;

        return {
          ...old,
          status: status as Document["status"],
          reject_message:
            status === "rejected" ? rejectMessage : old.reject_message,
          history: [
            ...old.history,
            {
              _id: `temp-${Date.now()}`,
              status,
              changed_by: "Current User", // Will be replaced with actual user
              changed_at: new Date().toISOString(),
            },
          ],
        };
      });

      // Also update the documents list if available
      if (applicationId && previousDocumentsResponse) {
        queryClient.setQueryData<{ success: boolean; data: Document[] }>(
          ["application-documents", applicationId],
          (old) => {
            if (!old || !old.data || !Array.isArray(old.data)) return old;

            return {
              ...old,
              data: old.data.map((doc) =>
                doc._id === documentId
                  ? {
                      ...doc,
                      status: status as Document["status"],
                      reject_message:
                        status === "rejected"
                          ? rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history,
                        {
                          _id: `temp-${Date.now()}`,
                          status,
                          changed_by: "Current User",
                          changed_at: new Date().toISOString(),
                        },
                      ],
                    }
                  : doc,
              ),
            };
          },
        );
      }

      // Also update the all documents cache (used by DocumentChecklistTable)
      if (applicationId) {
        queryClient.setQueriesData<{ success: boolean; data: Document[] }>(
          {
            queryKey: ["application-documents-all", applicationId],
          },
          (old) => {
            if (!old || !old.data || !Array.isArray(old.data)) return old;

            return {
              ...old,
              data: old.data.map((doc) =>
                doc._id === documentId
                  ? {
                      ...doc,
                      status: status as Document["status"],
                      reject_message:
                        status === "rejected"
                          ? rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history,
                        {
                          _id: `temp-${Date.now()}`,
                          status,
                          changed_by: "Current User",
                          changed_at: new Date().toISOString(),
                        },
                      ],
                    }
                  : doc,
              ),
            };
          },
        );
      }

      // Also update client documents cache for real-time UI updates
      queryClient.setQueryData<{ data?: { documents?: Document[] } }>(
        ["client-documents"],
        (old) => {
          if (!old?.data?.documents || !Array.isArray(old.data.documents))
            return old;

          return {
            ...old,
            data: {
              ...old.data,
              documents: old.data.documents.map((doc) =>
                doc._id === documentId
                  ? {
                      ...doc,
                      status: status as Document["status"],
                      reject_message:
                        status === "rejected"
                          ? rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history,
                        {
                          _id: `temp-${Date.now()}`,
                          status,
                          changed_by: "Current User",
                          changed_at: new Date().toISOString(),
                        },
                      ],
                    }
                  : doc,
              ),
            },
          };
        },
      );

      // Also update the paginated documents list if available
      if (applicationId && previousPaginatedResponse) {
        // Update all paginated queries for this application
        queryClient.setQueriesData<DocumentsResponse>(
          {
            queryKey: ["application-documents-paginated", applicationId],
          },
          (old) => {
            if (!old || !old.data || !Array.isArray(old.data)) return old;

            return {
              ...old,
              data: old.data.map((doc) =>
                doc._id === documentId
                  ? {
                      ...doc,
                      status: status as Document["status"],
                      reject_message:
                        status === "rejected"
                          ? rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history,
                        {
                          _id: `temp-${Date.now()}`,
                          status,
                          changed_by: "Current User",
                          changed_at: new Date().toISOString(),
                        },
                      ],
                    }
                  : doc,
              ),
            };
          },
        );
      }

      return {
        previousDocument,
        previousDocumentsResponse,
        previousPaginatedResponse,
        previousClientDocuments,
        documentId,
        newStatus: status,
      };
    },

    onError: (error, { documentId, status }, context) => {
      // Rollback optimistic update
      if (context?.previousDocument) {
        queryClient.setQueryData(
          ["document", documentId],
          context.previousDocument,
        );
      }

      // Also rollback documents list if available
      if (applicationId && context?.previousDocumentsResponse) {
        queryClient.setQueryData(
          ["application-documents", applicationId],
          context.previousDocumentsResponse,
        );
      }

      // Also rollback paginated documents list if available
      if (applicationId && context?.previousPaginatedResponse) {
        queryClient.setQueriesData(
          {
            queryKey: ["application-documents-paginated", applicationId],
          },
          context.previousPaginatedResponse,
        );
      }

      // Also rollback client documents cache
      if (context?.previousClientDocuments) {
        queryClient.setQueryData(
          ["client-documents"],
          context.previousClientDocuments,
        );
      }

      // Show error toast
      toast.error("Failed to update document status", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });

      // Call custom error handler
      onError?.(error as Error, documentId, status);
    },

    onSuccess: (data) => {
      // Update the document with the real server response
      queryClient.setQueryData<Document>(
        ["document", data.documentId],
        (old) => {
          if (!old) {
            return old;
          }

          const updatedDocument = {
            ...old,
            status: data.newStatus as Document["status"],
            reject_message:
              data.newStatus === "rejected"
                ? data.rejectMessage
                : old.reject_message,
            history: [
              ...old.history.filter((h) => !h._id.startsWith("temp-")),
              ...(data.response
                ? [
                    {
                      _id: data.response._id,
                      status: data.response.status,
                      changed_by: data.response.changed_by,
                      changed_at: data.response.changed_at,
                    },
                  ]
                : []),
            ],
          };

          return updatedDocument;
        },
      );

      // Also update the documents list if available
      if (applicationId) {
        queryClient.setQueryData<{ success: boolean; data: Document[] }>(
          ["application-documents", applicationId],
          (old) => {
            if (!old || !old.data || !Array.isArray(old.data)) return old;

            return {
              ...old,
              data: old.data.map((doc) =>
                doc._id === data.documentId
                  ? {
                      ...doc,
                      status: data.newStatus as Document["status"],
                      reject_message:
                        data.newStatus === "rejected"
                          ? data.rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history.filter(
                          (h) => !h._id.startsWith("temp-"),
                        ),
                        ...(data.response
                          ? [
                              {
                                _id: data.response._id,
                                status: data.response.status,
                                changed_by: data.response.changed_by,
                                changed_at: data.response.changed_at,
                              },
                            ]
                          : []),
                      ],
                    }
                  : doc,
              ),
            };
          },
        );

        // Also update the all documents cache (used by DocumentChecklistTable)
        queryClient.setQueriesData<{ success: boolean; data: Document[] }>(
          {
            queryKey: ["application-documents-all", applicationId],
          },
          (old) => {
            if (!old || !old.data || !Array.isArray(old.data)) return old;

            return {
              ...old,
              data: old.data.map((doc) =>
                doc._id === data.documentId
                  ? {
                      ...doc,
                      status: data.newStatus as Document["status"],
                      reject_message:
                        data.newStatus === "rejected"
                          ? data.rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history.filter(
                          (h) => !h._id.startsWith("temp-"),
                        ),
                        ...(data.response
                          ? [
                              {
                                _id: data.response._id,
                                status: data.response.status,
                                changed_by: data.response.changed_by,
                                changed_at: data.response.changed_at,
                              },
                            ]
                          : []),
                      ],
                    }
                  : doc,
              ),
            };
          },
        );

        // Also update the paginated documents list
        queryClient.setQueriesData<DocumentsResponse>(
          {
            queryKey: ["application-documents-paginated", applicationId],
          },
          (old) => {
            if (!old || !old.data || !Array.isArray(old.data)) return old;

            return {
              ...old,
              data: old.data.map((doc) =>
                doc._id === data.documentId
                  ? {
                      ...doc,
                      status: data.newStatus as Document["status"],
                      reject_message:
                        data.newStatus === "rejected"
                          ? data.rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history.filter(
                          (h) => !h._id.startsWith("temp-"),
                        ),
                        ...(data.response
                          ? [
                              {
                                _id: data.response._id,
                                status: data.response.status,
                                changed_by: data.response.changed_by,
                                changed_at: data.response.changed_at,
                              },
                            ]
                          : []),
                      ],
                    }
                  : doc,
              ),
            };
          },
        );
      }

      // Also update client documents cache with real server response
      queryClient.setQueryData<{ data?: { documents?: Document[] } }>(
        ["client-documents"],
        (old) => {
          if (!old?.data?.documents || !Array.isArray(old.data.documents))
            return old;

          return {
            ...old,
            data: {
              ...old.data,
              documents: old.data.documents.map((doc) =>
                doc._id === data.documentId
                  ? {
                      ...doc,
                      status: data.newStatus as Document["status"],
                      reject_message:
                        data.newStatus === "rejected"
                          ? data.rejectMessage
                          : doc.reject_message,
                      history: [
                        ...doc.history.filter(
                          (h) => !h._id.startsWith("temp-"),
                        ),
                        ...(data.response
                          ? [
                              {
                                _id: data.response._id,
                                status: data.response.status,
                                changed_by: data.response.changed_by,
                                changed_at: data.response.changed_at,
                              },
                            ]
                          : []),
                      ],
                    }
                  : doc,
              ),
            },
          };
        },
      );

      // Revalidate Next.js cache after successful update
      if (applicationId) {
        revalidateDocumentsCache(applicationId).catch((error) => {
          console.error("Error revalidating documents cache:", error);
        });
      }

      // Show success toast
      const statusMessages = {
        approved: "Document approved successfully",
        rejected: "Document rejected",
        reviewed: "Document marked as reviewed",
        pending: "Document status reset to pending",
        request_review: "Review requested for document",
      };

      toast.success(
        statusMessages[data.newStatus] ||
          "Document status updated successfully",
      );

      // Call custom success handler
      onSuccess?.(data.documentId, data.newStatus);
    },

    onSettled: (data, error, { documentId }) => {
      // Only invalidate on error to ensure we have the latest data
      if (error) {
        queryClient.invalidateQueries({
          queryKey: ["document", documentId],
        });

        // Also invalidate documents list queries if applicationId is provided
        if (applicationId) {
          queryClient.invalidateQueries({
            queryKey: ["application-documents", applicationId],
          });
          queryClient.invalidateQueries({
            queryKey: ["application-documents-paginated", applicationId],
          });
          // Invalidate client documents cache to ensure client UI reflects status changes
          queryClient.invalidateQueries({
            queryKey: ["client-documents"],
          });
        }
      }
    },
  });
}
