import { useQuery } from "@tanstack/react-query";
import {
  getQualityCheckApplications,
  searchQualityCheckApplications,
  type QualityCheckParams,
  type QualityCheckApplication,
} from "@/lib/api/qualityCheck";

// Hook for fetching paginated quality check applications
export function useQualityCheckApplications(params: QualityCheckParams = {}) {
  return useQuery({
    queryKey: ["quality-check-applications", params],
    queryFn: () => getQualityCheckApplications(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for searching quality check applications
export function useSearchQualityCheckApplications(
  searchParams: Record<string, string>,
) {
  return useQuery({
    queryKey: ["quality-check-search", searchParams],
    queryFn: () => searchQualityCheckApplications(searchParams),
    enabled:
      Object.keys(searchParams).length > 0 &&
      Object.values(searchParams).some((value) => value.trim() !== ""),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting all quality check applications (for stats)
export function useAllQualityCheckApplications() {
  return useQuery({
    queryKey: ["quality-check-applications-all"],
    queryFn: () => getQualityCheckApplications({ limit: 1000 }), // Large limit to get all
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
