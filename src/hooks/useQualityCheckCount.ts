import { useQuery } from '@tanstack/react-query';
import { getQualityCheckApplications } from '@/lib/api/qualityCheck';

interface UseQualityCheckCountOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useQualityCheckCount(options: UseQualityCheckCountOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 30000, // Refetch every 30 seconds for real-time updates
  } = options;

  return useQuery({
    queryKey: ['qualityCheckCount'],
    queryFn: async () => {
      // Fetch with minimal params to get total count from pagination
      const response = await getQualityCheckApplications({ page: 1, limit: 1 });
      return response.pagination.totalItems;
    },
    enabled,
    refetchInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export type QualityCheckCountHook = ReturnType<typeof useQualityCheckCount>;

