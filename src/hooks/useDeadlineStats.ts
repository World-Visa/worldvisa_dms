'use client';

import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import type { DeadlineStatsData } from '@/types/deadline-stats';

export function useDeadlineStats(type: 'visa' | 'spouse', enabled: boolean) {
  const url = `/api/zoho_dms/visa_applications/deadline-stats?type=${type}`;

  return useQuery<DeadlineStatsData>({
    queryKey: ['deadline-stats', type],
    queryFn: async () => {
      const res = await fetcher<{ data: DeadlineStatsData }>(url);
      return res.data;
    },
    enabled: !!enabled,
    staleTime: 60 * 1000,
  });
}
