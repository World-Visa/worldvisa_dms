import { useQuery } from '@tanstack/react-query';
import { getChecklistRequests, ChecklistRequestsParams, ChecklistRequestsResponse } from '@/lib/api/checklistRequests';

interface UseChecklistRequestsOptions extends ChecklistRequestsParams {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

export function useChecklistRequests(options: UseChecklistRequestsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval,
  } = options;

  const params: ChecklistRequestsParams = {
    page,
    limit,
  };

  return useQuery({
    queryKey: ['checklistRequests', params],
    queryFn: () => getChecklistRequests(params),
    enabled,
    staleTime,
    refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export type ChecklistRequestsHook = ReturnType<typeof useChecklistRequests>;
