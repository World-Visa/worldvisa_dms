"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSpouseApplications,
  searchSpouseApplications,
} from "@/lib/api/spouseApplications";
import { isValidSearchParams } from "@/lib/search";
import type {
  ApplicationsResponse,
  ApplicationsFilters,
  SearchParams,
} from "@/types/applications";

/**
 * Hook to fetch spouse skill assessment applications with pagination and filters
 */
export const useSpouseApplications = (filters: ApplicationsFilters) => {
  return useQuery<ApplicationsResponse>({
    queryKey: ["spouse-applications", filters],
    queryFn: () => getSpouseApplications(filters),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: "Failed to load spouse applications. Please try again.",
    },
  });
};

/**
 * Hook to search spouse applications via the same list endpoint as browsing.
 */
export const useSearchSpouseApplications = (searchParams: SearchParams) => {
  const hasValidParams = isValidSearchParams(searchParams);

  return useQuery<ApplicationsResponse>({
    queryKey: ["spouse-applications-search", searchParams],
    queryFn: () => searchSpouseApplications(searchParams),
    enabled: hasValidParams,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: "Failed to search spouse applications. Please try again.",
    },
  });
};
