import { fetcher } from "@/lib/fetcher";
import { fetchDocumentLink } from "@/lib/api/documentLinks";
import type { GetMovedDocsResponse, MovedDocument } from "@/types/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_ENDPOINTS, getFullUrl } from "@/lib/config/api";

export const MOVED_DOCS_KEYS = {
  all: ["document-moved-docs"] as const,
  byDocument: (documentId: string) =>
    [...MOVED_DOCS_KEYS.all, documentId] as const,
};

function parseMovedDocs(
  response: GetMovedDocsResponse | MovedDocument[],
): MovedDocument[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response.status === "error") {
    throw new Error("Failed to fetch moved documents");
  }
  if (Array.isArray(response.moved_files)) {
    return response.moved_files;
  }
  return [];
}

export function useDocumentMovedDocs(documentId: string) {
  const query = useQuery({
    queryKey: MOVED_DOCS_KEYS.byDocument(documentId),
    queryFn: async (): Promise<MovedDocument[]> => {
      if (!documentId) return [];

      const response = await fetcher<GetMovedDocsResponse | MovedDocument[]>(
        getFullUrl(API_ENDPOINTS.VISA_APPLICATIONS.DOCUMENTS.MOVED_ALL(documentId), {
          docId: documentId,
        }),
      );

      return parseMovedDocs(response);
    },
    enabled: !!documentId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    movedDocs: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useDocumentLink() {
  return useMutation({
    mutationFn: fetchDocumentLink,
    onError: (error: Error) => {
      toast.error(error.message || "Failed to open file");
    },
  });
}

export function useMoveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      if (!documentId) throw new Error("documentId is required");

      return fetcher(API_ENDPOINTS.CLIENTS.DOCUMENT_MOVE(documentId), {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
      queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
      queryClient.invalidateQueries({ queryKey: ["client-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["application-documents"] });
      queryClient.invalidateQueries({
        queryKey: ["application-documents-all"],
      });
      queryClient.invalidateQueries({ queryKey: MOVED_DOCS_KEYS.all });

      toast.success("Document deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}

export function useMoveDocumentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      if (!documentId) throw new Error("documentId is required");

      return fetcher(API_ENDPOINTS.VISA_APPLICATIONS.DOCUMENTS.MOVE(documentId), {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
      queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
      queryClient.invalidateQueries({ queryKey: ["client-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["application-documents"] });
      queryClient.invalidateQueries({
        queryKey: ["application-documents-all"],
      });
      queryClient.invalidateQueries({ queryKey: MOVED_DOCS_KEYS.all });

      toast.success("Document deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}
