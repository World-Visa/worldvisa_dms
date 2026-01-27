import { fetcher } from "@/lib/fetcher";
import {
  DocumentLink,
  GetDocumentLinkResponse,
  GetMovedDocsResponse,
  MovedDocument,
} from "@/types/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ZOHO_BASE_URL } from '@/lib/config/api';

/**
 * Fetches all moved documents for a given document ID.
 * Endpoint: /api/zoho_dms/visa_applications/documents/{docId}/move/all?docId={docId}
 */
export function useDocumentMovedDocs(documentId: string) {
  const query = useQuery({
    queryKey: ["document-moved-docs", documentId],
    queryFn: async (): Promise<MovedDocument[]> => {
      if (!documentId) return [];
      const MOVED_DOCS_URL = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/move/all?docId=${documentId}`;

      const response = await fetcher<GetMovedDocsResponse>(MOVED_DOCS_URL);
      // Assuming the API returns an array of moved documents or an object with a property containing them
      if (response.status === "error") {
        throw new Error(response.status || "Failed to fetch moved documents");
      }
      // Try to return response.movedDocs or response.data or just response
      if (Array.isArray(response)) {
        return response;
      }
      if (Array.isArray(response.moved_files)) {
        return response.moved_files;
      }
      if (Array.isArray(response.moved_files)) {
        return response.moved_files;
      }
      return [];
    },
    enabled: !!documentId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Fetches the public link for a document by making a POST request to
   * /documents/:resource_id/links endpoint.
   * Returns the full response and the link string.
   *
   * @param {string} documentId - The resource/document ID.
   * @returns {Promise<{ data: any; link: string | null }>}
   */
  async function getDocumentLink(documentId: string): Promise<DocumentLink> {
    if (!documentId) throw new Error("documentId is required");

    const url = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/links`;

    const response = await fetcher<GetDocumentLinkResponse>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // If you need to send a body, add it here. For now, assume no body is needed.
    });

    if (response.status === "error") {
      throw new Error(response.status || "Failed to fetch moved documents");
    }

    const documentLinks = {
      link: response.data.data.attributes.link,
      download_url: response.data.data.attributes.download_url,
      resource_id: response.data.data.attributes.resource_id,
    };

    return documentLinks;
  }

  return {
    movedDocs: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    getDocumentLink: getDocumentLink,
  };
}

/**
 * Moves a document by making a PATCH request to the move endpoint.
 *
 * @returns {object} - The mutation object from react-query.
 */
export function useMoveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<any> => {
      if (!documentId) throw new Error("documentId is required");

      const url = `${ZOHO_BASE_URL}/clients/documents/${documentId}/move`;

      return fetcher<any>(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
      queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
      queryClient.invalidateQueries({ queryKey: ["client-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["application-documents"] });
      queryClient.invalidateQueries({
        queryKey: ["application-documents-all"],
      });

      toast.success("Document deleted successfully");
    },
    onError: (error: any) => {
      console.error("Failed to deleted document:", error);
      toast.error(`Failed to deleted document: ${error.message}`);
    },
  });
}

/**
 * Moves an agent document by making a PATCH request to the agent move endpoint.
 *
 * @returns {object} - The mutation object from react-query.
 */
export function useMoveDocumentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<any> => {
      if (!documentId) throw new Error("documentId is required");

      const url = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/move`;

      return fetcher<any>(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Authorization header will be set by fetcher if needed
        },
      });
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
      queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
      queryClient.invalidateQueries({ queryKey: ["client-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["application-documents"] });
      queryClient.invalidateQueries({
        queryKey: ["application-documents-all"],
      });

      toast.success("Document deleted successfully");
    },
    onError: (error: any) => {
      console.error("Failed to delete document:", error);
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}
