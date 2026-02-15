import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { GetCommentsResponse } from "@/types/comments";
import { ZOHO_BASE_URL } from "@/lib/config/api";

interface DocumentCommentCountsResponse {
  status: "success" | "error";
  data?: Record<string, number>;
  message?: string;
}

export function useDocumentCommentCounts(documentIds: string[]) {
  return useQuery({
    queryKey: ["document-comment-counts", documentIds.sort().join(",")],
    queryFn: async (): Promise<Record<string, number>> => {
      if (documentIds.length === 0) {
        return {};
      }

      try {
        // Fetch comment counts for all documents in parallel
        const promises = documentIds.map(async (documentId) => {
          try {
            const response = await fetcher<GetCommentsResponse>(
              `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/comment`,
            );

            if (response.status === "error") {
              console.warn(
                `Failed to fetch comments for document ${documentId}:`,
                response.message,
              );
              return { documentId, count: 0 };
            }

            const count = response.data?.length || 0;
            return { documentId, count };
          } catch (error) {
            console.warn(
              `Error fetching comments for document ${documentId}:`,
              error,
            );
            return { documentId, count: 0 };
          }
        });

        const results = await Promise.all(promises);

        // Convert array to object for easy lookup
        return results.reduce(
          (acc, { documentId, count }) => {
            acc[documentId] = count;
            return acc;
          },
          {} as Record<string, number>,
        );
      } catch (error) {
        console.error("Error fetching document comment counts:", error);
        // Return empty object with zero counts for all documents
        return documentIds.reduce(
          (acc, documentId) => {
            acc[documentId] = 0;
            return acc;
          },
          {} as Record<string, number>,
        );
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
    enabled: documentIds.length > 0,
  });
}
