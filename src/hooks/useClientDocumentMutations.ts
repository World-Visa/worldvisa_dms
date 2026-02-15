import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clientUploadDocument,
  ClientUploadDocumentRequest,
  ClientUploadDocumentResponse,
  clientReuploadDocument,
  ClientReuploadDocumentRequest,
  ClientReuploadDocumentResponse,
} from "@/lib/api/clientDocumentUpload";
import { ClientDocument } from "@/types/client";
import { toast } from "sonner";

export function useClientUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<
    ClientUploadDocumentResponse,
    Error,
    ClientUploadDocumentRequest
  >({
    mutationFn: clientUploadDocument,
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries to ensure UI updates properly
      Promise.all([
        // Client view queries
        queryClient.invalidateQueries({
          queryKey: ["client-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-documents-all"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-checklist", variables.clientId],
        }),

        // Application details
        queryClient.invalidateQueries({
          queryKey: ["application-details", variables.clientId],
        }),

        // Document comment counts
        queryClient.invalidateQueries({
          queryKey: ["document-comment-counts"],
        }),

        // Checklist queries
        queryClient.invalidateQueries({
          queryKey: ["checklist", variables.clientId],
        }),
      ])
        .then(() => {
          toast.success("Document uploaded successfully");
        })
        .catch((error) => {
          console.error("Error invalidating queries after upload:", error);
          toast.success("Document uploaded successfully");
        });
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
}

export function useClientReuploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<
    ClientReuploadDocumentResponse,
    Error,
    ClientReuploadDocumentRequest
  >({
    mutationFn: clientReuploadDocument,
    onSuccess: (data, variables) => {
      // First, optimistically update the document status in the cache
      queryClient.setQueryData<{ success: boolean; data: ClientDocument[] }>(
        ["client-documents", variables.clientId],
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
                    uploaded_at: new Date().toISOString(), // Update upload time
                    history: [
                      ...doc.history,
                      {
                        _id: `temp-reupload-${Date.now()}`,
                        status: "pending",
                        changed_by: variables.uploaded_by,
                        changed_at: new Date().toISOString(),
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
      }>(["client-documents-all"], (old) => {
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
                    uploaded_at: new Date().toISOString(),
                    history: [
                      ...doc.history,
                      {
                        _id: `temp-reupload-${Date.now()}`,
                        status: "pending",
                        changed_by: variables.uploaded_by,
                        changed_at: new Date().toISOString(),
                      },
                    ],
                  }
                : doc,
            ),
          },
        };
      });

      // Invalidate all relevant queries to ensure UI updates properly
      Promise.all([
        // Client view queries
        queryClient.invalidateQueries({
          queryKey: ["client-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-documents-all"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-checklist", variables.clientId],
        }),

        // Application details
        queryClient.invalidateQueries({
          queryKey: ["application-details", variables.clientId],
        }),

        // Document comment counts
        queryClient.invalidateQueries({
          queryKey: ["document-comment-counts"],
        }),

        // Checklist queries
        queryClient.invalidateQueries({
          queryKey: ["checklist", variables.clientId],
        }),
      ])
        .then(() => {
          toast.success("Document reuploaded successfully");
        })
        .catch((error) => {
          console.error("Error invalidating queries after reupload:", error);
          toast.success("Document reuploaded successfully");
        });
    },
    onError: (error: Error) => {
      toast.error(`Failed to reupload document: ${error.message}`);
    },
  });
}
