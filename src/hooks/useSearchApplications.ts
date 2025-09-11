'use client';

import { useQuery } from '@tanstack/react-query';
import { searchApplications, isValidSearchParams } from '@/lib/search';
import { SearchParams } from '@/types/applications';

export const useSearchApplications = (searchParams: SearchParams) => {
  const hasValidParams = isValidSearchParams(searchParams);
  
  return useQuery({
    queryKey: ['search-applications', searchParams],
    queryFn: () => searchApplications(searchParams),
    enabled: hasValidParams, // Only run query if we have valid search parameters
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
