'use client';

import { useQuery } from "@tanstack/react-query";
import qs from "query-string";
import { fetcher } from "@/lib/fetcher";
import { ApplicationsResponse, ApplicationsFilters } from "@/types/applications";

export const useApplications = (filters: ApplicationsFilters) => {
  const query = qs.stringify(filters, { skipNull: true, skipEmptyString: true });
  const url = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications?${query}`;

  return useQuery<ApplicationsResponse>({
    queryKey: ["applications", filters],
    queryFn: () => fetcher<ApplicationsResponse>(url),
    placeholderData: (prev) => prev, 
    staleTime: 1000 * 60, 
    retry: 2,
  });
};
