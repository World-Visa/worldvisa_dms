import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocumentStatus, UpdateDocumentStatusRequest } from '@/lib/api/updateDocumentStatus';
import { Document } from '@/types/applications';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';

interface UseDocumentStatusUpdateProps {
  applicationId?: string;
  onSuccess?: (documentId: string, newStatus: string) => void;
  onError?: (error: Error, documentId: string, newStatus: string) => void;
}

export function useDocumentStatusUpdate({ 
  applicationId,
  onSuccess, 
  onError 
}: UseDocumentStatusUpdateProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      status, 
      changedBy 
    }: { 
      documentId: string; 
      status: UpdateDocumentStatusRequest['status']; 
      changedBy: string; 
    }) => {
      const startTime = Date.now();
      
      try {
        const response = await updateDocumentStatus(documentId, {
          status,
          changed_by: changedBy
        });

        const responseTime = Date.now() - startTime;

        if (!response.success) {
          throw new Error(response.message || 'Failed to update document status');
        }

        // Track performance
        if (responseTime > 2000) {
          console.warn(`Slow status update response: ${responseTime}ms`);
        }

        return {
          documentId,
          newStatus: status,
          response: response.data
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Log error to Sentry
        Sentry.captureException(error, {
          tags: {
            operation: 'update_document_status',
            documentId,
            status
          },
          extra: {
            changedBy,
            responseTime
          }
        });

        throw error;
      }
    },

    onMutate: async ({ documentId, status }) => {
      // Cancel any outgoing refetches for this document
      await queryClient.cancelQueries({
        queryKey: ['document', documentId]
      });

      if (applicationId) {
        await queryClient.cancelQueries({
          queryKey: ['application-documents', applicationId]
        });
      }

      // Snapshot the previous values
      const previousDocument = queryClient.getQueryData<Document>(['document', documentId]);
      const previousDocumentsResponse = applicationId ? 
        queryClient.getQueryData<{ success: boolean; data: Document[] }>(['application-documents', applicationId]) : null;

      // Optimistically update the document status
      queryClient.setQueryData<Document>(['document', documentId], (old) => {
        if (!old) return old;
        
        return { 
          ...old, 
          status: status as Document['status'],
          history: [
            ...old.history,
            {
              _id: `temp-${Date.now()}`,
              status,
              changed_by: 'Current User', // Will be replaced with actual user
              changed_at: new Date().toISOString()
            }
          ]
        };
      });

      // Also update the documents list if available
      if (applicationId && previousDocumentsResponse) {
        queryClient.setQueryData<{ success: boolean; data: Document[] }>(['application-documents', applicationId], (old) => {
          if (!old || !old.data || !Array.isArray(old.data)) return old;
          
          return {
            ...old,
            data: old.data.map(doc => 
              doc._id === documentId 
                ? { 
                    ...doc, 
                    status: status as Document['status'],
                    history: [
                      ...doc.history,
                      {
                        _id: `temp-${Date.now()}`,
                        status,
                        changed_by: 'Current User',
                        changed_at: new Date().toISOString()
                      }
                    ]
                  }
                : doc
            )
          };
        });
      }

      return { previousDocument, previousDocumentsResponse, documentId, newStatus: status };
    },

    onError: (error, { documentId, status }, context) => {
      // Rollback optimistic update
      if (context?.previousDocument) {
        queryClient.setQueryData(['document', documentId], context.previousDocument);
      }

      // Also rollback documents list if available
      if (applicationId && context?.previousDocumentsResponse) {
        queryClient.setQueryData(['application-documents', applicationId], context.previousDocumentsResponse);
      }

      // Show error toast
      toast.error('Failed to update document status', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });

      // Call custom error handler
      onError?.(error as Error, documentId, status);
    },

    onSuccess: (data) => {
      // Update the document with the real server response
      queryClient.setQueryData<Document>(['document', data.documentId], (old) => {
        if (!old) return old;
        
        return { 
          ...old, 
          status: data.newStatus as Document['status'],
          history: [
            ...old.history.filter(h => !h._id.startsWith('temp-')),
            ...(data.response ? [{
              _id: data.response._id,
              status: data.response.status,
              changed_by: data.response.changed_by,
              changed_at: data.response.changed_at
            }] : [])
          ]
        };
      });

      // Also update the documents list if available
      if (applicationId) {
        queryClient.setQueryData<{ success: boolean; data: Document[] }>(['application-documents', applicationId], (old) => {
          if (!old || !old.data || !Array.isArray(old.data)) return old;
          
          return {
            ...old,
            data: old.data.map(doc => 
              doc._id === data.documentId 
                ? { 
                    ...doc, 
                    status: data.newStatus as Document['status'],
                    history: [
                      ...doc.history.filter(h => !h._id.startsWith('temp-')),
                      ...(data.response ? [{
                        _id: data.response._id,
                        status: data.response.status,
                        changed_by: data.response.changed_by,
                        changed_at: data.response.changed_at
                      }] : [])
                    ]
                  }
                : doc
            )
          };
        });
      }

      // Show success toast
      const statusMessages = {
        approved: 'Document approved successfully',
        rejected: 'Document rejected',
        reviewed: 'Document marked as reviewed',
        pending: 'Document status reset to pending',
        request_review: 'Review requested for document'
      };

      toast.success(statusMessages[data.newStatus] || 'Document status updated successfully');

      // Call custom success handler
      onSuccess?.(data.documentId, data.newStatus);
    },

    onSettled: (data, error, { documentId }) => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ['document', documentId]
      });
      
      // Also invalidate documents list queries if applicationId is provided
      if (applicationId) {
        queryClient.invalidateQueries({
          queryKey: ['application-documents', applicationId]
        });
      }
    }
  });
}
