import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getRequestedDocumentsToMe, 
  getMyRequestedDocuments, 
  getAllRequestedDocuments,
  updateRequestedDocumentStatus,
  RequestedDocumentsParams, 
  RequestedDocument
} from '@/lib/api/requestedDocuments';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from './useAuth';

/**
 * Hook to fetch documents requested for review by the current user
 */
export function useRequestedDocumentsToMe(params: RequestedDocumentsParams = {}) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['requested-documents-to-me', params],
    queryFn: () => getRequestedDocumentsToMe(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    select: (data) => {
      // Transform and enhance the data with role-based calculations
      const enhancedData = data.data.map(doc => ({
        ...doc,
        // Add computed fields with user role
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        // Format dates
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(doc.uploaded_at).toLocaleDateString(), // Use uploaded_at as request date for now
      }));
      
      // Sort documents with overdue first
      const sortedData = sortDocumentsByPriority(enhancedData, user?.role);
      
      return {
        ...data,
        data: sortedData
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
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-requested-documents', params],
    queryFn: () => getMyRequestedDocuments(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    select: (data) => {
      // Transform and enhance the data with role-based calculations
      const enhancedData = data.data.map(doc => ({
        ...doc,
        // Add computed fields with user role
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        // Format dates
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(doc.uploaded_at).toLocaleDateString(), // Use uploaded_at as request date for now
      }));
      
      // Sort documents with overdue first
      const sortedData = sortDocumentsByPriority(enhancedData, user?.role);
      
      return {
        ...data,
        data: sortedData
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
      status: 'reviewed'; 
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
function isDocumentOverdue(doc: RequestedDocument, userRole?: string): boolean {
  const requestDate = new Date(doc.uploaded_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Role-based overdue thresholds
  switch (userRole) {
    case 'master_admin':
      return daysDiff > 4; // 4+ days for master_admin
    case 'team_leader':
      return daysDiff > 1; // 1+ days for team_leader
    default:
      return daysDiff > 4; // Default 4+ days for other roles
  }
}

function getDaysSinceRequest(doc: RequestedDocument): number {
  const requestDate = new Date(doc.uploaded_at);
  const now = new Date();
  return Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
}

function getDocumentPriority(doc: RequestedDocument, userRole?: string): 'high' | 'medium' | 'low' {
  const daysSinceRequest = getDaysSinceRequest(doc);
  const isOverdue = isDocumentOverdue(doc, userRole);
  
  // Overdue documents are always high priority
  if (isOverdue) return 'high';
  
  // Role-based priority thresholds
  switch (userRole) {
    case 'master_admin':
      if (daysSinceRequest > 3) return 'high';
      if (daysSinceRequest > 2) return 'medium';
      return 'low';
    case 'team_leader':
      if (daysSinceRequest > 0) return 'high';
      return 'medium';
    default:
      if (daysSinceRequest > 3) return 'high';
      if (daysSinceRequest > 2) return 'medium';
      return 'low';
  }
}

function sortDocumentsByPriority(documents: RequestedDocument[], userRole?: string): RequestedDocument[] {
  return [...documents].sort((a, b) => {
    const aOverdue = isDocumentOverdue(a, userRole);
    const bOverdue = isDocumentOverdue(b, userRole);
    
    // Overdue documents come first
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // If both are overdue or both are not overdue, sort by days since request (descending)
    const aDays = getDaysSinceRequest(a);
    const bDays = getDaysSinceRequest(b);
    
    if (aOverdue && bOverdue) {
      return bDays - aDays; // More overdue first
    }
    
    return bDays - aDays; // More recent requests first for non-overdue
  });
}

/**
 * Hook for fetching all requested documents (master admin only)
 */
export function useAllRequestedDocumentsPaginated(
  page: number = 1,
  limit: number = 10,
  filters: Omit<RequestedDocumentsParams, 'page' | 'limit'> = {}
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-requested-documents-paginated', page, limit, filters],
    queryFn: () => getAllRequestedDocuments(page, limit, filters),
    enabled: !!user && user.role === 'master_admin',
    select: (data) => {
      if (!data?.data) return data;
      
      const enhancedData = data.data.map(doc => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role)
      }));
      
      return {
        ...data,
        data: sortDocumentsByPriority(enhancedData, user?.role)
      };
    },
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      if (failureCount < 2 && error.message.includes('network')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

/**
 * Hook for fetching all requested documents without pagination (for stats)
 */
export function useAllRequestedDocuments(
  filters: Omit<RequestedDocumentsParams, 'page' | 'limit'> = {}
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-requested-documents', filters],
    queryFn: () => getAllRequestedDocuments(1, 1000, filters), // Large limit to get all data
    enabled: !!user && user.role === 'master_admin',
    select: (data) => {
      if (!data?.data) return data;
      
      const enhancedData = data.data.map(doc => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role)
      }));
      
      return {
        ...data,
        data: sortDocumentsByPriority(enhancedData, user?.role)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false
  });
}
