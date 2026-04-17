"use client";

import { useQuery } from "@tanstack/react-query";
import qs from "query-string";
import { fetcher } from "@/lib/fetcher";
import {
  ApplicationsResponse,
  ApplicationsFilters,
} from "@/types/applications";
import { ZOHO_BASE_URL } from "@/lib/config/api";

export const useApplications = (filters: ApplicationsFilters) => {
  const transformedFilters = {
    ...filters,
    handledBy:
      filters.handledBy && filters.handledBy.length > 0
        ? filters.handledBy.join(",")
        : undefined,
    applicationStage:
      filters.applicationStage && filters.applicationStage.length > 0
        ? filters.applicationStage.join(",")
        : undefined,
    applicationState: filters.applicationState ?? undefined,
    deadlineCategory: filters.deadlineCategory || undefined,
    serviceType: filters.serviceType ?? undefined,
  };

  const query = qs.stringify(transformedFilters, {
    skipNull: true,
    skipEmptyString: true,
  });
  const url = `${ZOHO_BASE_URL}/visa_applications?${query}`;

  const hasActiveFilters = Boolean(
    (filters.handledBy && filters.handledBy.length > 0) ||
      (filters.applicationStage && filters.applicationStage.length > 0) ||
      filters.applicationState ||
      filters.deadlineCategory ||
      filters.serviceType,
  );

  return useQuery<ApplicationsResponse>({
    queryKey: ["applications", filters],
    queryFn: () => fetcher<ApplicationsResponse>(url),
    placeholderData: hasActiveFilters ? undefined : (prev) => prev,
    staleTime: hasActiveFilters ? 0 : 1000 * 60,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: hasActiveFilters,
  });
};
