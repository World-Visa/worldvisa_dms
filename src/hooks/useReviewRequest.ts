import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReviewRequest, createMultipleReviewRequests, ReviewRequestData } from '@/lib/api/reviewRequest';
import { sendRequestedDocumentMessage } from '@/lib/api/requestedDocumentMessages';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';

interface UseReviewRequestProps {
  onSuccess?: (documentIds: string[], requestedTo: string[]) => void;
  onError?: (error: Error, documentIds: string[]) => void;
}

interface MultipleReviewRequestData {
  documentIds: string[];
  requestedTo: string[];
  message: string;
  requestedBy: string;
}

export function useReviewRequest({ onSuccess, onError }: UseReviewRequestProps = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentIds, requestedTo, message, requestedBy }: MultipleReviewRequestData) => {
      const startTime = Date.now();
      
      try {
        // Create review requests for each document and each admin
        const requests: Array<{ documentId: string; data: ReviewRequestData }> = [];
        
        documentIds.forEach(documentId => {
          requestedTo.forEach(adminUsername => {
            requests.push({
              documentId,
              data: {
                requested_by: requestedBy,
                requested_to: adminUsername,
                status: 'pending',
                message
              }
            });
          });
        });


        const results = await createMultipleReviewRequests(requests);
        
        // Send the message separately for each review request
        const messagePromises = results.map(async (result) => {
          // Handle the case where result.data is an array of review requests
          const reviewRequests = Array.isArray(result.data) ? result.data : [result.data];
          
          for (const reviewRequest of reviewRequests) {
            if (reviewRequest && reviewRequest._id) {
              try {
                await sendRequestedDocumentMessage(
                  reviewRequest.document_id || documentIds[0],
                  reviewRequest._id,
                  { message: message }
                );
              } catch (error) {
                console.warn('Failed to send message for review request:', {
                  reviewId: reviewRequest._id,
                  documentId: reviewRequest.document_id || documentIds[0],
                  error: error
                });
              }
            }
          }
        });
        
        // Wait for all messages to be sent
        await Promise.allSettled(messagePromises);
        
        const responseTime = Date.now() - startTime;
        
        // Log performance metrics
        if (responseTime > 5000) {
          console.warn(`Slow review request batch: ${responseTime}ms for ${requests.length} requests`);
        }

        return {
          documentIds,
          requestedTo,
          results,
          totalRequests: requests.length,
          successfulRequests: results.length
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Log error to Sentry
        Sentry.captureException(error, {
          tags: {
            operation: 'create_review_requests',
            documentCount: documentIds.length,
            adminCount: requestedTo.length
          },
          extra: {
            documentIds,
            requestedTo,
            requestedBy,
            responseTime
          }
        });

        throw error;
      }
    },
    onMutate: async ({ documentIds, requestedTo }) => {
      // Cancel any outgoing refetches for these documents
      await queryClient.cancelQueries({ queryKey: ['application-documents'] });
      await queryClient.cancelQueries({ queryKey: ['application-documents-paginated'] });
      
      // Show optimistic toast
      toast.loading(`Sending review requests to ${requestedTo.length} admin${requestedTo.length !== 1 ? 's' : ''}...`, {
        id: 'review-request-loading'
      });
    },
    onSuccess: (data, variables) => {
      const { documentIds, requestedTo, successfulRequests, totalRequests } = data;
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['application-documents'] });
      queryClient.invalidateQueries({ queryKey: ['application-documents-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['application-details'] });
      
      // Dismiss loading toast
      toast.dismiss('review-request-loading');
      
      // Show success message
      if (successfulRequests === totalRequests) {
        toast.success(
          `Review requests sent successfully! ${documentIds.length} document${documentIds.length !== 1 ? 's' : ''} sent to ${requestedTo.length} admin${requestedTo.length !== 1 ? 's' : ''}.`,
          {
            duration: 5000
          }
        );
      } else {
        toast.warning(
          `Partial success: ${successfulRequests}/${totalRequests} review requests sent. Some requests may have failed.`,
          {
            duration: 7000
          }
        );
      }
      
      onSuccess?.(documentIds, requestedTo);
    },
    onError: (error, variables) => {
      const { documentIds, requestedTo } = variables;
      
      // Dismiss loading toast
      toast.dismiss('review-request-loading');
      
      // Show error message
      toast.error(
        `Failed to send review requests. Please try again.`,
        {
          description: error.message,
          duration: 7000
        }
      );
      
      onError?.(error, documentIds);
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2 && error.message.includes('network')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

/**
 * Hook for single document review request
 */
export function useSingleReviewRequest({ onSuccess, onError }: UseReviewRequestProps = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      requestedTo, 
      message, 
      requestedBy 
    }: { 
      documentId: string; 
      requestedTo: string; 
      message: string; 
      requestedBy: string; 
    }) => {
      const startTime = Date.now();
      
      try {
        const result = await createReviewRequest(documentId, {
          requested_by: requestedBy,
          requested_to: requestedTo,
          status: 'pending',
          message
        });
        
        const responseTime = Date.now() - startTime;
        
        if (responseTime > 3000) {
          console.warn(`Slow single review request: ${responseTime}ms`);
        }

        return {
          documentId,
          requestedTo,
          result
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        Sentry.captureException(error, {
          tags: {
            operation: 'create_single_review_request',
            documentId
          },
          extra: {
            documentId,
            requestedTo,
            requestedBy,
            responseTime
          }
        });

        throw error;
      }
    },
    onMutate: async ({ requestedTo }) => {
      await queryClient.cancelQueries({ queryKey: ['application-documents'] });
      
      toast.loading(`Sending review request to ${requestedTo}...`, {
        id: 'single-review-request-loading'
      });
    },
    onSuccess: (data, variables) => {
      const { documentId, requestedTo } = data;
      
      queryClient.invalidateQueries({ queryKey: ['application-documents'] });
      queryClient.invalidateQueries({ queryKey: ['application-documents-paginated'] });
      
      toast.dismiss('single-review-request-loading');
      toast.success(`Review request sent to ${requestedTo} successfully!`);
      
      onSuccess?.([documentId], [requestedTo]);
    },
    onError: (error, variables) => {
      const { documentId } = variables;
      
      toast.dismiss('single-review-request-loading');
      toast.error(`Failed to send review request. Please try again.`, {
        description: error.message
      });
      
      onError?.(error, [documentId]);
    }
  });
}
