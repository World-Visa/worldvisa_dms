import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  updateDocumentStatus, 
  UpdateDocumentStatusRequest,
  deleteRequestedDocument,
  DeleteRequestedDocumentRequest
} from '@/lib/api/requestedDocumentActions';
import { toast } from 'sonner';

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: UpdateDocumentStatusRequest }) =>
      updateDocumentStatus(documentId, data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['requested-documents-to-me'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['requested-documents-my-requests'] 
      });
      
      toast.success('Document status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update document status: ${error.message}`);
    },
  });
}

export function useDeleteRequestedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: DeleteRequestedDocumentRequest }) =>
      deleteRequestedDocument(documentId, data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['requested-documents-to-me'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['requested-documents-my-requests'] 
      });
      
      toast.success('Requested document deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete requested document: ${error.message}`);
    },
  });
}
