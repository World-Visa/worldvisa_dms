import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clientUploadDocument,
  ClientUploadDocumentRequest,
  ClientUploadDocumentResponse,
  clientReuploadDocument,
  ClientReuploadDocumentRequest,
  ClientReuploadDocumentResponse,
} from "@/lib/api/clientDocumentUpload";
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
    onSuccess: (_data, variables) => {
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
    onSuccess: async (_data, variables) => {
      // Invalidate all relevant queries to ensure UI updates properly
      try {
        await Promise.all([
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
        ]);

        // Force immediate refetch so UI sees updated doc metadata quickly.
        await queryClient.refetchQueries({ queryKey: ["client-documents"], exact: true });

        toast.success("Document reuploaded successfully");
      } catch (error) {
        console.error("Error invalidating/refetching after reupload:", error);
        toast.success("Document reuploaded successfully");
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to reupload document: ${error.message}`);
    },
  });
}
