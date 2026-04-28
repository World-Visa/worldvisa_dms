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
import { Document } from "@/types/applications";
import { toast } from "sonner";
import { showSuccessToast } from "@/components/ui/primitives/sonner-helpers";

export function useClientUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<
    ClientUploadDocumentResponse,
    Error,
    ClientUploadDocumentRequest
  >({
    mutationFn: clientUploadDocument,
    onSuccess: (data, variables) => {
      const maybeUploaded = data?.data ?? [];
      for (const uploaded of maybeUploaded) {
        queryClient.setQueryData<Document>(["document", uploaded.id], (old) => {
          if (!old) return old;

          return {
            ...old,
            file_name: uploaded.name ?? old.file_name,
            uploaded_at: uploaded.uploaded_at ?? old.uploaded_at,
          };
        });
      }

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
          showSuccessToast("Document uploaded successfully");
        })
        .catch((error) => {
          console.error("Error invalidating queries after upload:", error);
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
    onSuccess: (_data, variables) => {
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
