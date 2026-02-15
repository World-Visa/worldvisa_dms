"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import type { DeadlineStatsData } from "@/types/deadline-stats";

export function useDeadlineStats(
  type: "visa" | "spouse",
  enabled: boolean,
  deadlineCategory?: "approaching" | "overdue" | "noDeadline" | null,
  page: number = 1,
  limit: number = 20,
) {
  // Build pagination params based on selected category
  const params = new URLSearchParams({ type });

  if (deadlineCategory === "approaching") {
    params.append("approachingPage", page.toString());
    params.append("approachingLimit", limit.toString());
  } else if (deadlineCategory === "overdue") {
    params.append("overduePage", page.toString());
    params.append("overdueLimit", limit.toString());
  } else if (deadlineCategory === "noDeadline") {
    params.append("noDeadlinePage", page.toString());
    params.append("noDeadlineLimit", limit.toString());
  }

  const url = `/api/zoho_dms/visa_applications/deadline-stats?${params.toString()}`;

  return useQuery<DeadlineStatsData>({
    queryKey: ["deadline-stats", type, deadlineCategory, page, limit],
    queryFn: async () => {
      const res = await fetcher<{ data: DeadlineStatsData }>(url);
      return res.data;
    },
    enabled: !!enabled,
    staleTime: 60 * 1000,
  });
}
