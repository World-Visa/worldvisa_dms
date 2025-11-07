import { useQueryClient } from '@tanstack/react-query';
import { Document } from '@/types/applications';
import { ClientDocumentsResponse } from '@/types/client';

interface UseClientDocumentHandlersProps {
  applicationId: string;
  documentsData?: ClientDocumentsResponse;
}

/**
 * Hook to manage document-related handlers and operations
 * Handles reupload, upload success, delete success, and refresh operations
 */
export function useClientDocumentHandlers({
  applicationId,
  documentsData,
}: UseClientDocumentHandlersProps) {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    try {
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-application"] }),
        queryClient.invalidateQueries({ queryKey: ["client-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["client-documents-all"] }),
        queryClient.invalidateQueries({
          queryKey: ["client-checklist", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["document-comment-counts"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["stage2-documents", applicationId],
        }),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleDeleteSuccess = () => {
    // Just invalidate queries to refresh the data without page reload
    queryClient.invalidateQueries({ queryKey: ["client-documents"] });
    queryClient.invalidateQueries({ queryKey: ["client-checklist"] });
  };

  const handleUploadSuccess = () => {
    // Invalidate all relevant queries to ensure UI updates
    queryClient.invalidateQueries({ queryKey: ["client-documents"] });
    queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
    queryClient.invalidateQueries({
      queryKey: ["client-checklist", applicationId],
    });
  };

  const handleReuploadDocument = (
    documentId: string,
    documentType: string,
    category: string
  ): { document: Document | null; documentType: string; category: string } | null => {
    // Find the document to reupload
    const documentToReupload = documentsData?.data?.documents?.find(
      (doc) => doc._id === documentId
    );
    if (!documentToReupload) {
      console.error("Document not found for reupload:", documentId);
      return null;
    }

    return {
      document: documentToReupload as unknown as Document,
      documentType,
      category,
    };
  };

  return {
    handleRefresh,
    handleDeleteSuccess,
    handleUploadSuccess,
    handleReuploadDocument,
  };
}


