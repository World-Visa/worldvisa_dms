'use client';

import { useQuery } from "@tanstack/react-query";
import { getSpouseApplicationById } from "@/lib/api/spouseApplications";
import { ApplicationDetailsResponse } from "@/types/applications";

export const useSpouseApplicationDetails = (id: string, queryId?: string) => {
  return useQuery<ApplicationDetailsResponse>({
    queryKey: ["spouse-application-details", id, queryId],
    queryFn: () => getSpouseApplicationById(id, queryId),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, 
    gcTime: 30 * 60 * 1000, 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    meta: {
      errorMessage: 'Failed to load spouse application details. Please try again.'
    }
  });
};
