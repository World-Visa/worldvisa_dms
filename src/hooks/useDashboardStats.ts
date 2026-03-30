import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { getClerkToken } from "@/lib/getToken";
import type { DashboardData } from "@/types/dashboard";

export function useDashboardStats() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const token = await getClerkToken();
      if (!token) throw new Error("No auth token available");
      return getDashboardStats(token);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
