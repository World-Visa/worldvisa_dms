import { useQuery } from '@tanstack/react-query';
import { getClerkToken } from '@/lib/getToken';
import { getAnalyticsDashboardData } from '@/lib/actions/analytics-actions';
import type { AnalyticsDashboardData } from '@/types/analytics';

export function useAnalyticsData(period = 30) {
  return useQuery<AnalyticsDashboardData>({
    queryKey: ['analytics-dashboard', period],
    queryFn: async () => {
      const token = await getClerkToken();
      if (!token) throw new Error('No auth token available');
      return getAnalyticsDashboardData(token, period);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
