import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { ChecklistResponse } from "@/types/checklist";

interface ChecklistApiResponse {
  status: string;
  data: {
    checklist: Array<{
      _id: string;
      document_category: string;
      document_type: string;
      required: boolean;
      company_name?: string;
      description?: string;
    }>;
  };
}

import { ZOHO_BASE_URL } from "@/lib/config/api";

export function useClientChecklist(applicationId: string) {
  return useQuery({
    queryKey: ["client-checklist", applicationId],
    queryFn: async (): Promise<ChecklistResponse> => {
      try {
        // Use the client checklist endpoint with applicationId as query parameter
        const url = `${ZOHO_BASE_URL}/clients/checklist/`;
        const params = new URLSearchParams({ record_id: applicationId });

        const response = await fetcher<ChecklistApiResponse>(
          `${url}?${params.toString()}`,
        );

        // Handle the actual API response structure
        if (
          response.status === "success" &&
          response.data &&
          response.data.checklist
        ) {
          return {
            success: true,
            data: response.data.checklist.map((item) => ({
              checklist_id: item._id,
              document_category: item.document_category,
              document_type: item.document_type,
              required: item.required,
              company_name: item.company_name,
              description: item.description,
            })),
          };
        }

        // Fallback to original response format
        return {
          success: true,
          data: [],
        };
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("User not found") ||
            error.message.includes("404") ||
            error.message.includes("Not found"))
        ) {
          return { success: true, data: [] };
        }
        throw error;
      }
    },
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries since we handle the error gracefully
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}
