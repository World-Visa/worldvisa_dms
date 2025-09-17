import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getRequestedDocumentsToMe, 
  getMyRequestedDocuments, 
  updateRequestedDocumentStatus,
  RequestedDocumentsParams, 
  RequestedDocument
} from '@/lib/api/requestedDocuments';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';

/**
 * Hook to fetch documents requested for review by the current user
 */
export function useRequestedDocumentsToMe(params: RequestedDocumentsParams = {}) {
  return useQuery({
    queryKey: ['requested-documents-to-me', params],
    queryFn: () => getRequestedDocumentsToMe(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    select: (data) => {
      // Transform and enhance the data
      return {
        ...data,
        data: data.data.map(doc => ({
          ...doc,
          // Add computed fields
          isOverdue: isDocumentOverdue(doc),
          daysSinceRequest: getDaysSinceRequest(doc),
          priority: getDocumentPriority(doc),
          // Format dates
          formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
          formattedRequestDate: new Date(doc.uploaded_at).toLocaleDateString(), // Use uploaded_at as request date for now
        }))
      };
    },
    meta: {
      errorMessage: 'Failed to load requested documents. Please try again.'
    }
  });
}

/**
 * Hook to fetch documents requested for review by the current user with pagination
 */
export function useRequestedDocumentsToMePaginated(
  page: number = 1,
  limit: number = 10,
  filters: Omit<RequestedDocumentsParams, 'page' | 'limit'> = {}
) {
  const params: RequestedDocumentsParams = {
    page,
    limit,
    ...filters
  };

  return useRequestedDocumentsToMe(params);
}

/**
 * Hook to fetch documents that the current user has requested for review
 */
export function useMyRequestedDocuments(params: RequestedDocumentsParams = {}) {
  return useQuery({
    queryKey: ['my-requested-documents', params],
    queryFn: () => getMyRequestedDocuments(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    select: (data) => {
      // Transform and enhance the data
      return {
        ...data,
        data: data.data.map(doc => ({
          ...doc,
          // Add computed fields
          isOverdue: isDocumentOverdue(doc),
          daysSinceRequest: getDaysSinceRequest(doc),
          priority: getDocumentPriority(doc),
          // Format dates
          formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
          formattedRequestDate: new Date(doc.uploaded_at).toLocaleDateString(), // Use uploaded_at as request date for now
        }))
      };
    },
    meta: {
      errorMessage: 'Failed to load my requested documents. Please try again.'
    }
  });
}

/**
 * Hook to fetch documents that the current user has requested for review with pagination
 */
export function useMyRequestedDocumentsPaginated(
  page: number = 1,
  limit: number = 10,
  filters: Omit<RequestedDocumentsParams, 'page' | 'limit'> = {}
) {
  const params: RequestedDocumentsParams = {
    page,
    limit,
    ...filters
  };

  return useMyRequestedDocuments(params);
}

/**
 * Hook to update the status of a requested document
 */
export function useUpdateRequestedDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      status, 
      message 
    }: { 
      documentId: string; 
      status: 'approved' | 'rejected'; 
      message?: string; 
    }) => {
      const startTime = Date.now();
      
      try {
        const result = await updateRequestedDocumentStatus(documentId, status, message);
        
        const responseTime = Date.now() - startTime;
        
        if (responseTime > 3000) {
          console.warn(`Slow status update: ${responseTime}ms`);
        }

        return {
          documentId,
          status,
          message,
          result
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        Sentry.captureException(error, {
          tags: {
            operation: 'update_requested_document_status',
            documentId
          },
          extra: {
            documentId,
            status,
            message,
            responseTime
          }
        });

        throw error;
      }
    },
    onMutate: async ({ status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requested-documents-to-me'] });
      await queryClient.cancelQueries({ queryKey: ['my-requested-documents'] });
      
      // Show optimistic toast
      toast.loading(`Updating document status to ${status}...`, {
        id: 'update-document-status'
      });
    },
    onSuccess: (data) => {
      const { status } = data;
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['requested-documents-to-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-requested-documents'] });
      queryClient.invalidateQueries({ queryKey: ['application-documents'] });
      
      // Dismiss loading toast
      toast.dismiss('update-document-status');
      
      // Show success message
      toast.success(`Document ${status} successfully!`, {
        duration: 3000
      });
    },
    onError: (error, variables) => {
      const { status } = variables;
      
      // Dismiss loading toast
      toast.dismiss('update-document-status');
      
      // Show error message
      toast.error(`Failed to ${status} document. Please try again.`, {
        description: error.message,
        duration: 5000
      });
    }
  });
}

// Helper functions
function isDocumentOverdue(doc: RequestedDocument): boolean {
  const requestDate = new Date(doc.uploaded_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 4; // Consider overdue after 4 days
}

function getDaysSinceRequest(doc: RequestedDocument): number {
  const requestDate = new Date(doc.uploaded_at);
  const now = new Date();
  return Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
}

function getDocumentPriority(doc: RequestedDocument): 'high' | 'medium' | 'low' {
  const daysSinceRequest = getDaysSinceRequest(doc);
  
  if (daysSinceRequest > 5) return 'high';
  if (daysSinceRequest > 2) return 'medium';
  return 'low';
}
