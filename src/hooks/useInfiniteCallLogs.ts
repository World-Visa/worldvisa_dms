"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getCallLogs } from "@/lib/api/callLogs";
import type { CallLogListFilters, CallLogListResponse } from "@/types/callLog";
import { callLogKeys } from "@/hooks/useCallLogs";

type UseInfiniteCallLogsArgs = Omit<CallLogListFilters, "page"> & {
  limit?: number;
};

export function useInfiniteCallLogs(filters: UseInfiniteCallLogsArgs) {
  const limit = filters.limit ?? 10;

  return useInfiniteQuery<CallLogListResponse>({
    queryKey: callLogKeys.list({ ...filters, page: 1, limit }),
    queryFn: ({ pageParam }) =>
      getCallLogs({
        ...filters,
        page: typeof pageParam === "number" ? pageParam : 1,
        limit,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage.pagination?.currentPage ?? 1;
      const total = lastPage.pagination?.totalPages ?? 1;
      return current < total ? current + 1 : undefined;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
  });
}

