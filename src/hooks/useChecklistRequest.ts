import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestChecklist, ChecklistRequestPayload, ChecklistRequestResponse } from '@/lib/api/checklistRequest';
import { toast } from 'sonner';

interface UseChecklistRequestOptions {
  onSuccess?: (response: ChecklistRequestResponse) => void;
  onError?: (error: Error) => void;
  leadId?: string;
}

export function useChecklistRequest(options: UseChecklistRequestOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, leadId } = options;

  const mutation = useMutation({
    mutationFn: async (payload: ChecklistRequestPayload) => {
      return await requestChecklist(payload);
    },
    onMutate: async (variables) => {
      // Optimistic update - we'll assume the request will succeed
      if (leadId) {
        // Invalidate related queries to trigger refetch
        await queryClient.invalidateQueries({
          queryKey: ['application', leadId],
        });
        await queryClient.invalidateQueries({
          queryKey: ['clientApplication', leadId],
        });
      }

      // Show optimistic toast
      toast.loading('Requesting checklist...', {
        id: 'checklist-request',
      });
    },
    onSuccess: (data, variables) => {
      // Dismiss loading toast
      toast.dismiss('checklist-request');

      // Show success message
      toast.success('Checklist requested successfully!', {
        description: 'Your document checklist will be generated shortly.',
        duration: 5000,
      });

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data);
      }

      // Invalidate and refetch application data to update the UI
      if (leadId) {
        queryClient.invalidateQueries({
          queryKey: ['application', leadId],
        });
        queryClient.invalidateQueries({
          queryKey: ['clientApplication', leadId],
        });
      }
    },
    onError: (error: Error, variables) => {
      // Dismiss loading toast
      toast.dismiss('checklist-request');

      // Show error message
      toast.error('Failed to request checklist', {
        description: error.message || 'Please try again later.',
        duration: 5000,
      });

      // Call custom error handler
      if (onError) {
        onError(error);
      }

      // Log error for debugging
      console.error('Checklist request failed:', {
        error: error.message,
        variables,
        timestamp: new Date().toISOString(),
      });
    },
    onSettled: () => {
      // Always dismiss loading toast, even if it wasn't shown
      toast.dismiss('checklist-request');
    },
  });

  const requestChecklistForApplication = async (applicationLeadId: string) => {
    if (!applicationLeadId) {
      throw new Error('Application Lead ID is required');
    }

    return mutation.mutateAsync({
      leadId: applicationLeadId,
      checklistRequested: true,
    });
  };

  return {
    requestChecklist: requestChecklistForApplication,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

export type ChecklistRequestHook = ReturnType<typeof useChecklistRequest>;
