import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getApplicationActivity,
  type ActivityFilterGroup,
} from "@/lib/api/getApplicationActivity";

export function useApplicationActivity(
  applicationId: string,
  activeFilter: ActivityFilterGroup = "all",
  limit = 20,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["application-activity", applicationId, activeFilter],
    queryFn: ({ pageParam }) =>
      getApplicationActivity({
        applicationId,
        page: pageParam as number,
        limit,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.data.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: enabled && !!applicationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
