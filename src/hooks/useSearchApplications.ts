"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApplications, isValidSearchParams } from "@/lib/search";
import type { ApplicationsResponse, SearchParams } from "@/types/applications";

export const useSearchApplications = (searchParams: SearchParams) => {
  const hasValidParams = isValidSearchParams(searchParams);

  return useQuery<ApplicationsResponse>({
    queryKey: ["search-applications", searchParams],
    queryFn: () => searchApplications(searchParams),
    enabled: hasValidParams,
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
