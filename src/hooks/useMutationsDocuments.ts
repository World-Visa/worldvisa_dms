import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDocument, AddDocumentRequest } from '@/lib/api/addDocument';
import { deleteDocument } from '@/lib/api/deleteDocument';
import { toast } from 'sonner';

export function useAddDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddDocumentRequest) => addDocument(data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch documents for this application
      queryClient.invalidateQueries({
        queryKey: ['application-documents', variables.applicationId],
      });
      
      // Also invalidate paginated documents queries
      queryClient.invalidateQueries({
        queryKey: ['application-documents-paginated', variables.applicationId],
      });
      
      // Invalidate application details to refresh document counts
      queryClient.invalidateQueries({
        queryKey: ['application-details', variables.applicationId],
      });
      
      // Force refetch the documents immediately
      queryClient.refetchQueries({
        queryKey: ['application-documents', variables.applicationId],
      });
      
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      // Invalidate all application documents queries
      queryClient.invalidateQueries({
        queryKey: ['application-documents'],
      });
      // Also invalidate paginated documents queries
      queryClient.invalidateQueries({
        queryKey: ['application-documents-paginated'],
      });
      // Invalidate application details to refresh document counts
      queryClient.invalidateQueries({
        queryKey: ['application-details'],
      });
      
      // Force refetch all application documents to ensure immediate update
      queryClient.refetchQueries({
        queryKey: ['application-documents'],
      });
      
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Delete document error:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}
