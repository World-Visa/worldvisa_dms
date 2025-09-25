'use client';

import { useQuery } from "@tanstack/react-query";
import { getSpouseApplications, searchSpouseApplications } from "@/lib/api/spouseApplications";
import { ApplicationsResponse, ApplicationsFilters } from "@/types/applications";

/**
 * Hook to fetch spouse skill assessment applications with pagination and filters
 */
export const useSpouseApplications = (filters: ApplicationsFilters) => {
  // Disable cache for recent activities to ensure real-time data
  const isRecentActivity = filters.recentActivity === true;

  return useQuery<ApplicationsResponse>({
    queryKey: ["spouse-applications", filters],
    queryFn: () => getSpouseApplications(filters),
    placeholderData: isRecentActivity ? undefined : (prev) => prev,
    staleTime: isRecentActivity ? 0 : 1000 * 60, // No cache for recent activities
    gcTime: isRecentActivity ? 0 : 5 * 60 * 1000, // No garbage collection time for recent activities
    retry: 2,
    refetchOnWindowFocus: isRecentActivity, // Refetch on focus for recent activities
    meta: {
      errorMessage: 'Failed to load spouse applications. Please try again.'
    }
  });
};

/**
 * Hook to search spouse applications by name, phone, or email
 */
export const useSearchSpouseApplications = (searchParams: { name?: string; phone?: string; email?: string }) => {
  return useQuery<ApplicationsResponse>({
    queryKey: ["spouse-applications-search", searchParams],
    queryFn: () => searchSpouseApplications(searchParams),
    enabled: !!(searchParams.name || searchParams.phone || searchParams.email),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: 'Failed to search spouse applications. Please try again.'
    }
  });
};
