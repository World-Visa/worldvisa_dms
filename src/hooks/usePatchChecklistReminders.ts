import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { patchChecklistReminders } from "@/lib/api/checklistReminders";
import type { ClientProfile } from "@/lib/api/clientProfile";

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
      queryClient.setQueryData<ClientProfile>(
        ["clientProfile", variables.leadId],
        (prev) =>
          prev
            ? { ...prev, checklist_reminders_enabled: variables.enabled }
            : prev,
      );

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
