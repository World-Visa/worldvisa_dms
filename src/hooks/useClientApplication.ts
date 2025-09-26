import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { ClientApplicationResponse } from "@/types/client";

const API_BASE_URL =
  "https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms";

export function useClientApplication() {
  return useQuery({
    queryKey: ["client-application"],
    queryFn: async (): Promise<ClientApplicationResponse> => {
      try {
        // Try the client-specific endpoint first
        return await fetcher<ClientApplicationResponse>(
          `${API_BASE_URL}/clients/application`
        );
      } catch (error) {
        // If client endpoint fails, try to get application data from user's lead_id
        if (typeof window !== "undefined") {
          const userData = localStorage.getItem("user_data");
          if (userData) {
            try {
              const user = JSON.parse(userData);
              if (user.lead_id) {
                return {
                  data: {
                    id: user.lead_id,
                    Name: user.username || user.Name || "Client Application",
                    Email: user.email,
                    Phone: "",
                    Created_Time: new Date().toISOString(),
                    Application_Handled_By: "",
                    AttachmentCount: 0,
                    DMS_Application_Status:
                      user?.DMS_Application_Status || null,
                    Application_Stage: user?.Application_Stage || "",
                  },
                };
              }
            } catch (parseError) {
              console.warn("Failed to parse user data:", parseError);
            }
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries since we handle the error gracefully
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}
