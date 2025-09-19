import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDeadlineForLodgement } from "@/lib/api/getApplicationById";
import { toast } from "sonner";

export function useDeadlineUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      deadlineDate,
    }: {
      leadId: string;
      deadlineDate: string;
    }) => {
    
      return updateDeadlineForLodgement(leadId, deadlineDate);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["application-details", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-application"],
      });
      queryClient.invalidateQueries({
        queryKey: ["application"],
      });
      
      toast.success("Deadline updated successfully");
    },
    onError: (error: Error & { status?: number; response?: unknown }) => {
      console.error("Error updating deadline:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        response: error.response
      });
      toast.error("Failed to update deadline. Please try again.");
    },
  });
}