import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';

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
    mutationFn: async ({ documentId }: DeleteDocumentRequest): Promise<DeleteDocumentResponse> => {
      const response = await fetcher<DeleteDocumentResponse>(`/api/zoho_dms/visa_applications/documents/${documentId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch client documents
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
    },
    onError: (error) => {
      console.error('Failed to delete document:', error);
    },
  });
}
