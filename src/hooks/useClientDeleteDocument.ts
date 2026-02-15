import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import { ZOHO_BASE_URL } from "@/lib/config/api";

interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

interface DeleteDocumentRequest {
  documentId: string;
}

export function useClientDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
    }: DeleteDocumentRequest): Promise<DeleteDocumentResponse> => {
      // Validate documentId before making the request
      if (
        !documentId ||
        typeof documentId !== "string" ||
        documentId.trim() === ""
      ) {
        throw new Error(
          "Document ID is required and must be a non-empty string",
        );
      }

      const response = await fetcher<DeleteDocumentResponse>(
        `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}`,
        {
          method: "DELETE",
        },
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch client documents
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
      queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
      queryClient.invalidateQueries({ queryKey: ["client-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["application-documents"] });
      queryClient.invalidateQueries({
        queryKey: ["application-documents-all"],
      });

      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete document:", error);
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}
