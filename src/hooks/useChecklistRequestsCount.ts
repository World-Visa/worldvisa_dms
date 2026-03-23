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
    refetchInterval = 30000,
  } = options;

  return useQuery({
    queryKey: ["checklistRequestsCount"],
    queryFn: async () => {
      const response = await getChecklistRequests({ page: 1, limit: 100 });
      const validRequests = response.data.filter(
        (req) =>
          req.id && req.id.trim() !== "" && req.Checklist_Requested === true,
      );
      return validRequests.length;
    },
    enabled,
    refetchInterval,
    staleTime: 10000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("4")) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
