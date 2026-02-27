import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { getStoredToken } from "@/lib/auth";
import type { DashboardData } from "@/types/dashboard";

export function useDashboardStats() {
  const token = getStoredToken();

  return useQuery<DashboardData>({
    queryKey: ["dashboard-stats"],
    queryFn: () => {
      if (!token) throw new Error("No auth token available");
      return getDashboardStats(token);
    },
    enabled: !!token,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
