import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { patchChecklistReminders } from "@/lib/api/checklistReminders";
import type { ApplicationDetailsResponse } from "@/types/applications";

export function usePatchChecklistReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      enabled,
    }: {
      leadId: string;
      enabled: boolean;
    }) => patchChecklistReminders(leadId, { enabled }),
    onSuccess: (_, variables) => {
      const patchApplication = (prev: ApplicationDetailsResponse | undefined) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            checklist_reminders_enabled: variables.enabled,
          },
        };
      };

      queryClient.setQueryData<ApplicationDetailsResponse>(
        ["application", variables.leadId],
        patchApplication,
      );
      queryClient.setQueriesData<ApplicationDetailsResponse>(
        { queryKey: ["spouse-application-details", variables.leadId] },
        patchApplication,
      );

      queryClient.invalidateQueries({
        queryKey: ["application", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["spouse-application-details", variables.leadId],
      });

      toast.success(
        variables.enabled
          ? "Reminder emails enabled."
          : "Reminder emails disabled.",
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to update reminder emails: ${error.message}`);
    },
  });
}
