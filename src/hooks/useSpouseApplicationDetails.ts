'use client';

import { useQuery } from "@tanstack/react-query";
import { getSpouseApplicationById } from "@/lib/api/spouseApplications";
import { ApplicationDetailsResponse } from "@/types/applications";

/**
 * Hook to fetch spouse application details by ID
 */
export const useSpouseApplicationDetails = (id: string, queryId?: string) => {
  return useQuery<ApplicationDetailsResponse>({
    queryKey: ["spouse-application-details", id, queryId],
    queryFn: () => getSpouseApplicationById(id, queryId),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: 'Failed to load spouse application details. Please try again.'
    }
  });
};
