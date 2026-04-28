import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reuploadDocument,
  ReuploadDocumentRequest,
  ReuploadDocumentResponse,
} from "@/lib/api/reuploadDocument";
import { Document } from "@/types/applications";
import { ClientDocument } from "@/types/client";
import { toast } from "sonner";
import { revalidateDocumentsCache } from "@/lib/actions/cache-actions";

export function useReuploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<ReuploadDocumentResponse, Error, ReuploadDocumentRequest>({
    mutationFn: reuploadDocument,
    onSuccess: async (_data, variables) => {
      const nowIso = new Date().toISOString();

      queryClient.setQueryData<Document>(["document", variables.documentId], (old) => {
        if (!old) return old;

        return {
          ...old,
          status: "pending",
          reject_message: undefined,
          file_name: variables.file.name,
          uploaded_at: nowIso,
          history: [
            ...old.history,
            {
              _id: `temp-reupload-${Date.now()}`,
              status: "pending",
              changed_by: variables.uploaded_by,
              changed_at: nowIso,
            },
          ],
        };
      });

      // First, optimistically update the document status in the cache
      queryClient.setQueryData<{ success: boolean; data: Document[] }>(
        ["application-documents", variables.applicationId],
        (old) => {
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((doc) =>
              doc._id === variables.documentId
                ? {
                    ...doc,
                    status: "pending", // Reset to pending after reupload
                    reject_message: undefined, // Clear rejection message
                    file_name: variables.file.name, // Update filename
                    uploaded_at: nowIso, // Update upload time
                    history: [
                      ...doc.history,
                      {
                        _id: `temp-reupload-${Date.now()}`,
                        status: "pending",
                        changed_by: variables.uploaded_by,
                        changed_at: nowIso,
                      },
                    ],
                  }
                : doc,
            ),
          };
        },
      );

      // Also update client documents cache
      queryClient.setQueryData<{
        success: boolean;
        data: { documents: ClientDocument[] };
      }>(["client-documents"], (old) => {
        if (
          !old ||
          !old.data ||
          !old.data.documents ||
          !Array.isArray(old.data.documents)
        )
          return old;

        return {
          ...old,
          data: {
            ...old.data,
            documents: old.data.documents.map((doc) =>
              doc._id === variables.documentId
                ? {
                    ...doc,
                    status: "pending",
                    reject_message: undefined,
                    file_name: variables.file.name,
                    uploaded_at: nowIso,
                    history: [
                      ...doc.history,
                      {
                        _id: `temp-reupload-${Date.now()}`,
                        status: "pending",
                        changed_by: variables.uploaded_by,
                        changed_at: nowIso,
                      },
                    ],
                  }
                : doc,
            ),
          },
        };
      });

      // Invalidate all relevant queries to ensure UI updates properly
      try {
        await Promise.all([
        // Admin view queries
        queryClient.invalidateQueries({
          queryKey: ["application-documents", variables.applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "application-documents-paginated",
            variables.applicationId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application-documents"],
        }),

        // Client view queries
        queryClient.invalidateQueries({
          queryKey: ["client-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-documents-all"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application-documents-all", variables.applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-checklist", variables.applicationId],
        }),

        // Document comment counts
        queryClient.invalidateQueries({
          queryKey: ["document-comment-counts"],
        }),

        // Checklist queries
        queryClient.invalidateQueries({
          queryKey: ["checklist", variables.applicationId],
        }),
        ]);

        // Force an immediate refetch so the cache contains the new versioned `r2_key`.
        await queryClient.refetchQueries({
          queryKey: ["application-documents", variables.applicationId],
          exact: true,
        });

        const docs = queryClient.getQueryData<{ success: boolean; data: Document[] }>([
          "application-documents",
          variables.applicationId,
        ]);
        const freshDoc = docs?.data?.find((d) => d._id === variables.documentId);
        if (freshDoc) {
          queryClient.setQueryData(["document", variables.documentId], freshDoc);
        }

        await revalidateDocumentsCache(variables.applicationId);
      } catch (error) {
        console.error("Error invalidating/refetching after reupload:", error);
      }
    },
    onError: (error) => {
      toast.error(`Failed to reupload document: ${error.message}`);
    },
  });
}
