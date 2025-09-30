import { fetcher } from "@/lib/fetcher";
import { GetTimelineResponse, Timeline } from "@/types/documents";
import { useQuery } from "@tanstack/react-query";

export function useDocumentTimeline(documentId: string) {
  // Query for fetching document timeline
  const query = useQuery({
    queryKey: ["document-timeline", documentId],
    queryFn: async (): Promise<Timeline[]> => {
      try {
        const TIMELINE_BASE_URL = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/${documentId}/timeline`;

        const response = await fetcher<GetTimelineResponse>(TIMELINE_BASE_URL);

        if (response.status === "error") {
          throw new Error(response.status || "Failed to fetch comments");
        }

        const timeline = response.timeline || [];

        return timeline;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 0, // Timeline should always be fresh
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Poll every 5 seconds since this is not real-time
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    timeline: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
