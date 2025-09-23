import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pushForQualityCheck } from '@/lib/api/qualityCheck';
import { QualityCheckRequest } from '@/types/common';
import { toast } from 'sonner';

interface UseQualityCheckOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Optimized hook for quality check operations
 * Handles mutation, cache invalidation, and user feedback
 */
export function useQualityCheck(options: UseQualityCheckOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, page = 1, limit = 10 }: { 
      data: QualityCheckRequest; 
      page?: number; 
      limit?: number; 
    }) => {
      try {
        const response = await pushForQualityCheck(data, page, limit);
        return response;
      } catch (error) {
        console.error('Quality check API error:', error);
        throw error;
      }
    },
    
    onSuccess: (response) => {
      try {
        
        // Check for success response
        if (response.success === true) {
          toast.success(response.message || 'Application pushed for quality check successfully!');
          
          // Invalidate relevant queries for real-time updates
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          queryClient.invalidateQueries({ queryKey: ['application-details'] });
          
          options.onSuccess?.();
        } else {
          const errorMessage = response.message || 'Failed to push for quality check';
          toast.error(errorMessage);
          options.onError?.(new Error(errorMessage));
        }
      } catch (error) {
        console.error('Error in quality check onSuccess handler:', error);
        toast.error('An unexpected error occurred while processing the quality check response');
        options.onError?.(error as Error);
      }
    },
    
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to push for quality check';
      toast.error(errorMessage);
      options.onError?.(error);
    },
    
    // Optimistic updates configuration
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
}
