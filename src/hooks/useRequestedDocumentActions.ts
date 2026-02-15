import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateDocumentStatus,
  UpdateDocumentStatusRequest,
  deleteRequestedDocument,
  DeleteRequestedDocumentRequest,
} from "@/lib/api/requestedDocumentActions";
import { toast } from "sonner";
import { RequestedDocument } from "@/lib/api/requestedDocuments";
import { useAuth } from "./useAuth";

// Helper functions for role-based calculations
function isDocumentOverdue(doc: RequestedDocument, userRole?: string): boolean {
  const requestDate = new Date(doc.requested_review.requested_at);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Role-based overdue thresholds
  switch (userRole) {
    case "master_admin":
      return daysDiff > 4; // 4+ days for master_admin
    case "team_leader":
      return daysDiff > 1; // 1+ days for team_leader
    default:
      return daysDiff > 4; // Default 4+ days for other roles
  }
}

function getDaysSinceRequest(doc: RequestedDocument): number {
  const requestDate = new Date(doc.requested_review.requested_at);
  const now = new Date();
  return Math.floor(
    (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getDocumentPriority(
  doc: RequestedDocument,
  userRole?: string,
): "high" | "medium" | "low" {
  const daysSinceRequest = getDaysSinceRequest(doc);
  const isOverdue = isDocumentOverdue(doc, userRole);

  // Overdue documents are always high priority
  if (isOverdue) return "high";

  // Role-based priority thresholds
  switch (userRole) {
    case "master_admin":
      if (daysSinceRequest > 3) return "high";
      if (daysSinceRequest > 2) return "medium";
      return "low";
    case "team_leader":
      if (daysSinceRequest > 0) return "high";
      return "medium";
    default:
      if (daysSinceRequest > 3) return "high";
      if (daysSinceRequest > 2) return "medium";
      return "low";
  }
}

function sortDocumentsByPriority(
  documents: RequestedDocument[],
  userRole?: string,
): RequestedDocument[] {
  return [...documents].sort((a, b) => {
    const aOverdue = isDocumentOverdue(a, userRole);
    const bOverdue = isDocumentOverdue(b, userRole);

    // Overdue documents come first
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // If both are overdue or both are not overdue, sort by days since request (descending)
    const aDays = getDaysSinceRequest(a);
    const bDays = getDaysSinceRequest(b);

    if (aOverdue && bOverdue) {
      return bDays - aDays; // More overdue first
    }

    return bDays - aDays; // More recent requests first for non-overdue
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      documentId,
      data,
    }: {
      documentId: string;
      data: UpdateDocumentStatusRequest;
    }) => updateDocumentStatus(documentId, data),
    onMutate: async ({ documentId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["requested-documents-to-me"],
      });
      await queryClient.cancelQueries({ queryKey: ["my-requested-documents"] });
      await queryClient.cancelQueries({
        queryKey: ["all-requested-documents"],
      });
      await queryClient.cancelQueries({
        queryKey: ["requested-document", documentId],
      });

      // Get current data for rollback
      const previousToMeData = queryClient.getQueriesData({
        queryKey: ["requested-documents-to-me"],
      });
      const previousMyRequestsData = queryClient.getQueriesData({
        queryKey: ["my-requested-documents"],
      });
      const previousAllRequestsData = queryClient.getQueriesData({
        queryKey: ["all-requested-documents"],
      });
      const previousDocumentData = queryClient.getQueryData<RequestedDocument>([
        "requested-document",
        documentId,
      ]);

      // Update the individual document cache immediately (like ViewDocumentSheet pattern)
      if (previousDocumentData) {
        const updatedDocument = {
          ...previousDocumentData,
          // Don't update top-level status - only requested_review.status
          requested_review: {
            ...previousDocumentData.requested_review,
            status: data.status,
          },
          // Also update requested_reviews array if it exists
          requested_reviews:
            previousDocumentData.requested_reviews?.map((review) =>
              review._id === previousDocumentData.requested_review._id
                ? { ...review, status: data.status }
                : review,
            ) || previousDocumentData.requested_reviews,
        };

        // Recalculate computed fields with user role
        const enhancedDocument = {
          ...updatedDocument,
          isOverdue: isDocumentOverdue(updatedDocument, user?.role),
          daysSinceRequest: getDaysSinceRequest(updatedDocument),
          priority: getDocumentPriority(updatedDocument, user?.role),
          formattedUploadDate: new Date(
            updatedDocument.uploaded_at,
          ).toLocaleDateString(),
          formattedRequestDate: new Date(
            updatedDocument.requested_review.requested_at,
          ).toLocaleDateString(),
        };

        queryClient.setQueryData(
          ["requested-document", documentId],
          enhancedDocument,
        );
      }

      // Optimistically update the list caches
      queryClient.setQueriesData(
        { queryKey: ["requested-documents-to-me"] },
        (old: { data: RequestedDocument[] } | undefined) => {
          if (!old?.data) return old;
          const updatedData = old.data.map((doc: RequestedDocument) => {
            if (doc._id === documentId) {
              const updatedDoc = {
                ...doc,
                // Don't update top-level status - only requested_review.status
                requested_review: {
                  ...doc.requested_review,
                  status: data.status,
                },
                // Also update requested_reviews array if it exists
                requested_reviews:
                  doc.requested_reviews?.map((review) =>
                    review._id === doc.requested_review._id
                      ? { ...review, status: data.status }
                      : review,
                  ) || doc.requested_reviews,
              };
              return {
                ...updatedDoc,
                isOverdue: isDocumentOverdue(updatedDoc, user?.role),
                daysSinceRequest: getDaysSinceRequest(updatedDoc),
                priority: getDocumentPriority(updatedDoc, user?.role),
                formattedUploadDate: new Date(
                  updatedDoc.uploaded_at,
                ).toLocaleDateString(),
                formattedRequestDate: new Date(
                  updatedDoc.requested_review.requested_at,
                ).toLocaleDateString(),
              };
            }
            return doc;
          });

          return {
            ...old,
            data: sortDocumentsByPriority(updatedData, user?.role),
          };
        },
      );

      queryClient.setQueriesData(
        { queryKey: ["my-requested-documents"] },
        (old: { data: RequestedDocument[] } | undefined) => {
          if (!old?.data) return old;
          const updatedData = old.data.map((doc: RequestedDocument) => {
            if (doc._id === documentId) {
              const updatedDoc = {
                ...doc,
                // Don't update top-level status - only requested_review.status
                requested_review: {
                  ...doc.requested_review,
                  status: data.status,
                },
              };
              return {
                ...updatedDoc,
                isOverdue: isDocumentOverdue(updatedDoc, user?.role),
                daysSinceRequest: getDaysSinceRequest(updatedDoc),
                priority: getDocumentPriority(updatedDoc, user?.role),
                formattedUploadDate: new Date(
                  updatedDoc.uploaded_at,
                ).toLocaleDateString(),
                formattedRequestDate: new Date(
                  updatedDoc.requested_review.requested_at,
                ).toLocaleDateString(),
              };
            }
            return doc;
          });

          return {
            ...old,
            data: sortDocumentsByPriority(updatedData, user?.role),
          };
        },
      );

      queryClient.setQueriesData(
        { queryKey: ["all-requested-documents"] },
        (old: { data: RequestedDocument[] } | undefined) => {
          if (!old?.data) return old;
          const updatedData = old.data.map((doc: RequestedDocument) => {
            if (doc._id === documentId) {
              const updatedDoc = {
                ...doc,
                // Don't update top-level status - only requested_review.status
                requested_review: {
                  ...doc.requested_review,
                  status: data.status,
                },
                // Also update requested_reviews array if it exists
                requested_reviews:
                  doc.requested_reviews?.map((review) =>
                    review._id === doc.requested_review._id
                      ? { ...review, status: data.status }
                      : review,
                  ) || doc.requested_reviews,
              };
              return {
                ...updatedDoc,
                isOverdue: isDocumentOverdue(updatedDoc, user?.role),
                daysSinceRequest: getDaysSinceRequest(updatedDoc),
                priority: getDocumentPriority(updatedDoc, user?.role),
                formattedUploadDate: new Date(
                  updatedDoc.uploaded_at,
                ).toLocaleDateString(),
                formattedRequestDate: new Date(
                  updatedDoc.requested_review.requested_at,
                ).toLocaleDateString(),
              };
            }
            return doc;
          });

          return {
            ...old,
            data: sortDocumentsByPriority(updatedData, user?.role),
          };
        },
      );

      // Show optimistic toast
      toast.loading(`Updating document status to ${data.status}...`, {
        id: "update-document-status",
      });

      // Return context for potential rollback
      return {
        previousToMeData,
        previousMyRequestsData,
        previousAllRequestsData,
        previousDocumentData,
      };
    },
    onSuccess: (data, variables) => {
      const { data: statusData } = variables;

      // Dismiss loading toast first
      toast.dismiss("update-document-status");

      // Show success message
      toast.success(`Document ${statusData.status} successfully!`);

      // The optimistic updates should be sufficient for real-time UI updates
      // Cache invalidation is not needed since we're updating the cache optimistically
    },
    onError: (error, variables, context) => {
      const { data: statusData } = variables;

      // Rollback optimistic updates
      if (context?.previousToMeData) {
        context.previousToMeData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousMyRequestsData) {
        context.previousMyRequestsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousAllRequestsData) {
        context.previousAllRequestsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDocumentData) {
        queryClient.setQueryData(
          ["requested-document", variables.documentId],
          context.previousDocumentData,
        );
      }

      // Dismiss loading toast
      toast.dismiss("update-document-status");

      toast.error(`Failed to ${statusData.status} document: ${error.message}`);
    },
  });
}

export function useDeleteRequestedDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      documentId,
      data,
    }: {
      documentId: string;
      data: DeleteRequestedDocumentRequest;
    }) => deleteRequestedDocument(documentId, data),
    onMutate: async ({ documentId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["requested-documents-to-me"],
      });
      await queryClient.cancelQueries({ queryKey: ["my-requested-documents"] });
      await queryClient.cancelQueries({
        queryKey: ["all-requested-documents"],
      });
      await queryClient.cancelQueries({
        queryKey: ["requested-document", documentId],
      });

      // Get current data for rollback
      const previousToMeData = queryClient.getQueriesData({
        queryKey: ["requested-documents-to-me"],
      });
      const previousMyRequestsData = queryClient.getQueriesData({
        queryKey: ["my-requested-documents"],
      });
      const previousAllRequestsData = queryClient.getQueriesData({
        queryKey: ["all-requested-documents"],
      });
      const previousDocumentData = queryClient.getQueryData<RequestedDocument>([
        "requested-document",
        documentId,
      ]);

      // Optimistically remove the document from list caches
      queryClient.setQueriesData(
        { queryKey: ["requested-documents-to-me"] },
        (old: { data: RequestedDocument[] } | undefined) => {
          if (!old?.data) return old;
          const filteredData = old.data.filter(
            (doc: RequestedDocument) => doc._id !== documentId,
          );
          return {
            ...old,
            data: sortDocumentsByPriority(filteredData, user?.role),
          };
        },
      );

      queryClient.setQueriesData(
        { queryKey: ["my-requested-documents"] },
        (old: { data: RequestedDocument[] } | undefined) => {
          if (!old?.data) return old;
          const filteredData = old.data.filter(
            (doc: RequestedDocument) => doc._id !== documentId,
          );
          return {
            ...old,
            data: sortDocumentsByPriority(filteredData, user?.role),
          };
        },
      );

      queryClient.setQueriesData(
        { queryKey: ["all-requested-documents"] },
        (old: { data: RequestedDocument[] } | undefined) => {
          if (!old?.data) return old;
          const filteredData = old.data.filter(
            (doc: RequestedDocument) => doc._id !== documentId,
          );
          return {
            ...old,
            data: sortDocumentsByPriority(filteredData, user?.role),
          };
        },
      );

      // Remove the individual document from cache
      queryClient.removeQueries({
        queryKey: ["requested-document", documentId],
      });

      // Show optimistic toast
      toast.loading("Deleting requested document...", {
        id: "delete-requested-document",
      });

      // Return context for potential rollback
      return {
        previousToMeData,
        previousMyRequestsData,
        previousAllRequestsData,
        previousDocumentData,
      };
    },
    onSuccess: async () => {
      toast.dismiss("delete-requested-document");
      toast.success("Requested document deleted successfully!");

      // Invalidate and refetch all requested document queries to ensure consistency
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["requested-documents-to-me"],
        }),
        queryClient.invalidateQueries({ queryKey: ["my-requested-documents"] }),
        queryClient.invalidateQueries({
          queryKey: ["all-requested-documents"],
        }),
      ]);

      // Force refetch to ensure UI is up to date
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["requested-documents-to-me"] }),
        queryClient.refetchQueries({ queryKey: ["my-requested-documents"] }),
        queryClient.refetchQueries({ queryKey: ["all-requested-documents"] }),
      ]);
    },
    onError: (error: Error, variables, context) => {
      const { documentId } = variables;

      // Rollback optimistic updates
      if (context?.previousToMeData) {
        context.previousToMeData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousMyRequestsData) {
        context.previousMyRequestsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousAllRequestsData) {
        context.previousAllRequestsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDocumentData) {
        queryClient.setQueryData(
          ["requested-document", documentId],
          context.previousDocumentData,
        );
      }

      // Dismiss loading toast
      toast.dismiss("delete-requested-document");

      toast.error(`Failed to delete requested document: ${error.message}`);
    },
  });
}
