import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getRequestedDocumentMessages,
  sendRequestedDocumentMessage,
  deleteRequestedDocumentMessage,
  SendMessageRequest,
  DeleteMessageRequest
} from '@/lib/api/requestedDocumentMessages';
import { toast } from 'sonner';

/**
 * Hook to fetch messages for a requested document review
 */
export function useRequestedDocumentMessages(documentId: string, reviewId: string) {
  return useQuery({
    queryKey: ['requested-document-messages', documentId, reviewId],
    queryFn: () => getRequestedDocumentMessages(documentId, reviewId),
    enabled: !!documentId && !!reviewId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    select: (data) => {
      // Return data as-is since there's no timestamp to sort by
      return data;
    },
    meta: {
      errorMessage: 'Failed to load messages. Please try again.'
    }
  });
}

/**
 * Hook to send a message for a requested document review
 */
export function useSendRequestedDocumentMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      documentId, 
      reviewId, 
      data 
    }: { 
      documentId: string; 
      reviewId: string; 
      data: SendMessageRequest 
    }) => sendRequestedDocumentMessage(documentId, reviewId, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ 
        queryKey: ['requested-document-messages', variables.documentId, variables.reviewId] 
      });
      
      toast.success('Message sent successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to send message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a message from a requested document review
 */
export function useDeleteRequestedDocumentMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      documentId, 
      reviewId, 
      data 
    }: { 
      documentId: string; 
      reviewId: string; 
      data: DeleteMessageRequest 
    }) => deleteRequestedDocumentMessage(documentId, reviewId, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ 
        queryKey: ['requested-document-messages', variables.documentId, variables.reviewId] 
      });
      
      toast.success('Message deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to delete message:', error);
      toast.error(`Failed to delete message: ${error.message}`);
    },
  });
}
