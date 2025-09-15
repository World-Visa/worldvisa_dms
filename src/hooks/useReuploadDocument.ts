import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reuploadDocument, ReuploadDocumentRequest, ReuploadDocumentResponse } from '@/lib/api/reuploadDocument';
import { toast } from 'sonner';

export function useReuploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<ReuploadDocumentResponse, Error, ReuploadDocumentRequest>({
    mutationFn: reuploadDocument,
    onSuccess: (data, variables) => {
      // Invalidate and refetch documents for this application
      queryClient.invalidateQueries({ 
        queryKey: ['application-documents', variables.applicationId] 
      });
      
      // Also invalidate client documents if applicable
      queryClient.invalidateQueries({ 
        queryKey: ['client-documents'] 
      });
      
      // Invalidate application documents for admin view
      queryClient.invalidateQueries({ 
        queryKey: ['application-documents'] 
      });
      
      toast.success('Document reuploaded successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to reupload document: ${error.message}`);
    },
  });
}
