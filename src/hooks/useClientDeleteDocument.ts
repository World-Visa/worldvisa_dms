import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';

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
      queryClient.invalidateQueries({ queryKey: ['client-checklist'] });
      
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete document:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}
