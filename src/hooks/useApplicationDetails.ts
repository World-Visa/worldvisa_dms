import {
  getApplicationById,
  updateApplicationFields,
} from "@/lib/api/getApplicationById";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function useApplicationDetails(id: string) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplicationById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateApplicationFields() {
  return useMutation({
    mutationFn: ({
      leadId,
      fieldsToUpdate,
    }: {
      leadId: string;
      fieldsToUpdate: Record<string, any>;
    }) => updateApplicationFields(leadId, fieldsToUpdate),
    onSuccess: () => {
      toast.success("Application fields updated successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update application fields: ${error.message}`);
    },
  });
}
