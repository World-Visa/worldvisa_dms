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
import { showErrorToast, showSuccessToast } from "@/components/ui/primitives/sonner-helpers";

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

      if (previousDocumentData) {
        const updatedDocument = {
          ...previousDocumentData,
          requested_review: {
            ...previousDocumentData.requested_review,
            status: data.status,
          },
          requested_reviews:
            previousDocumentData.requested_reviews?.map((review) =>
              review._id === previousDocumentData.requested_review._id
                ? { ...review, status: data.status }
                : review,
            ) || previousDocumentData.requested_reviews,
        };

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

      queryClient.setQueriesData(
        { queryKey: ["requested-documents-to-me"] },
        (old: { data: RequestedDocument[] } | undefined) => {
          if (!old?.data) return old;
          const updatedData = old.data.map((doc: RequestedDocument) => {
            if (doc._id === documentId) {
              const updatedDoc = {
                ...doc,
                requested_review: {
                  ...doc.requested_review,
                  status: data.status,
                },
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
                requested_review: {
                  ...doc.requested_review,
                  status: data.status,
                },
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

      toast.loading(`Updating document status to ${data.status}...`, {
        id: "update-document-status",
      });

      return {
        previousToMeData,
        previousMyRequestsData,
        previousAllRequestsData,
        previousDocumentData,
      };
    },
    onSuccess: (data, variables) => {
      const { data: statusData } = variables;
      toast.dismiss("update-document-status");
      showSuccessToast(`Document ${statusData.status} successfully!`);
    },
    onError: (error, variables, context) => {
      const { data: statusData } = variables;

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

      toast.dismiss("update-document-status");

      showErrorToast(`Failed to ${statusData.status} document`, error.message);
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
    }) =>
      deleteRequestedDocument(documentId, {
        ...data,
        username: data.username ?? user?.username,
        role: data.role ?? user?.role,
      }),
    onMutate: async ({ documentId }) => {
      const listQueryPrefixes: Array<readonly unknown[]> = [
        ["requested-documents-to-me"],
        ["my-requested-documents"],
        ["all-requested-documents"],
        ["all-requested-documents-paginated"],
        ["requested-documents-search"],
      ];

      await Promise.all([
        ...listQueryPrefixes.map((queryKey) =>
          queryClient.cancelQueries({ queryKey, exact: false }),
        ),
        queryClient.cancelQueries({
          queryKey: ["requested-document", documentId],
        }),
      ]);

      const previousListData = listQueryPrefixes.flatMap((queryKey) =>
        queryClient.getQueriesData({ queryKey, exact: false }),
      );
      const previousDocumentData = queryClient.getQueryData<RequestedDocument>([
        "requested-document",
        documentId,
      ]);

      const removeFromListCache = <T,>(old: T): T => {
        if (!old || typeof old !== "object") return old;
        if (!("data" in old)) return old;

        const oldAny = old as { data?: unknown };
        if (!Array.isArray(oldAny.data)) return old;

        const nextData = (oldAny.data as RequestedDocument[]).filter(
          (doc) => doc?._id !== documentId,
        );
        if (nextData.length === (oldAny.data as unknown[]).length) return old;

        return { ...(old as object), data: nextData } as T;
      };

      listQueryPrefixes.forEach((queryKey) => {
        queryClient.setQueriesData(
          { queryKey, exact: false },
          removeFromListCache,
        );
      });

      queryClient.removeQueries({
        queryKey: ["requested-document", documentId],
      });

      toast.loading("Deleting requested document...", {
        id: `delete-requested-document:${documentId}`,
      });

      return { previousListData, previousDocumentData };
    },
    onSuccess: (_data, variables) => {
      toast.dismiss(`delete-requested-document:${variables.documentId}`);
      showSuccessToast("Requested document deleted successfully!");
    },
    onError: (error: Error, variables, context) => {
      const toastId = `delete-requested-document:${variables.documentId}`;

      if (context?.previousListData) {
        context.previousListData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDocumentData) {
        queryClient.setQueryData(
          ["requested-document", variables.documentId],
          context.previousDocumentData,
        );
      }

      toast.dismiss(toastId);
      showErrorToast(`Failed to delete requested document`, error.message);
    },
    onSettled: (_data, _error, variables) => {
      const listQueryPrefixes: Array<readonly unknown[]> = [
        ["requested-documents-to-me"],
        ["my-requested-documents"],
        ["all-requested-documents"],
        ["all-requested-documents-paginated"],
        ["requested-documents-search"],
      ];

      listQueryPrefixes.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey, exact: false });
      });

      queryClient.invalidateQueries({
        queryKey: ["requested-document", variables.documentId],
      });
    },
  });
}
