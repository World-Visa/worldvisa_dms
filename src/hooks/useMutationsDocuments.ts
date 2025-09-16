import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDocument, AddDocumentRequest } from '@/lib/api/addDocument';
import { deleteDocument } from '@/lib/api/deleteDocument';
import { toast } from 'sonner';

export function useAddDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddDocumentRequest) => addDocument(data),
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries to ensure UI updates properly
      Promise.all([
        // Admin view queries
        queryClient.invalidateQueries({
          queryKey: ['application-documents', variables.applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['application-documents-paginated', variables.applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['application-documents'],
        }),
        
        // Client view queries
        queryClient.invalidateQueries({
          queryKey: ['client-documents'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['client-checklist', variables.applicationId],
        }),
        
        // Application details
        queryClient.invalidateQueries({
          queryKey: ['application-details', variables.applicationId],
        }),
        
        // Document comment counts
        queryClient.invalidateQueries({
          queryKey: ['document-comment-counts'],
        }),
        
        // Checklist queries
        queryClient.invalidateQueries({
          queryKey: ['checklist', variables.applicationId],
        }),
      ]).then(() => {
        toast.success('Document uploaded successfully');
      }).catch((error) => {
        console.error('Error invalidating queries after upload:', error);
        toast.success('Document uploaded successfully');
      });
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
      // Invalidate all relevant queries to ensure UI updates properly
      Promise.all([
        // Admin view queries
        queryClient.invalidateQueries({
          queryKey: ['application-documents'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['application-documents-paginated'],
        }),
        
        // Client view queries
        queryClient.invalidateQueries({
          queryKey: ['client-documents'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['client-checklist'],
        }),
        
        // Application details
        queryClient.invalidateQueries({
          queryKey: ['application-details'],
        }),
        
        // Document comment counts
        queryClient.invalidateQueries({
          queryKey: ['document-comment-counts'],
        }),
        
        // Checklist queries
        queryClient.invalidateQueries({
          queryKey: ['checklist'],
        }),
      ]).then(() => {
        toast.success('Document deleted successfully');
      }).catch((error) => {
        console.error('Error invalidating queries after deletion:', error);
        toast.success('Document deleted successfully');
      });
    },
    onError: (error: Error) => {
      console.error('Delete document error:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}
