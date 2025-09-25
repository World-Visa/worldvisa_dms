'use client';

import { useQuery } from "@tanstack/react-query";
import qs from "query-string";
import { fetcher } from "@/lib/fetcher";
import { ApplicationsResponse, ApplicationsFilters } from "@/types/applications";

export const useApplications = (filters: ApplicationsFilters) => {
  const query = qs.stringify(filters, { skipNull: true, skipEmptyString: true });
  const url = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications?${query}`;

  // Disable cache for recent activities to ensure real-time data
  const isRecentActivity = filters.recentActivity === true;

  return useQuery<ApplicationsResponse>({
    queryKey: ["applications", filters],
    queryFn: () => fetcher<ApplicationsResponse>(url),
    placeholderData: isRecentActivity ? undefined : (prev) => prev, 
    staleTime: isRecentActivity ? 0 : 1000 * 60, // No cache for recent activities
    gcTime: isRecentActivity ? 0 : 5 * 60 * 1000, // No garbage collection time for recent activities
    retry: 2,
    refetchOnWindowFocus: isRecentActivity, // Refetch on focus for recent activities
  });
};
