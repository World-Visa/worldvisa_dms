import { useQuery } from "@tanstack/react-query";
import { getChecklistRequests } from "@/lib/api/checklistRequests";

interface UseChecklistRequestsCountOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useChecklistRequestsCount(
  options: UseChecklistRequestsCountOptions = {},
) {
  const {
    enabled = true,
    refetchInterval = 30000, // Refetch every 30 seconds for real-time updates
  } = options;

  return useQuery({
    queryKey: ["checklistRequestsCount"],
    queryFn: async () => {
      // Fetch a reasonable amount of data to count valid records
      const response = await getChecklistRequests({ page: 1, limit: 100 });
      // Filter out empty or invalid records and count only valid ones
      const validRequests = response.data.filter(
        (req) =>
          req.id && req.id.trim() !== "" && req.Checklist_Requested === true,
      );
      return validRequests.length;
    },
    enabled,
    refetchInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes("4")) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export type ChecklistRequestsCountHook = ReturnType<
  typeof useChecklistRequestsCount
>;
